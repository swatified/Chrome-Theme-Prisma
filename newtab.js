document.addEventListener('DOMContentLoaded', async function() {

  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('search-input');
    const query = input.value.trim();
    
    // Always treat input as URL
    let url = query;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.location.href = url;
  });

  // Function to update offline status
  function updateOfflineStatus() {
    const isOffline = !navigator.onLine;
    document.body.classList.toggle('offline', isOffline);
    
    // Create or update offline alert
    let offlineAlert = document.querySelector('.offline-alert');
    if (!offlineAlert && isOffline) {
      offlineAlert = document.createElement('div');
      offlineAlert.className = 'offline-alert';
      offlineAlert.textContent = "You're offline! Connect to the internet to get the most out of this theme.";
      document.body.appendChild(offlineAlert);
    } else if (offlineAlert && !isOffline) {
      offlineAlert.remove();
    }
  }

  // Listen for online/offline events
  window.addEventListener('online', updateOfflineStatus);
  window.addEventListener('offline', updateOfflineStatus);
  
  // Initial check
  updateOfflineStatus();

  // Request new image on page load
  try {
    await chrome.runtime.sendMessage({ action: "getNewImage" });
  } catch (error) {
    console.error('Error requesting new image:', error);
  }

  // Load background image
  chrome.storage.local.get(['currentImage', 'shortcuts', 'isOffline'], function(result) {
    if (result.currentImage && !result.isOffline) {
      const img = new Image();
      img.onload = function() {
        document.body.style.backgroundImage = `url('${result.currentImage}')`;
      };
      img.onerror = function() {
        document.body.classList.add('offline');
        document.body.style.backgroundColor = '#2c2435';
      };
      img.src = result.currentImage;
    } else {
      document.body.classList.add('offline');
      document.body.style.backgroundColor = '#2c2435';
    }

    // Display existing shortcuts
    displayShortcuts(result.shortcuts || []);
  });
});

function enableDragAndDrop(shortcutElement, index, shortcuts) {
  shortcutElement.draggable = true;
  
  shortcutElement.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', index);
    shortcutElement.classList.add('dragging');
  });

  shortcutElement.addEventListener('dragend', () => {
    shortcutElement.classList.remove('dragging');
    document.querySelectorAll('.shortcut').forEach(item => {
      item.classList.remove('drag-over');
    });
  });

  shortcutElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    shortcutElement.classList.add('drag-over');
  });

  shortcutElement.addEventListener('dragleave', () => {
    shortcutElement.classList.remove('drag-over');
  });

  shortcutElement.addEventListener('drop', async (e) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const targetIndex = index;

    if (sourceIndex !== targetIndex) {
      try {
        const result = await chrome.storage.local.get(['shortcuts']);
        const updatedShortcuts = [...result.shortcuts];
        const [removed] = updatedShortcuts.splice(sourceIndex, 1);
        updatedShortcuts.splice(targetIndex, 0, removed);
        
        await chrome.storage.local.set({ shortcuts: updatedShortcuts });
        displayShortcuts(updatedShortcuts);
      } catch (error) {
        console.error('Error reordering shortcuts:', error);
      }
    }
    shortcutElement.classList.remove('drag-over');
  });
}

function createAddShortcutButton() {
  const button = document.createElement('div');
  button.className = 'shortcut add-button';
  
  const icon = document.createElement('div');
  icon.className = 'shortcut-icon';
  icon.textContent = '+';
  
  const text = document.createElement('span');
  text.textContent = 'Add Shortcut';
  
  button.appendChild(icon);
  button.appendChild(text);
  
  button.addEventListener('click', showAddShortcutDialog);
  return button;
}

function createShortcutImage(shortcut) {
  const img = document.createElement('img');
  img.alt = shortcut.name;
  img.src = shortcut.iconUrl;
  img.addEventListener('error', function() {
    this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%234a3b59"/></svg>';
  });
  return img;
}

function showAddShortcutDialog() {
  showShortcutDialog();
}

function showEditShortcutDialog(shortcut, index) {
  showShortcutDialog(shortcut, index);
}

function showShortcutDialog(shortcut = null, index = null) {
  // Remove any existing dialog
  const existingDialog = document.querySelector('.shortcut-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }

  const dialog = document.createElement('div');
  dialog.className = 'shortcut-dialog';
  
  const content = document.createElement('div');
  content.className = 'dialog-content';
  
  const title = document.createElement('h3');
  title.textContent = shortcut ? 'Edit Shortcut' : 'Add New Shortcut';
  
  const form = document.createElement('form');
  form.id = shortcut ? 'edit-shortcut-form' : 'add-shortcut-form';
  
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'shortcut-name';
  nameInput.placeholder = 'Name';
  nameInput.required = true;
  if (shortcut) nameInput.value = shortcut.name;
  
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.id = 'shortcut-url';
  urlInput.placeholder = 'URL (https://...)';
  urlInput.required = true;
  if (shortcut) urlInput.value = shortcut.url;
  
  const iconInput = document.createElement('input');
  iconInput.type = 'url';
  iconInput.id = 'shortcut-icon';
  iconInput.placeholder = 'Icon URL (optional)';
  if (shortcut) iconInput.value = shortcut.iconUrl;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'dialog-buttons';
  
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'cancel-btn';
  cancelButton.textContent = 'Cancel';
  
  const actionButton = document.createElement('button');
  actionButton.type = 'submit';
  actionButton.className = 'add-btn';
  actionButton.textContent = shortcut ? 'Save' : 'Add';
  
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(actionButton);
  
  form.appendChild(nameInput);
  form.appendChild(urlInput);
  form.appendChild(iconInput);
  form.appendChild(buttonContainer);
  
  content.appendChild(title);
  content.appendChild(form);
  dialog.appendChild(content);
  
  // Add event listeners
  cancelButton.addEventListener('click', () => dialog.remove());
  form.addEventListener('submit', (e) => shortcut ? handleEditShortcut(e, index) : handleAddShortcut(e));
  
  document.body.appendChild(dialog);
}

async function handleAddShortcut(event) {
  event.preventDefault();
  
  const name = document.getElementById('shortcut-name').value.trim();
  const url = document.getElementById('shortcut-url').value.trim();
  let iconUrl = document.getElementById('shortcut-icon').value.trim();
  
  if (!iconUrl) {
    iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(url)}`;
  }
  
  try {
    const result = await chrome.storage.local.get(['shortcuts']);
    const shortcuts = result.shortcuts || [];
    shortcuts.push({ name, url, iconUrl });
    await chrome.storage.local.set({ shortcuts });
    displayShortcuts(shortcuts);
    
    const dialog = document.querySelector('.shortcut-dialog');
    if (dialog) dialog.remove();
  } catch (error) {
    console.error('Error saving shortcut:', error);
    alert('Failed to save shortcut. Please try again.');
  }
}

async function handleEditShortcut(event, index) {
  event.preventDefault();
  
  const name = document.getElementById('shortcut-name').value.trim();
  const url = document.getElementById('shortcut-url').value.trim();
  let iconUrl = document.getElementById('shortcut-icon').value.trim();
  
  if (!iconUrl) {
    iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(url)}`;
  }
  
  try {
    const result = await chrome.storage.local.get(['shortcuts']);
    const shortcuts = result.shortcuts || [];
    shortcuts[index] = { name, url, iconUrl };
    await chrome.storage.local.set({ shortcuts });
    displayShortcuts(shortcuts);
    
    const dialog = document.querySelector('.shortcut-dialog');
    if (dialog) dialog.remove();
  } catch (error) {
    console.error('Error saving shortcut:', error);
    alert('Failed to save shortcut. Please try again.');
  }
}

function displayShortcuts(shortcuts) {
  const container = document.getElementById('shortcuts');
  container.innerHTML = '';
  
  shortcuts.forEach((shortcut, index) => {
    const shortcutElement = document.createElement('a');
    shortcutElement.className = 'shortcut';
    shortcutElement.href = shortcut.url;
    
    const img = createShortcutImage(shortcut);
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = shortcut.name;
    
    const editButton = document.createElement('button');
    editButton.className = 'edit-shortcut';
    editButton.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.5 1.5L10.5 3.5M1 11H3L10.5 3.5L8.5 1.5L1 9V11Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    editButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showEditShortcutDialog(shortcut, index);
    });
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-shortcut';
    removeButton.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    removeButton.dataset.index = index;
    
    removeButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        const result = await chrome.storage.local.get(['shortcuts']);
        const updatedShortcuts = result.shortcuts.filter((_, i) => i !== index);
        await chrome.storage.local.set({ shortcuts: updatedShortcuts });
        displayShortcuts(updatedShortcuts);
      } catch (error) {
        console.error('Error removing shortcut:', error);
      }
    });
    
    shortcutElement.appendChild(editButton);
    shortcutElement.appendChild(img);
    shortcutElement.appendChild(nameSpan);
    shortcutElement.appendChild(removeButton);
    
    // Enable drag and drop
    enableDragAndDrop(shortcutElement, index, shortcuts);
    
    container.appendChild(shortcutElement);
  });
  
  container.appendChild(createAddShortcutButton());
}