// background.js
const GITHUB_REPO = 'swatified/MC-Image-Lib';
const GITHUB_PATH = 'images';

async function fetchImageList() {
  try {
    console.log('Fetching images from:', `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`);
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const text = await response.text();
    console.log('Raw response:', text);
    
    const files = JSON.parse(text);
    console.log('Parsed files:', files);

    const imageFiles = files
      .filter(file => file.type === 'file' && 
        (file.name.toLowerCase().endsWith('.jpg') || 
         file.name.toLowerCase().endsWith('.png')));
    
    console.log('Filtered image files:', imageFiles);

    const imageUrls = imageFiles.map(file => {
      // Convert GitHub API URL to raw URL
      const rawUrl = file.download_url;
      console.log(`Processing image: ${file.name} -> ${rawUrl}`);
      return rawUrl;
    });

    console.log('Final image URLs:', imageUrls);
    return imageUrls;

  } catch (error) {
    console.error('Error in fetchImageList:', error);
    return [];
  }
}

async function getRandomImage() {
  console.log('Getting random image...');
  const images = await fetchImageList();
  
  if (images.length === 0) {
    console.error('No images found in the repository');
    return null;
  }

  const randomIndex = Math.floor(Math.random() * images.length);
  const selectedImage = images[randomIndex];
  console.log('Selected image:', selectedImage);
  return selectedImage;
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed, fetching first image...');
  const imageUrl = await getRandomImage();
  if (imageUrl) {
    console.log('Setting initial image:', imageUrl);
    chrome.storage.local.set({ currentImage: imageUrl }, () => {
      console.log('Image saved to storage');
    });
  }
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener(async (tab) => {
  console.log('New tab created, fetching new image...');
  const imageUrl = await getRandomImage();
  if (imageUrl) {
    console.log('Setting new tab image:', imageUrl);
    chrome.storage.local.set({ currentImage: imageUrl }, () => {
      console.log('New image saved to storage');
    });
  }
});