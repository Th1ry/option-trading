import { useState, useEffect, useCallback } from 'react'
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
  const [sortKey, setSortKey] = useState<'strike' | 'call_iv' | 'put_iv' | 'call_volume' | 'put_volume'>('strike')
  const [sortAsc, setSortAsc] = useState(true)
  const [showGreeks, setShowGreeks] = useState(false)
  const [hoveredStrike, setHoveredStrike] = useState<number | null>(null)

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
    } catch (e) {
      setError(`加载失败: ${e instanceof Error ? e.message : String(e)}`)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (symbol) fetchExpirations(symbol) }, [symbol])
  useEffect(() => { if (symbol && expiry) fetchOptions(symbol, expiry) }, [symbol, expiry, fetchOptions])
  useEffect(() => {
    if (!symbol || !expiry) return
    const interval = setInterval(() => fetchOptions(symbol, expiry), 15000)
    return () => clearInterval(interval)
  }, [symbol, expiry, fetchOptions])

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sortedContracts = data?.contracts ? [...data.contracts].sort((a, b) => {
    const aVal = a[sortKey] ?? 0; const bVal = b[sortKey] ?? 0
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  }) : []

  const fp = (v: number | undefined | null) => v != null ? v.toFixed(2) : '-'
  const fv = (v: number | undefined | null) => v != null ? v.toLocaleString() : '-'
  const fi = (v: number | undefined | null) => v != null ? (v * 100).toFixed(1) + '%' : '-'
  const fg = (v: number | undefined | null) => v != null ? v.toFixed(3) : '-'

  const price = data?.underlying_price ?? 0

  const SortHeader = ({ label, k }: { label: string; k: typeof sortKey }) => (
    <th className="px-1.5 py-1.5 text-[10px] font-medium text-text-muted cursor-pointer select-none hover:text-text-secondary whitespace-nowrap uppercase tracking-wider" onClick={() => handleSort(k)}>
      {label} {sortKey === k ? <span className="text-blue ml-0.5">{sortAsc ? '▲' : '▼'}</span> : ''}
    </th>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border shrink-0 bg-bg-800/50">
        <span className="text-sm font-bold text-text-primary tracking-wide">{symbol}</span>
        {data?.underlying_price ? (
          <span className="text-xs text-text-muted">
            现价 <span className="text-yellow font-mono font-semibold">${data.underlying_price.toFixed(2)}</span>
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={expiry}
            onChange={e => setExpiry(e.target.value)}
            className="bg-bg-700 text-text-secondary text-[11px] px-2 py-1 rounded-md border border-border outline-none cursor-pointer hover:border-text-muted"
          >
            {expiries.map(e => {
              const d = new Date(e)
              const label = d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })
              return <option key={e} value={e}>{label}</option>
            })}
          </select>
          <label className="flex items-center gap-1.5 text-[11px] text-text-muted cursor-pointer select-none">
            <input type="checkbox" checked={showGreeks} onChange={e => setShowGreeks(e.target.checked)}
              className="w-3 h-3 accent-blue rounded cursor-pointer" />
            Greeks
          </label>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-10 text-text-muted text-xs gap-2">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          加载期权数据...
        </div>
      )}
      {error && <div className="px-4 py-6 text-red text-xs text-center">{error}</div>}

      {/* Table */}
      {data && !loading && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-bg-850">
              <tr className="border-b border-border/60">
                <th colSpan={showGreeks ? 6 : 5} className="px-2 py-1.5 text-[11px] font-bold text-red/90 uppercase tracking-wider text-left">看跌</th>
                <th className="px-2 py-1.5 text-[11px] text-text-muted font-mono text-center">行权价</th>
                <th colSpan={showGreeks ? 6 : 5} className="px-2 py-1.5 text-[11px] font-bold text-green/90 uppercase tracking-wider text-right">看涨</th>
              </tr>
              <tr className="border-b border-border/40">
                <SortHeader label="最新" k="put_iv" />
                <SortHeader label="买价" k="put_iv" />
                <SortHeader label="卖价" k="put_iv" />
                <SortHeader label="成交量" k="put_volume" />
                <SortHeader label="IV" k="put_iv" />
                {showGreeks && <><SortHeader label="Δ" k="put_iv" /><SortHeader label="Γ" k="put_iv" /><SortHeader label="Θ" k="put_iv" /></>}
                <th className="w-[68px]"></th>
                {showGreeks && <><SortHeader label="Θ" k="call_iv" /><SortHeader label="Γ" k="call_iv" /><SortHeader label="Δ" k="call_iv" /></>}
                <SortHeader label="IV" k="call_iv" />
                <SortHeader label="成交量" k="call_volume" />
                <SortHeader label="卖价" k="call_iv" />
                <SortHeader label="买价" k="call_iv" />
                <SortHeader label="最新" k="call_iv" />
              </tr>
            </thead>
            <tbody>
              {sortedContracts.map((c, i) => {
                const itm = price > 0 ? (c.strike < price ? 'call' : c.strike > price ? 'put' : '') : ''
                const isHover = hoveredStrike === c.strike
                return (
                  <tr key={`${c.strike}`}
                    className={`border-b border-border/20 cursor-pointer transition-all duration-75
                      ${isHover ? 'bg-blue-bg/20 ring-1 ring-inset ring-blue-glow/30' : i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}
                      hover:bg-bg-700/30`}
                    onMouseEnter={() => setHoveredStrike(c.strike)}
                    onMouseLeave={() => setHoveredStrike(null)}
                    onClick={() => onSelectContract?.(c, 'call', c.strike, expiry)}
                  >
                    {/* PUT */}
                    <td className={`px-1.5 py-1 font-mono text-right text-[11px] ${c.put_last ? 'text-red' : 'text-text-muted'}`}>{fp(c.put_last)}</td>
                    <td className={`px-1.5 py-1 font-mono text-right text-[11px] ${c.put_bid ? 'text-text-primary' : 'text-text-muted'}`}>{fp(c.put_bid)}</td>
                    <td className={`px-1.5 py-1 font-mono text-right text-[11px] ${c.put_ask ? 'text-text-primary' : 'text-text-muted'}`}>{fp(c.put_ask)}</td>
                    <td className="px-1.5 py-1 font-mono text-right text-[11px] text-text-muted">{fv(c.put_volume)}</td>
                    <td className={`px-1.5 py-1 font-mono text-right text-[11px] ${c.put_iv ? 'text-yellow/80' : 'text-text-muted'}`}>{fi(c.put_iv)}</td>
                    {showGreeks && <>
                      <td className="px-1.5 py-1 font-mono text-right text-[11px] text-text-muted">{fg(c.put_delta)}</td>
                      <td className="px-1.5 py-1 font-mono text-right text-[11px] text-text-muted">{fg(c.put_gamma)}</td>
                      <td className="px-1.5 py-1 font-mono text-right text-[11px] text-text-muted">{fg(c.put_theta)}</td>
                    </>}
                    {/* Strike */}
                    <td className={`px-1.5 py-1 font-mono text-center font-bold text-[12px]
                      ${itm === 'call' ? 'text-green' : itm === 'put' ? 'text-red' : 'text-text-secondary'}`}>
                      {c.strike.toFixed(1)}
                      <div className="h-[2px] rounded-full mt-0.5 mx-auto" style={{
                        width: '80%',
                        background: price > 0 ? `linear-gradient(to right,
                          transparent ${Math.max(0, 50 - (price - c.strike) * 1.8)}%,
                          #0ecb81 ${Math.max(0, 50 - (price - c.strike) * 1.8)}%,
                          #f6465d ${Math.min(100, 50 + (c.strike - price) * 1.8)}%,
                          transparent ${Math.min(100, 50 + (c.strike - price) * 1.8)}%)` : 'transparent',
                        opacity: 0.35
                      }} />
                    </td>
                    {/* CALL */}
                    {showGreeks && <>
                      <td className="px-1.5 py-1 font-mono text-left text-[11px] text-text-muted">{fg(c.call_theta)}</td>
                      <td className="px-1.5 py-1 font-mono text-left text-[11px] text-text-muted">{fg(c.call_gamma)}</td>
                      <td className="px-1.5 py-1 font-mono text-left text-[11px] text-text-muted">{fg(c.call_delta)}</td>
                    </>}
                    <td className={`px-1.5 py-1 font-mono text-left text-[11px] ${c.call_iv ? 'text-yellow/80' : 'text-text-muted'}`}>{fi(c.call_iv)}</td>
                    <td className="px-1.5 py-1 font-mono text-left text-[11px] text-text-muted">{fv(c.call_volume)}</td>
                    <td className={`px-1.5 py-1 font-mono text-left text-[11px] ${c.call_ask ? 'text-text-primary' : 'text-text-muted'}`}>{fp(c.call_ask)}</td>
                    <td className={`px-1.5 py-1 font-mono text-left text-[11px] ${c.call_bid ? 'text-text-primary' : 'text-text-muted'}`}>{fp(c.call_bid)}</td>
                    <td className={`px-1.5 py-1 font-mono text-left text-[11px] ${c.call_last ? 'text-green' : 'text-text-muted'}`}>{fp(c.call_last)}</td>
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
