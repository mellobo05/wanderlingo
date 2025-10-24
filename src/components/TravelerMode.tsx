import { useState, useEffect, useRef } from 'react'
import { getConversationAI, type ConversationContext, type ConversationSuggestion } from '../services/conversation'
import { translationService, LANGUAGE_CODES } from '../services/translation'
import { speak, stopSpeaking, speakInLanguage } from '../services/ai'
import { DocumentTranslator } from './DocumentTranslator'

export interface TravelerModeProps {
  isActive: boolean
  onClose: () => void
}

const TRAVEL_SITUATIONS = [
  { value: 'greeting', label: 'Greeting & Introductions' },
  { value: 'directions', label: 'Directions & Navigation' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'shopping', label: 'Shopping & Money' },
  { value: 'emergency', label: 'Emergency & Help' },
  { value: 'accommodation', label: 'Hotels & Accommodation' },
  { value: 'transport', label: 'Transportation' },
  { value: 'general', label: 'General Conversation' }
]

// Removed unused POPULAR_DESTINATIONS constant

export function TravelerMode({ isActive, onClose }: TravelerModeProps) {
  const [currentLanguage, setCurrentLanguage] = useState('Vietnamese')
  const [situation, setSituation] = useState<ConversationContext['situation']>('greeting')
  const [location, setLocation] = useState('')
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [suggestions, setSuggestions] = useState<ConversationSuggestion[]>([])
  const [conversationHistory, setConversationHistory] = useState<Array<{english: string, translated: string, timestamp: number}>>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPlayingTranslation, setIsPlayingTranslation] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [showDocumentTranslator, setShowDocumentTranslator] = useState(false)
  
  const conversationAI = useRef(getConversationAI({
    situation,
    currentLanguage,
    previousMessages: conversationHistory.map(msg => msg.english)
  }))
  const recognition = useRef<SpeechRecognition | null>(null)

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = false
      recognition.current.interimResults = false
      recognition.current.lang = 'en-US'

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        handleTranslate(transcript)
      }

      recognition.current.onend = () => {
        setIsListening(false)
      }

      recognition.current.onerror = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Update conversation AI when context changes
  useEffect(() => {
    conversationAI.current.updateContext({
      situation,
      currentLanguage,
      location,
      previousMessages: conversationHistory.map(msg => msg.english)
    })
    generateSuggestions()
  }, [situation, currentLanguage, location, conversationHistory])

  const generateSuggestions = async () => {
    try {
      const newSuggestions = await conversationAI.current.generateSuggestions(6)
      setSuggestions(newSuggestions)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      // Fallback to empty suggestions
      setSuggestions([])
    }
  }

  const handleTranslate = async (text: string) => {
    if (!text.trim()) return

    try {
      const targetCode = LANGUAGE_CODES[currentLanguage] || 'vi'
      const translated = await translationService.translate(text, 'en', targetCode)
      setTranslatedText(translated)
      
      // Add to conversation history
      const newEntry = {
        english: text,
        translated,
        timestamp: Date.now()
      }
      setConversationHistory(prev => [...prev.slice(-9), newEntry])
      
      // Generate new suggestions based on the input
      const predictions = conversationAI.current.predictNextResponses(text, 4)
      setSuggestions(predictions)
    } catch (error) {
      console.error('Translation error:', error)
      setTranslatedText(`[Translation failed] ${text}`)
    }
  }

  const handleSuggestionClick = (suggestion: ConversationSuggestion) => {
    setInputText(suggestion.text)
    setTranslatedText(suggestion.translated)
    
    // Add to conversation history
    const newEntry = {
      english: suggestion.text,
      translated: suggestion.translated,
      timestamp: Date.now()
    }
    setConversationHistory(prev => [...prev.slice(-9), newEntry])
    
    // Generate new suggestions
    const predictions = conversationAI.current.predictNextResponses(suggestion.text, 4)
    setSuggestions(predictions)
  }

  const handleVoiceInput = () => {
    if (!recognition.current) return

    if (isListening) {
      recognition.current.stop()
      setIsListening(false)
    } else {
      recognition.current.start()
      setIsListening(true)
    }
  }

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
    } else {
      speak(text)
      setIsSpeaking(true)
      // Auto-stop after 10 seconds
      setTimeout(() => {
        stopSpeaking()
        setIsSpeaking(false)
      }, 10000)
    }
  }

  const handlePlayTranslation = () => {
    if (!translatedText) return
    
    if (isPlayingTranslation) {
      stopSpeaking()
      setIsPlayingTranslation(false)
    } else {
      const targetCode = LANGUAGE_CODES[currentLanguage] || 'vi'
      speakInLanguage(translatedText, targetCode)
      setIsPlayingTranslation(true)
      // Auto-stop after 15 seconds
      setTimeout(() => {
        stopSpeaking()
        setIsPlayingTranslation(false)
      }, 15000)
    }
  }

  const clearHistory = () => {
    setConversationHistory([])
    setInputText('')
    setTranslatedText('')
    generateSuggestions()
  }

  if (!isActive) return null

  return (
    <div className="traveler-mode-overlay">
      <div className="traveler-mode">
        <div className="traveler-header">
          <h2>🌍 Traveler Mode</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="traveler-controls">
          <div className="control-group">
            <label>Destination Language:</label>
            <select 
              value={currentLanguage} 
              onChange={(e) => setCurrentLanguage(e.target.value)}
            >
              {Object.keys(LANGUAGE_CODES).map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Location:</label>
            <input
              type="text"
              placeholder="e.g., Ho Chi Minh City, Vietnam"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Situation:</label>
            <select 
              value={situation} 
              onChange={(e) => setSituation(e.target.value as ConversationContext['situation'])}
            >
              {TRAVEL_SITUATIONS.map(sit => (
                <option key={sit.value} value={sit.value}>{sit.label}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
              />
              Enable Voice Features
            </label>
          </div>

          <div className="control-group">
            <button
              onClick={() => setShowDocumentTranslator(true)}
              className="document-translator-btn"
              style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontWeight: '600',
                width: '100%',
                transition: 'all 0.2s'
              }}
            >
              📄 Translate Documents
            </button>
          </div>
        </div>

        <div className="conversation-area">
          <div className="input-section">
            <div className="input-group">
              <label>What do you want to say?</label>
              <div className="input-with-voice">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type or speak your message..."
                  rows={3}
                />
                {voiceEnabled && (
                  <button
                    onClick={handleVoiceInput}
                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    🎤
                  </button>
                )}
              </div>
              <button 
                onClick={() => handleTranslate(inputText)}
                disabled={!inputText.trim()}
                className="translate-btn"
              >
                Translate
              </button>
            </div>

            <div className="translation-group">
              <label>Translation:</label>
              <div className="translation-with-voice">
                <div className="translated-text">{translatedText || 'Translation will appear here...'}</div>
                <div className="audio-controls">
                  {translatedText && (
                    <button
                      onClick={handlePlayTranslation}
                      className={`play-btn ${isPlayingTranslation ? 'playing' : ''}`}
                      title={isPlayingTranslation ? 'Stop playing' : 'Play translation'}
                    >
                      {isPlayingTranslation ? '⏹️' : '▶️'}
                    </button>
                  )}
                  {voiceEnabled && translatedText && (
                    <button
                      onClick={() => handleSpeak(translatedText)}
                      className={`speak-btn ${isSpeaking ? 'speaking' : ''}`}
                      title={isSpeaking ? 'Stop speaking' : 'Speak translation'}
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="suggestions-section">
            <h3>💡 Quick Suggestions</h3>
            <div className="suggestions-grid">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-card">
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="suggestion-btn"
                    title={`Confidence: ${Math.round(suggestion.confidence * 100)}%`}
                  >
                    <div className="suggestion-content">
                      <div className="suggestion-english">{suggestion.text}</div>
                      <div className="suggestion-translated">{suggestion.translated}</div>
                    </div>
                  </button>
                  <div className="suggestion-actions">
                    <button
                      onClick={() => handleSpeak(suggestion.text)}
                      className="suggestion-speak-btn"
                      title="Speak English"
                    >
                      🔊
                    </button>
                    <button
                      onClick={() => {
                        const targetCode = LANGUAGE_CODES[currentLanguage] || 'vi'
                        speakInLanguage(suggestion.translated, targetCode)
                      }}
                      className="suggestion-speak-btn"
                      title="Speak Translation"
                    >
                      🎵
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {conversationHistory.length > 0 && (
            <div className="conversation-history">
              <div className="history-header">
                <h3>📝 Conversation History</h3>
                <button onClick={clearHistory} className="clear-btn">Clear</button>
              </div>
              <div className="history-list">
                {conversationHistory.map((entry, index) => (
                  <div key={index} className="history-entry">
                    <div className="history-content">
                      <div className="history-english">{entry.english}</div>
                      <div className="history-translated">{entry.translated}</div>
                      <div className="history-time">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="history-actions">
                      <button
                        onClick={() => handleSpeak(entry.english)}
                        className="history-speak-btn"
                        title="Speak English"
                      >
                        🔊
                      </button>
                      <button
                        onClick={() => {
                          const targetCode = LANGUAGE_CODES[currentLanguage] || 'vi'
                          speakInLanguage(entry.translated, targetCode)
                        }}
                        className="history-speak-btn"
                        title="Speak Translation"
                      >
                        🎵
                      </button>
                      <button
                        onClick={() => {
                          setInputText(entry.english)
                          setTranslatedText(entry.translated)
                        }}
                        className="history-reuse-btn"
                        title="Reuse this phrase"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="traveler-footer">
          <small>
            💡 Tip: Use voice input for hands-free communication, or click suggestions for quick phrases!
          </small>
        </div>
      </div>

      <DocumentTranslator
        isActive={showDocumentTranslator}
        onClose={() => setShowDocumentTranslator(false)}
        targetLanguage={currentLanguage}
      />
    </div>
  )
}

export default TravelerMode
