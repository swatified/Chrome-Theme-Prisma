const GITHUB_REPO = 'swatified/MC-Image-Lib';
const GITHUB_PATH = 'images';

async function fetchImageList() {
  try {
    if (!navigator.onLine) {
      throw new Error('Offline');
    }
    
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const files = JSON.parse(await response.text());
    const imageFiles = files.filter(file => 
      file.type === 'file' &&
      (file.name.toLowerCase().endsWith('.jpg') || 
       file.name.toLowerCase().endsWith('.png'))
    );
    
    return imageFiles.map(file => file.download_url);
  } catch (error) {
    console.error('Error in fetchImageList:', error);
    return [];
  }
}

async function getRandomImage() {
  if (!navigator.onLine) {
    return null;
  }
  
  const images = await fetchImageList();
  
  if (images.length === 0) {
    console.error('No images found in the repository');
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}

async function updateThemeState(isOnline) {
  if (!isOnline) {
    await chrome.storage.local.set({ 
      isOffline: true,
      currentImage: null
    });
  } else {
    const imageUrl = await getRandomImage();
    await chrome.storage.local.set({ 
      isOffline: false,
      currentImage: imageUrl 
    });
  }
}

// Listen for online/offline events
self.addEventListener('online', () => updateThemeState(true));
self.addEventListener('offline', () => updateThemeState(false));

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async () => {
  await updateThemeState(navigator.onLine);
});

// Listen for messages from newtab.js
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    if (request.action === "getNewImage") {
      await updateThemeState(navigator.onLine);
      sendResponse({ success: true });
    }
    return true;
  }
);

// Listen for new tab creation
chrome.tabs.onCreated.addListener(async (tab) => {
  await updateThemeState(navigator.onLine);
});