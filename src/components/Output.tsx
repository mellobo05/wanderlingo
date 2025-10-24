export interface OutputProps {
  original: string
  simplified: string
  keyPoints: string[]
  termExplanations: Array<{ term: string; explanation: string }>
  readTimeMin: number
  onSpeak: () => void
  onStopSpeak: () => void
}

export function Output(props: OutputProps) {
  return (
    <section className="output" aria-label="Output">
      <div className="actions">
        <button onClick={props.onSpeak}>Listen</button>
        <button onClick={props.onStopSpeak}>Stop</button>
      </div>
      <div className="two-col">
        <div>
          <h2>Original</h2>
          <article className="panel" aria-label="Original text">
            {props.original || '—'}
          </article>
        </div>
        <div>
          <h2>
            Simplified <span className="readtime">~{props.readTimeMin} min</span>
          </h2>
          <article className="panel simplified" aria-label="Simplified text">
            {props.simplified || '—'}
          </article>
        </div>
      </div>
      <div className="meta">
        <div>
          <h3>Key points</h3>
          <ul>
            {props.keyPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Terms</h3>
          <ul>
            {props.termExplanations.map((t, i) => (
              <li key={i} title={t.explanation} aria-label={t.explanation}>
                <strong>{t.term}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default Output







