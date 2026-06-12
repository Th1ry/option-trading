import { useState, useEffect, useCallback, useRef } from 'react'
import type { OptionsChainData, OptionContract } from '../types/options'

interface Props {
  symbol: string
  onSelectContract?: (contract: OptionContract, type: 'call' | 'put', strike: number, expiry: string) => void
}

export default function OptionsChain({ symbol, onSelectContract }: Props) {
  const [data, setData] = useState<OptionsChainData | null>(null)
  const [loading, setLoading] = useState(false)
  const [expiries, setExpiries] = useState<string[]>([])
  const [expiry, setExpiry] = useState('')
  const [error, setError] = useState('')
  const [hoveredStrike, setHoveredStrike] = useState<number | null>(null)
  const tbodyRef = useRef<HTMLTableSectionElement>(null)
  const autoCenteredRef = useRef(false)

  const fetchExpirations = useCallback(async (sym: string) => {
    try {
      const res = await fetch(`/api/expirations/${encodeURIComponent(sym)}`)
      if (res.ok) {
        const list = await res.json()
        if (Array.isArray(list) && list.length > 0) {
          setExpiries(list)
          if (!expiry || !list.includes(expiry)) setExpiry(list[0])
        }
      }
    } catch {
      const fallback = ['2026-06-19', '2026-07-17', '2026-09-18', '2026-12-18', '2027-01-15']
      setExpiries(fallback)
      if (!expiry) setExpiry(fallback[0])
    }
  }, [expiry])

  const fetchOptions = useCallback(async (sym: string, exp: string) => {
    if (!sym || !exp) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/options/${encodeURIComponent(sym)}?expiry=${encodeURIComponent(exp)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: OptionsChainData = await res.json()
      json.contracts.sort((a, b) => a.strike - b.strike)
      setData(json)
      autoCenteredRef.current = false
    } catch (e) {
      setError(`加载失败`); setData(null)
    } finally { setLoading(false) }
  }, [])

  const refreshPrices = useCallback(async (sym: string, exp: string) => {
    if (!sym || !exp) return
    try {
      const res = await fetch(`/api/options/${encodeURIComponent(sym)}?expiry=${encodeURIComponent(exp)}`)
      if (!res.ok) return
      const json: OptionsChainData = await res.json()
      json.contracts.sort((a, b) => a.strike - b.strike)
      setData(json)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { if (symbol) fetchExpirations(symbol) }, [symbol])
  useEffect(() => { if (symbol && expiry) fetchOptions(symbol, expiry) }, [symbol, expiry, fetchOptions])
  useEffect(() => {
    if (!symbol || !expiry) return
    const interval = setInterval(() => refreshPrices(symbol, expiry), 15000)
    return () => clearInterval(interval)
  }, [symbol, expiry, refreshPrices])

  // Auto-center on ATM strike
  useEffect(() => {
    if (!data || autoCenteredRef.current || !tbodyRef.current) return
    const price = data.underlying_price
    if (!price) return
    const closest = data.contracts.reduce((best, c) =>
      Math.abs(c.strike - price) < Math.abs(best.strike - price) ? c : best, data.contracts[0])
    const rows = tbodyRef.current.querySelectorAll('tr')
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td')
      if (cells.length >= 3 && Math.abs(parseFloat(cells[2]?.textContent || '0') - closest.strike) < 0.1) {
        rows[i].scrollIntoView({ block: 'center', behavior: 'smooth' })
        autoCenteredRef.current = true
        break
      }
    }
  }, [data])

  const fp = (v: number | undefined | null, def = '-') => v != null ? v.toFixed(2) : def
  const fi = (v: number | undefined | null) => v != null ? (v * 100).toFixed(1) + '%' : '-'

  const price = data?.underlying_price ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-rh-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{symbol}</span>
          {price > 0 && <span className="text-sm text-rh-text-secondary font-mono tabular-nums">${price.toFixed(2)}</span>}
        </div>
        {loading && <span className="text-[11px] text-rh-text-muted animate-pulse">更新中</span>}
        <div className="ml-auto flex items-center gap-2">
          <select value={expiry} onChange={e => setExpiry(e.target.value)}
            className="text-xs text-rh-text-secondary bg-rh-card border border-rh-border rounded-lg px-2.5 py-1.5 outline-none appearance-none cursor-pointer"
          >
            {expiries.map(e => {
              const d = new Date(e)
              const label = d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
              return <option key={e} value={e}>{label}</option>
            })}
          </select>
        </div>
      </div>

      {error && !data && <div className="p-6 text-xs text-rh-text-muted text-center">{error}</div>}

      {data && (
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-rh-bg">
              <tr className="border-b border-rh-border/50">
                <th colSpan={2} className="px-3 py-2 text-[11px] font-semibold text-rh-red/80 text-left tracking-wide">PUT</th>
                <th className="px-1 py-2 text-[11px] text-rh-text-muted font-mono text-center">行权价</th>
                <th colSpan={2} className="px-3 py-2 text-[11px] font-semibold text-rh-green/80 text-right tracking-wide">CALL</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {(data?.contracts || []).map((c, i) => {
                const d = price > 0 ? Math.abs(c.strike - price) : 999
                const isATM = d < 0.5
                const isITM = price > 0 ? (c.strike < price ? 'call' : c.strike > price ? 'put' : '') : ''
                const isHover = hoveredStrike === c.strike
                return (
                  <tr key={c.strike}
                    onClick={() => onSelectContract?.(c, 'call', c.strike, expiry)}
                    onMouseEnter={() => setHoveredStrike(c.strike)}
                    onMouseLeave={() => setHoveredStrike(null)}
                    className={`border-b border-rh-border/15 cursor-pointer transition-colors
                      ${isHover ? 'bg-rh-card-hover' : isATM ? 'bg-rh-card/40' : ''}`}
                  >
                    <td className={`px-3 py-2 text-xs font-mono tabular-nums text-right ${c.put_last ? 'text-rh-red' : 'text-rh-text-muted'}`}>{fp(c.put_last, '-')}</td>
                    <td className={`px-2 py-2 text-[11px] font-mono tabular-nums text-right ${c.put_iv ? 'text-rh-text-muted' : 'text-rh-text-muted'}`}>{fi(c.put_iv)}</td>
                    <td className={`px-1 py-2 text-xs font-bold font-mono text-center
                      ${isATM ? 'text-rh-green' : isITM === 'call' ? 'text-rh-green/70' : isITM === 'put' ? 'text-rh-red/70' : 'text-rh-text-secondary'}`}>
                      {c.strike.toFixed(1)}
                    </td>
                    <td className={`px-2 py-2 text-[11px] font-mono tabular-nums text-left ${c.call_iv ? 'text-rh-text-muted' : 'text-rh-text-muted'}`}>{fi(c.call_iv)}</td>
                    <td className={`px-3 py-2 text-xs font-mono tabular-nums text-left ${c.call_last ? 'text-rh-green' : 'text-rh-text-muted'}`}>{fp(c.call_last, '-')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
