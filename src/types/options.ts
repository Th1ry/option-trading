export interface OptionContract {
  strike: number
  expiry: string
  type: 'call' | 'put'

  // Calls (right side)
  call_bid?: number
  call_ask?: number
  call_last?: number
  call_volume?: number
  call_oi?: number
  call_iv?: number
  call_delta?: number
  call_gamma?: number
  call_theta?: number
  call_vega?: number

  // Puts (left side)
  put_bid?: number
  put_ask?: number
  put_last?: number
  put_volume?: number
  put_oi?: number
  put_iv?: number
  put_delta?: number
  put_gamma?: number
  put_theta?: number
  put_vega?: number
}

export interface OptionsChainData {
  symbol: string
  underlying_price: number
  expiry: string
  contracts: OptionContract[]
}

export interface OrderForm {
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop'
  quantity: number
  price: number
  stopPrice: number
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok'
}

export interface AlpacaConfig {
  apiKey: string
  secretKey: string
  paper: boolean
}
