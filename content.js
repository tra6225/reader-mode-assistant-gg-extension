// config, exclude time estimates in all search pages
const AVG_READING_SPEED = 225; 
const WORDS_THRESHOLD = 100; 
const TIME_PER_IMAGE = 12; 
const EXCLUDED_DOMAINS = ['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'baidu.'];

// all setting status
let extensionEnabled = true;
let progressEnabled = false;
let currentTheme = 'original';
let currentFont = 'original';
let currentZoom = 100; 

// init settings
chrome.storage.sync.get(['extensionEnabled', 'progressEnabled', 'themeType', 'fontType'], (result) => {
  extensionEnabled = result.extensionEnabled !== false;
  progressEnabled = result.progressEnabled || false;
  currentTheme = result.themeType || 'original';
  currentFont = result.fontType || 'original';

  if (extensionEnabled) initializeExtension();
});

// messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!extensionEnabled && request.action !== 'toggleExtension') return;

  switch (request.action) {
    case 'toggleExtension':
      extensionEnabled = request.enabled;
      if (extensionEnabled) initializeExtension();
      else cleanupAll();
      break;
    case 'toggleProgress': toggleProgressBar(request.enabled); break;
    case 'changeTheme': applyTheme(request.theme); break;
    case 'changeFont': applyFont(request.font); break;
    case 'resizeText': handleResize(request.type); break; 
  }
});

// functions
// init extension
function initializeExtension() {
  if (isLoginPage()) return;
  const isSearch = isSearchPage();

  if (!isSearch) {
    const readingTime = calculateReadingTime();
    if (readingTime > 0) displayBadge(readingTime);
  }

  if (progressEnabled) toggleProgressBar(true);
  if (currentTheme !== 'original') applyTheme(currentTheme);
  if (currentFont !== 'original') applyFont(currentFont);
  if (currentZoom !== 100) document.body.style.zoom = `${currentZoom}%`;
}

// clean up function -> no remaind effects
function cleanupAll() {
  document.getElementById('reading-time-badge')?.remove();
  const bar = document.getElementById('reading-progress-bar');
  if (bar) { bar.remove(); window.removeEventListener('scroll', updateProgress); }

  document.body.classList.remove('theme-yellow', 'theme-dark');
  document.body.classList.remove('font-sans', 'font-serif', 'font-comic', 'font-minecraft');

  document.body.style.zoom = '100%';
  document.body.style.fontSize = ''; 
}

// thimi set
function applyTheme(themeName) {
  currentTheme = themeName; 
  document.body.classList.remove('theme-yellow', 'theme-dark'); 
  if (themeName !== 'original') document.body.classList.add(`theme-${themeName}`); 
}

// resize function
function handleResize(type) {
  if (type === 'increase') currentZoom += 10;
  else if (type === 'decrease') currentZoom = Math.max(50, currentZoom - 10);
  else if (type === 'reset') currentZoom = 100;
  document.body.style.zoom = `${currentZoom}%`;
}

// progress bar run
function toggleProgressBar(enable) {
  progressEnabled = enable; 
  const barId = 'reading-progress-bar';
  let bar = document.getElementById(barId);
  if (enable) {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = barId;
      document.body.appendChild(bar);
      window.addEventListener('scroll', updateProgress);
      updateProgress();
    }
  } else {
    if (bar) { bar.remove(); window.removeEventListener('scroll', updateProgress); }
  }
}

// update progress for progress bar
function updateProgress() {
  const bar = document.getElementById('reading-progress-bar');
  if (!bar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;
  bar.style.width = `${scrollPercent}%`;
}

// font set
function applyFont(fontType) {
  currentFont = fontType;
  document.body.classList.remove('font-sans', 'font-serif', 'font-comic', 'font-minecraft');
  
  // reset font size
  document.body.style.fontSize = ''; 

  if (fontType !== 'original') document.body.classList.add(`font-${fontType}`);
}

// helpers
function isSearchPage() { 
  return EXCLUDED_DOMAINS.some(d => window.location.hostname.includes(d)); }
function isLoginPage() { return false; }

// estimate reading time
function calculateReadingTime() {
  // look for and count main content only
  const article = document.querySelector('article, [role="main"], .main-content, #content');
  const elementToCount = article ? article : document.body;
  const text = elementToCount.innerText;
  //use regex
  const words = text.split(/\s+/).length;
  
  // threshold check
  if (words < WORDS_THRESHOLD) return 0;
  
  // add time for images
  const images = elementToCount.querySelectorAll('img').length;
  return Math.ceil((words / AVG_READING_SPEED) * 60 + images * TIME_PER_IMAGE);
}

// display time estimates
function displayBadge(seconds) {
  const existing = document.getElementById('reading-time-badge');
  if (existing) existing.remove();
  const badge = document.createElement('div');
  badge.id = 'reading-time-badge';
  badge.textContent = `⏱️ Approximately ${Math.ceil(seconds / 60)} min read`;
  document.body.appendChild(badge);
}