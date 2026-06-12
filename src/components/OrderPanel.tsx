import { useState } from 'react'
import type { OrderForm } from '../types/options'
import { isAlpacaConfigured } from '../api/config'

interface Props {
  symbol: string
  onPlaceOrder?: (order: OrderForm) => void
}

const TABS = ['限价', '市价', '止损'] as const
const SIZES = [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50]

export default function OrderPanel({ symbol, onPlaceOrder }: Props) {
  const [tab, setTab] = useState<number>(0)
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [price, setPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [orderType] = useState<'market' | 'limit' | 'stop'>(['limit', 'market', 'stop'][tab] as any)
  const [tif, setTif] = useState<'day' | 'gtc' | 'ioc' | 'fok'>('day')

  const configured = isAlpacaConfigured()

  const handleSubmit = () => {
    if (!symbol) return
    const order: OrderForm = {
      side,
      type: orderType,
      quantity: parseFloat(amount) || 0,
      price: parseFloat(price) || 0,
      stopPrice: parseFloat(stopPrice) || 0,
      timeInForce: tif,
    }
    onPlaceOrder?.(order)
  }

  const pnl = parseFloat(amount) && parseFloat(price) ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '—'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">交易</h3>
        {symbol && <span className="text-xs text-text-muted">{symbol}</span>}
      </div>

      {/* Buy/Sell Toggle */}
      <div className="flex mx-3 mt-2 rounded overflow-hidden border border-border">
        <button
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${side === 'buy' ? 'bg-green text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'}`}
          onClick={() => setSide('buy')}
        >买入</button>
        <button
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${side === 'sell' ? 'bg-red text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'}`}
          onClick={() => setSide('sell')}
        >卖出</button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex mx-3 mt-2 border-b border-border">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${tab === i ? 'text-blue border-b-2 border-blue' : 'text-text-muted hover:text-text-secondary'}`}
            onClick={() => setTab(i)}
          >{t}</button>
        ))}
      </div>

      {/* Price Input */}
      {tab !== 1 && (
        <div className="mx-3 mt-2">
          <label className="text-xs text-text-muted mb-1 block">{tab === 2 ? '触发价' : '价格'}</label>
          <div className="flex items-center bg-surface-2 rounded border border-border px-3 py-2">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={tab === 2 ? stopPrice : price}
              onChange={e => tab === 2 ? setStopPrice(e.target.value) : setPrice(e.target.value)}
              className="bg-transparent text-text-primary text-sm w-full outline-none"
            />
            <span className="text-text-muted text-xs ml-2">USD</span>
          </div>
        </div>
      )}

      {/* Limit price (when stop-limit) */}
      {tab === 2 && (
        <div className="mx-3 mt-2">
          <label className="text-xs text-text-muted mb-1 block">限价</label>
          <div className="flex items-center bg-surface-2 rounded border border-border px-3 py-2">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="bg-transparent text-text-primary text-sm w-full outline-none"
            />
            <span className="text-text-muted text-xs ml-2">USD</span>
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="mx-3 mt-2">
        <label className="text-xs text-text-muted mb-1 block">数量</label>
        <div className="flex items-center bg-surface-2 rounded border border-border px-3 py-2">
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-transparent text-text-primary text-sm w-full outline-none"
          />
        </div>
      </div>

      {/* Quick size buttons */}
      <div className="flex gap-1 mx-3 mt-1.5 flex-wrap">
        {SIZES.slice(0, 4).map(s => (
          <button
            key={s}
            onClick={() => setAmount(String(s))}
            className="px-2 py-0.5 text-xs bg-surface-2 text-text-muted rounded hover:bg-surface-3 transition-colors"
          >{s}</button>
        ))}
        <span className="text-text-muted text-xs self-center ml-auto">×</span>
        {[25, 50, 75, 100].map(p => (
          <button
            key={p}
            onClick={() => setAmount(String(p))}
            className="px-2 py-0.5 text-xs bg-surface-2 text-text-muted rounded hover:bg-surface-3 transition-colors"
          >{p}%</button>
        ))}
      </div>

      {/* TIF */}
      <div className="mx-3 mt-2">
        <label className="text-xs text-text-muted mb-1 block">有效方式</label>
        <div className="flex gap-1">
          {(['day', 'gtc', 'ioc', 'fok'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTif(t)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${tif === t ? 'border-blue text-blue bg-blue-bg' : 'border-border text-text-muted hover:border-text-muted'}`}
            >{t.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {(parseFloat(amount) > 0 && (parseFloat(price) > 0 || tab === 1)) && (
        <div className="mx-3 mt-3 p-2 bg-surface-2 rounded border border-border">
          <div className="flex justify-between text-xs text-text-muted">
            <span>预估总额</span>
            <span className="text-text-primary font-mono">
              {tab === 1 ? `≈ $${pnl}` : `$${pnl}`}
            </span>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="mx-3 mt-auto mb-3">
        {!configured ? (
          <div className="p-2 bg-yellow/10 border border-yellow/30 rounded text-xs text-yellow text-center mb-2">
            ⚡ 在根目录创建 .env 文件填入 VITE_ALPACA_API_KEY 和 VITE_ALPACA_SECRET_KEY 即可激活交易
          </div>
        ) : null}
        <button
          onClick={handleSubmit}
          disabled={!symbol || !amount || (tab !== 1 && !price) || (tab === 2 && !stopPrice)}
          className={`w-full py-2.5 rounded font-semibold text-sm transition-all
            ${side === 'buy'
              ? 'bg-green text-white hover:bg-green/90 active:bg-green/80'
              : 'bg-red text-white hover:bg-red/90 active:bg-red/80'}
            disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {side === 'buy' ? '买入' : '卖出'} {symbol || '—'}
        </button>
      </div>
    </div>
  )
}
