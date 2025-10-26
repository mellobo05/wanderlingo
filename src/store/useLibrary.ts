import { useEffect, useReducer } from 'react'

export interface SavedDocMeta {
  id: string
  title: string
  createdAt: number
  language?: string
}

export interface SavedDoc extends SavedDocMeta {
  source: string
  output: string
  keyPoints: string[]
  termExplanations: Array<{ term: string; explanation: string }>
}

type State = {
  docs: SavedDoc[]
}

type Action =
  | { type: 'add'; doc: SavedDoc }
  | { type: 'remove'; id: string }
  | { type: 'replaceAll'; docs: SavedDoc[] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { docs: [action.doc, ...state.docs] }
    case 'remove':
      return { docs: state.docs.filter((d) => d.id !== action.id) }
    case 'replaceAll':
      return { docs: action.docs }
  }
}

export function useLibrary() {
  // Load from localStorage on initialization
  const [state, dispatch] = useReducer(reducer, { docs: [] })

  // Load saved documents from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wanderlingo-library')
      if (saved) {
        const docs = JSON.parse(saved) as SavedDoc[]
        dispatch({ type: 'replaceAll', docs })
        console.log('Loaded', docs.length, 'documents from localStorage')
      }
    } catch (error) {
      console.error('Failed to load library from localStorage:', error)
    }
  }, [])

  // Save to localStorage whenever docs change
  useEffect(() => {
    try {
      localStorage.setItem('wanderlingo-library', JSON.stringify(state.docs))
      console.log('Saved', state.docs.length, 'documents to localStorage')
    } catch (error) {
      console.error('Failed to save library to localStorage:', error)
    }
  }, [state.docs])

  const add = (doc: SavedDoc) => dispatch({ type: 'add', doc })
  const remove = (id: string) => dispatch({ type: 'remove', id })
  const replaceAll = (docs: SavedDoc[]) => dispatch({ type: 'replaceAll', docs })

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state.docs, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `localingo-library-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File) => {
    const text = await file.text()
    const docs = JSON.parse(text) as SavedDoc[]
    replaceAll(docs)
  }

  return { ...state, add, remove, exportJson, importJson }
}



