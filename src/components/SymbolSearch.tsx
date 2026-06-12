import { useState, useEffect, useRef } from 'react'

interface Props {
  onSelect: (symbol: string) => void
  currentSymbol: string
}

export default function SymbolSearch({ onSelect, currentSymbol }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{symbol: string; name: string}[]>([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const doSearch = async (q: string) => {
    setQuery(q)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setOpen(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      if (res.ok) setResults((await res.json()).slice(0, 8))
    } catch { /* silent */ }
  }

  return (
    <div className="relative">
      <div className="flex items-center bg-rh-bg-alt rounded-xl border border-rh-border px-3.5 py-2 w-52 focus-within:border-rh-green transition-all">
        <svg className="w-3.5 h-3.5 text-rh-text-muted mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input ref={inputRef} type="text" value={query}
          onChange={e => doSearch(e.target.value)}
          onFocus={() => { if (query.trim()) setOpen(true) }}
          placeholder="搜索股票或期权"
          className="bg-transparent text-sm text-rh-text outline-none w-full placeholder:text-rh-text-muted" />
      </div>
      {open && results.length > 0 && (
        <div ref={panelRef} className="absolute top-full left-0 mt-1.5 w-64 bg-rh-bg rounded-2xl shadow-lg border border-rh-border z-50 overflow-hidden backdrop-blur-sm">
          {results.map(r => (
            <button key={r.symbol}
              className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-rh-border/50 last:border-b-0
                ${r.symbol === currentSymbol ? 'text-rh-green bg-rh-green-bg font-semibold' : 'text-rh-text hover:bg-rh-bg-alt'}`}
              onClick={() => { onSelect(r.symbol); setQuery(''); setOpen(false) }}
            >
              <span className="font-semibold">{r.symbol}</span>
              {r.name && <span className="text-xs text-rh-text-muted ml-2">{r.name}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
