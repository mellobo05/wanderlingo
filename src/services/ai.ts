/*
  AI service abstraction with feature detection and graceful fallbacks.
  Note: Chrome AI APIs are experimental; we detect and degrade to simple
  client-side heuristics so the app remains usable without keys.
*/

import { translationService, LANGUAGE_CODES } from './translation'

export type ComplexityLevel = 'child' | 'simple' | 'standard'

export interface SimplifyOptions {
  targetLanguage?: string
  complexity: ComplexityLevel
  contextTopic?: string
}

export interface AIOutputs {
  simplified: string
  keyPoints: string[]
  termExplanations: Array<{ term: string; explanation: string }>
}

function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const wpm = 180
  return Math.max(1, Math.round(words / wpm))
}

function naiveSimplify(text: string, level: ComplexityLevel): string {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/([.!?])\s+/)
    .reduce<string[]>((acc, part, idx, arr) => {
      if (idx % 2 === 0) {
        const end = arr[idx + 1] ?? ''
        acc.push((part + end).trim())
      }
      return acc
    }, [])
    .filter(Boolean)

  const simplifySentence = (s: string) => {
    let r = s
      .replace(/hereby/gi, 'now')
      .replace(/pursuant to/gi, 'under')
      .replace(/in accordance with/gi, 'following')
      .replace(/utilize/gi, 'use')
      .replace(/commence/gi, 'start')
      .replace(/terminate/gi, 'end')
      .replace(/remuneration/gi, 'pay')
      .replace(/facilitate/gi, 'help')
      .replace(/prohibited/gi, 'not allowed')
      .replace(/obligation/gi, 'duty')
      .replace(/undertake/gi, 'promise')

    if (level === 'child') {
      // shorten and simplify further
      r = r
        .replace(/shall/gi, 'must')
        .replace(/notwithstanding/gi, 'even so')
        .replace(/thereof|therein|hereto/gi, 'it')
      if (r.length > 140) r = r.slice(0, 140) + '…'
    }
    if (level === 'simple') {
      r = r.replace(/shall/gi, 'must')
    }
    return r
  }

  return sentences.map(simplifySentence).join(' ')
}

function extractKeyPoints(text: string): string[] {
  const points = text
    .split(/\n|[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) => /must|deadline|fee|pay|due|right|oblig|require|prohibit|not allowed/i.test(s))
  return points.slice(0, 8)
}

const KNOWN_TERMS: Record<string, string> = {
  HOA: 'Homeowners Association – a group that makes rules and collects fees in a neighborhood.',
  'Security deposit': 'Money you pay that a landlord can use for damages or unpaid rent.',
  'Due date': 'The last day something must be done or paid.',
  Jurisdiction: 'The area or authority where a law or court has power.',
}

function findTerms(text: string): Array<{ term: string; explanation: string }> {
  const results: Array<{ term: string; explanation: string }> = []
  const lower = text.toLowerCase()
  for (const [term, explanation] of Object.entries(KNOWN_TERMS)) {
    if (lower.includes(term.toLowerCase())) results.push({ term, explanation })
  }
  return results
}

async function maybeChromeRewrite(
  text: string,
  options: SimplifyOptions,
): Promise<string | null> {
  // Chrome AI Rewrite API implementation using Gemini Nano
  try {
    const ai = (globalThis as any).ai
    if (!ai || !ai.rewriter) {
      console.log('Chrome AI Rewriter not available')
      return null
    }
    
    console.log('🤖 Using Chrome AI Rewriter (Gemini Nano)')
    const rewriter = await ai.rewriter.create()
    const style =
      options.complexity === 'child'
        ? 'Explain like I am 10 years old'
        : options.complexity === 'simple'
        ? 'Plain, simple English for travelers'
        : 'Clear and concise professional language'
    
    const res: string = await rewriter.rewrite(text, { 
      style,
      context: options.contextTopic || 'travel communication'
    })
    
    console.log('✅ Chrome AI Rewriter completed')
    return res || null
  } catch (error) {
    console.log('Chrome AI Rewriter failed:', error)
    return null
  }
}

// Chrome AI Summarization API implementation
async function maybeChromeSummarize(text: string, options: SimplifyOptions): Promise<string | null> {
  try {
    const ai = (globalThis as any).ai
    if (!ai || !ai.summarization) {
      console.log('Chrome AI Summarization not available')
      return null
    }
    
    console.log('🤖 Using Chrome AI Summarization (Gemini Nano)')
    const summarizer = await ai.summarization.create()
    
    const res: string = await summarizer.summarize(text, {
      length: options.complexity === 'child' ? 'short' : 
              options.complexity === 'simple' ? 'medium' : 'long',
      context: options.contextTopic || 'travel document',
      language: 'English'
    })
    
    console.log('✅ Chrome AI Summarization completed')
    return res || null
  } catch (error) {
    console.log('Chrome AI Summarization failed:', error)
    return null
  }
}

export async function simplify(
  text: string,
  options: SimplifyOptions,
): Promise<AIOutputs & { readTimeMin: number }> {
  // Try Chrome AI Summarization API first for long documents
  let chromeSummary = null
  if (text.length > 500) {
    chromeSummary = await maybeChromeSummarize(text, options)
  }
  
  // Try Chrome AI Rewrite API for simplification
  const chromeResult = await maybeChromeRewrite(text, options)
  
  // Use the best available result
  const simplified = chromeSummary || chromeResult || naiveSimplify(text, options.complexity)
  const keyPoints = extractKeyPoints(simplified)
  const termExplanations = findTerms(text)
  const readTimeMin = estimateReadTime(simplified)
  
  return { simplified, keyPoints, termExplanations, readTimeMin }
}

async function translateText(text: string, targetLanguage: string): Promise<string> {
  const targetCode = LANGUAGE_CODES[targetLanguage] || 'en'
  
  if (targetCode === 'en') {
    return text // No translation needed for English
  }
  
  try {
    return await translationService.translate(text, 'en', targetCode)
  } catch (error) {
    console.error('Translation failed:', error)
    // Fallback to language indicator if translation fails
    return `[Translated to ${targetLanguage}] ${text}`
  }
}

export async function translateAndSimplify(
  text: string,
  options: SimplifyOptions & { targetLanguage: string },
): Promise<AIOutputs & { readTimeMin: number; language: string }> {
  // First translate the text
  const translatedText = await translateText(text, options.targetLanguage)
  
  // Then simplify the translated text
  const base = await simplify(translatedText, options)
  const language = options.targetLanguage
  return { ...base, language }
}

export async function summarize(text: string): Promise<string[]> {
  const keyPoints = extractKeyPoints(text)
  if (keyPoints.length === 0) {
    const sentences = text.split(/[.!?]/).map((s) => s.trim()).filter(Boolean)
    return sentences.slice(0, 5)
  }
  return keyPoints
}

// Language code mapping for TTS
const TTS_LANGUAGE_MAP: Record<string, string> = {
  'en': 'en-US',
  'es': 'es-ES',
  'zh': 'zh-CN',
  'hi': 'hi-IN',
  'ar': 'ar-SA',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'pt': 'pt-PT',
  'ru': 'ru-RU',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'vi': 'vi-VN',
  'th': 'th-TH',
  'id': 'id-ID',
  'ms': 'ms-MY',
  'tl': 'fil-PH',
  'it': 'it-IT',
  'nl': 'nl-NL',
  'sv': 'sv-SE',
  'no': 'no-NO',
  'da': 'da-DK',
  'fi': 'fi-FI',
  'pl': 'pl-PL',
  'cs': 'cs-CZ',
  'hu': 'hu-HU',
  'ro': 'ro-RO',
  'bg': 'bg-BG',
  'hr': 'hr-HR',
  'sk': 'sk-SK',
  'sl': 'sl-SI',
  'et': 'et-EE',
  'lv': 'lv-LV',
  'lt': 'lt-LT',
  'el': 'el-GR',
  'tr': 'tr-TR',
  'he': 'he-IL',
  'fa': 'fa-IR',
  'ur': 'ur-PK',
  'bn': 'bn-BD',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'gu': 'gu-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN',
  'pa': 'pa-IN',
  'mr': 'mr-IN',
  'ne': 'ne-NP',
  'si': 'si-LK',
  'my': 'my-MM',
  'km': 'km-KH',
  'lo': 'lo-LA'
}

export function speak(text: string, rate = 1, language = 'en-US'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.lang = language
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function speakInLanguage(text: string, languageCode: string, rate = 1): void {
  const ttsLanguage = TTS_LANGUAGE_MAP[languageCode] || 'en-US'
  speak(text, rate, ttsLanguage)
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
}


