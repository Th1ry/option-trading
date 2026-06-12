import { useState, useCallback } from 'react'
import SymbolSearch from './components/SymbolSearch'
import TradingViewChart from './components/TradingViewChart'
import OptionsChain from './components/OptionsChain'
import OrderPanel from './components/OrderPanel'
import type { OrderForm, OptionContract } from './types/options'

export default function App() {
  const [symbol, setSymbol] = useState('SPY')
  const [selectedContract, setSelectedContract] = useState<{strike: number; expiry: string; type: 'call' | 'put'} | null>(null)

  const handleSymbolSelect = useCallback((s: string) => setSymbol(s), [])
  const handlePlaceOrder = useCallback((order: OrderForm) => console.log('Place order:', order), [])
  const handleSelectContract = useCallback((c: OptionContract, type: 'call' | 'put', strike: number, expiry: string) => {
    setSelectedContract({ strike, expiry, type })
  }, [])

  return (
    <div className="h-screen flex flex-col bg-rh-bg-alt text-rh-text">
      {/* ============ TOP BAR ============ */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-rh-border bg-rh-bg shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <svg className="w-6 h-6 text-rh-green" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="none"/>
            </svg>
            <span className="text-lg font-bold tracking-tight text-rh-text">Alpaca</span>
          </div>
          <SymbolSearch onSelect={handleSymbolSelect} currentSymbol={symbol} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-rh-text-secondary">模拟交易</span>
          <span className="w-2 h-2 rounded-full bg-rh-green" />
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* LEFT - Watchlist sidebar */}
        <aside className="w-60 border-r border-rh-border bg-rh-bg hidden lg:flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-rh-border">
            <h2 className="text-xs font-semibold text-rh-text-secondary uppercase tracking-wider">关注列表</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {[
              { s: 'SPY', p: '742.60', ch: '+0.82%' },
              { s: 'QQQ', p: '723.62', ch: '+1.14%' },
              { s: 'AAPL', p: '198.50', ch: '-0.31%' },
              { s: 'TSLA', p: '342.15', ch: '+2.45%' },
              { s: 'NVDA', p: '895.30', ch: '+3.12%' },
              { s: 'AMD', p: '156.80', ch: '-0.55%' },
              { s: 'IWM', p: '218.40', ch: '+0.44%' },
            ].map(({ s, p, ch }) => {
              const up = ch.startsWith('+')
              return (
                <button key={s}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all
                    ${s === symbol ? 'bg-rh-green-bg text-rh-green font-semibold' : 'hover:bg-rh-bg-alt text-rh-text'}`}
                  onClick={() => handleSymbolSelect(s)}
                >
                  <span className="font-semibold">{s}</span>
                  <div className="text-right">
                    <div className="font-mono text-sm">${p}</div>
                    <div className={`text-xs font-medium ${up ? 'text-rh-green' : 'text-rh-red'}`}>{ch}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* CENTER - Chart + Options */}
        <main className="flex-1 flex flex-col min-w-0 gap-0 p-3">
          {/* Chart card */}
          <div className="flex-1 min-h-[300px] bg-rh-bg rounded-2xl card overflow-hidden">
            <div className="h-full">
              <TradingViewChart symbol={symbol} />
            </div>
          </div>

          {/* Spacing */}
          <div className="h-3 shrink-0" />

          {/* Options chain card */}
          <div className="h-[40%] min-h-[220px] bg-rh-bg rounded-2xl card overflow-hidden">
            <OptionsChain symbol={symbol} onSelectContract={handleSelectContract} />
          </div>
        </main>

        {/* RIGHT - Trading panel */}
        <aside className="w-[340px] bg-rh-bg border-l border-rh-border shrink-0 flex flex-col">
          <div className="px-5 py-4 border-b border-rh-border flex items-center gap-2 shrink-0">
            <svg className="w-4 h-4 text-rh-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-sm font-semibold">交易</span>
            {selectedContract && (
              <span className="text-xs text-rh-text-secondary ml-auto">
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
