import { useState, useEffect, useRef } from 'react'

interface Props {
  onSelect: (symbol: string) => void
  currentSymbol: string
}

export default function SymbolSearch({ onSelect, currentSymbol }: Props) {
  const [q, setQ] = useState('')
  const [r, setR] = useState<{symbol: string; name: string}[]>([])
  const [open, setOpen] = useState(false)
  const ir = useRef<HTMLInputElement>(null)
  const pr = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pr.current && !pr.current.contains(e.target as Node) && !ir.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const search = async (v: string) => {
    setQ(v)
    if (!v.trim()) { setR([]); setOpen(false); return }
    setOpen(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(v.trim())}`)
      if (res.ok) setR((await res.json()).slice(0, 8))
    } catch {}
  }

  return (
    <div className="relative">
      <div className="flex items-center bg-[#1c1c1e] rounded-xl border border-[#2c2c2e] px-3 py-1.5 w-44 focus-within:border-[#636366] transition-colors">
        <svg className="w-3.5 h-3.5 text-[#636366] mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input ref={ir} type="text" value={q}
          onChange={e => search(e.target.value)}
          onFocus={() => { if (q.trim()) setOpen(true) }}
          placeholder="搜索"
          className="bg-transparent text-sm text-white outline-none w-full placeholder:text-[#636366]" />
      </div>
      {open && r.length > 0 && (
        <div ref={pr} className="absolute top-full left-0 mt-1 w-52 bg-[#1c1c1e] rounded-xl border border-[#2c2c2e] shadow-2xl z-50 overflow-hidden">
          {r.map(item => (
            <button key={item.symbol}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-[#2c2c2e]/50 last:border-b-0
                ${item.symbol === currentSymbol ? 'text-[#30d158] bg-[#30d158]/10' : 'text-white hover:bg-[#252527]'}`}
              onClick={() => { onSelect(item.symbol); setQ(''); setOpen(false) }}
            >
              <span className="font-semibold">{item.symbol}</span>
              {item.name && <span className="text-xs text-[#636366] ml-2">{item.name}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
