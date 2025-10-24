import { useId } from 'react'
import type { ComplexityLevel } from '../services/ai'

export interface ControlsProps {
  language: string
  setLanguage: (v: string) => void
  complexity: ComplexityLevel
  setComplexity: (v: ComplexityLevel) => void
  contextTopic: string
  setContextTopic: (v: string) => void
  textSize: number
  setTextSize: (v: number) => void
  rtl: boolean
  setRtl: (v: boolean) => void
  highContrast: boolean
  setHighContrast: (v: boolean) => void
}

const LANGS = [
  'English',
  'Spanish',
  'Mandarin',
  'Hindi',
  'Arabic',
  'Vietnamese',
  'Thai',
  'Indonesian',
  'Malay',
  'Filipino',
  'French',
  'German',
  'Portuguese',
  'Russian',
  'Japanese',
  'Korean',
  'Italian',
  'Dutch',
  'Turkish',
  'Polish',
  'Greek',
  'Hebrew',
  'Persian',
  'Urdu',
  'Bengali',
  'Tamil',
  'Telugu',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Marathi',
  'Nepali',
  'Sinhala',
  'Burmese',
  'Khmer',
  'Lao'
]

export function Controls(props: ControlsProps) {
  const langId = useId()
  const compId = useId()
  const ctxId = useId()
  const sizeId = useId()

  return (
    <section className="controls" aria-label="Controls">
      <div className="row">
        <label htmlFor={langId}>Language</label>
        <select
          id={langId}
          value={props.language}
          onChange={(e) => props.setLanguage(e.target.value)}
        >
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <label htmlFor={compId}>Complexity</label>
        <select
          id={compId}
          value={props.complexity}
          onChange={(e) => props.setComplexity(e.target.value as any)}
        >
          <option value="child">Child-friendly</option>
          <option value="simple">Simple</option>
          <option value="standard">Standard</option>
        </select>

        <label htmlFor={ctxId}>Context</label>
        <input
          id={ctxId}
          type="text"
          placeholder="e.g., rental agreement, tax document"
          value={props.contextTopic}
          onChange={(e) => props.setContextTopic(e.target.value)}
        />
      </div>

      <div className="row">
        <label htmlFor={sizeId}>Text size</label>
        <input
          id={sizeId}
          type="range"
          min={14}
          max={22}
          step={1}
          value={props.textSize}
          onChange={(e) => props.setTextSize(parseInt(e.target.value))}
        />
        <span aria-live="polite" className="size-indicator">
          {props.textSize}px
        </span>

        <label>
          <input
            type="checkbox"
            checked={props.rtl}
            onChange={(e) => props.setRtl(e.target.checked)}
          />
          RTL
        </label>

        <label>
          <input
            type="checkbox"
            checked={props.highContrast}
            onChange={(e) => props.setHighContrast(e.target.checked)}
          />
          High contrast
        </label>
      </div>
    </section>
  )
}

export default Controls



