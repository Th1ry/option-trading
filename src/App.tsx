import { useState, useCallback } from 'react'
import SymbolSearch from './components/SymbolSearch'
import AssetSelector from './components/AssetSelector'
import TradingViewChart from './components/TradingViewChart'
import OptionsChain from './components/OptionsChain'
import OrderPanel from './components/OrderPanel'
import type { OrderForm, OptionContract } from './types/options'

export default function App() {
  const [symbol, setSymbol] = useState('SPY')
  const [selectedContract, setSelectedContract] = useState<{strike: number; expiry: string; type: 'call' | 'put'} | null>(null)

  const handleSymbolSelect = useCallback((s: string) => setSymbol(s), [])

  const handlePlaceOrder = useCallback((order: OrderForm) => {
    console.log('Place order:', order)
  }, [])

  const handleSelectContract = useCallback((contract: OptionContract, type: 'call' | 'put', strike: number, expiry: string) => {
    setSelectedContract({ strike, expiry, type })
  }, [])

  return (
    <div className="h-screen flex flex-col bg-bg-950 text-text-primary select-none">
      {/* ============ TOP BAR ============ */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-bg-900 shrink-0">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <span className="font-bold text-sm tracking-wider text-text-primary">ALPACA<span className="text-yellow font-black">TRADE</span></span>
          </div>
          <div className="w-px h-5 bg-border" />
          <SymbolSearch onSelect={handleSymbolSelect} currentSymbol={symbol} />
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted bg-bg-800 px-3 py-1.5 rounded-lg border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-green shadow-sm shadow-green-glow" />
          <span className="hidden sm:inline">模拟交易</span>
        </div>
      </header>

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Asset list */}
        <aside className="w-56 border-r border-border bg-surface hidden lg:flex flex-col shrink-0">
          <div className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border">市场</div>
          <AssetSelector onSelect={handleSymbolSelect} currentSymbol={symbol} />
        </aside>

        {/* CENTER — Chart + Options Chain (primary) */}
        <main className="flex-1 flex flex-col min-w-0 bg-bg-900">
          {/* Chart */}
          <div className="flex-1 min-h-[300px] bg-bg-850">
            <TradingViewChart symbol={symbol} />
          </div>
          {/* Split handle */}
          <div className="h-px bg-border relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-8 h-2 rounded-full bg-bg-600" />
          </div>
          {/* Options Chain */}
          <div className="h-[42%] min-h-[200px]">
            <OptionsChain symbol={symbol} onSelectContract={handleSelectContract} />
          </div>
        </main>

        {/* RIGHT — Trading panel only */}
        <aside className="w-[340px] border-l border-border bg-surface shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
            <svg className="w-4 h-4 text-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span className="text-sm font-semibold text-text-primary">交易</span>
            {selectedContract && (
              <span className="text-[11px] text-text-muted ml-auto">
                {symbol} {selectedContract.type === 'call' ? 'Call' : 'Put'} ${selectedContract.strike}
              </span>
            )}
          </div>
          <OrderPanel symbol={symbol} onPlaceOrder={handlePlaceOrder} selectedContract={selectedContract} />
        </aside>
      </div>
    </div>
  )
}
