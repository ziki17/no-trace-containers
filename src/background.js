const STORAGE_KEY = "ntc:settings";

const defaultSettings = {
  blockedContainers: [],
  clearCookiesOnClose: false,
};

async function getSettings() {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  return { ...defaultSettings, ...(stored[STORAGE_KEY] || {}) };
}

async function isBlockedContainer(cookieStoreId) {
  if (!cookieStoreId || cookieStoreId === "firefox-default") return false;
  const { blockedContainers } = await getSettings();
  return blockedContainers.includes(cookieStoreId);
}

const recentlyVisited = new Map();

browser.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  try {
    const tab = await browser.tabs.get(details.tabId);
    if (!(await isBlockedContainer(tab.cookieStoreId))) return;
    recentlyVisited.set(details.tabId, [
      ...(recentlyVisited.get(details.tabId) || []),
      details.url,
    ]);
    await browser.history.deleteUrl({ url: details.url });
  } catch (err) {
    console.warn("[no-trace-containers] onCommitted error:", err);
  }
});

browser.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  try {
    const tab = await browser.tabs.get(details.tabId);
    if (!(await isBlockedContainer(tab.cookieStoreId))) return;
    await browser.history.deleteUrl({ url: details.url });
  } catch (err) {
    console.warn("[no-trace-containers] onCompleted error:", err);
  }
});

browser.tabs.onRemoved.addListener(async (tabId) => {
  const urls = recentlyVisited.get(tabId);
  recentlyVisited.delete(tabId);
  if (!urls) return;
  for (const url of urls) {
    try {
      await browser.history.deleteUrl({ url });
    } catch (err) {
      console.warn("[no-trace-containers] cleanup deleteUrl error:", err);
    }
  }
});

browser.tabs.onCreated.addListener(async (tab) => {
  if (!tab.id || !tab.cookieStoreId) return;
  try {
    await browser.storage.session?.set?.({ [`tab:${tab.id}`]: tab.cookieStoreId });
  } catch {
    /* storage.session may not exist on older Firefox — ignore */
  }
});

browser.tabs.onUpdated.addListener(async (tabId, _changeInfo, tab) => {
  if (!tab.cookieStoreId) return;
  try {
    await browser.storage.session?.set?.({ [`tab:${tabId}`]: tab.cookieStoreId });
  } catch {
    /* ignore */
  }
});

browser.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const settings = await getSettings();
    if (!settings.clearCookiesOnClose) return;

    const stored = await browser.storage.session?.get?.(`tab:${tabId}`).catch(() => null);
    const cookieStoreId = stored?.[`tab:${tabId}`];
    if (!cookieStoreId) return;
    if (!settings.blockedContainers.includes(cookieStoreId)) return;

    const remaining = await browser.tabs.query({ cookieStoreId });
    if (remaining.length > 0) return;

    const cookies = await browser.cookies.getAll({ storeId: cookieStoreId });
    for (const cookie of cookies) {
      const protocol = cookie.secure ? "https:" : "http:";
      const cookieUrl = `${protocol}//${cookie.domain.replace(/^\./, "")}${cookie.path}`;
      try {
        await browser.cookies.remove({
          url: cookieUrl,
          name: cookie.name,
          storeId: cookieStoreId,
        });
      } catch (err) {
        console.warn("[no-trace-containers] cookies.remove error:", err);
      }
    }
  } catch (err) {
    console.warn("[no-trace-containers] cookies-on-close error:", err);
  }
});

async function updateBadge(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);
    const blocked = await isBlockedContainer(tab.cookieStoreId);
    await browser.action.setBadgeText({ tabId, text: blocked ? "OFF" : "" });
    await browser.action.setBadgeBackgroundColor({ tabId, color: "#c0392b" });
  } catch {
    /* ignore */
  }
}

browser.tabs.onActivated.addListener(({ tabId }) => updateBadge(tabId));
browser.tabs.onUpdated.addListener((tabId) => updateBadge(tabId));
browser.storage.onChanged.addListener(async (changes) => {
  if (!changes[STORAGE_KEY]) return;
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) updateBadge(tab.id);
});
