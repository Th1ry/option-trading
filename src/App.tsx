import { useState, useCallback } from 'react'
import SymbolSearch from './components/SymbolSearch'
import TradingViewChart from './components/TradingViewChart'
import OptionsChain from './components/OptionsChain'
import OrderPanel from './components/OrderPanel'
import type { OrderForm, OptionContract } from './types/options'

const WATCHLIST = [
  { s: 'SPY', p: '742.60', ch: '+0.82%' },
  { s: 'QQQ', p: '723.62', ch: '+1.14%' },
  { s: 'AAPL', p: '198.50', ch: '-0.31%' },
  { s: 'TSLA', p: '342.15', ch: '+2.45%' },
  { s: 'NVDA', p: '895.30', ch: '+3.12%' },
  { s: 'AMD', p: '156.80', ch: '-0.55%' },
  { s: 'IWM', p: '218.40', ch: '+0.44%' },
]

export default function App() {
  const [symbol, setSymbol] = useState('SPY')
  const [selectedContract, setSelectedContract] = useState<{strike: number; expiry: string; type: 'call' | 'put'} | null>(null)

  const handleSymbolSelect = useCallback((s: string) => setSymbol(s), [])
  const handlePlaceOrder = useCallback((order: OrderForm) => console.log('Place order:', order), [])
  const handleSelectContract = useCallback((c: OptionContract, type: 'call' | 'put', strike: number, expiry: string) => {
    setSelectedContract({ strike, expiry, type })
  }, [])

  return (
    <div className="h-screen flex flex-col bg-rh-bg text-rh-text">
      {/* ===== TOP BAR ===== */}
      <header className="h-12 flex items-center justify-between px-5 border-b border-rh-border bg-rh-bg shrink-0">
        <div className="flex items-center gap-5">
          <span className="text-base font-bold tracking-tight">Alpaca<span className="text-rh-green font-black">Trade</span></span>
          <div className="w-px h-4 bg-rh-border" />
          <SymbolSearch onSelect={handleSymbolSelect} currentSymbol={symbol} />
        </div>
        <div className="flex items-center gap-2 text-xs text-rh-text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-rh-green" />
          模拟
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT */}
        <aside className="w-56 border-r border-rh-border bg-rh-bg hidden lg:flex flex-col shrink-0">
          <div className="px-4 py-3 text-[11px] font-semibold text-rh-text-muted uppercase tracking-widest border-b border-rh-border">
            自选
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {WATCHLIST.map(({ s, p, ch }) => {
              const up = ch.startsWith('+')
              return (
                <button key={s}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                    ${s === symbol ? 'bg-rh-card text-rh-text' : 'text-rh-text-secondary hover:bg-rh-card'}`}
                  onClick={() => handleSymbolSelect(s)}
                >
                  <span className="font-semibold">{s}</span>
                  <div className="text-right">
                    <div className="font-mono text-sm tabular-nums">${p}</div>
                    <div className={`text-xs font-medium tabular-nums ${up ? 'text-rh-green' : 'text-rh-red'}`}>{ch}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* CENTER */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Chart */}
          <div className="flex-1 min-h-[280px]">
            <TradingViewChart symbol={symbol} />
          </div>
          {/* Divider */}
          <div className="h-px bg-rh-border shrink-0" />
          {/* Options chain */}
          <div className="h-[38%] min-h-[200px]">
            <OptionsChain symbol={symbol} onSelectContract={handleSelectContract} />
          </div>
        </main>

        {/* RIGHT */}
        <aside className="w-[320px] border-l border-rh-border bg-rh-bg shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-rh-border flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold">下单</span>
            {selectedContract && (
              <span className="text-xs text-rh-text-muted ml-auto font-mono">
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
