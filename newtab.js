// newtab.js
document.addEventListener('DOMContentLoaded', function() {
  // Load background image
  chrome.storage.local.get(['currentImage', 'shortcuts'], function(result) {
    if (result.currentImage) {
      const img = new Image();
      img.onload = function() {
        document.body.style.backgroundImage = `url('${result.currentImage}')`;
      };
      img.onerror = function() {
        document.body.style.backgroundColor = '#f0f0f0';
      };
      img.src = result.currentImage;
    }

    // Display existing shortcuts
    displayShortcuts(result.shortcuts || []);
  });
});

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
  title.textContent = 'Add New Shortcut';
  
  const form = document.createElement('form');
  form.id = 'add-shortcut-form';
  
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'shortcut-name';
  nameInput.placeholder = 'Name';
  nameInput.required = true;
  
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.id = 'shortcut-url';
  urlInput.placeholder = 'URL (https://...)';
  urlInput.required = true;
  
  const iconInput = document.createElement('input');
  iconInput.type = 'url';
  iconInput.id = 'shortcut-icon';
  iconInput.placeholder = 'Icon URL (optional)';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'dialog-buttons';
  
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'cancel-btn';
  cancelButton.textContent = 'Cancel';
  
  const addButton = document.createElement('button');
  addButton.type = 'submit';
  addButton.className = 'add-btn';
  addButton.textContent = 'Add';
  
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(addButton);
  
  form.appendChild(nameInput);
  form.appendChild(urlInput);
  form.appendChild(iconInput);
  form.appendChild(buttonContainer);
  
  content.appendChild(title);
  content.appendChild(form);
  dialog.appendChild(content);
  
  // Add event listeners
  cancelButton.addEventListener('click', () => dialog.remove());
  form.addEventListener('submit', handleAddShortcut);
  
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

function displayShortcuts(shortcuts) {
  const container = document.getElementById('shortcuts');
  container.innerHTML = '';
  
  shortcuts.forEach((shortcut, index) => {
    const shortcutElement = document.createElement('a');
    shortcutElement.className = 'shortcut';
    shortcutElement.href = shortcut.url;
    shortcutElement.target = '_blank';
    
    const img = createShortcutImage(shortcut);
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = shortcut.name;
    
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
    
    shortcutElement.appendChild(img);
    shortcutElement.appendChild(nameSpan);
    shortcutElement.appendChild(removeButton);
    
    container.appendChild(shortcutElement);
  });
  
  container.appendChild(createAddShortcutButton());
}