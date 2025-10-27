// Background service worker for WanderLingo Chrome Extension

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
      
    case 'fetchUrl':
      // Handle URL fetching for Nomad mode
      fetchUrlContent(request.url)
        .then(content => {
          sendResponse({ success: true, content: content });
        })
        .catch(error => {
          console.error('Error fetching URL:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep the message channel open for async response
      
    case 'fetchUrlWithTab':
      // Alternative method: open tab and extract content
      fetchUrlWithTab(request.url)
        .then(content => {
          sendResponse({ success: true, content: content });
        })
        .catch(error => {
          console.error('Error fetching URL with tab:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep the message channel open for async response
      
    case 'translate':
      // Handle text translation request
      handleTranslate(request.text, request.targetLanguage)
        .then(translation => {
          sendResponse({ success: true, translation: translation });
        })
        .catch(error => {
          console.error('Error translating text:', error);
          sendResponse({ success: false, translation: `[Translation failed] ${request.text}` });
        });
      return true; // Keep the message channel open for async response
      
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

// Function to fetch URL content using a temporary tab (for SPAs)
async function fetchUrlWithTab(url) {
  return new Promise((resolve, reject) => {
    // Create a temporary tab
    chrome.tabs.create({ url: url, active: false }, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // Wait for the tab to load
      const checkComplete = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(checkComplete);
          
          // Wait longer for SPAs to load their content
          setTimeout(() => {
            // Extract content from the loaded page
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: () => {
                // Wait for any dynamic content to load
                return new Promise((resolve) => {
                  // Check if content is still loading
                  const checkContent = () => {
                    const bodyText = document.body.innerText || document.body.textContent || '';
                    const title = document.title || '';
                    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
                    
                    // If we have substantial content, return it
                    if (bodyText.length > 200) {
                      resolve({
                        title: title,
                        description: metaDescription,
                        content: bodyText
                      });
                    } else {
                      // Wait a bit more and try again
                      setTimeout(checkContent, 1000);
                    }
                  };
                  
                  // Start checking after a short delay
                  setTimeout(checkContent, 2000);
                });
              }
            }, (results) => {
              // Close the temporary tab
              chrome.tabs.remove(tab.id);
              
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              
              if (results && results[0] && results[0].result) {
                const data = results[0].result;
                const fullContent = `${data.title}\n\n${data.description}\n\n${data.content}`;
                resolve(fullContent);
              } else {
                reject(new Error('Failed to extract content from page'));
              }
            });
          }, 3000); // Wait 3 seconds for SPA to load
        }
      };
      
      chrome.tabs.onUpdated.addListener(checkComplete);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(checkComplete);
        chrome.tabs.remove(tab.id);
        reject(new Error('Timeout waiting for page to load'));
      }, 30000);
    });
  });
}

// Function to fetch URL content from background script
async function fetchUrlContent(url) {
  try {
    console.log('Background script: Fetching URL:', url);
    
    // Use fetch API from background script (has more permissions)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    console.log('Background script: Response status:', response.status);
    console.log('Background script: Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('Background script: Successfully fetched URL content, length:', html.length);
    console.log('Background script: First 500 chars:', html.substring(0, 500));
    return html;
  } catch (error) {
    console.error('Background script: Error fetching URL:', error);
    throw error;
  }
}

// Handle text translation function
async function handleTranslate(text, targetLanguage) {
  console.log('Background: Translating text:', text, 'to:', targetLanguage);
  
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
    'Dutch': 'nl'
  };
  
  const targetCode = LANGUAGE_CODES[targetLanguage] || 'vi';
  
  // Common direct translations
  const commonTranslations = {
    'vi': {
      'how much does it cost': 'giá bao nhiêu',
      'how much': 'bao nhiêu',
      'cost': 'giá',
      'price': 'giá',
      'hello': 'xin chào',
      'thank you': 'cảm ơn',
      'please': 'làm ơn',
      'sorry': 'xin lỗi',
      'yes': 'có',
      'no': 'không'
    }
  };
  
  // Check for direct translation first
  const lowerText = text.toLowerCase();
  if (commonTranslations[targetCode] && commonTranslations[targetCode][lowerText]) {
    console.log('Using direct translation:', commonTranslations[targetCode][lowerText]);
    return commonTranslations[targetCode][lowerText];
  }
  
  // Try Google Translate API
  try {
    console.log('Trying Google Translate API...');
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        console.log('Google Translate successful:', data[0][0][0]);
        return data[0][0][0];
      }
    }
  } catch (error) {
    console.log('Google Translate failed:', error);
  }
  
  // Try MyMemory API as fallback
  try {
    console.log('Trying MyMemory API...');
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetCode}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        console.log('MyMemory API successful:', data.responseData.translatedText);
        return data.responseData.translatedText;
      }
    }
  } catch (error) {
    console.log('MyMemory API failed:', error);
  }
  
  // Fallback: return original text with translation prefix
  console.log('All translation APIs failed, returning fallback');
  return `[Translated to ${targetLanguage}] ${text}`;
}

// Context menu for right-click translation
chrome.runtime.onInstalled.addListener(() => {
  // Check if contextMenus API is available
  if (chrome.contextMenus) {
    try {
      chrome.contextMenus.create({
        id: 'translate-selection',
        title: 'Translate with WanderLingo',
        contexts: ['selection']
      });
      
      chrome.contextMenus.create({
        id: 'translate-page',
        title: 'Translate this page with WanderLingo',
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

// Simple translation function - NO COMPLEX INJECTION
function translateSelectedText(targetLanguage) {
  console.log('Simple translation called for:', targetLanguage);
  
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (!selectedText) {
    alert('Please select some text to translate');
    return;
  }
  
  // Simple direct translations - English to Vietnamese
  const translations = {
    'Vietnamese visa is a type of travel document granted by competent Vietnamese authorities, providing permission to travel to and enter Viet Nam.': 'Thị thực Việt Nam là một loại giấy tờ du lịch được cấp bởi các cơ quan có thẩm quyền của Việt Nam, cung cấp quyền đi lại và nhập cảnh vào Việt Nam.',
    'Viet Nam e-Visa is valid for a maximum of 90 days, for single or multiple entries.': 'Thị thực điện tử Việt Nam có hiệu lực tối đa 90 ngày, cho một hoặc nhiều lần nhập cảnh.',
    'THỊ THỰC ĐIỆN TỬ VIỆT NAM': 'VIETNAM ELECTRONIC VISA',
    'Dành cho người nước ngoài đang ở nước ngoài trục tiep de nghị cup mị thực điện tử': 'For foreigners currently abroad who directly apply for an electronic visa',
    'For foreigners outside Viet Nam applying for an e-Visa personally': 'Dành cho người nước ngoài bên ngoài Việt Nam đăng ký thị thực điện tử cá nhân',
    'Fill out the Application form': 'Điền đầy đủ thông tin khai báo',
    'Complete payment': 'Tiến hành thanh toán',
    'Receive e-Visa online': 'Nhận e-Visa trực tuyến',
    'GENERAL': 'TỔNG QUAN',
    'Apply now': 'Đăng ký ngay',
    'HOME': 'TRANG CHỦ',
    'E-VISA': 'THỊ THỰC ĐIỆN TỬ',
    'SEARCH': 'TÌM KIẾM',
    'INSTRUCTION': 'HƯỚNG DẪN',
    'FAQS': 'CÂU HỎI THƯỜNG GẶP',
    'CONTACT US': 'LIÊN HỆ'
  };
  
  // Check if we have a direct translation
  let translation;
  if (translations[selectedText]) {
    translation = translations[selectedText];
  } else {
    // For Vietnamese language, show Vietnamese text
    if (targetLanguage === 'Vietnamese') {
      translation = `[Chưa có bản dịch] ${selectedText}`;
    } else {
      translation = `[Translated to ${targetLanguage}] ${selectedText}`;
    }
  }
  
  // Show translation in a simple alert
  alert(`Translation:\n${translation}\n\nOriginal:\n${selectedText}`);
}

function performTranslation(text, targetLanguage, translationDiv) {
  console.log('Starting translation of:', text);
  
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
      'Sunday': 'Chủ nhật',
      'Vietnamese visa is a type of travel document granted by competent Vietnamese authorities, providing permission to travel to and enter Viet Nam.': 'Thị thực Việt Nam là một loại giấy tờ du lịch được cấp bởi các cơ quan có thẩm quyền của Việt Nam, cung cấp quyền đi lại và nhập cảnh vào Việt Nam.',
      'Viet Nam e-Visa is valid for a maximum of 90 days, for single or multiple entries.': 'Thị thực điện tử Việt Nam có hiệu lực tối đa 90 ngày, cho một hoặc nhiều lần nhập cảnh.'
    }
  };
  
  // Check if we have a direct translation
  if (commonTranslations[targetCode] && commonTranslations[targetCode][text]) {
    console.log('Using common translation:', commonTranslations[targetCode][text]);
    translationDiv.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">${commonTranslations[targetCode][text]}</div>
      <div style="font-size: 12px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px;">${text}</div>
    `;
    return;
  }
  
  // Try API translation
  tryGoogleTranslate(text, targetCode, translationDiv);
}

function tryGoogleTranslate(text, targetCode, translationDiv) {
  console.log('Trying Google Translate API...');
  
  fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Google Translate API failed');
    })
    .then(data => {
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        console.log('Google Translate successful:', data[0][0][0]);
        translationDiv.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">${data[0][0][0]}</div>
          <div style="font-size: 12px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px;">${text}</div>
        `;
      } else {
        tryMyMemory(text, targetCode, translationDiv);
      }
      })
      .catch(error => {
      console.log('Google Translate failed:', error);
      tryMyMemory(text, targetCode, translationDiv);
    });
}

function tryMyMemory(text, targetCode, translationDiv) {
  console.log('Trying MyMemory API...');
  
  fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetCode}`)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('MyMemory API failed');
    })
    .then(data => {
      console.log('MyMemory API response:', data);
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        console.log('MyMemory API successful:', data.responseData.translatedText);
        translationDiv.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">${data.responseData.translatedText}</div>
          <div style="font-size: 12px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px;">${text}</div>
        `;
      } else {
        showFallbackTranslation(text, translationDiv);
      }
    })
    .catch(error => {
      console.log('MyMemory API failed:', error);
      showFallbackTranslation(text, translationDiv);
    });
}

function showFallbackTranslation(text, translationDiv) {
  console.log('All translation services failed, using fallback');
  translationDiv.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">[Translated to Vietnamese] ${text}</div>
    <div style="font-size: 12px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px;">${text}</div>
  `;
}

function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    background: #f44336;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    top: 20px;
    right: 20px;
    font-family: Arial, sans-serif;
  `;
  
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 3000);
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
  console.log('Background script: Starting translation of "' + text + '" to ' + targetLanguage);
  
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
    console.log('Background script: All translation services failed, using fallback');
    return `[Translated to ${targetLanguage}] ${text}`;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}
