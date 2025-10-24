// Content script for LocaLingo Chrome Extension
// This script runs on all web pages to provide translation functionality

// Inject CSS
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = chrome.runtime.getURL('content.css')
document.head.appendChild(link)

(function() {
  'use strict';
  
  // Create floating translation button
  function createFloatingButton() {
    const button = document.createElement('div');
    button.id = 'localingo-floating-btn';
    button.innerHTML = '🌍';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      user-select: none;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
    
    button.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });
    
    document.body.appendChild(button);
  }
  
  // Create translation overlay
  function createTranslationOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'localingo-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10001;
      display: none;
      align-items: center;
      justify-content: center;
    `;
    
    overlay.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">🌍 LocaLingo Translation</h2>
          <button id="close-overlay" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
          ">×</button>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
            Translate to:
          </label>
          <select id="target-lang" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
          ">
            <option value="Vietnamese">Vietnamese</option>
            <option value="Thai">Thai</option>
            <option value="Indonesian">Indonesian</option>
            <option value="Malay">Malay</option>
            <option value="Filipino">Filipino</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Chinese">Chinese</option>
            <option value="Arabic">Arabic</option>
            <option value="Hindi">Hindi</option>
            <option value="Portuguese">Portuguese</option>
            <option value="Russian">Russian</option>
            <option value="Italian">Italian</option>
            <option value="Dutch">Dutch</option>
            <option value="Turkish">Turkish</option>
            <option value="Polish">Polish</option>
            <option value="Greek">Greek</option>
            <option value="Hebrew">Hebrew</option>
            <option value="Persian">Persian</option>
            <option value="Urdu">Urdu</option>
            <option value="Bengali">Bengali</option>
            <option value="Tamil">Tamil</option>
            <option value="Telugu">Telugu</option>
            <option value="Gujarati">Gujarati</option>
            <option value="Kannada">Kannada</option>
            <option value="Malayalam">Malayalam</option>
            <option value="Punjabi">Punjabi</option>
            <option value="Marathi">Marathi</option>
            <option value="Nepali">Nepali</option>
            <option value="Sinhala">Sinhala</option>
            <option value="Burmese">Burmese</option>
            <option value="Khmer">Khmer</option>
            <option value="Lao">Lao</option>
          </select>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
            Text to translate:
          </label>
          <textarea id="text-input" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            min-height: 80px;
            resize: vertical;
          " placeholder="Type or paste text to translate..."></textarea>
        </div>
        
        <div style="margin-bottom: 20px;">
          <button id="translate-btn" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            width: 100%;
          ">Translate</button>
        </div>
        
        <div id="translation-result" style="
          background: #f5f5f5;
          padding: 15px;
          border-radius: 6px;
          min-height: 60px;
          display: none;
        "></div>
        
        <div style="margin-top: 20px; text-align: center;">
          <button id="open-full-app" style="
            background: #2196F3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 10px;
          ">Open Full App</button>
          <button id="translate-page-btn" style="
            background: #FF9800;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Translate This Page</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event listeners
    document.getElementById('close-overlay').addEventListener('click', () => {
      overlay.style.display = 'none';
    });
    
    document.getElementById('translate-btn').addEventListener('click', async () => {
      const text = document.getElementById('text-input').value.trim();
      const targetLang = document.getElementById('target-lang').value;
      
      if (!text) return;
      
      const translateBtn = document.getElementById('translate-btn');
      const resultDiv = document.getElementById('translation-result');
      
      translateBtn.textContent = 'Translating...';
      translateBtn.disabled = true;
      
      try {
        const translation = await translateText(text, targetLang);
        resultDiv.innerHTML = `
          <div style="font-weight: 600; color: #2e7d32; margin-bottom: 8px;">Translation:</div>
          <div style="margin-bottom: 8px;">${translation}</div>
          <div style="font-size: 12px; color: #666; font-style: italic;">Original: ${text}</div>
        `;
        resultDiv.style.display = 'block';
      } catch (error) {
        resultDiv.innerHTML = '<div style="color: #f44336;">Translation failed. Please try again.</div>';
        resultDiv.style.display = 'block';
      } finally {
        translateBtn.textContent = 'Translate';
        translateBtn.disabled = false;
      }
    });
    
    document.getElementById('open-full-app').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openFullApp' });
    });
    
    document.getElementById('translate-page-btn').addEventListener('click', () => {
      const targetLang = document.getElementById('target-lang').value;
      translatePage(targetLang);
      overlay.style.display = 'none';
    });
    
    return overlay;
  }
  
  // Translation function
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
  
  // Translate page function
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
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createFloatingButton();
      createTranslationOverlay();
    });
  } else {
    createFloatingButton();
    createTranslationOverlay();
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openOverlay') {
      const overlay = document.getElementById('localingo-overlay');
      if (overlay) {
        overlay.style.display = 'flex';
      }
    }
  });
  
})();
