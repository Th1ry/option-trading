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
  const [showGreeks, setShowGreeks] = useState(false)
  const [hoveredStrike, setHoveredStrike] = useState<number | null>(null)
  const tbodyRef = useRef<HTMLTableSectionElement>(null)
  const prevDataRef = useRef<OptionsChainData | null>(null)
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
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/options/${encodeURIComponent(sym)}?expiry=${encodeURIComponent(exp)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: OptionsChainData = await res.json()
      json.contracts.sort((a, b) => a.strike - b.strike)
      setData(json)
      autoCenteredRef.current = false
      setLoading(false)
    } catch (e) {
      setError(`加载失败: ${e instanceof Error ? e.message : String(e)}`)
      setData(null)
      setLoading(false)
    }
  }, [])

  // Silent refresh
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

  // Auto-refresh every 15s
  useEffect(() => {
    if (!symbol || !expiry) return
    const interval = setInterval(() => refreshPrices(symbol, expiry), 15000)
    return () => clearInterval(interval)
  }, [symbol, expiry, refreshPrices])

  // Auto-center on ATM strike when data first loads
  useEffect(() => {
    if (!data || autoCenteredRef.current || !tbodyRef.current) return
    const price = data.underlying_price
    if (!price) return

    // Find ATM strike
    const closest = data.contracts.reduce((best, c) =>
      Math.abs(c.strike - price) < Math.abs(best.strike - price) ? c : best
    , data.contracts[0])

    const rows = tbodyRef.current.querySelectorAll('tr')
    for (let i = 0; i < rows.length; i++) {
      const strikeCell = rows[i].querySelector('td:nth-child(6)')  // Strike column
      if (strikeCell && Math.abs(parseFloat(strikeCell.textContent || '0') - closest.strike) < 0.1) {
        rows[i].scrollIntoView({ block: 'center', behavior: 'smooth' })
        autoCenteredRef.current = true
        break
      }
    }
  }, [data])

  const sortedContracts = data?.contracts ? [...data.contracts] : []

  const fp = (v: number | undefined | null) => v != null ? v.toFixed(2) : '-'
  const fv = (v: number | undefined | null) => v != null ? v.toLocaleString() : '-'
  const fi = (v: number | undefined | null) => v != null ? (v * 100).toFixed(1) + '%' : '-'
  const fg = (v: number | undefined | null) => v != null ? v.toFixed(3) : '-'

  const price = data?.underlying_price ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-rh-border shrink-0">
        <span className="text-sm font-bold text-rh-text">{symbol} 期权</span>
        {price > 0 && (
          <span className="text-sm text-rh-text-secondary">
            ${price.toFixed(2)}
          </span>
        )}
        {loading && (
          <svg className="animate-spin h-3 w-3 text-rh-text-muted" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        <div className="ml-auto flex items-center gap-3">
          <select
            value={expiry}
            onChange={e => setExpiry(e.target.value)}
            className="text-xs text-rh-text-secondary bg-rh-bg-alt border border-rh-border rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:border-rh-text-muted appearance-none"
          >
            {expiries.map(e => {
              const d = new Date(e)
              const today = new Date()
              const days = Math.round((d.getTime() - today.getTime()) / 86400000)
              const label = days <= 1 ? '本周' : days <= 7 ? '本周' :
                d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
              return <option key={e} value={e}>{label} ({e})</option>
            })}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-rh-text-muted cursor-pointer select-none">
            <input type="checkbox" checked={showGreeks} onChange={e => setShowGreeks(e.target.checked)}
              className="w-3.5 h-3.5 accent-rh-green rounded cursor-pointer" />
            Greeks
          </label>
        </div>
      </div>

      {error && !data && <div className="px-5 py-8 text-rh-red text-xs text-center">{error}</div>}

      {data && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-rh-bg">
              <tr className="border-b border-rh-border/60">
                <th className="px-3 py-2 text-[11px] font-semibold text-rh-red/70 text-left">看跌</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-rh-green/70 text-right" colSpan={4}>看涨</th>
              </tr>
              <tr className="border-b border-rh-border/30">
                <th className="px-2 py-1.5 text-[10px] font-medium text-rh-text-muted text-right">最新</th>
                <th className="px-2 py-1.5 text-[10px] font-medium text-rh-text-muted text-center w-16">行权价</th>
                <th className="px-2 py-1.5 text-[10px] font-medium text-rh-text-muted text-left">最新</th>
                <th className="px-2 py-1.5 text-[10px] font-medium text-rh-text-muted text-left">涨跌幅</th>
                <th className="px-2 py-1.5 text-[10px] font-medium text-rh-text-muted text-left">IV</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {sortedContracts.map((c, i) => {
                const isATM = price > 0 && Math.abs(c.strike - price) < 0.5
                const isITM = price > 0 ? (c.strike < price ? 'call' : c.strike > price ? 'put' : '') : ''
                return (
                  <tr key={`${c.strike}`}
                    className={`border-b border-rh-border/15 cursor-pointer transition-all duration-75
                      ${hoveredStrike === c.strike ? 'bg-rh-blue-bg' : isATM ? 'bg-rh-green-bg/30' : i % 2 === 0 ? 'bg-white' : 'bg-rh-bg-alt/30'}
                      hover:bg-rh-blue-bg/40`}
                    onMouseEnter={() => setHoveredStrike(c.strike)}
                    onMouseLeave={() => setHoveredStrike(null)}
                    onClick={() => onSelectContract?.(c, 'call', c.strike, expiry)}
                  >
                    {/* Put last price */}
                    <td className={`px-2 py-1.5 font-mono text-right text-[11px] ${c.put_last ? 'text-rh-red' : 'text-rh-text-muted'}`}>
                      {fp(c.put_last)}
                    </td>
                    {/* Strike price — centered, bold */}
                    <td className={`px-2 py-1.5 font-mono text-center text-[12px] font-bold
                      ${isATM ? 'text-rh-green bg-rh-green-bg/50 rounded-lg' : isITM === 'call' ? 'text-rh-green' : isITM === 'put' ? 'text-rh-red' : 'text-rh-text'}`}>
                      {c.strike.toFixed(1)}
                    </td>
                    {/* Call last price */}
                    <td className={`px-2 py-1.5 font-mono text-left text-[11px] ${c.call_last ? 'text-rh-green' : 'text-rh-text-muted'}`}>
                      {fp(c.call_last)}
                    </td>
                    {/* Change */}
                    <td className="px-2 py-1.5 text-left text-[11px] font-medium">—</td>
                    {/* IV */}
                    <td className={`px-2 py-1.5 font-mono text-left text-[11px] ${c.call_iv ? 'text-rh-text-secondary' : 'text-rh-text-muted'}`}>
                      {fi(c.call_iv)}
                    </td>
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
