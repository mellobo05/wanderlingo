/*
  Chrome AI Service - Uses Chrome's built-in Gemini Nano models
  Implements Prompt API, Summarization API, Write API, and Rewrite API
*/

export interface ChromeAIResponse {
  text: string
  confidence?: number
  metadata?: any
}

export interface TranslationOptions {
  sourceLanguage: string
  targetLanguage: string
  context?: string
  formality?: 'formal' | 'informal' | 'casual' | 'polite'
}

export interface ConversationContext {
  situation: string
  location?: string
  previousMessages: string[]
}

class ChromeAIService {
  private isAvailable: boolean = false

  constructor() {
    this.checkAvailability()
  }

  private async checkAvailability(): Promise<void> {
    try {
      // Check if Chrome AI APIs are available
      if (typeof window !== 'undefined' && 'ai' in window) {
        this.isAvailable = true
        console.log('Chrome AI APIs detected and available')
      } else {
        console.warn('Chrome AI APIs not available, falling back to external services')
        this.isAvailable = false
      }
    } catch (error) {
      console.error('Error checking Chrome AI availability:', error)
      this.isAvailable = false
    }
  }

  async isChromeAIAvailable(): Promise<boolean> {
    await this.checkAvailability()
    return this.isAvailable
  }

  // Translation using Chrome's Prompt API
  async translateText(text: string, options: TranslationOptions): Promise<ChromeAIResponse> {
    if (!this.isAvailable) {
      console.log('Chrome AI not available, using fallback translation')
      return await this.translateTextFallback(text, options)
    }

    try {
      const prompt = this.buildTranslationPrompt(text, options)
      const result = await this.callPromptAPI(prompt)
      
      return {
        text: result,
        confidence: 0.95, // High confidence for Gemini Nano
        metadata: {
          sourceLanguage: options.sourceLanguage,
          targetLanguage: options.targetLanguage,
          model: 'gemini-nano'
        }
      }
    } catch (error) {
      console.error('Chrome AI translation error:', error)
      console.log('Falling back to external translation APIs')
      return await this.translateTextFallback(text, options)
    }
  }

  // Document summarization using Chrome's Summarization API
  async summarizeDocument(text: string, maxLength: number = 200): Promise<ChromeAIResponse> {
    if (!this.isAvailable) {
      console.log('Chrome AI not available, using fallback summarization')
      return {
        text: text.substring(0, maxLength) + (text.length > maxLength ? '...' : ''),
        confidence: 0.5,
        metadata: { fallback: true, method: 'truncation' }
      }
    }

    try {
      const prompt = `Summarize the following document in ${maxLength} words or less, focusing on key information for travelers:\n\n${text}`
      const result = await this.callPromptAPI(prompt)
      
      return {
        text: result,
        confidence: 0.9,
        metadata: {
          originalLength: text.length,
          summaryLength: result.length,
          model: 'gemini-nano'
        }
      }
    } catch (error) {
      console.error('Chrome AI summarization error:', error)
      throw error
    }
  }

  // Text rewriting using Chrome's Rewrite API
  async rewriteText(text: string, style: 'simplified' | 'formal' | 'casual' | 'professional'): Promise<ChromeAIResponse> {
    if (!this.isAvailable) {
      throw new Error('Chrome AI APIs not available')
    }

    try {
      const prompt = this.buildRewritePrompt(text, style)
      const result = await this.callPromptAPI(prompt)
      
      return {
        text: result,
        confidence: 0.9,
        metadata: {
          originalStyle: 'original',
          targetStyle: style,
          model: 'gemini-nano'
        }
      }
    } catch (error) {
      console.error('Chrome AI rewrite error:', error)
      throw error
    }
  }

  // Generate conversation suggestions using Chrome's Write API
  async generateConversationSuggestions(context: ConversationContext, count: number = 5): Promise<ChromeAIResponse[]> {
    if (!this.isAvailable) {
      console.log('Chrome AI not available, using fallback conversation suggestions')
      return this.generateFallbackSuggestions(context, count)
    }

    try {
      const prompt = this.buildConversationPrompt(context, count)
      const result = await this.callPromptAPI(prompt)
      
      // Parse the response to extract individual suggestions
      const suggestions = this.parseConversationSuggestions(result)
      
      return suggestions.map(suggestion => ({
        text: suggestion,
        confidence: 0.85,
        metadata: {
          context: context.situation,
          model: 'gemini-nano'
        }
      }))
    } catch (error) {
      console.error('Chrome AI conversation generation error:', error)
      throw error
    }
  }

  // Extract information from documents using Chrome's Prompt API
  async extractDocumentInfo(text: string, documentType: string): Promise<Record<string, string>> {
    if (!this.isAvailable) {
      throw new Error('Chrome AI APIs not available')
    }

    try {
      const prompt = this.buildDocumentExtractionPrompt(text, documentType)
      const result = await this.callPromptAPI(prompt)
      
      return this.parseDocumentInfo(result, documentType)
    } catch (error) {
      console.error('Chrome AI document extraction error:', error)
      throw error
    }
  }

  // Core method to call Chrome's Prompt API
  private async callPromptAPI(prompt: string): Promise<string> {
    try {
      const ai = (window as any).ai
      if (!ai || !ai.prompt) {
        throw new Error('Chrome AI Prompt API not available')
      }

      const result = await ai.prompt(prompt)
      return result || ''
    } catch (error) {
      console.error('Chrome AI Prompt API call failed:', error)
      throw error
    }
  }

  private buildTranslationPrompt(text: string, options: TranslationOptions): string {
    const { sourceLanguage, targetLanguage, context, formality } = options
    
    let prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}`
    
    if (context) {
      prompt += ` in the context of ${context}`
    }
    
    if (formality) {
      prompt += ` using ${formality} language`
    }
    
    prompt += `:\n\n"${text}"\n\nProvide only the translation without any additional text or explanations.`
    
    return prompt
  }

  private buildRewritePrompt(text: string, style: string): string {
    const styleInstructions: Record<string, string> = {
      simplified: 'Rewrite this text in simple, easy-to-understand language suitable for travelers',
      formal: 'Rewrite this text in formal, professional language',
      casual: 'Rewrite this text in casual, friendly language',
      professional: 'Rewrite this text in professional, business-appropriate language'
    }

    return `${styleInstructions[style] || styleInstructions.simplified}:\n\n"${text}"\n\nProvide only the rewritten text without any additional explanations.`
  }

  private buildConversationPrompt(context: ConversationContext, count: number): string {
    const { situation, location, previousMessages } = context
    
    let prompt = `Generate ${count} conversation suggestions for a traveler in a ${situation} situation`
    
    if (location) {
      prompt += ` in ${location}`
    }
    
    prompt += `. The suggestions should be practical, polite, and useful for communication.`
    
    if (previousMessages.length > 0) {
      prompt += ` Consider the previous conversation context: ${previousMessages.join(', ')}`
    }
    
    prompt += `\n\nFormat each suggestion on a new line, starting with a number.`
    
    return prompt
  }

  private buildDocumentExtractionPrompt(text: string, documentType: string): string {
    const fieldMappings: Record<string, string> = {
      'Passport': 'Name, Surname, Given Names, Date of Birth, Place of Birth, Nationality, Passport Number, Date of Issue, Date of Expiry, Authority',
      'Driver\'s License': 'Name, Address, Date of Birth, License Number, Class, Date of Issue, Date of Expiry, Restrictions',
      'ID Card': 'Name, ID Number, Date of Birth, Address, Nationality, Date of Issue, Date of Expiry',
      'Other Document': 'Name, Number, Date, Address, Description'
    }

    const fields = fieldMappings[documentType] || 'Name, Number, Date, Address, Description'
    
    return `Extract the following information from this ${documentType} document:\n\nFields to extract: ${fields}\n\nDocument text:\n"${text}"\n\nFormat the response as: Field Name: Value\nIf a field is not found, write "Not found" for that field.`
  }

  private parseConversationSuggestions(response: string): string[] {
    return response
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5) // Limit to 5 suggestions
  }

  private parseDocumentInfo(response: string, _documentType: string): Record<string, string> {
    const fields: Record<string, string> = {}
    
    response.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const fieldName = line.substring(0, colonIndex).trim()
        const fieldValue = line.substring(colonIndex + 1).trim()
        if (fieldValue !== 'Not found') {
          fields[fieldName] = fieldValue
        }
      }
    })
    
    return fields
  }

  // Fallback methods for when Chrome AI is not available
  async translateTextFallback(text: string, options: TranslationOptions): Promise<ChromeAIResponse> {
    // Use external API as fallback
    const targetCode = this.getLanguageCode(options.targetLanguage)
    
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetCode}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          return {
            text: data.responseData.translatedText,
            confidence: 0.8,
            metadata: { fallback: true, service: 'mymemory' }
          }
        }
      }
      
      // Final fallback
      return {
        text: `[Translated to ${options.targetLanguage}] ${text}`,
        confidence: 0.5,
        metadata: { fallback: true, service: 'placeholder' }
      }
    } catch (error) {
      return {
        text: `[Translation failed] ${text}`,
        confidence: 0.1,
        metadata: { fallback: true, error: true }
      }
    }
  }

  private getLanguageCode(language: string): string {
    const codes: Record<string, string> = {
      'Vietnamese': 'vi',
      'Thai': 'th',
      'Indonesian': 'id',
      'Malay': 'ms',
      'Filipino': 'tl',
      'Spanish': 'es',
      'French': 'fr',
      'German': 'de',
      'Japanese': 'ja',
      'Korean': 'ko',
      'Chinese': 'zh',
      'Arabic': 'ar',
      'Hindi': 'hi',
      'Portuguese': 'pt',
      'Russian': 'ru',
      'Italian': 'it',
      'Dutch': 'nl',
      'Turkish': 'tr',
      'Polish': 'pl',
      'Greek': 'el',
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
    
    return codes[language] || 'vi'
  }

  // Fallback conversation suggestions
  private generateFallbackSuggestions(context: ConversationContext, count: number): ChromeAIResponse[] {
    const suggestions: Record<string, string[]> = {
      'Shopping & Money': [
        'How much does this cost?',
        'Can you make it cheaper?',
        'Do you have this in a different size?',
        'Is there a discount?',
        'What payment methods do you accept?'
      ],
      'Transportation': [
        'How do I get to the airport?',
        'What time does the bus leave?',
        'How much is a taxi to downtown?',
        'Where is the nearest metro station?',
        'Can you call me a taxi?'
      ],
      'Food & Dining': [
        'What do you recommend?',
        'Is this spicy?',
        'Do you have vegetarian options?',
        'Can I see the menu?',
        'What time do you close?'
      ],
      'Emergency': [
        'I need help!',
        'Call the police!',
        'Where is the hospital?',
        'I lost my passport',
        'I need a doctor'
      ]
    }

    const categorySuggestions = suggestions[context.situation] || suggestions['Shopping & Money']
    return categorySuggestions.slice(0, count).map(text => ({
      text,
      confidence: 0.7,
      metadata: { fallback: true, category: context.situation }
    }))
  }
}

// Singleton instance
export const chromeAIService = new ChromeAIService()

// Export types for use in other modules
export type { ConversationContext as ChromeAIConversationContext }
