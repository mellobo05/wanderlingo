/*
  AI Context Service for intelligent conversation suggestions
  Uses multiple AI approaches: Chrome AI, local models, and external APIs
*/

export interface ConversationContext {
  input: string
  language: string
  situation?: string
  previousMessages?: string[]
}

export interface AISuggestion {
  text: string
  confidence: number
  context: string
  category: string
}

export class AIContextService {
  private isChromeAIAvailable: boolean = false
  private chromeAI: any = null
  private promptAPI: any = null
  private writeAPI: any = null
  private rewriteAPI: any = null

  constructor() {
    this.initializeChromeAI()
  }

  private async initializeChromeAI(): Promise<void> {
    try {
      // Check if Chrome AI is available
      if (typeof window !== 'undefined' && (window as any).ai) {
        this.chromeAI = (window as any).ai
        this.isChromeAIAvailable = true
        
        // Initialize specific Chrome AI APIs
        await this.initializeChromeAPIs()
        console.log('✅ Chrome AI APIs initialized successfully')
      } else {
        console.log('❌ Chrome AI not available - using fallback methods')
      }
    } catch (error) {
      console.log('❌ Chrome AI initialization failed:', error)
    }
  }

  private async initializeChromeAPIs(): Promise<void> {
    try {
      // Initialize Prompt API
      if (this.chromeAI.prompt) {
        this.promptAPI = await this.chromeAI.prompt.create()
        console.log('✅ Prompt API initialized')
      }

      // Initialize Summarization API
      if (this.chromeAI.summarization) {
        console.log('✅ Summarization API available')
      }

      // Initialize Write API
      if (this.chromeAI.write) {
        this.writeAPI = await this.chromeAI.write.create()
        console.log('✅ Write API initialized')
      }

      // Initialize Rewrite API
      if (this.chromeAI.rewriter) {
        this.rewriteAPI = await this.chromeAI.rewriter.create()
        console.log('✅ Rewrite API initialized')
      }
    } catch (error) {
      console.error('Failed to initialize Chrome AI APIs:', error)
    }
  }

  // Main method to get AI-powered suggestions
  async getContextualSuggestions(context: ConversationContext): Promise<AISuggestion[]> {
    try {
      // Try Chrome AI APIs first (Gemini Nano)
      if (this.isChromeAIAvailable) {
        console.log('🤖 Using Chrome AI (Gemini Nano) for suggestions')
        
        // Try Prompt API first
        if (this.promptAPI) {
          const promptSuggestions = await this.getPromptAPISuggestions(context)
          if (promptSuggestions.length > 0) {
            return promptSuggestions
          }
        }

        // Try Write API for creative suggestions
        if (this.writeAPI) {
          const writeSuggestions = await this.getWriteAPISuggestions(context)
          if (writeSuggestions.length > 0) {
            return writeSuggestions
          }
        }

        // Try Rewrite API for refined suggestions
        if (this.rewriteAPI) {
          const rewriteSuggestions = await this.getRewriteAPISuggestions(context)
          if (rewriteSuggestions.length > 0) {
            return rewriteSuggestions
          }
        }
      }

      // Fallback to local AI model
      console.log('🔄 Falling back to local AI model')
      const localSuggestions = await this.getLocalAISuggestions(context)
      if (localSuggestions.length > 0) {
        return localSuggestions
      }

      // Final fallback to rule-based suggestions
      console.log('🔄 Using rule-based fallback')
      return this.getRuleBasedSuggestions(context)
    } catch (error) {
      console.error('AI suggestions error:', error)
      return this.getRuleBasedSuggestions(context)
    }
  }

  // Chrome AI Prompt API implementation
  private async getPromptAPISuggestions(context: ConversationContext): Promise<AISuggestion[]> {
    try {
      if (!this.promptAPI) return []

      const prompt = this.buildContextPrompt(context)
      const result = await this.promptAPI.prompt(prompt)
      
      return this.parseAIResponse(result, context)
    } catch (error) {
      console.log('Chrome AI Prompt API failed:', error)
      return []
    }
  }

  // Chrome AI Write API implementation
  private async getWriteAPISuggestions(context: ConversationContext): Promise<AISuggestion[]> {
    try {
      if (!this.writeAPI) return []

      const prompt = this.buildWritePrompt(context)
      const result = await this.writeAPI.write(prompt, {
        style: 'conversational',
        tone: 'helpful',
        length: 'short'
      })
      
      return this.parseAIResponse(result, context)
    } catch (error) {
      console.log('Chrome AI Write API failed:', error)
      return []
    }
  }

  // Chrome AI Rewrite API implementation
  private async getRewriteAPISuggestions(context: ConversationContext): Promise<AISuggestion[]> {
    try {
      if (!this.rewriteAPI) return []

      const baseSuggestions = this.getRuleBasedSuggestions(context)
      const rewrittenSuggestions: AISuggestion[] = []

      for (const suggestion of baseSuggestions.slice(0, 3)) { // Limit to 3 for performance
        try {
          const result = await this.rewriteAPI.rewrite(suggestion.text, {
            style: 'natural conversation',
            tone: 'friendly and helpful'
          })
          
          rewrittenSuggestions.push({
            text: result,
            confidence: suggestion.confidence * 1.1, // Boost confidence for AI-rewritten
            context: suggestion.context,
            category: suggestion.category
          })
        } catch (rewriteError) {
          // If rewrite fails, keep original
          rewrittenSuggestions.push(suggestion)
        }
      }

      return rewrittenSuggestions
    } catch (error) {
      console.log('Chrome AI Rewrite API failed:', error)
      return []
    }
  }

  // Local AI using browser-based models or simple NLP
  private async getLocalAISuggestions(context: ConversationContext): Promise<AISuggestion[]> {
    try {
      // Use a simple but effective local AI approach
      const suggestions = await this.generateLocalSuggestions(context)
      return suggestions
    } catch (error) {
      console.log('Local AI failed:', error)
      return []
    }
  }

  // Generate suggestions using local processing
  private async generateLocalSuggestions(context: ConversationContext): Promise<AISuggestion[]> {
    const { input, language, situation } = context
    const lowerInput = input.toLowerCase()

    // Enhanced context analysis
    const contextAnalysis = this.analyzeContext(lowerInput, situation)
    
    // Generate suggestions based on analysis
    const suggestions: AISuggestion[] = []

    // Travel-specific AI suggestions
    if (contextAnalysis.isTravelRelated) {
      suggestions.push(...this.getTravelSuggestions(contextAnalysis, language))
    }

    // Shopping-specific AI suggestions
    if (contextAnalysis.isShoppingRelated) {
      suggestions.push(...this.getShoppingSuggestions(contextAnalysis, language))
    }

    // Food-specific AI suggestions
    if (contextAnalysis.isFoodRelated) {
      suggestions.push(...this.getFoodSuggestions(contextAnalysis, language))
    }

    // Emergency-specific AI suggestions
    if (contextAnalysis.isEmergencyRelated) {
      suggestions.push(...this.getEmergencySuggestions(contextAnalysis, language))
    }

    // General conversation AI suggestions
    if (suggestions.length === 0) {
      suggestions.push(...this.getGeneralSuggestions(contextAnalysis, language))
    }

    return suggestions.slice(0, 6) // Limit to 6 suggestions
  }

  // Context analysis using pattern matching and NLP
  private analyzeContext(input: string, situation?: string) {
    const travelKeywords = ['travel', 'trip', 'vacation', 'hotel', 'flight', 'airport', 'passport', 'visa', 'tourist', 'destination']
    const shoppingKeywords = ['buy', 'purchase', 'cost', 'price', 'expensive', 'cheap', 'discount', 'sale', 'product', 'item', 'shop', 'store']
    const foodKeywords = ['food', 'eat', 'restaurant', 'meal', 'hungry', 'spicy', 'vegetarian', 'menu', 'bill', 'order']
    const emergencyKeywords = ['help', 'emergency', 'hospital', 'police', 'lost', 'danger', 'problem', 'urgent', 'doctor', 'ambulance']
    const transportKeywords = ['bus', 'taxi', 'train', 'car', 'drive', 'ride', 'transport', 'direction', 'route', 'station']

    return {
      isTravelRelated: travelKeywords.some(keyword => input.includes(keyword)),
      isShoppingRelated: shoppingKeywords.some(keyword => input.includes(keyword)),
      isFoodRelated: foodKeywords.some(keyword => input.includes(keyword)),
      isEmergencyRelated: emergencyKeywords.some(keyword => input.includes(keyword)),
      isTransportRelated: transportKeywords.some(keyword => input.includes(keyword)),
      sentiment: this.analyzeSentiment(input),
      urgency: this.analyzeUrgency(input),
      situation: situation || 'general'
    }
  }

  // Sentiment analysis
  private analyzeSentiment(input: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'beautiful', 'nice', 'perfect', 'love', 'like']
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'problem', 'issue', 'wrong', 'broken']

    const positiveCount = positiveWords.filter(word => input.includes(word)).length
    const negativeCount = negativeWords.filter(word => input.includes(word)).length

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  // Urgency analysis
  private analyzeUrgency(input: string): 'high' | 'medium' | 'low' {
    const urgentWords = ['urgent', 'emergency', 'help', 'now', 'immediately', 'asap', 'quickly', 'fast']
    const mediumWords = ['soon', 'later', 'when', 'time', 'schedule']

    if (urgentWords.some(word => input.includes(word))) return 'high'
    if (mediumWords.some(word => input.includes(word))) return 'medium'
    return 'low'
  }

  // Travel-specific AI suggestions
  private getTravelSuggestions(analysis: any, _language: string): AISuggestion[] {
    const suggestions = [
      { text: "What are the must-see attractions here?", confidence: 0.9, context: "tourism", category: "travel" },
      { text: "How do I get to the city center?", confidence: 0.8, context: "navigation", category: "travel" },
      { text: "What's the best local transportation?", confidence: 0.8, context: "transport", category: "travel" },
      { text: "Can you recommend a good hotel?", confidence: 0.7, context: "accommodation", category: "travel" },
      { text: "What's the local currency exchange rate?", confidence: 0.7, context: "money", category: "travel" },
      { text: "Is it safe to walk around here at night?", confidence: 0.6, context: "safety", category: "travel" }
    ]

    return suggestions.map(s => ({ ...s, confidence: s.confidence * (analysis.urgency === 'high' ? 1.2 : 1) }))
  }

  // Shopping-specific AI suggestions
  private getShoppingSuggestions(analysis: any, _language: string): AISuggestion[] {
    const suggestions = [
      { text: "Can you give me a better price?", confidence: 0.9, context: "negotiation", category: "shopping" },
      { text: "Do you have this in a different color?", confidence: 0.8, context: "variety", category: "shopping" },
      { text: "What's your return policy?", confidence: 0.8, context: "policy", category: "shopping" },
      { text: "Is this authentic?", confidence: 0.7, context: "authenticity", category: "shopping" },
      { text: "Can I pay with credit card?", confidence: 0.7, context: "payment", category: "shopping" },
      { text: "Do you offer international shipping?", confidence: 0.6, context: "shipping", category: "shopping" }
    ]

    return suggestions.map(s => ({ ...s, confidence: s.confidence * (analysis.sentiment === 'positive' ? 1.1 : 1) }))
  }

  // Food-specific AI suggestions
  private getFoodSuggestions(_analysis: any, _language: string): AISuggestion[] {
    const suggestions = [
      { text: "What's the local specialty here?", confidence: 0.9, context: "local_food", category: "food" },
      { text: "I'm vegetarian, what do you recommend?", confidence: 0.8, context: "dietary", category: "food" },
      { text: "Is this dish spicy?", confidence: 0.8, context: "spice_level", category: "food" },
      { text: "Can I have the bill, please?", confidence: 0.7, context: "payment", category: "food" },
      { text: "Do you have English menu?", confidence: 0.7, context: "language", category: "food" },
      { text: "What's the best time to visit?", confidence: 0.6, context: "timing", category: "food" }
    ]

    return suggestions
  }

  // Emergency-specific AI suggestions
  private getEmergencySuggestions(_analysis: any, _language: string): AISuggestion[] {
    const suggestions = [
      { text: "I need immediate help!", confidence: 0.95, context: "urgent_help", category: "emergency" },
      { text: "Where is the nearest hospital?", confidence: 0.9, context: "medical", category: "emergency" },
      { text: "Can you call the police?", confidence: 0.9, context: "police", category: "emergency" },
      { text: "I'm lost, can you help me?", confidence: 0.8, context: "navigation", category: "emergency" },
      { text: "I lost my passport", confidence: 0.8, context: "document", category: "emergency" },
      { text: "I need to contact my embassy", confidence: 0.7, context: "diplomatic", category: "emergency" }
    ]

    return suggestions.map(s => ({ ...s, confidence: s.confidence * 1.3 })) // Boost confidence for emergencies
  }

  // General conversation AI suggestions
  private getGeneralSuggestions(_analysis: any, _language: string): AISuggestion[] {
    const suggestions = [
      { text: "Do you speak English?", confidence: 0.8, context: "language", category: "general" },
      { text: "Can you help me?", confidence: 0.7, context: "assistance", category: "general" },
      { text: "Thank you very much", confidence: 0.6, context: "gratitude", category: "general" },
      { text: "Excuse me, I don't understand", confidence: 0.6, context: "clarification", category: "general" },
      { text: "Can you speak slower?", confidence: 0.5, context: "communication", category: "general" },
      { text: "Nice to meet you", confidence: 0.5, context: "greeting", category: "general" }
    ]

    return suggestions
  }

  // Build context prompt for Chrome AI Prompt API
  private buildContextPrompt(context: ConversationContext): string {
    return `
You are a helpful AI assistant for travelers using Gemini Nano. Based on this conversation context, suggest 4-6 relevant follow-up questions or responses.

Context:
- User input: "${context.input}"
- Target language: ${context.language}
- Situation: ${context.situation || 'general travel'}
- Previous messages: ${context.previousMessages?.join(', ') || 'none'}

Please provide natural, helpful suggestions that a traveler might need in this situation. Focus on practical, actionable responses that help with communication and navigation.

Format your response as a simple list of suggestions, one per line.
    `.trim()
  }

  // Build write prompt for Chrome AI Write API
  private buildWritePrompt(context: ConversationContext): string {
    return `
Write 4-6 helpful conversation suggestions for a traveler who said: "${context.input}"

Context: ${context.situation || 'general travel situation'}
Target language: ${context.language}

Create natural, conversational responses that would be useful for someone traveling and needing to communicate in this situation. Make them practical and actionable.

Format as a simple list, one suggestion per line.
    `.trim()
  }

  // Parse AI response
  private parseAIResponse(response: string, context: ConversationContext): AISuggestion[] {
    const lines = response.split('\n').filter(line => line.trim())
    return lines.map((line, index) => ({
      text: line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim(),
      confidence: 0.8 - (index * 0.1), // Decreasing confidence
      context: context.situation || 'ai_generated',
      category: 'ai'
    })).filter(s => s.text.length > 0)
  }

  // Rule-based fallback suggestions
  private getRuleBasedSuggestions(context: ConversationContext): AISuggestion[] {
    const { input } = context
    const lowerInput = input.toLowerCase()

    // Simple keyword-based suggestions
    if (lowerInput.includes('cost') || lowerInput.includes('price')) {
      return [
        { text: "Can you make it cheaper?", confidence: 0.8, context: "negotiation", category: "shopping" },
        { text: "What's the best price you can offer?", confidence: 0.7, context: "negotiation", category: "shopping" },
        { text: "Do you accept credit card?", confidence: 0.6, context: "payment", category: "shopping" }
      ]
    }

    if (lowerInput.includes('where') || lowerInput.includes('location')) {
      return [
        { text: "How do I get there?", confidence: 0.8, context: "navigation", category: "travel" },
        { text: "Is it far from here?", confidence: 0.7, context: "distance", category: "travel" },
        { text: "Can you show me on a map?", confidence: 0.6, context: "navigation", category: "travel" }
      ]
    }

    // Default suggestions
    return [
      { text: "Can you help me?", confidence: 0.6, context: "assistance", category: "general" },
      { text: "Do you speak English?", confidence: 0.5, context: "language", category: "general" },
      { text: "Thank you", confidence: 0.4, context: "gratitude", category: "general" }
    ]
  }
}

// Export singleton instance
export const aiContextService = new AIContextService()
