import { useState, useEffect } from 'react'
import './App.css'
import { Controls } from './components/Controls'
import { Editor } from './components/Editor'
import { Output } from './components/Output'
import { simplify, speak, stopSpeaking, translateAndSimplify } from './services/ai'
import type { ComplexityLevel } from './services/ai'
import { useLibrary } from './store/useLibrary'
import { aiContextService, type AISuggestion } from './services/ai-context'

function App() {
  const [mode, setMode] = useState<'traveler' | 'nomad'>('traveler')
  const [language, setLanguage] = useState('Vietnamese')
  const [complexity, setComplexity] = useState<ComplexityLevel>('simple')
  const [contextTopic, setContextTopic] = useState('')
  const [textSize, setTextSize] = useState(16)
  const [rtl, setRtl] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  const [url, setUrl] = useState('')
  const [source, setSource] = useState('')

  const [simplified, setSimplified] = useState('')
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [termExplanations, setTermExplanations] = useState<Array<{ term: string; explanation: string }>>([])
  const [readTimeMin, setReadTimeMin] = useState(1)
  const [loading, setLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [chromeAIStatus, setChromeAIStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')

  const { docs, add, remove, exportJson } = useLibrary()

  const dirAttr = rtl ? 'rtl' : 'ltr'
  const appClass = highContrast ? 'app high-contrast' : 'app'

  // Function to clear content when switching modes
  const clearContent = () => {
    setSource('')
    setSimplified('')
    setKeyPoints([])
    setTermExplanations([])
    setReadTimeMin(1)
    setUrl('')
  }

  // Clear content when switching modes
  useEffect(() => {
    clearContent()
  }, [mode])

  // Function to extract readable text from HTML
  function extractTextFromHTML(html: string): string {
    // Remove script and style elements
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, ' ')
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
    text = text.replace(/&amp;/g, '&')
    text = text.replace(/&lt;/g, '<')
    text = text.replace(/&gt;/g, '>')
    text = text.replace(/&quot;/g, '"')
    text = text.replace(/&#39;/g, "'")
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim()
    
    // Remove common non-content patterns
    text = text.replace(/\{[^}]*\}/g, '') // Remove JSON-like structures
    text = text.replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    
    return text
  }

  // Voice input functionality
  useEffect(() => {
    const voiceInputBtn = document.getElementById('voiceInputBtn')

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      ;(recognition as any).onstart = () => {
        if (voiceInputBtn) {
          voiceInputBtn.style.background = '#4CAF50'
          voiceInputBtn.style.color = 'white'
          voiceInputBtn.innerHTML = '<span>🎤</span><span>Listening...</span>'
        }
      }

      ;(recognition as any).onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setSource(transcript)
        if (voiceInputBtn) {
          voiceInputBtn.style.background = 'rgba(102, 126, 234, 0.1)'
          voiceInputBtn.style.color = '#667eea'
          voiceInputBtn.innerHTML = '<span>🎤</span><span>Voice Input</span>'
        }
      }

      ;(recognition as any).onerror = () => {
        if (voiceInputBtn) {
          voiceInputBtn.style.background = 'rgba(102, 126, 234, 0.1)'
          voiceInputBtn.style.color = '#667eea'
          voiceInputBtn.innerHTML = '<span>🎤</span><span>Voice Input</span>'
        }
      }

      ;(recognition as any).onend = () => {
        if (voiceInputBtn) {
          voiceInputBtn.style.background = 'rgba(102, 126, 234, 0.1)'
          voiceInputBtn.style.color = '#667eea'
          voiceInputBtn.innerHTML = '<span>🎤</span><span>Voice Input</span>'
        }
      }

      if (voiceInputBtn) {
        voiceInputBtn.addEventListener('click', () => {
          recognition.start()
        })
      }
    } else if (voiceInputBtn) {
      voiceInputBtn.style.display = 'none'
    }

    // Voice output functionality removed - no longer needed
  }, [simplified, source, language])


  // Generate AI-powered suggestions
  const generateAISuggestions = async (input: string, context: string = '') => {
    if (!input.trim()) {
      setAiSuggestions([])
      return
    }

    setSuggestionsLoading(true)
    try {
      const suggestions = await aiContextService.getContextualSuggestions({
        input,
        language,
        situation: context || undefined
      })
      setAiSuggestions(suggestions)
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
      setAiSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }

  // Check Chrome AI availability
  useEffect(() => {
    const checkChromeAI = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).ai) {
          setChromeAIStatus('available')
          console.log('✅ Chrome AI (Gemini Nano) is available')
        } else {
          setChromeAIStatus('unavailable')
          console.log('❌ Chrome AI (Gemini Nano) is not available')
        }
      } catch (error) {
        setChromeAIStatus('unavailable')
        console.log('❌ Chrome AI check failed:', error)
      }
    }
    
    checkChromeAI()
  }, [])

  // Debounced suggestion generation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (source.trim()) {
        generateAISuggestions(source, contextTopic)
      } else {
        setAiSuggestions([])
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [source, contextTopic, language])

  async function onFetchUrl() {
    if (!url) return
    
    setLoading(true)
    try {
      console.log('Fetching URL:', url)
      
      // Use Chrome extension API to fetch the URL content
      if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime) {
        // Send message to background script to fetch the URL
        const response = await (window as any).chrome.runtime.sendMessage({
          action: 'fetchUrl',
          url: url
        })
        
        if (response.success) {
          console.log('Raw HTML content received:', response.content.substring(0, 500))
          
          // Better content extraction
          const text = extractTextFromHTML(response.content)
          console.log('Extracted text:', text.substring(0, 500))
          
          // Check if we got meaningful content (not just metadata)
          if (text.trim().length < 100 || text.includes('Vietnam National Electronic Visa system --> -->')) {
            console.log('Content appears to be SPA metadata, trying tab-based extraction...')
            
            // Try the tab-based method for SPAs
            const tabResponse = await (window as any).chrome.runtime.sendMessage({
              action: 'fetchUrlWithTab',
              url: url
            })
            
            if (tabResponse.success) {
              console.log('Tab-based extraction successful:', tabResponse.content.substring(0, 500))
              setSource(tabResponse.content.slice(0, 5000))
              console.log('URL content loaded successfully via tab method')
            } else {
              throw new Error(tabResponse.error || 'Both fetch methods failed')
            }
          } else {
            setSource(text.slice(0, 5000))
            console.log('URL content loaded successfully')
          }
        } else {
          throw new Error(response.error || 'Failed to fetch URL')
        }
      } else {
        // Fallback: try direct fetch (will likely fail due to CORS)
        console.log('Chrome extension API not available, trying direct fetch...')
      const res = await fetch(url)
      const html = await res.text()
        const text = extractTextFromHTML(html)
      setSource(text.slice(0, 5000))
      }
    } catch (e) {
      console.error('Error fetching URL:', e)
      // Show user-friendly error message
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      setSource(`Error loading URL: ${errorMessage}\n\nPlease try:\n1. Copy and paste the text directly into the text area below\n2. Use the browser's "View Page Source" and copy the text\n3. Try a different URL`)
    } finally {
      setLoading(false)
    }
  }

  async function onSimplify() {
    if (!source) return
    setLoading(true)
    try {
      let result
      if (language === 'English') {
        result = await simplify(source, { complexity, contextTopic })
      } else {
        // Use the proper translation service for non-English languages
        console.log('Translating to:', language)
        console.log('Source text length:', source.length)
        console.log('Source text preview:', source.substring(0, 200))
        
        const translatedText = await translateAndSimplify(source, { 
          complexity, 
          contextTopic, 
          targetLanguage: language 
        })
        
        console.log('Translation result:', translatedText)
        
        result = {
          simplified: translatedText.simplified,
          keyPoints: translatedText.keyPoints,
          termExplanations: translatedText.termExplanations,
          readTimeMin: translatedText.readTimeMin
        }
      }
      setSimplified(result.simplified)
      setKeyPoints(result.keyPoints)
      setTermExplanations(result.termExplanations)
      setReadTimeMin(result.readTimeMin)
    } catch (error) {
      console.error('Translation error:', error)
      // Fallback to original text if translation fails
      setSimplified(source)
      setKeyPoints([source])
      setTermExplanations([])
      setReadTimeMin(1)
    } finally {
      setLoading(false)
    }
  }


  function onSave() {
    console.log('onSave called')
    console.log('source:', source ? 'exists' : 'missing')
    console.log('simplified:', simplified ? 'exists' : 'missing')
    
    if (!source || !simplified) {
      console.log('Cannot save: missing source or simplified content')
      alert('Cannot save: Please load and translate content first')
      return
    }
    
    const title = source.slice(0, 60) + (source.length > 60 ? '…' : '')
    console.log('Saving document with title:', title)
    
    try {
    add({
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
      language: language === 'English' ? undefined : language,
      source,
      output: simplified,
      keyPoints,
      termExplanations,
    })
      console.log('Document saved successfully')
      alert('Document saved successfully! You can find it in your library.')
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Error saving document: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  function onDownload() {
    if (!simplified) {
      alert('No simplified content to download. Please translate content first.')
      return
    }

    try {
      // Create a clean filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      const languageSuffix = language === 'English' ? '' : `_${language}`
      const filename = `wanderlingo_simplified${languageSuffix}_${timestamp}.txt`
      
      // Create the content with metadata
      const content = [
        `WanderLingo - Simplified Content`,
        `Generated: ${new Date().toLocaleString()}`,
        `Language: ${language}`,
        `Read Time: ~${readTimeMin} min`,
        `\n${'='.repeat(50)}`,
        `\nSIMPLIFIED CONTENT:\n`,
        simplified,
        `\n\n${'='.repeat(50)}`,
        `\nKEY POINTS:\n`,
        keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n'),
        `\n\n${'='.repeat(50)}`,
        `\nTERM EXPLANATIONS:\n`,
        termExplanations.map(term => `• ${term.term}: ${term.explanation}`).join('\n')
      ].join('\n')

      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('File downloaded successfully:', filename)
      alert(`File downloaded successfully as: ${filename}`)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }


  return (
    <div className={appClass} dir={dirAttr} style={{ fontSize: `${textSize}px` }}>
      <header>
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">
              <div className="logo-icon">🌍</div>
              <div className="logo-text">
                <h1>WanderLingo</h1>
        <p className="tagline">AI Travel Translator for Nomads & Travelers</p>
              </div>
            </div>
          </div>
        
        <div className="mode-selector">
          <button 
            className={mode === 'traveler' ? 'active' : ''}
            onClick={() => setMode('traveler')}
            style={{
              background: mode === 'traveler' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
              color: mode === 'traveler' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              marginRight: '0.5rem',
              transition: 'all 0.3s ease'
            }}
          >
            🧳 Traveler Mode
          </button>
          <button 
            className={mode === 'nomad' ? 'active' : ''}
            onClick={() => setMode('nomad')}
            style={{
              background: mode === 'nomad' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
              color: mode === 'nomad' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            📄 Nomad Mode
          </button>
          <button 
            onClick={exportJson}
            style={{
              background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              marginLeft: '1rem',
              transition: 'all 0.3s ease'
            }}
          >
            📤 Export Library
          </button>
        </div>
        </div>
      </header>

      {mode === 'traveler' ? (
        <div className="traveler-interface">
          <div className="quick-translate-section">
            <h2>🧳 Quick Translation for Travelers</h2>
            <div className="traveler-controls">
              <div className="control-group">
                <label>Translate to:</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="Vietnamese">Vietnamese</option>
                  <option value="Thai">Thai</option>
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
            </div>
            
            <div className="traveler-features">
              <div className="feature-tabs">
                <button 
                  className="feature-tab active"
                  onClick={() => setContextTopic('')}
                  style={{
                    background: contextTopic === '' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
                    color: contextTopic === '' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginRight: '0.5rem'
                  }}
                >
                  💬 Quick Translate
                </button>
                <button 
                  className="feature-tab"
                  onClick={() => setContextTopic('conversation')}
                  style={{
                    background: contextTopic === 'conversation' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
                    color: contextTopic === 'conversation' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginRight: '0.5rem'
                  }}
                >
                  🗣️ Conversation Help
                </button>
                <button 
                  className="feature-tab"
                  onClick={() => setContextTopic('ai-chat')}
                  style={{
                    background: contextTopic === 'ai-chat' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
                    color: contextTopic === 'ai-chat' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  🤖 AI Chat Assistant
                </button>
              </div>

              {contextTopic === '' && (
                <div className="quick-translate">
                  <h3>What do you want to say?</h3>
                  <textarea 
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Type what you want to translate (e.g., 'Where is the bathroom?', 'How much does this cost?')"
                    rows={3}
                    style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                  />
                  
                  <div className="voice-controls" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button 
                      id="voiceInputBtn"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'rgba(102, 126, 234, 0.1)',
                        border: '1px solid #667eea',
                        borderRadius: '6px',
                        color: '#667eea',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>🎤</span>
                      <span>Voice Input</span>
                    </button>
                    <button 
                      id="stopVoiceBtn"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'rgba(244, 67, 54, 0.1)',
                        border: '1px solid #f44336',
                        borderRadius: '6px',
                        color: '#f44336',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>⏹️</span>
                      <span>Stop</span>
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                    <button 
                      onClick={onSimplify} 
                      disabled={loading || !source.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '1rem 2rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        flex: 1
                      }}
                    >
                      {loading ? 'Translating...' : 'Translate'}
                    </button>
                    <button 
                      onClick={clearContent}
                      style={{
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '1rem 1.5rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px'
                      }}
                    >
                      Clear
                    </button>
                  </div>

                  {/* AI-Powered Next Sentence Suggestions */}
                  {source.trim() && (
                    <div className="conversation-suggestions" style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: '#333', fontSize: '14px' }}>
                          🤖 AI-Powered Suggestions:
                        </h4>
                        <select 
                          value={contextTopic}
                          onChange={(e) => setContextTopic(e.target.value)}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: 'white'
                          }}
                        >
                          <option value="">🧠 Auto-detect context</option>
                          <option value="shopping">🛍️ Shopping</option>
                          <option value="food">🍽️ Food & Dining</option>
                          <option value="transport">🚗 Transportation</option>
                          <option value="accommodation">🏨 Accommodation</option>
                          <option value="emergency">🏥 Emergency</option>
                          <option value="general">💬 General Conversation</option>
                        </select>
                        {suggestionsLoading && (
                          <span style={{ fontSize: '12px', color: '#667eea' }}>🤖 AI thinking...</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {aiSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => setSource(suggestion.text)}
                            style={{
                              background: suggestion.confidence > 0.7 ? '#e3f2fd' : '#f8f9fa',
                              border: suggestion.confidence > 0.7 ? '1px solid #2196f3' : '1px solid #dee2e6',
                              borderRadius: '4px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              color: '#333',
                              transition: 'all 0.2s',
                              position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e9ecef'
                              e.currentTarget.style.borderColor = '#667eea'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = suggestion.confidence > 0.7 ? '#e3f2fd' : '#f8f9fa'
                              e.currentTarget.style.borderColor = suggestion.confidence > 0.7 ? '#2196f3' : '#dee2e6'
                            }}
                            title={`AI Confidence: ${Math.round(suggestion.confidence * 100)}% | Context: ${suggestion.context} | Category: ${suggestion.category}`}
                          >
                            {suggestion.text}
                            {suggestion.confidence > 0.8 && (
                              <span style={{ 
                                position: 'absolute', 
                                top: '-2px', 
                                right: '-2px', 
                                background: '#4CAF50', 
                                color: 'white', 
                                borderRadius: '50%', 
                                width: '12px', 
                                height: '12px', 
                                fontSize: '8px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                              }}>
                                ✓
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      {aiSuggestions.length > 0 && (
                        <div style={{ 
                          marginTop: '8px', 
                          fontSize: '11px', 
                          color: '#666',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span>
                            {chromeAIStatus === 'available' ? '🤖 Powered by Chrome AI (Gemini Nano)' : 
                             chromeAIStatus === 'checking' ? '🤖 Checking Chrome AI...' : 
                             '🤖 Powered by Local AI'}
                          </span>
                          <span>• Context: {aiSuggestions[0]?.context || 'auto-detected'}</span>
                          <span>• Confidence: {Math.round((aiSuggestions.reduce((acc, s) => acc + s.confidence, 0) / aiSuggestions.length) * 100)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {contextTopic === 'ai-chat' && (
                <div className="ai-chat-assistant">
                  <h3>🤖 AI Chat Assistant</h3>
                  <div style={{ 
                    background: chromeAIStatus === 'available' ? '#e8f5e8' : 
                               chromeAIStatus === 'checking' ? '#fff3cd' : '#f8d7da',
                    border: chromeAIStatus === 'available' ? '1px solid #4caf50' : 
                           chromeAIStatus === 'checking' ? '1px solid #ffc107' : '1px solid #dc3545',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    marginBottom: '1rem',
                    fontSize: '14px'
                  }}>
                    <strong>
                      {chromeAIStatus === 'available' ? '✅ Chrome AI (Gemini Nano) Active' : 
                       chromeAIStatus === 'checking' ? '⏳ Checking Chrome AI...' : 
                       '⚠️ Using Local AI (Chrome AI not available)'}
                    </strong>
                    <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                      {chromeAIStatus === 'available' ? 
                        'Using Chrome\'s built-in AI models: Prompt API, Write API, Rewrite API, and Summarization API' :
                        'Falling back to local AI processing with rule-based suggestions'
                      }
                    </div>
                  </div>
                  <p>Get intelligent, context-aware conversation suggestions powered by AI. The AI understands your situation and provides relevant responses.</p>
                  
                  <div className="ai-features" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem', 
                    marginBottom: '1.5rem' 
                  }}>
                    <div style={{ 
                      background: '#e3f2fd', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      border: '1px solid #2196f3' 
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>🧠 Smart Context</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        AI automatically detects your situation (shopping, food, transport, etc.)
                      </p>
                    </div>
                    <div style={{ 
                      background: '#f3e5f5', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      border: '1px solid #9c27b0' 
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#7b1fa2' }}>🎯 Confidence Scoring</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        Each suggestion has an AI confidence score for reliability
                      </p>
                    </div>
                    <div style={{ 
                      background: '#e8f5e8', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      border: '1px solid #4caf50' 
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#388e3c' }}>🌍 Multi-Language</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        AI suggestions work with all supported languages
                      </p>
                    </div>
                  </div>

                  <div className="ai-demo" style={{ 
                    background: '#f8f9fa', 
                    padding: '1.5rem', 
                    borderRadius: '8px', 
                    border: '1px solid #dee2e6' 
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>Try AI Suggestions:</h4>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                      <button 
                        onClick={() => setSource("I'm looking for a good restaurant")}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🍽️ Food Request
                      </button>
                      <button 
                        onClick={() => setSource("How much does this cost?")}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🛍️ Shopping
                      </button>
                      <button 
                        onClick={() => setSource("I need help finding my hotel")}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🏨 Navigation
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      Click any button above to see AI-powered suggestions appear below!
                    </p>
                  </div>
                </div>
              )}

              {contextTopic === 'conversation' && (
                <div className="conversation-help">
                  <h3>🗣️ Conversation Suggestions</h3>
                  <p>Get AI-powered conversation suggestions for common travel situations:</p>
                  
                  <div className="conversation-categories">
                    <div className="category">
                      <h4>🍽️ Food & Dining</h4>
                      <div className="suggestions">
                        <button className="suggestion-btn" onClick={() => setSource("I'm vegetarian, what do you recommend?")}>
                          I'm vegetarian, what do you recommend?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Is this spicy?")}>
                          Is this spicy?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Can I have the bill, please?")}>
                          Can I have the bill, please?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Do you have English menu?")}>
                          Do you have English menu?
                        </button>
                      </div>
                    </div>

                    <div className="category">
                      <h4>🏨 Accommodation</h4>
                      <div className="suggestions">
                        <button className="suggestion-btn" onClick={() => setSource("What time is check-in?")}>
                          What time is check-in?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Is there WiFi?")}>
                          Is there WiFi?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Can you call me a taxi?")}>
                          Can you call me a taxi?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Where is the nearest ATM?")}>
                          Where is the nearest ATM?
                        </button>
                      </div>
                    </div>

                    <div className="category">
                      <h4>🚗 Transportation</h4>
                      <div className="suggestions">
                        <button className="suggestion-btn" onClick={() => setSource("How much to the airport?")}>
                          How much to the airport?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Where is the bus stop?")}>
                          Where is the bus stop?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Is this the right bus?")}>
                          Is this the right bus?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Can you help me with directions?")}>
                          Can you help me with directions?
                        </button>
                      </div>
                    </div>

                    <div className="category">
                      <h4>🛍️ Shopping</h4>
                      <div className="suggestions">
                        <button className="suggestion-btn" onClick={() => setSource("How much does this cost?")}>
                          How much does this cost?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Can you make it cheaper?")}>
                          Can you make it cheaper?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Do you accept credit card?")}>
                          Do you accept credit card?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Can I try this on?")}>
                          Can I try this on?
                        </button>
                      </div>
                    </div>

                    <div className="category">
                      <h4>🏥 Emergency</h4>
                      <div className="suggestions">
                        <button className="suggestion-btn" onClick={() => setSource("I need help!")}>
                          I need help!
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Where is the hospital?")}>
                          Where is the hospital?
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("Call the police!")}>
                          Call the police!
                        </button>
                        <button className="suggestion-btn" onClick={() => setSource("I'm lost, can you help?")}>
                          I'm lost, can you help?
                        </button>
                      </div>
                    </div>
                  </div>

                  {source && (
                    <div className="selected-suggestion">
                      <h4>Selected: "{source}"</h4>
                      <button 
                        onClick={onSimplify} 
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '1rem 2rem',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '16px',
                          marginTop: '1rem'
                        }}
                      >
                        {loading ? 'Translating...' : `Translate to ${language}`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {contextTopic === 'page' && (
                <div className="page-translation">
                  <h3>🌐 Translate Current Page</h3>
                  <p>Perfect for visa applications, government websites, and official documents in foreign languages.</p>
                  
                  <div className="page-translation-options">
                    <div className="translation-target">
                      <label>Translate this page to:</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                        <option value="English">English</option>
                        <option value="Vietnamese">Vietnamese</option>
                        <option value="Thai">Thai</option>
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
                    
                    <button 
                      onClick={() => {
                        // Show instructions for page translation
                        alert(`To translate the current page:\n\n1. Right-click anywhere on the page\n2. Select "Translate this page with WanderLingo"\n3. Or use the extension popup on any webpage\n\nTarget language: ${language}`);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '1rem 2rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        marginTop: '1rem'
                      }}
                    >
                      🌐 Translate Current Page
                    </button>
                  </div>

                  <div className="page-translation-tips">
                    <h4>💡 How to Use Page Translation:</h4>
                    <ul>
                      <li><strong>Right-click method:</strong> Right-click anywhere on a webpage → "Translate this page with WanderLingo"</li>
                      <li><strong>Extension popup:</strong> Click the WanderLingo icon on any webpage</li>
                      <li>Perfect for visa application websites (like Vietnam e-visa)</li>
                      <li>Great for government forms and official documents</li>
                      <li>Useful for local business websites and menus</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="nomad-interface">
          <div className="document-processing-section">
            <h2>📄 Document Processing for Nomads</h2>
            <p>Process legal documents, visa applications, government forms, and official paperwork from any country.</p>
            
            <Controls
              language={language}
              setLanguage={setLanguage}
              complexity={complexity}
              setComplexity={setComplexity}
              contextTopic={contextTopic}
              setContextTopic={setContextTopic}
              textSize={textSize}
              setTextSize={setTextSize}
              rtl={rtl}
              setRtl={setRtl}
              highContrast={highContrast}
              setHighContrast={setHighContrast}
            />

            <Editor url={url} setUrl={setUrl} source={source} setSource={setSource} onFetchUrl={onFetchUrl} loading={loading} />

            <div className="actions">
              <button onClick={onSimplify} disabled={loading}>
                {loading ? 'Working…' : language === 'English' ? 'Simplify' : 'Translate & Simplify'}
              </button>
              <button onClick={onSave} disabled={!simplified}>Save Document</button>
              <button onClick={onDownload} disabled={!simplified}>Download Text</button>
              <button onClick={clearContent} style={{ background: '#f44336', color: 'white' }}>Clear All</button>
            </div>
          </div>
        </div>
      )}

      <Output
        original={source}
        simplified={simplified}
        keyPoints={keyPoints}
        termExplanations={termExplanations}
        readTimeMin={readTimeMin}
        onSpeak={() => speak(simplified)}
        onStopSpeak={() => stopSpeaking()}
      />

      <aside className="library" aria-label="Saved documents">
        <h2>Saved</h2>
        {docs.length === 0 && <p>No saved documents yet.</p>}
        <ul>
          {docs.map((d) => (
            <li key={d.id}>
              <button className="link" onClick={() => { setSource(d.source); setSimplified(d.output); setKeyPoints(d.keyPoints); setTermExplanations(d.termExplanations); }}>
                {d.title}
              </button>
              <button onClick={() => remove(d.id)} aria-label="Delete">✕</button>
            </li>
          ))}
        </ul>
      </aside>

      <footer>
        <small>
          WanderLingo - AI Travel Translator for Nomads & Travelers. No server, no persistence. Chrome AI API used when available.
        </small>
      </footer>
    </div>
  )
}

export default App
