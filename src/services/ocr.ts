/*
  OCR (Optical Character Recognition) service for extracting text from images
  Uses Tesseract.js for client-side OCR processing
*/

export interface OCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
  lines: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
}

export interface DocumentType {
  name: string
  icon: string
  commonFields: string[]
  description: string
}

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    name: 'Passport',
    icon: '📘',
    commonFields: ['Name', 'Surname', 'Given Names', 'Date of Birth', 'Place of Birth', 'Nationality', 'Passport No', 'Date of Issue', 'Date of Expiry', 'Authority'],
    description: 'International passport or travel document'
  },
  {
    name: 'Driver\'s License',
    icon: '🚗',
    commonFields: ['Name', 'Address', 'Date of Birth', 'License No', 'Class', 'Date of Issue', 'Date of Expiry', 'Restrictions'],
    description: 'Driver\'s license or driving permit'
  },
  {
    name: 'ID Card',
    icon: '🆔',
    commonFields: ['Name', 'ID Number', 'Date of Birth', 'Address', 'Nationality', 'Date of Issue', 'Date of Expiry'],
    description: 'National ID card or identity document'
  },
  {
    name: 'Other Document',
    icon: '📄',
    commonFields: ['Name', 'Number', 'Date', 'Address', 'Description'],
    description: 'Any other document with text'
  }
]

class OCRService {
  private tesseractWorker: any = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Dynamically import Tesseract.js
      const Tesseract = await import('tesseract.js')
      
      this.tesseractWorker = await Tesseract.createWorker()

      await this.tesseractWorker.load()
      await this.tesseractWorker.loadLanguage('eng')
      await this.tesseractWorker.initialize('eng')
      
      this.isInitialized = true
      console.log('OCR Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize OCR service:', error)
      throw new Error('OCR service initialization failed')
    }
  }

  async extractText(imageFile: File, _documentType: string = 'eng'): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const { data } = await this.tesseractWorker.recognize(imageFile)
      
      // Process the OCR result
      const words = data.words.map((word: any) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1
        }
      }))

      const lines = data.lines.map((line: any) => ({
        text: line.text,
        confidence: line.confidence,
        bbox: {
          x0: line.bbox.x0,
          y0: line.bbox.y0,
          x1: line.bbox.x1,
          y1: line.bbox.y1
        }
      }))

      return {
        text: data.text,
        confidence: data.confidence,
        words,
        lines
      }
    } catch (error) {
      console.error('OCR extraction failed:', error)
      throw new Error('Failed to extract text from image')
    }
  }

  async extractTextFromImageUrl(imageUrl: string): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const { data } = await this.tesseractWorker.recognize(imageUrl)
      
      const words = data.words.map((word: any) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1
        }
      }))

      const lines = data.lines.map((line: any) => ({
        text: line.text,
        confidence: line.confidence,
        bbox: {
          x0: line.bbox.x0,
          y0: line.bbox.y0,
          x1: line.bbox.x1,
          y1: line.bbox.y1
        }
      }))

      return {
        text: data.text,
        confidence: data.confidence,
        words,
        lines
      }
    } catch (error) {
      console.error('OCR extraction from URL failed:', error)
      throw new Error('Failed to extract text from image URL')
    }
  }

  // Extract specific fields from document based on type
  extractDocumentFields(ocrResult: OCRResult, _documentType: DocumentType): Record<string, string> {
    const fields: Record<string, string> = {}
    const text = ocrResult.text.toLowerCase()
    
    // Common patterns for different document types
    const patterns: Record<string, RegExp[]> = {
      'Name': [
        /name[:\s]+([a-zA-Z\s]+)/i,
        /surname[:\s]+([a-zA-Z\s]+)/i,
        /given\s+names?[:\s]+([a-zA-Z\s]+)/i
      ],
      'Date of Birth': [
        /date\s+of\s+birth[:\s]+([0-9\/\-\.\s]+)/i,
        /dob[:\s]+([0-9\/\-\.\s]+)/i,
        /born[:\s]+([0-9\/\-\.\s]+)/i
      ],
      'Passport No': [
        /passport\s+(?:no|number)[:\s]+([a-zA-Z0-9]+)/i,
        /passport[:\s]+([a-zA-Z0-9]+)/i
      ],
      'License No': [
        /license\s+(?:no|number)[:\s]+([a-zA-Z0-9]+)/i,
        /lic[:\s]+([a-zA-Z0-9]+)/i
      ],
      'ID Number': [
        /id\s+(?:no|number)[:\s]+([a-zA-Z0-9]+)/i,
        /identity[:\s]+([a-zA-Z0-9]+)/i
      ],
      'Date of Issue': [
        /date\s+of\s+issue[:\s]+([0-9\/\-\.\s]+)/i,
        /issued[:\s]+([0-9\/\-\.\s]+)/i
      ],
      'Date of Expiry': [
        /date\s+of\s+expiry[:\s]+([0-9\/\-\.\s]+)/i,
        /expires?[:\s]+([0-9\/\-\.\s]+)/i,
        /valid\s+until[:\s]+([0-9\/\-\.\s]+)/i
      ],
      'Nationality': [
        /nationality[:\s]+([a-zA-Z\s]+)/i,
        /citizen[:\s]+([a-zA-Z\s]+)/i
      ],
      'Address': [
        /address[:\s]+([a-zA-Z0-9\s,\.]+)/i,
        /residence[:\s]+([a-zA-Z0-9\s,\.]+)/i
      ]
    }

    // Extract fields using patterns
    for (const [fieldName, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        const match = text.match(regex)
        if (match && match[1]) {
          fields[fieldName] = match[1].trim()
          break
        }
      }
    }

    return fields
  }

  async terminate(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate()
      this.tesseractWorker = null
      this.isInitialized = false
    }
  }
}

// Singleton instance
export const ocrService = new OCRService()

// Utility function to validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff']
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, WebP, or TIFF)' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image file is too large. Please upload an image smaller than 10MB' }
  }
  
  return { valid: true }
}

// Utility function to create image preview
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to create image preview'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}
