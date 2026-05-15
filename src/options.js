const STORAGE_KEY = "ntc:settings";

const listEl = document.getElementById("containers");
const emptyEl = document.getElementById("containers-empty");
const clearCookiesEl = document.getElementById("clear-cookies");
const saveStatusEl = document.getElementById("save-status");

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
  flashSaved();
}

let flashTimer;
function flashSaved() {
  saveStatusEl.textContent = "Saved.";
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    saveStatusEl.textContent = "Saved automatically.";
  }, 1200);
}

async function render() {
  const settings = await getSettings();
  clearCookiesEl.checked = !!settings.clearCookiesOnClose;

  let identities = [];
  try {
    identities = await browser.contextualIdentities.query({});
  } catch (err) {
    console.warn("contextualIdentities.query failed:", err);
  }

  listEl.innerHTML = "";
  if (!identities.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  for (const id of identities) {
    const li = document.createElement("li");
    const label = document.createElement("label");
    const swatch = document.createElement("span");
    const cb = document.createElement("input");
    const text = document.createElement("span");

    swatch.className = "swatch";
    swatch.style.background = id.colorCode;
    cb.type = "checkbox";
    cb.checked = settings.blockedContainers.includes(id.cookieStoreId);
    text.textContent = id.name;

    cb.addEventListener("change", async () => {
      const next = await getSettings();
      const set = new Set(next.blockedContainers);
      if (cb.checked) set.add(id.cookieStoreId);
      else set.delete(id.cookieStoreId);
      next.blockedContainers = [...set];
      await saveSettings(next);
    });

    label.append(swatch, cb, text);
    li.append(label);
    listEl.append(li);
  }
}

clearCookiesEl.addEventListener("change", async () => {
  const next = await getSettings();
  next.clearCookiesOnClose = clearCookiesEl.checked;
  await saveSettings(next);
});

browser.storage.onChanged.addListener((changes) => {
  if (changes[STORAGE_KEY]) render();
});

render().catch((err) => console.error(err));
