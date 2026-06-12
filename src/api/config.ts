import type { AlpacaConfig } from '../types/options'

// ============================================================
// Alpaca API 配置 — 填入你的 Key 即可激活交易功能
// 免费注册: https://alpaca.markets/
// ============================================================
export const alpacaConfig: AlpacaConfig = {
  apiKey: import.meta.env.VITE_ALPACA_API_KEY || '',
  secretKey: import.meta.env.VITE_ALPACA_SECRET_KEY || '',
  paper: true, // true = 模拟交易, false = 实盘
}

export const isAlpacaConfigured = (): boolean => {
  return alpacaConfig.apiKey.length > 0 && alpacaConfig.secretKey.length > 0
}

// 免费行情数据源（后端代理 Yahoo Finance）
export const API_BASE = '/api'
