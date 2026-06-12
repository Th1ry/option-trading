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
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market')
  const [price, setPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [tif, setTif] = useState<'day' | 'gtc'>('day')

  const configured = isAlpacaConfigured()

  // Pre-fill from selected contract
  useEffect(() => {
    if (selectedContract?.strike && !price) {
      setPrice(String(selectedContract.strike))
      setOrderType('limit')
    }
  }, [selectedContract])

  const handleSubmit = () => {
    if (!symbol) return
    onPlaceOrder?.({
      side,
      type: orderType,
      quantity: parseFloat(amount) || 0,
      price: parseFloat(price) || 0,
      stopPrice: parseFloat(stopPrice) || 0,
      timeInForce: tif === 'day' ? 'day' : 'gtc',
    })
  }

  const total = parseFloat(amount) && (parseFloat(price) || orderType === 'market')
    ? (parseFloat(amount) * (parseFloat(price) || 0) || parseFloat(amount) * 100).toFixed(2)
    : null

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      {/* Buy/Sell Toggle */}
      <div className="flex bg-rh-bg-alt rounded-2xl p-1 gap-1">
        <button
          className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all
            ${side === 'buy' ? 'bg-rh-green text-white shadow-sm' : 'text-rh-text-secondary hover:text-rh-text'}`}
          onClick={() => setSide('buy')}
        >买入</button>
        <button
          className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all
            ${side === 'sell' ? 'bg-rh-red text-white shadow-sm' : 'text-rh-text-secondary hover:text-rh-text'}`}
          onClick={() => setSide('sell')}
        >卖出</button>
      </div>

      {/* Order Type */}
      <div className="flex gap-1.5">
        {(['market', 'limit', 'stop'] as const).map(t => (
          <button key={t}
            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all
              ${orderType === t
                ? 'border-rh-green text-rh-green bg-rh-green-bg'
                : 'border-rh-border text-rh-text-secondary hover:border-rh-text-muted'}`}
            onClick={() => setOrderType(t)}
          >{t === 'market' ? '市价' : t === 'limit' ? '限价' : '止损'}</button>
        ))}
      </div>

      {/* Price (for limit/stop) */}
      {orderType !== 'market' && (
        <div>
          <label className="text-xs font-medium text-rh-text-secondary mb-1.5 block">{orderType === 'stop' ? '触发价' : '价格'}</label>
          <div className="flex items-center bg-rh-bg-alt rounded-xl border border-rh-border px-4 py-2.5 focus-within:border-rh-green focus-within:ring-1 focus-within:ring-rh-green/20">
            <span className="text-rh-text-muted text-sm mr-1">$</span>
            <input type="number" step="0.01" placeholder="0.00"
              value={orderType === 'stop' ? stopPrice : price}
              onChange={e => orderType === 'stop' ? setStopPrice(e.target.value) : setPrice(e.target.value)}
              className="bg-transparent text-rh-text text-sm w-full outline-none font-mono" />
          </div>
        </div>
      )}

      {/* Stop price extra */}
      {orderType === 'stop' && (
        <div>
          <label className="text-xs font-medium text-rh-text-secondary mb-1.5 block">限价</label>
          <div className="flex items-center bg-rh-bg-alt rounded-xl border border-rh-border px-4 py-2.5 focus-within:border-rh-green focus-within:ring-1 focus-within:ring-rh-green/20">
            <span className="text-rh-text-muted text-sm mr-1">$</span>
            <input type="number" step="0.01" placeholder="0.00" value={price}
              onChange={e => setPrice(e.target.value)}
              className="bg-transparent text-rh-text text-sm w-full outline-none font-mono" />
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="text-xs font-medium text-rh-text-secondary mb-1.5 block">数量</label>
        <div className="flex items-center bg-rh-bg-alt rounded-xl border border-rh-border px-4 py-2.5 focus-within:border-rh-green focus-within:ring-1 focus-within:ring-rh-green/20">
          <input type="number" step="1" placeholder="0" value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-transparent text-rh-text text-sm w-full outline-none font-mono" />
        </div>
        {/* Quick amounts */}
        <div className="flex gap-1.5 mt-1.5">
          {[1, 10, 50, 100].map(n => (
            <button key={n} onClick={() => setAmount(String(n))}
              className="flex-1 py-1.5 text-xs text-rh-text-secondary bg-rh-bg-alt rounded-lg hover:bg-rh-border transition-colors"
            >{n}</button>
          ))}
        </div>
      </div>

      {/* TIF */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-rh-text-secondary">有效期</label>
        <div className="flex gap-1">
          {(['day', 'gtc'] as const).map(t => (
            <button key={t}
              className={`px-3 py-1 text-xs rounded-lg border transition-all
                ${tif === t ? 'border-rh-green text-rh-green bg-rh-green-bg' : 'border-rh-border text-rh-text-secondary'}`}
              onClick={() => setTif(t)}
            >{t === 'day' ? '当日' : '永久'}</button>
          ))}
        </div>
      </div>

      {/* Total */}
      {total && (
        <div className="flex justify-between items-center py-2 border-t border-rh-border">
          <span className="text-xs text-rh-text-secondary">预估金额</span>
          <span className="text-sm font-semibold font-mono">${total}</span>
        </div>
      )}

      {/* Submit button */}
      {!configured && (
        <div className="p-3 rounded-xl bg-rh-bg-alt border border-rh-border text-xs text-rh-text-secondary text-center leading-relaxed">
          创建 <code className="text-rh-text bg-rh-bg-alt px-1 py-0.5 rounded font-mono">.env</code> 文件<br />
          填入 Alpaca API Key 即可激活交易
        </div>
      )}
      <button onClick={handleSubmit}
        disabled={!symbol || !amount || (orderType !== 'market' && !price)}
        className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all
          ${side === 'buy'
            ? 'bg-rh-green text-white hover:bg-rh-green/90 active:scale-[0.98]'
            : 'bg-rh-red text-white hover:bg-rh-red/90 active:scale-[0.98]'}
          disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
      >
        {side === 'buy' ? '买入' : '卖出'} {symbol || '—'}
      </button>
    </div>
  )
}
