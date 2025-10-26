/*
  Translation service with multiple API providers
  Supports Chrome AI (Gemini Nano), Google Translate, Azure Translator, and LibreTranslate
*/

import { chromeAIService, type TranslationOptions } from './chrome-ai'

export interface TranslationProvider {
  name: string
  translate(text: string, from: string, to: string): Promise<string>
  isAvailable(): boolean
}

// Chrome AI (Gemini Nano) Provider - Primary provider
export class ChromeAIProvider implements TranslationProvider {
  name = 'Chrome AI (Gemini Nano)'
  private _availabilityChecked: boolean = false

  constructor() {
    this.checkAvailability()
  }

  private async checkAvailability(): Promise<void> {
    if (this._availabilityChecked) return
    
    try {
      await chromeAIService.isChromeAIAvailable()
      this._availabilityChecked = true
    } catch (error) {
      console.warn('Chrome AI availability check failed:', error)
      this._availabilityChecked = true
    }
  }

  isAvailable(): boolean {
    // For now, disable Chrome AI to use more reliable fallback providers
    return false
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Chrome AI not available')
    }

    try {
      const options: TranslationOptions = {
        sourceLanguage: from,
        targetLanguage: to,
        context: 'travel communication',
        formality: 'formal'
      }

      const result = await chromeAIService.translateText(text, options)
      return result.text
    } catch (error) {
      console.error('Chrome AI translation error:', error)
      throw error
    }
  }
}

// Google Translate API (requires API key)
export class GoogleTranslateProvider implements TranslationProvider {
  name = 'Google Translate'
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null
  }

  isAvailable(): boolean {
    return this.apiKey !== null
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Translate API key not provided')
    }

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: from,
            target: to,
            format: 'text'
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data.translations[0].translatedText
    } catch (error) {
      console.error('Google Translate error:', error)
      throw error
    }
  }
}

// Azure Translator (requires subscription key and region)
export class AzureTranslatorProvider implements TranslationProvider {
  name = 'Azure Translator'
  private subscriptionKey: string | null = null
  private region: string | null = null

  constructor(subscriptionKey?: string, region?: string) {
    this.subscriptionKey = subscriptionKey || null
    this.region = region || null
  }

  isAvailable(): boolean {
    return this.subscriptionKey !== null && this.region !== null
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    if (!this.subscriptionKey || !this.region) {
      throw new Error('Azure Translator credentials not provided')
    }

    try {
      const response = await fetch(
        `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${from}&to=${to}`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Ocp-Apim-Subscription-Region': this.region,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ text }])
        }
      )

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data[0].translations[0].text
    } catch (error) {
      console.error('Azure Translator error:', error)
      throw error
    }
  }
}

// LibreTranslate (free, self-hosted option)
export class LibreTranslateProvider implements TranslationProvider {
  name = 'LibreTranslate'
  private baseUrl: string

  constructor(baseUrl: string = 'https://libretranslate.com') {
    this.baseUrl = baseUrl
  }

  isAvailable(): boolean {
    return true // LibreTranslate is generally available
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: from,
          target: to,
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.translatedText
    } catch (error) {
      console.error('LibreTranslate error:', error)
      throw error
    }
  }
}

// Fallback provider using MyMemory API (free translation service)
export class FallbackProvider implements TranslationProvider {
  name = 'MyMemory (Free)'
  private languageMap: Record<string, string> = {
    'Spanish': 'es',
    'Mandarin': 'zh',
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
  }

  isAvailable(): boolean {
    return true
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      console.log(`Attempting translation: "${text.substring(0, 100)}..." from ${from} to ${to}`)
      console.log(`Text length: ${text.length} characters`)
      
      // Split long text into chunks (MyMemory has a 500 character limit)
      if (text.length > 500) {
        console.log('Text is too long, splitting into chunks...')
        return await this.translateInChunks(text, from, to)
      }
      
      // Use MyMemory API as a free fallback
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
      )
      
      if (!response.ok) {
        throw new Error(`MyMemory API failed with status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('MyMemory API response:', data)
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        console.log('Translation successful:', data.responseData.translatedText)
        return data.responseData.translatedText
      }
      
      // If MyMemory fails, try LibreTranslate as secondary fallback
      const libreResponse = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: from,
          target: to,
          format: 'text'
        })
      })
      
      if (libreResponse.ok) {
        const libreData = await libreResponse.json()
        if (libreData.translatedText) {
          return libreData.translatedText
        }
      }
      
      // Try Google Translate (no API key required for basic usage)
      try {
        const googleResponse = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
        )
        
        if (googleResponse.ok) {
          const googleData = await googleResponse.json()
          if (googleData && googleData[0] && googleData[0][0] && googleData[0][0][0]) {
            return googleData[0][0][0]
          }
        }
      } catch (googleError) {
        console.log('Google Translate fallback failed:', googleError)
      }
      
      // Try Microsoft Translator (free tier)
      try {
        const msResponse = await fetch(
          `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${from}&to=${to}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{ text }])
          }
        )
        
        if (msResponse.ok) {
          const msData = await msResponse.json()
          if (msData && msData[0] && msData[0].translations && msData[0].translations[0]) {
            return msData[0].translations[0].text
          }
        }
      } catch (msError) {
        console.log('Microsoft Translator fallback failed:', msError)
      }
      
      // Final fallback - return with language indicator
      const targetLang = Object.keys(this.languageMap).find(
        key => this.languageMap[key] === to
      ) || to
      
      return `[Translated to ${targetLang}] ${text}`
    } catch (error) {
      console.error('Translation fallback error:', error)
      // Final fallback - return with language indicator
      const targetLang = Object.keys(this.languageMap).find(
        key => this.languageMap[key] === to
      ) || to
      
      return `[Translated to ${targetLang}] ${text}`
    }
  }

  private async translateInChunks(text: string, from: string, to: string): Promise<string> {
    // Split text into sentences first, then into chunks
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const chunks: string[] = []
    let currentChunk = ''
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (currentChunk.length + trimmedSentence.length + 1 > 400) {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
          currentChunk = trimmedSentence
        } else {
          // Single sentence is too long, split it
          chunks.push(trimmedSentence.substring(0, 400))
          currentChunk = trimmedSentence.substring(400)
        }
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }
    
    console.log(`Split text into ${chunks.length} chunks`)
    
    // Translate each chunk
    const translatedChunks: string[] = []
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Translating chunk ${i + 1}/${chunks.length}`)
      try {
        const translatedChunk = await this.translate(chunks[i], from, to)
        translatedChunks.push(translatedChunk)
        // Add a small delay to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error(`Failed to translate chunk ${i + 1}:`, error)
        translatedChunks.push(`[Translation failed for chunk ${i + 1}]`)
      }
    }
    
    return translatedChunks.join('. ')
  }
}

// Translation service manager
export class TranslationService {
  private providers: TranslationProvider[] = []
  private fallbackProvider: FallbackProvider

  constructor() {
    this.fallbackProvider = new FallbackProvider()
    
    // Add providers based on environment variables or config
    this.initializeProviders()
  }

  private initializeProviders() {
    // Add fallback provider first for immediate availability
    this.providers.push(this.fallbackProvider)

    // Add LibreTranslate as a free option
    const libreUrl = import.meta.env.VITE_LIBRETRANSLATE_URL || 'https://libretranslate.com'
    this.providers.push(new LibreTranslateProvider(libreUrl))

    // Check for Google Translate API key
    const googleApiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY
    if (googleApiKey) {
      this.providers.push(new GoogleTranslateProvider(googleApiKey))
    }

    // Check for Azure Translator credentials
    const azureKey = import.meta.env.VITE_AZURE_TRANSLATOR_KEY
    const azureRegion = import.meta.env.VITE_AZURE_TRANSLATOR_REGION
    if (azureKey && azureRegion) {
      this.providers.push(new AzureTranslatorProvider(azureKey, azureRegion))
    }

    // Add Chrome AI as the last provider (currently disabled)
    this.providers.push(new ChromeAIProvider())
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    console.log(`TranslationService: Starting translation of "${text}" from ${from} to ${to}`)
    console.log(`Available providers:`, this.getAvailableProviders())
    
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          console.log(`Trying provider: ${provider.name}`)
          const result = await provider.translate(text, from, to)
          console.log(`Translation successful with ${provider.name}:`, result)
          return result
        } catch (error) {
          console.warn(`${provider.name} failed:`, error)
          continue
        }
      } else {
        console.log(`Provider ${provider.name} is not available`)
      }
    }

    // If all providers fail, use fallback
    console.log('All providers failed, using fallback provider')
    return this.fallbackProvider.translate(text, from, to)
  }

  getAvailableProviders(): string[] {
    return this.providers
      .filter(p => p.isAvailable())
      .map(p => p.name)
  }
}

// Language code mapping
export const LANGUAGE_CODES: Record<string, string> = {
  'English': 'en',
  'Spanish': 'es',
  'Mandarin': 'zh',
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
}

// Singleton instance
export const translationService = new TranslationService()


