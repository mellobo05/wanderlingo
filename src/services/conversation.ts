/*
  AI-powered conversation suggestions and predictions for travelers
  Provides contextual conversation suggestions based on travel scenarios
  Uses Chrome AI (Gemini Nano) for enhanced suggestions
*/

import { chromeAIService, type ChromeAIConversationContext } from './chrome-ai'

export interface ConversationSuggestion {
  text: string
  translated: string
  category: string
  confidence: number
}

export interface ConversationContext {
  location?: string
  situation: 'greeting' | 'directions' | 'food' | 'shopping' | 'emergency' | 'accommodation' | 'transport' | 'general'
  previousMessages: string[]
  currentLanguage: string
}

// Common travel phrases organized by category
const TRAVEL_PHRASES: Record<string, Record<string, string>> = {
  greeting: {
    'Hello': 'Xin chào',
    'Good morning': 'Chào buổi sáng',
    'Good afternoon': 'Chào buổi chiều',
    'Good evening': 'Chào buổi tối',
    'How are you?': 'Bạn khỏe không?',
    'Nice to meet you': 'Rất vui được gặp bạn',
    'Thank you': 'Cảm ơn',
    'You\'re welcome': 'Không có gì',
    'Excuse me': 'Xin lỗi',
    'Sorry': 'Xin lỗi'
  },
  directions: {
    'Where is...?': '...ở đâu?',
    'How do I get to...?': 'Làm sao để đến...?',
    'Is it far?': 'Có xa không?',
    'Can you show me on the map?': 'Bạn có thể chỉ cho tôi trên bản đồ không?',
    'Turn left': 'Rẽ trái',
    'Turn right': 'Rẽ phải',
    'Go straight': 'Đi thẳng',
    'Stop here': 'Dừng ở đây',
    'I\'m lost': 'Tôi bị lạc',
    'Can you help me?': 'Bạn có thể giúp tôi không?'
  },
  food: {
    'I\'m hungry': 'Tôi đói',
    'Where can I eat?': 'Tôi có thể ăn ở đâu?',
    'What do you recommend?': 'Bạn gợi ý gì?',
    'Is this spicy?': 'Cái này có cay không?',
    'I\'m vegetarian': 'Tôi ăn chay',
    'I\'m allergic to...': 'Tôi dị ứng với...',
    'The bill, please': 'Tính tiền',
    'Is this halal?': 'Cái này có halal không?',
    'How much is this?': 'Cái này bao nhiêu tiền?',
    'Can I have the menu?': 'Tôi có thể xem thực đơn không?'
  },
  shopping: {
    'How much does this cost?': 'Cái này giá bao nhiêu?',
    'Can you make it cheaper?': 'Có thể giảm giá không?',
    'Do you have this in a different size?': 'Có cỡ khác không?',
    'Can I try this on?': 'Tôi có thể thử không?',
    'Do you accept credit cards?': 'Có nhận thẻ tín dụng không?',
    'I\'m just looking': 'Tôi chỉ xem thôi',
    'This is too expensive': 'Cái này đắt quá',
    'Do you have change?': 'Có tiền lẻ không?',
    'Can I return this?': 'Tôi có thể trả lại không?',
    'What time do you close?': 'Mấy giờ đóng cửa?'
  },
  emergency: {
    'Help!': 'Cứu!',
    'Call the police': 'Gọi cảnh sát',
    'Call an ambulance': 'Gọi xe cứu thương',
    'I need a doctor': 'Tôi cần bác sĩ',
    'Where is the hospital?': 'Bệnh viện ở đâu?',
    'I\'m hurt': 'Tôi bị thương',
    'I lost my passport': 'Tôi mất hộ chiếu',
    'I was robbed': 'Tôi bị cướp',
    'I need the embassy': 'Tôi cần đại sứ quán',
    'Can you help me?': 'Bạn có thể giúp tôi không?'
  },
  accommodation: {
    'Do you have a room?': 'Có phòng không?',
    'How much per night?': 'Một đêm bao nhiêu tiền?',
    'I have a reservation': 'Tôi đã đặt phòng',
    'What time is checkout?': 'Mấy giờ trả phòng?',
    'Is breakfast included?': 'Có bao gồm bữa sáng không?',
    'Can I see the room?': 'Tôi có thể xem phòng không?',
    'Is there WiFi?': 'Có WiFi không?',
    'Where is the elevator?': 'Thang máy ở đâu?',
    'I need extra towels': 'Tôi cần thêm khăn tắm',
    'Can you wake me up at...?': 'Có thể đánh thức tôi lúc...?'
  },
  transport: {
    'Where is the bus stop?': 'Trạm xe buýt ở đâu?',
    'How much is the fare?': 'Giá vé bao nhiêu?',
    'Does this go to...?': 'Xe này có đi...?',
    'When is the next bus?': 'Xe buýt tiếp theo lúc mấy giờ?',
    'I want to go to...': 'Tôi muốn đi...',
    'How long does it take?': 'Mất bao lâu?',
    'Is this the right bus?': 'Đây có phải xe buýt đúng không?',
    'Can I buy a ticket here?': 'Tôi có thể mua vé ở đây không?',
    'Where do I get off?': 'Tôi xuống ở đâu?',
    'Can you tell me when to get off?': 'Bạn có thể báo tôi khi nào xuống không?'
  }
}

// AI-powered conversation prediction based on context
export class ConversationAI {
  private conversationHistory: string[] = []
  private currentContext: ConversationContext

  constructor(initialContext: ConversationContext) {
    this.currentContext = initialContext
  }

  updateContext(context: Partial<ConversationContext>) {
    this.currentContext = { ...this.currentContext, ...context }
  }

  addMessage(message: string) {
    this.conversationHistory.push(message)
    // Keep only last 10 messages for context
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10)
    }
  }

  // Generate contextual conversation suggestions using Chrome AI
  async generateSuggestions(count: number = 5): Promise<ConversationSuggestion[]> {
    try {
      // Try Chrome AI first
      const chromeAIContext: ChromeAIConversationContext = {
        situation: this.currentContext.situation,
        location: this.currentContext.location,
        previousMessages: this.currentContext.previousMessages
      }

      const aiSuggestions = await chromeAIService.generateConversationSuggestions(chromeAIContext, count)
      
      // Translate suggestions using Chrome AI
      const translatedSuggestions: ConversationSuggestion[] = []
      for (const suggestion of aiSuggestions) {
        try {
          const translation = await chromeAIService.translateText(suggestion.text, {
            sourceLanguage: 'English',
            targetLanguage: this.currentContext.currentLanguage,
            context: this.currentContext.situation,
            formality: 'formal'
          })
          
          translatedSuggestions.push({
            text: suggestion.text,
            translated: translation.text,
            category: this.currentContext.situation,
            confidence: suggestion.confidence || 0.9
          })
        } catch (error) {
          // Fallback to static translation
          const staticTranslation = this.getStaticTranslation(suggestion.text)
          translatedSuggestions.push({
            text: suggestion.text,
            translated: staticTranslation,
            category: this.currentContext.situation,
            confidence: 0.7
          })
        }
      }

      return translatedSuggestions
    } catch (error) {
      console.warn('Chrome AI suggestions failed, using static phrases:', error)
      return this.generateStaticSuggestions(count)
    }
  }

  // Fallback to static suggestions
  private generateStaticSuggestions(count: number): ConversationSuggestion[] {
    const category = this.currentContext.situation
    const phrases = TRAVEL_PHRASES[category] || TRAVEL_PHRASES.general

    // Get phrases based on context
    const relevantPhrases = Object.entries(phrases)
      .map(([english, vietnamese]) => ({
        text: english,
        translated: vietnamese,
        category,
        confidence: this.calculateConfidence(english, category)
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, count)

    return relevantPhrases
  }

  private getStaticTranslation(text: string): string {
    // Simple fallback translation lookup
    const allPhrases = Object.values(TRAVEL_PHRASES).reduce((acc, phrases) => ({ ...acc, ...phrases }), {})
    return allPhrases[text] || `[${this.currentContext.currentLanguage}] ${text}`
  }

  // Predict next likely responses based on conversation flow
  predictNextResponses(input: string, count: number = 3): ConversationSuggestion[] {
    const predictions: ConversationSuggestion[] = []
    
    // Simple pattern matching for common conversation flows
    const patterns = [
      {
        pattern: /hello|hi|good morning|good afternoon/i,
        responses: [
          { text: 'How are you?', translated: 'Bạn khỏe không?', category: 'greeting', confidence: 0.9 },
          { text: 'Nice to meet you', translated: 'Rất vui được gặp bạn', category: 'greeting', confidence: 0.8 },
          { text: 'What\'s your name?', translated: 'Tên bạn là gì?', category: 'greeting', confidence: 0.7 }
        ]
      },
      {
        pattern: /thank you|thanks/i,
        responses: [
          { text: 'You\'re welcome', translated: 'Không có gì', category: 'greeting', confidence: 0.9 },
          { text: 'No problem', translated: 'Không vấn đề gì', category: 'greeting', confidence: 0.8 },
          { text: 'My pleasure', translated: 'Hân hạnh', category: 'greeting', confidence: 0.7 }
        ]
      },
      {
        pattern: /where|location|directions/i,
        responses: [
          { text: 'Can you show me on the map?', translated: 'Bạn có thể chỉ cho tôi trên bản đồ không?', category: 'directions', confidence: 0.9 },
          { text: 'Is it far from here?', translated: 'Có xa đây không?', category: 'directions', confidence: 0.8 },
          { text: 'How do I get there?', translated: 'Làm sao để đến đó?', category: 'directions', confidence: 0.9 }
        ]
      },
      {
        pattern: /food|eat|restaurant|hungry/i,
        responses: [
          { text: 'What do you recommend?', translated: 'Bạn gợi ý gì?', category: 'food', confidence: 0.9 },
          { text: 'Is this spicy?', translated: 'Cái này có cay không?', category: 'food', confidence: 0.8 },
          { text: 'I\'m vegetarian', translated: 'Tôi ăn chay', category: 'food', confidence: 0.7 }
        ]
      },
      {
        pattern: /price|cost|how much|expensive/i,
        responses: [
          { text: 'Can you make it cheaper?', translated: 'Có thể giảm giá không?', category: 'shopping', confidence: 0.9 },
          { text: 'Do you accept credit cards?', translated: 'Có nhận thẻ tín dụng không?', category: 'shopping', confidence: 0.8 },
          { text: 'This is too expensive', translated: 'Cái này đắt quá', category: 'shopping', confidence: 0.7 }
        ]
      }
    ]

    for (const { pattern, responses } of patterns) {
      if (pattern.test(input)) {
        predictions.push(...responses.slice(0, count))
        break
      }
    }

    // If no patterns match, return general suggestions
    if (predictions.length === 0) {
      const generalPhrases = TRAVEL_PHRASES.general
      const generalSuggestions = Object.entries(generalPhrases)
        .slice(0, count)
        .map(([english, vietnamese]) => ({
          text: english,
          translated: vietnamese,
          category: 'general',
          confidence: 0.5
        }))
      predictions.push(...generalSuggestions)
    }

    return predictions.slice(0, count)
  }

  // Calculate confidence based on context and conversation history
  private calculateConfidence(phrase: string, category: string): number {
    let confidence = 0.5

    // Boost confidence if category matches current context
    if (category === this.currentContext.situation) {
      confidence += 0.3
    }

    // Boost confidence if phrase relates to recent conversation
    const recentMessages = this.conversationHistory.slice(-3).join(' ').toLowerCase()
    const phraseWords = phrase.toLowerCase().split(' ')
    
    for (const word of phraseWords) {
      if (recentMessages.includes(word)) {
        confidence += 0.1
      }
    }

    // Boost confidence for common phrases
    const commonPhrases = ['hello', 'thank you', 'excuse me', 'how much', 'where is']
    if (commonPhrases.some(common => phrase.toLowerCase().includes(common))) {
      confidence += 0.2
    }

    return Math.min(confidence, 1.0)
  }

  // Get conversation context summary
  getContextSummary(): string {
    const { situation, location, currentLanguage } = this.currentContext
    let summary = `Traveling in ${currentLanguage}`
    
    if (location) {
      summary += ` (${location})`
    }
    
    summary += ` - Current situation: ${situation}`
    
    if (this.conversationHistory.length > 0) {
      summary += ` - Recent: ${this.conversationHistory.slice(-2).join(', ')}`
    }
    
    return summary
  }
}

// Create a singleton instance
let conversationAI: ConversationAI | null = null

export function getConversationAI(context?: ConversationContext): ConversationAI {
  if (!conversationAI && context) {
    conversationAI = new ConversationAI(context)
  }
  return conversationAI!
}

export function resetConversationAI() {
  conversationAI = null
}
