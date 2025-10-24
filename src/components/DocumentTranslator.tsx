import { useState, useRef } from 'react'
import { ocrService, validateImageFile, createImagePreview, type OCRResult, type DocumentType, DOCUMENT_TYPES } from '../services/ocr'
import { translationService, LANGUAGE_CODES } from '../services/translation'
import { speakInLanguage } from '../services/ai'
import { chromeAIService } from '../services/chrome-ai'

export interface DocumentTranslatorProps {
  isActive: boolean
  onClose: () => void
  targetLanguage: string
}

export function DocumentTranslator({ isActive, onClose, targetLanguage }: DocumentTranslatorProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(DOCUMENT_TYPES[0])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [extractedFields, setExtractedFields] = useState<Record<string, string>>({})
  const [translatedFields, setTranslatedFields] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error!)
      return
    }

    setError('')
    setUploadedFile(file)
    
    try {
      const preview = await createImagePreview(file)
      setImagePreview(preview)
    } catch (err) {
      setError('Failed to create image preview')
    }
  }

  const handleExtractText = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setError('')

    try {
      const result = await ocrService.extractText(uploadedFile)
      setOcrResult(result)
      
      // Extract specific fields using Chrome AI
      let fields: Record<string, string> = {}
      try {
        // Try Chrome AI first
        fields = await chromeAIService.extractDocumentInfo(result.text, selectedDocumentType.name)
      } catch (error) {
        console.warn('Chrome AI extraction failed, using OCR fallback:', error)
        // Fallback to OCR-based extraction
        fields = ocrService.extractDocumentFields(result, selectedDocumentType)
      }
      
      setExtractedFields(fields)
      
      // Translate extracted fields
      await translateFields(fields)
    } catch (err) {
      setError('Failed to extract text from image. Please try again with a clearer image.')
      console.error('OCR Error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const translateFields = async (fields: Record<string, string>) => {
    const targetCode = LANGUAGE_CODES[targetLanguage] || 'vi'
    const translated: Record<string, string> = {}

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      if (fieldValue.trim()) {
        try {
          const translatedValue = await translationService.translate(fieldValue, 'en', targetCode)
          translated[fieldName] = translatedValue
        } catch (err) {
          translated[fieldName] = fieldValue // Keep original if translation fails
        }
      }
    }

    setTranslatedFields(translated)
  }

  const handleSpeakField = (fieldValue: string, fieldName: string) => {
    if (isPlaying === fieldName) {
      setIsPlaying(null)
      return
    }

    const targetCode = LANGUAGE_CODES[targetLanguage] || 'vi'
    speakInLanguage(fieldValue, targetCode)
    setIsPlaying(fieldName)
    
    // Auto-stop after 10 seconds
    setTimeout(() => {
      setIsPlaying(null)
    }, 10000)
  }

  const handleClear = () => {
    setUploadedFile(null)
    setImagePreview('')
    setOcrResult(null)
    setExtractedFields({})
    setTranslatedFields({})
    setError('')
    setIsPlaying(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadTranslation = () => {
    if (Object.keys(translatedFields).length === 0) return

    const content = Object.entries(translatedFields)
      .map(([field, value]) => `${field}: ${value}`)
      .join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document-translation-${selectedDocumentType.name.toLowerCase()}-${targetLanguage}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isActive) return null

  return (
    <div className="document-translator-overlay">
      <div className="document-translator">
        <div className="document-header">
          <h2>📄 Document Translator</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="document-content">
          {/* Document Type Selection */}
          <div className="document-type-section">
            <h3>Select Document Type</h3>
            <div className="document-types">
              {DOCUMENT_TYPES.map((docType) => (
                <button
                  key={docType.name}
                  onClick={() => setSelectedDocumentType(docType)}
                  className={`document-type-btn ${selectedDocumentType.name === docType.name ? 'selected' : ''}`}
                >
                  <span className="doc-icon">{docType.icon}</span>
                  <div className="doc-info">
                    <div className="doc-name">{docType.name}</div>
                    <div className="doc-desc">{docType.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="upload-section">
            <h3>Upload Document Image</h3>
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file-input"
                id="document-upload"
              />
              <label htmlFor="document-upload" className="upload-label">
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Uploaded document" />
                    <div className="image-overlay">
                      <span>Click to change image</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📷</div>
                    <div className="upload-text">
                      <strong>Click to upload document image</strong>
                      <small>Supports JPEG, PNG, WebP, TIFF (max 10MB)</small>
                    </div>
                  </div>
                )}
              </label>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            {uploadedFile && (
              <div className="upload-actions">
                <button
                  onClick={handleExtractText}
                  disabled={isProcessing}
                  className="extract-btn"
                >
                  {isProcessing ? 'Processing...' : 'Extract & Translate Text'}
                </button>
                <button onClick={handleClear} className="clear-btn">
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* OCR Results */}
          {ocrResult && (
            <div className="results-section">
              <div className="results-header">
                <h3>Extracted Information</h3>
                <div className="confidence-badge">
                  Confidence: {Math.round(ocrResult.confidence)}%
                </div>
              </div>

              <div className="fields-container">
                {Object.entries(extractedFields).map(([fieldName, fieldValue]) => (
                  <div key={fieldName} className="field-item">
                    <div className="field-header">
                      <span className="field-name">{fieldName}</span>
                      <button
                        onClick={() => handleSpeakField(translatedFields[fieldName] || fieldValue, fieldName)}
                        className={`speak-field-btn ${isPlaying === fieldName ? 'playing' : ''}`}
                        title={isPlaying === fieldName ? 'Stop speaking' : 'Speak translation'}
                      >
                        {isPlaying === fieldName ? '⏹️' : '🔊'}
                      </button>
                    </div>
                    <div className="field-content">
                      <div className="original-text">
                        <strong>Original:</strong> {fieldValue}
                      </div>
                      {translatedFields[fieldName] && (
                        <div className="translated-text">
                          <strong>Translated ({targetLanguage}):</strong> {translatedFields[fieldName]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(translatedFields).length > 0 && (
                <div className="download-section">
                  <button onClick={handleDownloadTranslation} className="download-btn">
                    📥 Download Translation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Raw OCR Text */}
          {ocrResult && (
            <div className="raw-text-section">
              <details>
                <summary>View Raw Extracted Text</summary>
                <div className="raw-text">
                  {ocrResult.text}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentTranslator
