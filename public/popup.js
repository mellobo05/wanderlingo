// Popup script for WanderLingo Chrome Extension

document.addEventListener('DOMContentLoaded', async () => {
  console.log('WanderLingo popup loaded');
  
  try {
    const targetLanguageSelect = document.getElementById('targetLanguage');
    const quickInput = document.getElementById('quickInput');
    const quickTranslateBtn = document.getElementById('quickTranslateBtn');
    const quickResult = document.getElementById('quickResult');
    
    // Check if elements exist
    if (!targetLanguageSelect || !quickInput || !quickTranslateBtn || !quickResult) {
      console.error('Required DOM elements not found');
      return;
    }
    
    console.log('All DOM elements found');
    
    // Load saved language preference with error handling
    try {
      const savedLanguage = await chrome.storage.sync.get(['targetLanguage']);
      if (savedLanguage.targetLanguage) {
        targetLanguageSelect.value = savedLanguage.targetLanguage;
      }
    } catch (error) {
      console.log('Could not load saved language preference:', error);
    }
    
    // Save language preference when changed
    targetLanguageSelect.addEventListener('change', async () => {
      try {
        await chrome.storage.sync.set({ targetLanguage: targetLanguageSelect.value });
      } catch (error) {
        console.log('Could not save language preference:', error);
      }
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
        console.error('Translation error:', error);
        quickResult.textContent = 'Translation failed. Please try again.';
        quickResult.style.display = 'block';
      } finally {
        quickTranslateBtn.textContent = 'Translate';
        quickTranslateBtn.disabled = false;
      }
    });
  
    // Action button handlers with error handling
    const openTravelerModeBtn = document.getElementById('openTravelerMode');
    if (openTravelerModeBtn) {
      openTravelerModeBtn.addEventListener('click', () => {
        try {
          chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
        } catch (error) {
          console.error('Error opening traveler mode:', error);
        }
      });
    }
    
    const translatePageBtn = document.getElementById('translatePage');
    if (translatePageBtn) {
      translatePageBtn.addEventListener('click', async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.id) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: translatePage,
              args: [targetLanguageSelect.value]
            });
          }
        } catch (error) {
          console.error('Error translating page:', error);
        }
        setTimeout(() => window.close(), 1000);
      });
    }
    
    const translateSelectedBtn = document.getElementById('translateSelected');
    if (translateSelectedBtn) {
      translateSelectedBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        try {
          await chrome.tabs.sendMessage(tab.id, { 
            action: 'translateSelectedText', 
            language: targetLanguageSelect.value 
          });
        } catch (error) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: translateSelectedText,
            args: [targetLanguageSelect.value]
          });
        }
        
        window.close();
      });
    }
    
    const documentTranslatorBtn = document.getElementById('documentTranslator');
    if (documentTranslatorBtn) {
      documentTranslatorBtn.addEventListener('click', () => {
        try {
          chrome.tabs.create({ url: chrome.runtime.getURL('index.html#document') });
        } catch (error) {
          console.error('Error opening document translator:', error);
        }
      });
    }
    
    console.log('All event listeners attached');
    
  } catch (error) {
    console.error('Error in popup initialization:', error);
  }
});

// Simple translation function
async function translateText(text, targetLanguage) {
  const translations = {
    'Vietnamese': {
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
  if (translations[targetLanguage] && translations[targetLanguage][text]) {
    return translations[targetLanguage][text];
  }
  
  // Simple fallback
  return `[Translated to ${targetLanguage}] ${text}`;
}

// Content script functions
function translatePage(targetLanguage) {
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th');
  
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
    
    const rect = range.getBoundingClientRect();
    translationDiv.style.left = rect.left + 'px';
    translationDiv.style.top = (rect.bottom + 10) + 'px';
    
    document.body.appendChild(translationDiv);
    
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
    
    setTimeout(() => {
      if (translationDiv.parentNode) {
        translationDiv.parentNode.removeChild(translationDiv);
      }
    }, 5000);
  }
}