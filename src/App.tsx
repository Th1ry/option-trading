import { useState, useCallback, useEffect } from 'react'
import SymbolSearch from './components/SymbolSearch'
import TradingViewChart from './components/TradingViewChart'
import OptionsChain from './components/OptionsChain'
import OrderPanel from './components/OrderPanel'
import type { OrderForm, OptionContract } from './types/options'

interface Quote {
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
}

export default function App() {
  const [symbol, setSymbol] = useState('SPY')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [selectedContract, setSelectedContract] = useState<{strike: number; expiry: string; type: 'call' | 'put'} | null>(null)

  // Fetch real quote
  useEffect(() => {
    if (!symbol) return
    fetch(`/api/quote/${encodeURIComponent(symbol)}`)
      .then(r => r.json())
      .then(d => {
        if (d.price) setQuote(d)
      })
      .catch(() => {})
    const interval = setInterval(() => {
      fetch(`/api/quote/${encodeURIComponent(symbol)}`)
        .then(r => r.json())
        .then(d => { if (d.price) setQuote(d) })
        .catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [symbol])

  const handleSymbolSelect = useCallback((s: string) => { setSymbol(s); setSelectedContract(null) }, [])
  const handlePlaceOrder = useCallback((order: OrderForm) => console.log('Place order:', order), [])
  const handleSelectContract = useCallback((c: OptionContract, type: 'call' | 'put', strike: number, expiry: string) => {
    setSelectedContract({ strike, expiry, type })
  }, [])

  const changeUp = quote && quote.change >= 0

  return (
    <div className="h-screen flex flex-col bg-[#000] text-white">
      {/* ===== TOP BAR ===== */}
      <header className="h-11 flex items-center justify-between px-4 border-b border-[#1c1c1e] bg-[#000] shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold tracking-tight">Alpaca<span className="text-[#30d158]">Trade</span></span>
          <div className="w-px h-3.5 bg-[#2c2c2e]" />
          <SymbolSearch onSelect={handleSymbolSelect} currentSymbol={symbol} />
        </div>
        <div className="flex items-center gap-2.5">
          {quote && (
            <div className="flex items-center gap-3 text-xs tabular-nums">
              <span className="font-semibold text-sm text-white">${quote.price.toFixed(2)}</span>
              <span className={changeUp ? 'text-[#30d158]' : 'text-[#ff453a]'}>
                {changeUp ? '+' : ''}{quote.change.toFixed(2)} ({changeUp ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </span>
              <span className="text-[#636366]">高 {quote.high.toFixed(2)}</span>
              <span className="text-[#636366]">低 {quote.low.toFixed(2)}</span>
            </div>
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SYMBOL LIST */}
        <aside className="w-52 border-r border-[#1c1c1e] bg-[#000] hidden lg:flex flex-col shrink-0">
          <div className="px-4 py-2.5 text-[11px] font-semibold text-[#636366] uppercase tracking-widest border-b border-[#1c1c1e]">
            自选
          </div>
          <div className="flex-1 overflow-y-auto">
            {['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'AMD', 'IWM'].map(s => (
              <button key={s}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${s === symbol ? 'bg-[#1c1c1e] text-white font-semibold border-l-2 border-l-[#30d158]' : 'text-[#98989d] hover:text-white hover:bg-[#1c1c1e]/50'}`}
                onClick={() => handleSymbolSelect(s)}
              >{s}</button>
            ))}
          </div>
        </aside>

        {/* CENTER */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#000]">
          {/* Chart */}
          <div className="flex-1 min-h-[280px]">
            <TradingViewChart symbol={symbol} />
          </div>
          {/* Divider */}
          <div className="h-[1px] bg-[#1c1c1e] shrink-0" />
          {/* Options chain */}
          <div className="h-[38%] min-h-[200px]">
            <OptionsChain symbol={symbol} onSelectContract={handleSelectContract} />
          </div>
        </main>

        {/* RIGHT ORDER PANEL */}
        <aside className="w-[300px] border-l border-[#1c1c1e] bg-[#000] shrink-0 flex flex-col">
          <div className="px-4 py-2.5 border-b border-[#1c1c1e] flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold">下单</span>
            {selectedContract && (
              <span className="text-xs text-[#636366] font-mono ml-auto">
                {symbol} {selectedContract.type.toUpperCase()} ${selectedContract.strike}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <OrderPanel symbol={symbol} onPlaceOrder={handlePlaceOrder} selectedContract={selectedContract} />
          </div>
        </aside>
      </div>
    </div>
  )
}
