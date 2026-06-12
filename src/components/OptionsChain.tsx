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
  const centeredRef = useRef(false)

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
      const fb = ['2026-06-19', '2026-07-17', '2026-09-18', '2026-12-18', '2027-01-15']
      setExpiries(fb)
      if (!expiry) setExpiry(fb[0])
    }
  }, [expiry])

  const fetchOptions = useCallback(async (sym: string, exp: string) => {
    if (!sym || !exp) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/options/${encodeURIComponent(sym)}?expiry=${encodeURIComponent(exp)}`)
      if (!res.ok) throw new Error('')
      const json: OptionsChainData = await res.json()
      json.contracts.sort((a, b) => a.strike - b.strike)
      setData(json)
      centeredRef.current = false
    } catch {
      setError('加载失败')
    } finally { setLoading(false) }
  }, [])

  const refresh = useCallback(async (sym: string, exp: string) => {
    try {
      const res = await fetch(`/api/options/${encodeURIComponent(sym)}?expiry=${encodeURIComponent(exp)}`)
      if (!res.ok) return
      const json: OptionsChainData = await res.json()
      json.contracts.sort((a, b) => a.strike - b.strike)
      setData(json)
    } catch {}
  }, [])

  useEffect(() => { if (symbol) fetchExpirations(symbol) }, [symbol])
  useEffect(() => { if (symbol && expiry) fetchOptions(symbol, expiry) }, [symbol, expiry, fetchOptions])
  useEffect(() => {
    if (!symbol || !expiry) return
    const int = setInterval(() => refresh(symbol, expiry), 15000)
    return () => clearInterval(int)
  }, [symbol, expiry, refresh])

  // Auto-center ATM
  useEffect(() => {
    if (!data || centeredRef.current || !tbodyRef.current) return
    const p = data.underlying_price
    if (!p) return
    const best = data.contracts.reduce((a, b) => Math.abs(a.strike - p) < Math.abs(b.strike - p) ? a : b)
    const rows = tbodyRef.current.querySelectorAll('tr')
    for (let i = 0; i < rows.length; i++) {
      const tds = rows[i].querySelectorAll('td')
      if (tds.length >= 3 && Math.abs(parseFloat(tds[2]?.textContent || '0') - best.strike) < 0.1) {
        rows[i].scrollIntoView({ block: 'center', behavior: 'smooth' })
        centeredRef.current = true
        break
      }
    }
  }, [data])

  const fp = (v: number | undefined | null) => v != null ? v.toFixed(2) : '-'
  const fi = (v: number | undefined | null) => v != null ? (v * 100).toFixed(1) + '%' : '-'
  const price = data?.underlying_price ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center px-4 py-2.5 border-b border-[#1c1c1e] shrink-0">
        <span className="text-sm font-semibold">期权</span>
        <select value={expiry} onChange={e => setExpiry(e.target.value)}
          className="ml-3 text-xs text-[#98989d] bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg px-2.5 py-1 outline-none appearance-none cursor-pointer"
        >
          {expiries.map(e => (
            <option key={e} value={e}>{new Date(e).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</option>
          ))}
        </select>
        {loading && <span className="ml-2 text-xs text-[#636366] animate-pulse">更新</span>}
        <span className="ml-auto text-xs text-[#636366]">15秒自动刷新</span>
      </div>

      {error && !data && <div className="p-6 text-xs text-[#636366] text-center">{error}</div>}

      {data && (
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-black">
              <tr className="border-b border-[#1c1c1e]/50">
                <th className="w-[22%] px-3 py-2 text-[11px] font-semibold text-[#ff453a]/80 text-left">PUT</th>
                <th className="w-[12%] px-1 py-2 text-[11px] text-[#636366] text-center">行权价</th>
                <th className="w-[22%] px-3 py-2 text-[11px] font-semibold text-[#30d158]/80 text-right">CALL</th>
                <th className="w-[22%] px-3 py-1 text-[10px] text-[#636366] font-mono text-right tabular-nums">IV</th>
                <th className="w-[22%] px-3 py-1 text-[10px] text-[#636366] font-mono text-left tabular-nums">成交量</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {(data?.contracts || []).map((c, i) => {
                const d = price > 0 ? Math.abs(c.strike - price) : 999
                const isATM = d < 0.5
                const itm = price > 0 ? (c.strike < price ? 'call' : c.strike > price ? 'put' : '') : ''
                const h = hoveredStrike === c.strike
                return (
                  <tr key={c.strike}
                    onClick={() => onSelectContract?.(c, 'call', c.strike, expiry)}
                    onMouseEnter={() => setHoveredStrike(c.strike)}
                    onMouseLeave={() => setHoveredStrike(null)}
                    className={`border-b border-[#1c1c1e]/10 cursor-pointer transition-colors text-xs
                      ${h ? 'bg-[#252527]' : isATM ? 'bg-[#1c1c1e]/30' : ''}`}
                  >
                    {/* PUT last price */}
                    <td className={`px-3 py-2 font-mono text-right tabular-nums ${c.put_last ? 'text-[#ff453a]' : 'text-[#636366]'}`}>
                      {fp(c.put_last)}
                    </td>
                    {/* Strike - centered */}
                    <td className={`px-1 py-2 font-bold font-mono text-center tabular-nums
                      ${isATM ? 'text-[#30d158]' : itm === 'call' ? 'text-[#30d158]/70' : itm === 'put' ? 'text-[#ff453a]/70' : 'text-[#98989d]'}`}>
                      {c.strike.toFixed(1)}
                    </td>
                    {/* CALL last price */}
                    <td className={`px-3 py-2 font-mono text-left tabular-nums ${c.call_last ? 'text-[#30d158]' : 'text-[#636366]'}`}>
                      {fp(c.call_last)}
                    </td>
                    {/* IV */}
                    <td className="px-3 py-2 font-mono text-right tabular-nums text-[#636366]">{fi(c.call_iv)}</td>
                    {/* Volume */}
                    <td className={`px-3 py-2 font-mono text-left tabular-nums ${c.call_volume ? 'text-[#636366]' : 'text-[#636366]'}`}>
                      {c.call_volume ?? '-'}
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
