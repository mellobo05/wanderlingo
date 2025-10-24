import { useId } from 'react'

export interface EditorProps {
  url: string
  setUrl: (v: string) => void
  source: string
  setSource: (v: string) => void
  onFetchUrl: () => void
}

export function Editor(props: EditorProps) {
  const urlId = useId()
  const textId = useId()
  return (
    <section className="editor" aria-label="Input">
      <div className="row">
        <label htmlFor={urlId}>Website URL</label>
        <input
          id={urlId}
          type="url"
          placeholder="https://example.gov/notice"
          value={props.url}
          onChange={(e) => props.setUrl(e.target.value)}
        />
        <button onClick={props.onFetchUrl} aria-label="Fetch URL">
          Load
        </button>
      </div>

      <label htmlFor={textId} className="block-label">
        Paste text
      </label>
      <textarea
        id={textId}
        rows={10}
        value={props.source}
        onChange={(e) => props.setSource(e.target.value)}
        placeholder="Paste legal/government text here"
      />
    </section>
  )
}

export default Editor



