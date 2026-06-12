import { useState } from 'react'

const GROUPS = [
  { name: '热门', items: ['SPY', 'QQQ', 'IWM', 'AAPL', 'TSLA', 'NVDA'] },
  { name: '科技', items: ['AMD', 'AMZN', 'MSFT', 'GOOGL', 'META', 'NFLX'] },
  { name: 'ETF', items: ['SPY', 'QQQ', 'IWM', 'VTI', 'TLT', 'GLD', 'TQQQ', 'SQQQ'] },
  { name: '自选', items: ['SPY', 'QQQ'] },
]

interface Props {
  onSelect: (symbol: string) => void
  currentSymbol: string
}

export default function AssetSelector({ onSelect, currentSymbol }: Props) {
  const [activeGroup, setActiveGroup] = useState(0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border shrink-0 overflow-x-auto bg-bg-800/30">
        {GROUPS.map((g, i) => (
          <button key={g.name}
            className={`flex-1 px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap transition-colors uppercase tracking-wider
              ${activeGroup === i ? 'text-blue border-b-2 border-blue bg-blue-bg/20' : 'text-text-muted hover:text-text-secondary hover:bg-bg-700/30'}`}
            onClick={() => setActiveGroup(i)}
          >{g.name}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {GROUPS[activeGroup].items.map(sym => (
          <button key={sym} onClick={() => onSelect(sym)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all border-b border-border/20
              ${sym === currentSymbol ? 'text-blue bg-blue-bg/20 border-l-2 border-l-blue' : 'text-text-primary hover:bg-bg-700/30 hover:border-l-2 hover:border-l-blue/50'}`}
          >
            <div className="flex flex-col items-start">
              <span className="font-bold text-[13px]">{sym}</span>
              <span className="text-[10px] text-text-muted mt-0.5">
                {sym === 'SPY' ? 'S&P 500 ETF' : sym === 'QQQ' ? 'Nasdaq 100 ETF' : sym === 'AAPL' ? 'Apple Inc.' : sym === 'TSLA' ? 'Tesla Inc.' : sym === 'NVDA' ? 'NVIDIA Corp.' : ''}
              </span>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-text-secondary">—</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
