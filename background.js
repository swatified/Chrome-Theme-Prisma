const GITHUB_REPO = 'swatified/MC-Image-Lib';
const GITHUB_PATH = 'images';

async function fetchImageList() {
  try {
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
  const images = await fetchImageList();
  
  if (images.length === 0) {
    console.error('No images found in the repository');
    return null;
  }

  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async () => {
  const imageUrl = await getRandomImage();
  if (imageUrl) {
    chrome.storage.local.set({ currentImage: imageUrl });
  }
});

// Listen for messages from newtab.js
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    if (request.action === "getNewImage") {
      const imageUrl = await getRandomImage();
      if (imageUrl) {
        await chrome.storage.local.set({ currentImage: imageUrl });
        sendResponse({ imageUrl });
      }
    }
    return true;
  }
);

// Listen for new tab creation
chrome.tabs.onCreated.addListener(async (tab) => {
  const imageUrl = await getRandomImage();
  if (imageUrl) {
    chrome.storage.local.set({ currentImage: imageUrl });
  }
});