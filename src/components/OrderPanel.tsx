import { useState, useEffect } from 'react'
import type { OrderForm } from '../types/options'
import { isAlpacaConfigured } from '../api/config'

interface Props {
  symbol: string
  onPlaceOrder?: (order: OrderForm) => void
  selectedContract?: { strike: number; expiry: string; type: 'call' | 'put' } | null
}

export default function OrderPanel({ symbol, onPlaceOrder, selectedContract }: Props) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [type, setType] = useState<'market' | 'limit'>('market')
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (selectedContract?.strike) { setPrice(String(selectedContract.strike)); setType('limit') }
  }, [selectedContract])

  const submit = () => {
    onPlaceOrder?.({
      side, type,
      quantity: parseInt(amount) || 1,
      price: parseFloat(price) || 0,
      stopPrice: 0, timeInForce: 'day',
    })
  }

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      {/* Buy/Sell */}
      <div className="flex rounded-xl overflow-hidden border border-[#2c2c2e]">
        <button className={`flex-1 py-2.5 text-sm font-semibold transition-colors
          ${side === 'buy' ? 'bg-[#30d158] text-black' : 'bg-[#1c1c1e] text-[#98989d] hover:text-white'}`}
          onClick={() => setSide('buy')}>买入</button>
        <button className={`flex-1 py-2.5 text-sm font-semibold transition-colors
          ${side === 'sell' ? 'bg-[#ff453a] text-black' : 'bg-[#1c1c1e] text-[#98989d] hover:text-white'}`}
          onClick={() => setSide('sell')}>卖出</button>
      </div>

      {/* Type */}
      <div className="flex gap-3 border-b border-[#1c1c1e]">
        {(['market', 'limit'] as const).map(t => (
          <button key={t}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors
              ${type === t ? 'border-[#30d158] text-white' : 'border-transparent text-[#636366] hover:text-[#98989d]'}`}
            onClick={() => setType(t)}>{t === 'market' ? '市价' : '限价'}</button>
        ))}
      </div>

      {/* Price */}
      {type === 'limit' && (
        <div className="bg-[#1c1c1e] rounded-xl px-4 py-2.5 border border-[#2c2c2e]">
          <div className="text-[11px] text-[#636366] mb-1">价格</div>
          <div className="flex items-center">
            <span className="text-[#636366] text-sm mr-1">$</span>
            <input type="number" step="0.01" placeholder="0.00"
              value={price} onChange={e => setPrice(e.target.value)}
              className="bg-transparent text-white text-sm w-full outline-none font-mono tabular-nums" />
          </div>
        </div>
      )}

      {/* Qty */}
      <div className="bg-[#1c1c1e] rounded-xl px-4 py-2.5 border border-[#2c2c2e]">
        <div className="text-[11px] text-[#636366] mb-1">数量</div>
        <input type="number" step="1" placeholder="1"
          value={amount} onChange={e => setAmount(e.target.value)}
          className="bg-transparent text-white text-sm w-full outline-none font-mono tabular-nums" />
      </div>

      {/* Quick qty */}
      <div className="flex gap-1.5">
        {[1, 10, 50, 100].map(n => (
          <button key={n} onClick={() => setAmount(String(n))}
            className="flex-1 py-2 text-xs font-medium text-[#98989d] bg-[#1c1c1e] rounded-lg border border-[#2c2c2e] hover:border-[#636366] transition-colors"
          >{n}</button>
        ))}
      </div>

      {/* Submit */}
      {!isAlpacaConfigured() && (
        <div className="text-xs text-[#636366] text-center py-2 leading-relaxed bg-[#1c1c1e] rounded-xl border border-[#2c2c2e]">
          配置 Alpaca Key 后激活
        </div>
      )}
      <button onClick={submit}
        disabled={!symbol || !amount || (type !== 'market' && !price)}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]
          ${side === 'buy'
            ? 'bg-[#30d158] text-black hover:brightness-110 disabled:opacity-40'
            : 'bg-[#ff453a] text-black hover:brightness-110 disabled:opacity-40'}
          disabled:cursor-not-allowed disabled:active:scale-100`}
      >
        {side === 'buy' ? '买入' : '卖出'} {symbol}
      </button>
    </div>
  )
}
