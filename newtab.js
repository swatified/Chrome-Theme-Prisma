document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get(['currentImage'], function(result) {
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
  });
});