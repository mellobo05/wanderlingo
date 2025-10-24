// Popup script for LocaLingo Chrome Extension

document.addEventListener('DOMContentLoaded', async () => {
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const quickInput = document.getElementById('quickInput');
  const quickTranslateBtn = document.getElementById('quickTranslateBtn');
  const quickResult = document.getElementById('quickResult');
  
  // Load saved language preference
  const savedLanguage = await chrome.storage.sync.get(['targetLanguage']);
  if (savedLanguage.targetLanguage) {
    targetLanguageSelect.value = savedLanguage.targetLanguage;
  }
  
  // Save language preference when changed
  targetLanguageSelect.addEventListener('change', async () => {
    await chrome.storage.sync.set({ targetLanguage: targetLanguageSelect.value });
  });
  
  // Quick translate functionality
  quickTranslateBtn.addEventListener('click', async () => {
    const text = quickInput.value.trim();
    if (!text) return;
    
    quickTranslateBtn.textContent = 'Translating...';
    quickTranslateBtn.disabled = true;
    
    try {
      const result = await translateText(text, targetLanguageSelect.value);
      quickResult.textContent = result;
      quickResult.style.display = 'block';
    } catch (error) {
      quickResult.textContent = 'Translation failed. Please try again.';
      quickResult.style.display = 'block';
    } finally {
      quickTranslateBtn.textContent = 'Translate';
      quickTranslateBtn.disabled = false;
    }
  });
  
  // Action button handlers
  document.getElementById('openTravelerMode').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  });
  
  document.getElementById('translatePage').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: translatePage,
      args: [targetLanguageSelect.value]
    });
    window.close();
  });
  
  document.getElementById('translateSelected').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: translateSelectedText,
      args: [targetLanguageSelect.value]
    });
    window.close();
  });
  
  document.getElementById('documentTranslator').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html#document') });
  });
});

// Translation function with multiple fallback options
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
  
  // Simple translation dictionary for common phrases
  const commonTranslations = {
    'vi': {
      'Hello': 'Xin chào',
      'Thank you': 'Cảm ơn',
      'How much': 'Bao nhiêu',
      'Where is': 'Ở đâu',
      'I need help': 'Tôi cần giúp đỡ',
      'Excuse me': 'Xin lỗi',
      'Yes': 'Có',
      'No': 'Không',
      'Please': 'Làm ơn',
      'Sorry': 'Xin lỗi',
      'Good morning': 'Chào buổi sáng',
      'Good afternoon': 'Chào buổi chiều',
      'Good evening': 'Chào buổi tối',
      'Goodbye': 'Tạm biệt',
      'I don\'t understand': 'Tôi không hiểu',
      'Do you speak English?': 'Bạn có nói tiếng Anh không?',
      'Can you help me?': 'Bạn có thể giúp tôi không?',
      'I\'m lost': 'Tôi bị lạc',
      'Where is the bathroom?': 'Nhà vệ sinh ở đâu?',
      'How much does this cost?': 'Cái này giá bao nhiêu?',
      'I want to buy this': 'Tôi muốn mua cái này',
      'I\'m hungry': 'Tôi đói',
      'I\'m thirsty': 'Tôi khát',
      'Water': 'Nước',
      'Food': 'Thức ăn',
      'Hotel': 'Khách sạn',
      'Airport': 'Sân bay',
      'Taxi': 'Taxi',
      'Bus': 'Xe buýt',
      'Train': 'Tàu hỏa',
      'Money': 'Tiền',
      'Credit card': 'Thẻ tín dụng',
      'Passport': 'Hộ chiếu',
      'Visa': 'Thị thực',
      'Police': 'Cảnh sát',
      'Hospital': 'Bệnh viện',
      'Pharmacy': 'Nhà thuốc',
      'Emergency': 'Khẩn cấp',
      'Help': 'Giúp đỡ',
      'Stop': 'Dừng lại',
      'Go': 'Đi',
      'Left': 'Trái',
      'Right': 'Phải',
      'Straight': 'Thẳng',
      'Turn': 'Rẽ',
      'Street': 'Đường phố',
      'Address': 'Địa chỉ',
      'Phone number': 'Số điện thoại',
      'Email': 'Email',
      'Internet': 'Internet',
      'WiFi': 'WiFi',
      'Password': 'Mật khẩu',
      'Open': 'Mở',
      'Closed': 'Đóng',
      'Today': 'Hôm nay',
      'Tomorrow': 'Ngày mai',
      'Yesterday': 'Hôm qua',
      'Now': 'Bây giờ',
      'Later': 'Sau',
      'Before': 'Trước',
      'After': 'Sau',
      'Morning': 'Buổi sáng',
      'Afternoon': 'Buổi chiều',
      'Evening': 'Buổi tối',
      'Night': 'Buổi tối',
      'Week': 'Tuần',
      'Month': 'Tháng',
      'Year': 'Năm',
      'Time': 'Thời gian',
      'Date': 'Ngày',
      'Monday': 'Thứ hai',
      'Tuesday': 'Thứ ba',
      'Wednesday': 'Thứ tư',
      'Thursday': 'Thứ năm',
      'Friday': 'Thứ sáu',
      'Saturday': 'Thứ bảy',
      'Sunday': 'Chủ nhật'
    }
  };
  
  // Check if we have a direct translation
  if (commonTranslations[targetCode] && commonTranslations[targetCode][text]) {
    return commonTranslations[targetCode][text];
  }
  
  try {
    // Try Google Translate API (free tier)
    const googleResponse = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`
    );
    
    if (googleResponse.ok) {
      const data = await googleResponse.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
    }
  } catch (error) {
    console.log('Google Translate failed:', error);
  }
  
  try {
    // Try MyMemory API
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetCode}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (error) {
    console.log('MyMemory API failed:', error);
  }
  
  try {
    // Try LibreTranslate
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
  } catch (error) {
    console.log('LibreTranslate failed:', error);
  }
  
  try {
    // Try Google Translate (no API key required for basic usage)
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
  
  // Final fallback - return with language indicator
  return `[Translated to ${targetLanguage}] ${text}`;
}

// Content script functions
function translatePage(targetLanguage) {
  // This will be injected into the page
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th');
  
  // Reset all translated markers to allow re-translation
  elements.forEach(element => {
    delete element.dataset.translated;
    element.style.border = '';
    element.style.borderRadius = '';
    element.style.padding = '';
    element.style.margin = '';
  });
  
  elements.forEach(async (element) => {
    if (element.textContent.trim() && !element.dataset.translated) {
      element.dataset.translated = 'true';
      element.style.border = '2px solid #4CAF50';
      element.style.borderRadius = '4px';
      element.style.padding = '4px';
      element.style.margin = '2px';
      
      try {
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(element.textContent)}&langpair=en|vi`
        );
        const data = await response.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          element.innerHTML = `<span style="color: #2e7d32; font-weight: 500;">${data.responseData.translatedText}</span><br><small style="color: #666; font-style: italic;">${element.textContent}</small>`;
        }
      } catch (error) {
        console.error('Translation error:', error);
      }
    }
  });
}

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
