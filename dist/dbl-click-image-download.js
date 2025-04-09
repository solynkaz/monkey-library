// ==UserScript==
// @name         Fast Image Downloader on Double Click
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Double-click any image on any site to download it in source quality
// @author       solynkaz
// @match        *://*/*
// @updateURL
// @downloadURL
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Utility to download file
  function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'image';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Generate a filename from URL
  function getFilenameFromURL(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const name = pathname.substring(pathname.lastIndexOf('/') + 1) || 'image';
      return decodeURIComponent(name.split('?')[0]);
    } catch {
      return 'image';
    }
  }

  // Handle double click
  function handleDoubleClick(e) {
    const img = e.target;
    if (img.tagName.toLowerCase() !== 'img') return;

    const src = img.currentSrc || img.src;

    // Special handling for blob or data URLs
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      fetch(src)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const filename = getFilenameFromURL(img.src);
          downloadImage(url, filename);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        });
    } else {
      const filename = getFilenameFromURL(src);
      downloadImage(src, filename);
    }

    e.preventDefault();
    e.stopPropagation();
  }

  // Add listeners to all existing and future images
  function addListenersToImages() {
    document.querySelectorAll('img').forEach(img => {
      if (!img.dataset.fastDownloadAttached) {
        img.addEventListener('dblclick', handleDoubleClick);
        img.dataset.fastDownloadAttached = 'true';
      }
    });
  }

  // Initial run
  addListenersToImages();

  // Observe for dynamically added images
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        addListenersToImages();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
