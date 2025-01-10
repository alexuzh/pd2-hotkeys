const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SPECIAL_KEYS = ["-", "Alt", "Ctrl", "Shift"];
const HOTKEY_IDS = [
  "pd2-hk-search",
  "pd2-hk-clear",
  "pd2-hk-bump",
  "pd2-hk-name",
  "pd2-hk-property",
];

const DEFAULT_HOTKEYS = {
  "pd2-hk-search": ":Alt:S",
  "pd2-hk-clear": ":Alt:C",
  "pd2-hk-bump": ":Alt:B",
  "pd2-hk-name": ":Alt:N",
  "pd2-hk-property": ":Alt:P",
};

const primaryKeyPrefix = "primary-key-";
const secondaryKeyPrefix = "secondary-key-";
const hotkeyPrefix = "hotkey-";

// Save selected hotkey combinations to Chrome storage
document.getElementById("pd2-hk-save").addEventListener("click", async () => {
  const changes = HOTKEY_IDS.reduce((acc, hotkeyId) => {
    const [primaryKey, secondaryKey, hotkeyLetter] = [
      `${primaryKeyPrefix + hotkeyId}`,
      `${secondaryKeyPrefix + hotkeyId}`,
      `${hotkeyPrefix + hotkeyId}`,
    ].map((id) => document.getElementById(id).value);
    acc[hotkeyId] = `${primaryKey}:${secondaryKey}:${hotkeyLetter}`;
    return acc;
  }, {});
  await chrome.storage.local.set(changes);
});

// Reset hotkey combinations to defaults
document.getElementById("pd2-hk-reset").addEventListener("click", async () => {
  await chrome.storage.local.clear();
  await populateHotkeys();
});

// Initialize popup HTML with hotkey configuration inputs
function initializeHtml() {
  HOTKEY_IDS.forEach((hotkeyId) => {
    const hotkeyEl = document.getElementById(hotkeyId);
    hotkeyEl.innerHTML = `
      <h3>${formatHotkeyId(hotkeyId)}</h3>
      ${createDropdown(`${primaryKeyPrefix + hotkeyId}`, SPECIAL_KEYS)}
      + ${createDropdown(`${secondaryKeyPrefix + hotkeyId}`, SPECIAL_KEYS)}
      + ${createDropdown(`${hotkeyPrefix + hotkeyId}`, LETTERS)}
    `;
  });
}

// Helper function to create a dropdown (select element) for options
function createDropdown(elementId, options) {
  return `<select id="${elementId}">
    ${options.map((option) => `<option value="${option === "-" ? "" : option}">${option}</option>`).join("")}
  </select>`;
}

// Format hotkey ID to a more readable string (e.g., "pd2-hk-search" -> "Search")
function formatHotkeyId(hotkeyId) {
  return hotkeyId
    .replace(/^pd2-hk-/, "")
    .replace(/^(.)/, (match) => match.toUpperCase());
}

// Populate hotkey dropdowns with stored values or defaults
async function populateHotkeys() {
  const storedValues = await chrome.storage.local.get(null);
  HOTKEY_IDS.forEach((hotkeyId) => {
    const [primaryKey, secondaryKey, hotkeyLetter] = (
      storedValues[hotkeyId] || DEFAULT_HOTKEYS[hotkeyId]
    ).split(":");
    document.getElementById(`${primaryKeyPrefix + hotkeyId}`).value = primaryKey;
    document.getElementById(`${secondaryKeyPrefix + hotkeyId}`).value = secondaryKey;
    document.getElementById(`${hotkeyPrefix + hotkeyId}`).value = hotkeyLetter;
  });
}

// Initialize the popup
(async () => {
  initializeHtml();
  await populateHotkeys();
})();
