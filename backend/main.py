"""
Alpaca Trading — 后端代理服务
=============================
提供免费行情数据(Yahoo Finance)代理 + Alpaca API 占位
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Optional
from contextlib import asynccontextmanager

from fastapi.staticfiles import StaticFiles

import httpx
import yfinance as yf
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alpaca-backend")

# ============================================================
# Alpaca API 配置 — 在 .env 中填入 Key 即可激活
# ============================================================
ALPACA_API_KEY = ""
ALPACA_SECRET_KEY = ""
ALPACA_BASE_URL = "https://paper-api.alpaca.markets"  # 模拟交易

# ============================================================
# 共享 HTTP 客户端
# ============================================================
_client: Optional[httpx.AsyncClient] = None


async def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=15)
    return _client


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _client
    _client = httpx.AsyncClient(timeout=15)
    yield
    if _client:
        await _client.aclose()
        _client = None


app = FastAPI(title="Alpaca Trading Backend", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 搜索股票/ETF
# ============================================================
@app.get("/api/search")
async def search_symbols(q: str = Query(..., min_length=1)):
    """搜索股票/ETF代码 — 使用 Yahoo Finance"""
    try:
        q = q.upper().strip()
        ticker = yf.Ticker(q)
        info = ticker.info or {}
        results = []

        # Primary match
        if info.get("symbol"):
            results.append({
                "symbol": info["symbol"],
                "name": info.get("shortName") or info.get("longName") or "",
                "type": info.get("quoteType", "EQUITY"),
                "exchange": info.get("exchange", ""),
            })

        # Search via yf (if exact match found, include some popular symbols)
        popular = ["SPY", "QQQ", "AAPL", "TSLA", "NVDA", "AMD", "AMZN",
                   "MSFT", "GOOGL", "META", "IWM", "TLT", "GLD", "VTI"]
        for sym in popular:
            if q in sym and sym != info.get("symbol"):
                results.append({
                    "symbol": sym,
                    "name": "",
                    "type": "EQUITY",
                    "exchange": "NASDAQ",
                })

        return results if results else [{"symbol": q, "name": "", "type": "EQUITY", "exchange": ""}]
    except Exception as e:
        logger.warning(f"Search error for {q}: {e}")
        return [{"symbol": q, "name": "", "type": "EQUITY", "exchange": ""}]


# ============================================================
# 获取到期日列表
# ============================================================
@app.get("/api/expirations/{symbol}")
async def get_expirations(symbol: str):
    """获取期权到期日列表"""
    try:
        ticker = yf.Ticker(symbol.upper())
        try:
            exps = ticker.options
        except Exception:
            exps = []
        if not exps:
            raise HTTPException(status_code=404, detail=f"{symbol} 没有期权数据")
        return exps  # Returns list of strings like ["2026-06-19", ...]
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Expiration error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 期权链数据 (Yahoo Finance — 免费)
# ============================================================
@app.get("/api/options/{symbol}")
async def get_options_chain(symbol: str, expiry: Optional[str] = None):
    """获取 T 型期权链"""
    try:
        ticker = yf.Ticker(symbol.upper())

        # Get available expirations
        try:
            expirations = ticker.options
        except Exception:
            expirations = []

        if not expirations:
            raise HTTPException(status_code=404, detail=f"{symbol} 没有期权数据")

        # Select expiry
        if expiry and expiry in expirations:
            target_expiry = expiry
        else:
            target_expiry = expirations[0]  # Nearest

        # Fetch option chain
        opt = ticker.option_chain(target_expiry)
        calls = opt.calls
        puts = opt.puts

        # Get underlying price
        info = ticker.info or {}
        underlying_price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("previousClose") or 0

        # Merge into T-type contracts
        contracts = []
        call_map = {}
        put_map = {}

        for _, row in calls.iterrows():
            strike = float(row.get("strike", 0))
            call_map[strike] = {
                "call_bid": _safe(row, "bid"),
                "call_ask": _safe(row, "ask"),
                "call_last": _safe(row, "lastPrice"),
                "call_volume": _safe_int(row, "volume"),
                "call_oi": _safe_int(row, "openInterest"),
                "call_iv": _safe(row, "impliedVolatility"),
                "call_delta": _safe(row, "delta"),
                "call_gamma": _safe(row, "gamma"),
                "call_theta": _safe(row, "theta"),
                "call_vega": _safe(row, "vega"),
            }

        for _, row in puts.iterrows():
            strike = float(row.get("strike", 0))
            put_map[strike] = {
                "put_bid": _safe(row, "bid"),
                "put_ask": _safe(row, "ask"),
                "put_last": _safe(row, "lastPrice"),
                "put_volume": _safe_int(row, "volume"),
                "put_oi": _safe_int(row, "openInterest"),
                "put_iv": _safe(row, "impliedVolatility"),
                "put_delta": _safe(row, "delta"),
                "put_gamma": _safe(row, "gamma"),
                "put_theta": _safe(row, "theta"),
                "put_vega": _safe(row, "vega"),
            }

        all_strikes = sorted(set(list(call_map.keys()) + list(put_map.keys())))
        for strike in all_strikes:
            contracts.append({
                "strike": strike,
                "expiry": target_expiry,
                "type": "",
                **put_map.get(strike, {}),
                **call_map.get(strike, {}),
            })

        return {
            "symbol": symbol.upper(),
            "underlying_price": underlying_price,
            "expiry": target_expiry,
            "contracts": contracts,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Options chain error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 行情快照 (可选 — TradingView widget 自带绘图)
# ============================================================
@app.get("/api/quote/{symbol}")
async def get_quote(symbol: str):
    """简单行情快照"""
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info or {}
        return {
            "symbol": symbol.upper(),
            "price": info.get("regularMarketPrice") or info.get("currentPrice") or info.get("previousClose"),
            "change": info.get("regularMarketChange"),
            "changePercent": info.get("regularMarketChangePercent"),
            "volume": info.get("regularMarketVolume"),
            "high": info.get("regularMarketDayHigh"),
            "low": info.get("regularMarketDayLow"),
            "open": info.get("regularMarketOpen"),
            "prevClose": info.get("previousClose"),
        }
    except Exception as e:
        logger.warning(f"Quote error for {symbol}: {e}")
        return {"symbol": symbol.upper(), "error": str(e)}


# ============================================================
# 健康检查
# ============================================================
@app.get("/api/health")
async def health():
    return {"status": "ok", "time": datetime.now().isoformat()}


# ============================================================
# Helpers
# ============================================================
def _safe(row, col):
    """Safely extract float from pandas Series"""
    try:
        val = row.get(col)
        if val is not None and val == val:  # NaN check
            return float(val)
    except (TypeError, ValueError, KeyError):
        pass
    return None


def _safe_int(row, col):
    """Safely extract int from pandas Series"""
    try:
        val = row.get(col)
        if val is not None and val == val:  # NaN check
            return int(val)
    except (TypeError, ValueError, KeyError):
        pass
    return None


# ============================================================
# SPA fallback: 在 /api 路由之后挂载前端静态文件
# ============================================================
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
if os.path.isdir(FRONTEND_DIR):
    logger.info(f"Serving frontend from {FRONTEND_DIR}")
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    logger.warning(f"Frontend build not found at {FRONTEND_DIR}. Run 'npx vite build' first.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
