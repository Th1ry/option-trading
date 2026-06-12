import { useState, useEffect, useRef } from 'react'

const POPULAR_SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'AMD', 'NVDA', 'AMZN', 'MSFT', 'GOOGL', 'META']

interface Props {
  onSelect: (symbol: string) => void
  currentSymbol: string
}

export default function SymbolSearch({ onSelect, currentSymbol }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) setOpen(false)
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
      if (res.ok) setResults((await res.json()).map((r: any) => r.symbol).slice(0, 10))
      else setResults(POPULAR_SYMBOLS.filter(s => s.toLowerCase().includes(q.toLowerCase())))
    } catch {
      setResults(POPULAR_SYMBOLS.filter(s => s.toLowerCase().includes(q.toLowerCase())))
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-base font-black text-text-primary tracking-tight">{currentSymbol}</span>
      <div className="relative">
        <div className="flex items-center bg-bg-800 rounded-lg border border-border px-3 py-1.5 w-44 focus-within:border-blue/50 focus-within:shadow-sm focus-within:shadow-blue-glow/20 transition-all">
          <svg className="w-3.5 h-3.5 text-text-muted mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => doSearch(e.target.value)}
            onFocus={() => { if (query.trim()) setOpen(true) }}
            placeholder="搜索标的"
            className="bg-transparent text-text-secondary text-xs outline-none w-full placeholder:text-text-muted"
          />
          {query && (
            <button onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }} className="text-text-muted hover:text-text-secondary ml-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>
        {open && results.length > 0 && (
          <div ref={panelRef} className="absolute top-full left-0 mt-1.5 w-52 bg-bg-800 border border-border rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto backdrop-blur-sm">
            {results.map(s => (
              <button key={s}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl
                  ${s === currentSymbol ? 'text-blue bg-blue-bg/30' : 'text-text-primary hover:bg-bg-700'}`}
                onClick={() => { onSelect(s); setQuery(''); setOpen(false) }}
              >
                <span className="font-semibold">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
