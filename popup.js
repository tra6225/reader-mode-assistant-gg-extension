// dom, const declaration here
const extensionToggle = document.getElementById('extensionToggle');
const statusText = document.getElementById('statusText');
const themeSelect = document.getElementById('themeSelect');
const themeBtns = document.querySelectorAll('.theme-btn');
const btnIncrease = document.getElementById('btnIncrease');
const btnDecrease = document.getElementById('btnDecrease');
const btnReset = document.getElementById('btnReset');
const fontSelect = document.getElementById('fontSelect');
const progressToggle = document.getElementById('progressToggle');

// init
chrome.storage.sync.get(['extensionEnabled', 'themeType', 'fontType', 'progressEnabled'], (result) => {
  // controller switch init
  const isEnabled = result.extensionEnabled !== false;
  extensionToggle.checked = isEnabled;
  updateStatus(isEnabled);

  // thimi init
  const theme = result.themeType || 'original';
  themeSelect.value = theme;
  highlightThemeBtn(theme);

  // font, progress bar init
  fontSelect.value = result.fontType || 'original';
  progressToggle.checked = result.progressEnabled || false;
});

// event listeners
// controller switch first
extensionToggle.addEventListener('change', (e) => {
  const isEnabled = e.target.checked;
  chrome.storage.sync.set({ extensionEnabled: isEnabled });
  updateStatus(isEnabled);
  sendMessage({ action: 'toggleExtension', enabled: isEnabled });
});

// thimi options listeners
themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.getAttribute('data-value');
    themeSelect.value = val;
    // visual update
    highlightThemeBtn(val); 
    chrome.storage.sync.set({ themeType: val }); 
    // send update message
    sendMessage({ action: 'changeTheme', theme: val }); 
  });
});

// font option button -> rmb send message
fontSelect.addEventListener('change', (e) => {
  chrome.storage.sync.set({ fontType: e.target.value });
  sendMessage({ action: 'changeFont', font: e.target.value });
});

// progress bar update -> rmb send message
progressToggle.addEventListener('change', (e) => {
  chrome.storage.sync.set({ progressEnabled: e.target.checked });
  sendMessage({ action: 'toggleProgress', enabled: e.target.checked });
});

// resize font button -> rmb send message
btnIncrease.addEventListener('click', () => sendMessage({ action: 'resizeText', type: 'increase' }));
btnDecrease.addEventListener('click', () => sendMessage({ action: 'resizeText', type: 'decrease' }));
btnReset.addEventListener('click', () => sendMessage({ action: 'resizeText', type: 'reset' }));

// helper functions
// update toggles & buttons status
function updateStatus(isEnabled) {
  statusText.textContent = isEnabled ? 'Active' : 'Inactive';
  statusText.style.opacity = isEnabled ? '1' : '0.6';
}

// deselect CLEAR FIRST -> update thimi
function highlightThemeBtn(val) {
  themeBtns.forEach(btn => btn.classList.remove('selected'));
  const active = document.querySelector(`.theme-btn[data-value="${val}"]`);
  if (active) active.classList.add('selected');
}

//send messages
function sendMessage(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
  });
}