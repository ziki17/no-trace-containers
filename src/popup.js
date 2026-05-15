const STORAGE_KEY = "ntc:settings";

const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggle");
const hintEl = document.getElementById("hint");
const openOptions = document.getElementById("open-options");

openOptions.addEventListener("click", (e) => {
  e.preventDefault();
  browser.runtime.openOptionsPage();
});

async function getSettings() {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  return {
    blockedContainers: [],
    clearCookiesOnClose: false,
    ...(stored[STORAGE_KEY] || {}),
  };
}

async function saveSettings(settings) {
  await browser.storage.local.set({ [STORAGE_KEY]: settings });
}

async function render() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    statusEl.textContent = "No active tab.";
    return;
  }

  const cookieStoreId = tab.cookieStoreId;
  if (!cookieStoreId || cookieStoreId === "firefox-default") {
    statusEl.textContent = "This tab is not in a container.";
    hintEl.hidden = false;
    hintEl.textContent = "Open this site in a container to use No Trace.";
    return;
  }

  let identity;
  try {
    identity = await browser.contextualIdentities.get(cookieStoreId);
  } catch {
    statusEl.textContent = "Unknown container.";
    return;
  }

  const settings = await getSettings();
  const isBlocked = settings.blockedContainers.includes(cookieStoreId);

  statusEl.replaceChildren();
  const prefix = document.createTextNode("History is ");
  const stateEl = document.createElement("strong");
  stateEl.textContent = isBlocked ? "disabled" : "enabled";
  const mid = document.createTextNode(" for ");
  const nameEl = document.createElement("strong");
  nameEl.textContent = identity.name;
  const suffix = document.createTextNode(".");
  statusEl.append(prefix, stateEl, mid, nameEl, suffix);

  toggleBtn.hidden = false;
  toggleBtn.textContent = isBlocked ? "Re-enable history" : "Disable history";

  toggleBtn.onclick = async () => {
    toggleBtn.disabled = true;
    const next = await getSettings();
    if (isBlocked) {
      next.blockedContainers = next.blockedContainers.filter(
        (id) => id !== cookieStoreId
      );
    } else {
      next.blockedContainers = [...next.blockedContainers, cookieStoreId];
    }
    await saveSettings(next);
    await render();
    toggleBtn.disabled = false;
  };
}

render().catch((err) => {
  statusEl.textContent = "Error loading state.";
  console.error(err);
});
