// Background service worker for LocaLingo Chrome Extension

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      targetLanguage: 'Vietnamese',
      voiceEnabled: true,
      autoTranslate: false
    });
    
    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('index.html')
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'openPopup':
      chrome.action.openPopup();
      break;
      
    case 'openFullApp':
      chrome.tabs.create({
        url: chrome.runtime.getURL('index.html')
      });
      break;
      
    case 'openDocumentTranslator':
      chrome.tabs.create({
        url: chrome.runtime.getURL('index.html#document')
      });
      break;
      
    case 'translateSelectedText':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: translateSelectedText,
          args: [request.targetLanguage]
        });
      });
      break;
      
    case 'translatePage':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: translatePage,
          args: [request.targetLanguage]
        });
      });
      break;
  }
});

// Context menu for right-click translation
chrome.runtime.onInstalled.addListener(() => {
  // Check if contextMenus API is available
  if (chrome.contextMenus) {
    try {
      chrome.contextMenus.create({
        id: 'translate-selection',
        title: 'Translate with LocaLingo',
        contexts: ['selection']
      });
      
      chrome.contextMenus.create({
        id: 'translate-page',
        title: 'Translate this page with LocaLingo',
        contexts: ['page']
      });
    } catch (error) {
      console.error('Failed to create context menu:', error);
    }
  }
});

// Add context menu click listener only if contextMenus is available
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'translate-selection') {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: translateSelectedText,
        args: ['Vietnamese']
      });
    } else if (info.menuItemId === 'translate-page') {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: translatePage,
        args: ['Vietnamese']
      });
    }
  });
}

// Functions to be injected into content scripts
function translateSelectedText(targetLanguage) {
  const selection = window.getSelection();
  if (selection.toString().trim()) {
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    // Create a temporary element to show translation
    const translationDiv = document.createElement('div');
    translationDiv.style.cssText = `
      position: absolute;
      background: #4CAF50;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    translationDiv.textContent = 'Translating...';
    
    // Position the tooltip
    const rect = range.getBoundingClientRect();
    translationDiv.style.left = rect.left + 'px';
    translationDiv.style.top = (rect.bottom + 10) + 'px';
    
    document.body.appendChild(translationDiv);
    
    // Translate the text
    translateText(selectedText, targetLanguage)
      .then(translation => {
        translationDiv.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 4px;">${translation}</div>
          <div style="font-size: 12px; opacity: 0.8;">${selectedText}</div>
        `;
      })
      .catch(error => {
        translationDiv.textContent = 'Translation failed';
        translationDiv.style.background = '#f44336';
      });
    
    // Remove tooltip after 5 seconds
    setTimeout(() => {
      if (translationDiv.parentNode) {
        translationDiv.parentNode.removeChild(translationDiv);
      }
    }, 5000);
  }
}

async function translatePage(targetLanguage) {
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th');
  const targetCode = targetLanguage === 'Vietnamese' ? 'vi' : 'en';
  
  // Reset all translated markers to allow re-translation
  elements.forEach(element => {
    delete element.dataset.translated;
    element.style.border = '';
    element.style.borderRadius = '';
    element.style.padding = '';
    element.style.margin = '';
  });
  
  // Process elements in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < elements.length; i += batchSize) {
    const batch = Array.from(elements).slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (element) => {
      if (element.textContent.trim() && !element.dataset.translated && element.textContent.length > 3) {
        element.dataset.translated = 'true';
        element.style.border = '2px solid #4CAF50';
        element.style.borderRadius = '4px';
        element.style.padding = '4px';
        element.style.margin = '2px';
        
        try {
          const translation = await translateText(element.textContent, targetLanguage);
          if (translation && translation !== element.textContent) {
            element.innerHTML = `<span style="color: #2e7d32; font-weight: 500;">${translation}</span><br><small style="color: #666; font-style: italic;">${element.textContent}</small>`;
          }
        } catch (error) {
          console.error('Translation error:', error);
          element.style.border = '2px solid #f44336';
        }
      }
    }));
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function translateText(text, targetLanguage) {
  const LANGUAGE_CODES = {
    'English': 'en',
    'Spanish': 'es',
    'Mandarin': 'zh',
    'Chinese': 'zh',
    'Hindi': 'hi',
    'Arabic': 'ar',
    'French': 'fr',
    'German': 'de',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Japanese': 'ja',
    'Korean': 'ko',
    'Vietnamese': 'vi',
    'Thai': 'th',
    'Indonesian': 'id',
    'Malay': 'ms',
    'Filipino': 'tl',
    'Italian': 'it',
    'Dutch': 'nl',
    'Swedish': 'sv',
    'Norwegian': 'no',
    'Danish': 'da',
    'Finnish': 'fi',
    'Polish': 'pl',
    'Czech': 'cs',
    'Hungarian': 'hu',
    'Romanian': 'ro',
    'Bulgarian': 'bg',
    'Croatian': 'hr',
    'Slovak': 'sk',
    'Slovenian': 'sl',
    'Estonian': 'et',
    'Latvian': 'lv',
    'Lithuanian': 'lt',
    'Greek': 'el',
    'Turkish': 'tr',
    'Hebrew': 'he',
    'Persian': 'fa',
    'Urdu': 'ur',
    'Bengali': 'bn',
    'Tamil': 'ta',
    'Telugu': 'te',
    'Gujarati': 'gu',
    'Kannada': 'kn',
    'Malayalam': 'ml',
    'Punjabi': 'pa',
    'Marathi': 'mr',
    'Nepali': 'ne',
    'Sinhala': 'si',
    'Burmese': 'my',
    'Khmer': 'km',
    'Lao': 'lo'
  };
  
  const targetCode = LANGUAGE_CODES[targetLanguage] || 'vi';
  
  try {
    // Try MyMemory API first
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetCode}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
    
    // Fallback to LibreTranslate
    const libreResponse = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetCode,
        format: 'text'
      })
    });
    
    if (libreResponse.ok) {
      const libreData = await libreResponse.json();
      if (libreData.translatedText) {
        return libreData.translatedText;
      }
    }
    
    // Try Google Translate (no API key required for basic usage)
    try {
      const googleResponse = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`
      );
      
      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        if (googleData && googleData[0] && googleData[0][0] && googleData[0][0][0]) {
          return googleData[0][0][0];
        }
      }
    } catch (googleError) {
      console.log('Google Translate fallback failed:', googleError);
    }
    
    // Final fallback
    return `[Translated to ${targetLanguage}] ${text}`;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}
