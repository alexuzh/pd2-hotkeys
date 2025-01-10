const HOTKEY_PREFIX = "pd2-hk-";

const HOTKEYS = {
  SEARCH: `${HOTKEY_PREFIX}search`,
  CLEAR: `${HOTKEY_PREFIX}clear`,
  NAME: `${HOTKEY_PREFIX}name`,
  PROPERTY: `${HOTKEY_PREFIX}property`,
  BUMP: `${HOTKEY_PREFIX}bump`,
};

const DEFAULT_HOTKEYS = {
  [HOTKEYS.SEARCH]: ":Alt:S",
  [HOTKEYS.CLEAR]: ":Alt:C",
  [HOTKEYS.NAME]: ":Alt:N",
  [HOTKEYS.PROPERTY]: ":Alt:P",
  [HOTKEYS.BUMP]: ":Alt:B",
};

const UI_ACTIONS = {
  BUTTONS: {
    SEARCH: "SEARCH",
    CLEAR: "CLEAR FILTERS",
    BUMP: "BUMP ALL",
  },
  INPUTS: {
    NAME: { header: "NAME", placeholder: "Name" },
    PROPERTY: { header: "PROPERTIES", placeholder: "Property" },
  },
};

// stored hotkey listener
let hotkeyListener = null;

// Parses hotkey combination into an object
function parseHotkey(combination) {
  const [primary, secondary, key] = combination.split(":");
  return { primary, secondary, key };
}

// Checks if a keyboard event matches a given hotkey object
function doesEventMatchHotkey(event, { primary, secondary, key }) {
  const isKeyMatch = event.code === `Key${key}`;
  const isModifierMatch =
    ((primary === "Alt" || secondary === "Alt") && event.altKey) ||
    ((primary === "Ctrl" || secondary === "Ctrl") && event.ctrlKey) ||
    ((primary === "Shift" || secondary === "Shift") && event.shiftKey);

  return isKeyMatch && isModifierMatch;
}

// Sets up hotkeyListeners from storage values
async function initializeHotkeys() {
  if (hotkeyListener) {
    document.removeEventListener("keydown", hotkeyListener);
  }

  let storedHotkeys;
  try {
    storedHotkeys = await chrome.storage.local.get(null);
  } catch (error) {
    console.error(
      "Error getting storage values, falling back to defaults",
      error,
    );
    storedHotkeys = DEFAULT_HOTKEYS;
  }

  const hotkeysConfig = Object.entries(HOTKEYS).reduce(
    (accum, [action, key]) => {
      accum[action] = parseHotkey(storedHotkeys[key] || DEFAULT_HOTKEYS[key]);
      return accum;
    },
    {},
  );

  hotkeyListener = (event) => {
    if (event.repeat) return;

    for (const [action, hotkey] of Object.entries(hotkeysConfig)) {
      if (!doesEventMatchHotkey(event, hotkey)) continue;

      if (handleButtonAction(UI_ACTIONS.BUTTONS[action.toUpperCase()])) return;
      if (handleInputFocus(UI_ACTIONS.INPUTS[action.toUpperCase()])) return;
    }
  };

  document.addEventListener("keydown", hotkeyListener);
}

// Handles the button clicks based on the action
function handleButtonAction(actionKey) {
  const button = [...document.querySelectorAll("button")].find(
    (btn) => btn.innerText === actionKey,
  );
  if (button) {
    button.click();
    return true;
  }
  return false;
}

// Handles focusing input fields based on the action
function handleInputFocus(action) {
  const header = [...document.querySelectorAll("h2")].find(
    (h2) => h2.innerText === action.header,
  );
  if (!header) return false;

  const inputSelector = `input[placeholder='${action.placeholder}']`;
  const inputElement =
    header.parentElement.querySelector(inputSelector) ||
    header.parentElement.nextElementSibling.querySelector(inputSelector);

  if (inputElement) {
    inputElement.focus();
    return true;
  }
  return false;
}

// Hotkey re-initialization upon storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== "local") return;
  if (Object.keys(changes).some((key) => key.startsWith(HOTKEY_PREFIX))) {
    initializeHotkeys().then(() => {});
  }
});

// Initial hotkey setup
initializeHotkeys().then(() => {});
console.log("PD2 Market hotkeys loaded");
