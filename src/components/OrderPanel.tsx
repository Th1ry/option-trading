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
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (selectedContract?.strike) {
      setPrice(String(selectedContract.strike))
      setOrderType('limit')
    }
  }, [selectedContract])

  const handleSubmit = () => {
    if (!symbol) return
    onPlaceOrder?.({
      side, type: orderType,
      quantity: parseInt(amount) || 0,
      price: parseFloat(price) || 0,
      stopPrice: 0, timeInForce: 'day',
    })
  }

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      {/* Buy/Sell */}
      <div className="flex rounded-xl overflow-hidden border border-rh-border">
        <button className={`flex-1 py-2.5 text-sm font-semibold transition-colors
          ${side === 'buy' ? 'bg-rh-green text-black' : 'bg-rh-card text-rh-text-secondary hover:text-rh-text'}`}
          onClick={() => setSide('buy')}>买入</button>
        <button className={`flex-1 py-2.5 text-sm font-semibold transition-colors
          ${side === 'sell' ? 'bg-rh-red text-black' : 'bg-rh-card text-rh-text-secondary hover:text-rh-text'}`}
          onClick={() => setSide('sell')}>卖出</button>
      </div>

      {/* Order type */}
      <div className="flex border-b border-rh-border gap-4">
        {(['market', 'limit'] as const).map(t => (
          <button key={t}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors
              ${orderType === t ? 'border-rh-green text-rh-text' : 'border-transparent text-rh-text-muted hover:text-rh-text-secondary'}`}
            onClick={() => setOrderType(t)}>
            {t === 'market' ? '市价' : '限价'}
          </button>
        ))}
      </div>

      {/* Price */}
      {orderType === 'limit' && (
        <div className="bg-rh-card rounded-xl px-4 py-2.5 border border-rh-border">
          <div className="text-[11px] text-rh-text-muted mb-1">价格</div>
          <div className="flex items-center">
            <span className="text-rh-text-muted text-sm mr-1">$</span>
            <input type="number" step="0.01" placeholder="0.00"
              value={price} onChange={e => setPrice(e.target.value)}
              className="bg-transparent text-rh-text text-sm w-full outline-none font-mono tabular-nums" />
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="bg-rh-card rounded-xl px-4 py-2.5 border border-rh-border">
        <div className="text-[11px] text-rh-text-muted mb-1">数量</div>
        <input type="number" step="1" placeholder="0"
          value={amount} onChange={e => setAmount(e.target.value)}
          className="bg-transparent text-rh-text text-sm w-full outline-none font-mono tabular-nums" />
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1.5">
        {[1, 10, 50, 100].map(n => (
          <button key={n} onClick={() => setAmount(String(n))}
            className="flex-1 py-2 text-xs font-medium text-rh-text-secondary bg-rh-card rounded-lg border border-rh-border hover:border-rh-text-muted transition-colors"
          >{n}</button>
        ))}
      </div>

      {/* Submit */}
      {!isAlpacaConfigured() && (
        <div className="text-xs text-rh-text-muted text-center py-2 leading-relaxed bg-rh-card rounded-xl border border-rh-border">
          配置 Alpaca Key 后激活交易
        </div>
      )}
      <button onClick={handleSubmit}
        disabled={!symbol || !amount || (orderType !== 'market' && !price)}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]
          ${side === 'buy'
            ? 'bg-rh-green text-black hover:brightness-110 disabled:brightness-50'
            : 'bg-rh-red text-black hover:brightness-110 disabled:brightness-50'}
          disabled:cursor-not-allowed disabled:active:scale-100`}
      >
        {side === 'buy' ? '买入' : '卖出'} {symbol}
      </button>
    </div>
  )
}
