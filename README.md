# 🌍 WanderLingo - AI Travel Translator

**The ultimate AI-powered translation and document processing tool for travelers, backpackers, and digital nomads.** 

WanderLingo combines cutting-edge AI technology with practical travel needs, offering real-time translation, voice communication, intelligent conversation suggestions, and document processing in 50+ languages. Perfect for visa applications, government forms, local interactions, and seamless travel experiences.

## ✨ Key Features

### 🧳 **Traveler Mode** - Your AI Travel Companion
- **Real-time Translation**: Instant translation from English to 50+ languages
- **Voice Input/Output**: Hands-free communication with speech recognition and text-to-speech
- **AI Conversation Suggestions**: Smart, context-aware suggestions for any travel situation
- **Travel Phrase Library**: Quick access to categorized phrases (greetings, directions, food, shopping, emergency, etc.)
- **Contextual Predictions**: AI predicts your next likely responses based on conversation flow
- **Multi-language Support**: Vietnamese, Thai, Spanish, French, German, Japanese, Korean, Chinese, Arabic, Hindi, and many more

### 📄 **Nomad Mode** - Document Processing Powerhouse
- **Document Simplification**: Simplify complex legal documents, visa applications, and government forms
- **AI-Powered Analysis**: Extract key points and explain technical terms
- **Reading Time Estimation**: Know how long documents will take to read
- **Text-to-Speech**: Listen to documents in multiple languages
- **Export Options**: Save as PDF or print documents
- **Document Library**: Save and organize processed documents

### 🔧 **Chrome Extension** - Seamless Web Integration
- **Selected Text Translation**: Right-click to translate any selected text with instant Vietnamese translations
- **Context Menu Integration**: Easy access from any webpage
- **Popup Interface**: Quick translation without leaving your current page
- **Reliable Translation**: Simple, error-free translation system with predefined Vietnamese phrases
- **Voice Input**: Speak to translate, get instant results

### 🤖 **AI Technology Stack**
- **Chrome AI Integration**: Uses Chrome's built-in Gemini Nano models when available
- **Multiple Translation APIs**: Google Translate, Azure Translator, LibreTranslate, MyMemory
- **Intelligent Fallbacks**: Graceful degradation when APIs are unavailable
- **Context-Aware Suggestions**: AI understands your situation and provides relevant responses
- **Confidence Scoring**: Each suggestion includes AI confidence levels

## 🆕 Recent Updates

### Latest Improvements (v1.2.0)
- ✅ **Fixed Selected Text Translation**: Resolved `translateText is not defined` errors
- ✅ **Simplified Translation System**: Replaced complex injection with reliable message passing
- ✅ **Enhanced Vietnamese Support**: Added comprehensive Vietnamese translations for visa websites
- ✅ **Improved UI/UX**: Modern glass-morphism design with better button styling
- ✅ **Brand Update**: Rebranded from LocaLingo to WanderLingo
- ✅ **Download Feature**: Added text file download for simplified documents
- ✅ **Error Handling**: Better error messages and user feedback

## 🚀 Quick Start

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/wanderlingo.git
cd wanderlingo

# Install dependencies
npm install

# Start development server
npm run dev
```

### Chrome Extension Setup

```bash
# Build the extension
npm run build:extension

# Load in Chrome
# 1. Open Chrome and go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the 'dist' folder
```

## 🎯 Usage Guide

### For Travelers

1. **Click "🧳 Traveler Mode"** in the header
2. **Select your destination language** (e.g., Vietnamese for Vietnam)
3. **Choose your situation** (greeting, directions, food, shopping, emergency, etc.)
4. **Type or speak** what you want to say in English
5. **Get instant translation** and AI-powered suggestions
6. **Use voice features** for hands-free communication
7. **Access quick phrases** from the suggestion grid

### For Digital Nomads

1. **Click "📄 Nomad Mode"** in the header
2. **Paste text or load from URL** (visa applications, legal documents, etc.)
3. **Select language and complexity level**
4. **Click "Simplify" or "Translate & Simplify"**
5. **Review key points and term explanations**
6. **Save to your document library**
7. **Export as PDF or print**

### Chrome Extension Usage

1. **Right-click on any webpage** → "Translate this page with WanderLingo"
2. **Select text and right-click** → "Translate with WanderLingo"
3. **Click the extension icon** for quick translation popup
4. **Use voice input** directly in the popup
5. **Access conversation help** for travel phrases

## 🌐 Supported Languages

**50+ Languages Supported:**
- **Asian**: Vietnamese, Thai, Chinese, Japanese, Korean, Hindi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Marathi, Nepali, Sinhala, Burmese, Khmer, Lao
- **European**: Spanish, French, German, Italian, Portuguese, Russian, Dutch, Turkish, Polish, Greek, Hebrew
- **Middle Eastern**: Arabic, Persian, Urdu
- **And many more...**

## 🔧 Configuration (Optional)

### Translation API Setup

For enhanced translation quality, add your API keys:

1. Copy `env.example` to `.env`:
```bash
cp env.example .env
```

2. Add your API keys to `.env`:
```bash
# Google Translate (Free tier available)
VITE_GOOGLE_TRANSLATE_API_KEY=your_key_here

# Azure Translator (Free tier available)
VITE_AZURE_TRANSLATOR_KEY=your_key_here
VITE_AZURE_TRANSLATOR_REGION=your_region

# LibreTranslate (Free, no key needed)
VITE_LIBRETRANSLATE_URL=https://libretranslate.com
```

### API Key Sources

- **Google Translate**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Azure Translator**: [Azure Portal](https://portal.azure.com/)
- **LibreTranslate**: Free, no registration required

## 🎨 Features in Detail

### AI-Powered Conversation Suggestions

- **Smart Context Detection**: AI automatically detects your situation
- **Confidence Scoring**: Each suggestion includes reliability scores
- **Multi-language Support**: Works with all supported languages
- **Contextual Flow**: Suggestions adapt based on conversation history

### Voice Features

- **Speech Recognition**: Speak in English, get translations
- **Text-to-Speech**: Listen to translations in target language
- **Hands-free Operation**: Perfect for busy travel situations
- **Language-specific Voices**: Natural pronunciation for each language

### Document Processing

- **Complexity Levels**: Child, Simple, Standard simplification
- **Key Point Extraction**: AI identifies important information
- **Term Explanations**: Technical terms explained in simple language
- **Reading Time**: Accurate time estimates for document review

### Chrome Extension Features

- **Page Translation**: Translate entire web pages
- **Selected Text**: Right-click translation
- **Context Menu**: Easy access from any webpage
- **Popup Interface**: Quick translation without page navigation
- **Voice Integration**: Speak to translate, listen to results

## 🛠️ Technical Details

### Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **AI Integration**: Chrome AI APIs (Gemini Nano), Multiple Translation APIs
- **Voice**: Web Speech API (Speech Recognition & Synthesis)
- **Extension**: Chrome Extension Manifest V3
- **Storage**: In-memory library with JSON export/import

### Architecture

- **Modular Design**: Separate services for translation, AI, conversation, and OCR
- **Graceful Fallbacks**: Multiple API providers with intelligent fallback chains
- **Client-side Processing**: No server required, works offline
- **Privacy-focused**: All processing happens locally when possible

### Browser Compatibility

- **Chrome**: Full support including Chrome AI APIs
- **Edge**: Full support including Chrome AI APIs
- **Firefox**: Basic support (voice features may be limited)
- **Safari**: Basic support (voice features may be limited)

## 📱 Use Cases

### For Travelers
- **Restaurant Orders**: "I'm vegetarian, what do you recommend?"
- **Directions**: "How do I get to the train station?"
- **Shopping**: "How much does this cost? Can you make it cheaper?"
- **Emergency**: "I need help! Where is the hospital?"
- **Accommodation**: "What time is check-in? Is there WiFi?"

### For Digital Nomads
- **Visa Applications**: Simplify complex government forms
- **Legal Documents**: Process contracts and agreements
- **Business Communication**: Translate professional correspondence
- **Local Regulations**: Understand local laws and requirements
- **Documentation**: Process official paperwork

### For Students & Researchers
- **Academic Papers**: Simplify complex research documents
- **Foreign Language Learning**: Practice with real-world examples
- **Cultural Understanding**: Learn local phrases and customs
- **Research**: Translate foreign sources and documents

## 🔒 Privacy & Security

- **No Data Collection**: All processing happens locally
- **No Server Required**: Works completely offline
- **API Keys Optional**: Basic functionality without external APIs
- **Secure**: No personal data transmitted or stored
- **Open Source**: Transparent code, community audited

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/wanderlingo.git
cd wanderlingo

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build Chrome extension
npm run build:extension
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chrome AI Team**: For the experimental AI APIs
- **Translation API Providers**: Google, Microsoft, LibreTranslate, MyMemory
- **Open Source Community**: For the amazing tools and libraries
- **Travelers & Nomads**: For the inspiration and feedback

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/wanderlingo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/wanderlingo/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/wanderlingo/wiki)

---

**Made with ❤️ for travelers, backpackers, and digital nomads worldwide.**

*WanderLingo - Your AI-powered travel companion for seamless global communication.*