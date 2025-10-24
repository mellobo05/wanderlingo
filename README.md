## WanderLingo

AI-powered translation and document processing for travelers and digital nomads. Features real-time translation, voice input/output, and AI-powered conversation suggestions in 50+ languages. Perfect for travelers, backpackers, and digital nomads exploring the world. Runs fully client-side with graceful fallbacks; uses Chrome AI APIs when available.

### Run locally

```bash
npm install
npm run dev
```

Open the printed URL. 

**For Document Simplification**: Paste text or load from a URL, choose language and complexity, then click Simplify or Translate & Simplify.

**For Traveler Mode**: Click the "🌍 Traveler Mode" button in the header to access real-time translation and conversation features for foreign travel.

### Features

#### Core Features
- Simplify text at three levels; detect key points and show term explanations
- Translate & simplify (placeholder translation tag)
- Reading-time estimate, TTS "Listen", print/Download PDF
- In-memory library with export/import JSON
- Accessibility: adjustable text size, high contrast, RTL, ARIA labels

#### 🌍 Traveler Mode (NEW!)
- **Real-time Translation**: Translate from English to 50+ languages including Vietnamese, Thai, Indonesian, and more
- **Voice Input/Output**: Hands-free communication with speech recognition and text-to-speech
- **AI Conversation Suggestions**: Smart suggestions based on travel context (greetings, directions, food, shopping, emergency, etc.)
- **Contextual Predictions**: AI predicts next likely responses based on conversation flow
- **Travel Phrase Library**: Quick access to common travel phrases organized by category
- **Conversation History**: Keep track of your translated conversations
- **Multiple Situations**: Choose from greeting, directions, food, shopping, emergency, accommodation, transport, and general conversation

### Translation Setup (Optional)

The app includes real translation APIs. To enable them:

1. Copy `env.example` to `.env` in the project root
2. Add your API keys:
   - **Google Translate**: Get free API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - **Azure Translator**: Get key from [Azure Portal](https://portal.azure.com/)
   - **LibreTranslate**: Free, no key needed (default)

```bash
# Copy the example file
cp env.example .env

# Edit .env and add your keys
VITE_GOOGLE_TRANSLATE_API_KEY=your_key_here
```

### Traveler Mode Usage

1. **Click "🌍 Traveler Mode"** in the header
2. **Select your destination language** (e.g., Vietnamese for Vietnam)
3. **Choose your situation** (greeting, directions, food, etc.)
4. **Type or speak** what you want to say in English
5. **Get instant translation** and AI-powered suggestions
6. **Use voice features** for hands-free communication
7. **Access quick phrases** from the suggestion grid
8. **Track your conversations** in the history section

### Notes
- No server or persistence; library is in-memory only
- Chrome AI APIs are experimental and may not be available; the app degrades to heuristic simplification
- Translation works without API keys (uses fallback), but real APIs provide better quality
- Voice features require microphone access and work best in Chrome/Edge browsers
- Traveler Mode includes 50+ languages with Vietnamese, Thai, Indonesian, and other popular travel destinations
