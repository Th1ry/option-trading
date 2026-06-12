import { useEffect, useRef } from 'react'

interface Props {
  symbol: string
}

// TradingView 免费 Advanced Chart Widget
export default function TradingViewChart({ symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || !symbol) return

    // Clean up previous widget
    if (widgetRef.current) {
      try { widgetRef.current.remove() } catch {}
      widgetRef.current = null
    }

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (!containerRef.current || !(window as any).TradingView) return

      widgetRef.current = new (window as any).TradingView.widget({
        container: containerRef.current,
        width: '100%',
        height: '100%',
        symbol: symbol.includes('/') ? symbol : `NASDAQ:${symbol}`,
        interval: '5',
        timezone: 'America/New_York',
        theme: 'dark',
        style: '1',
        locale: 'zh_CN',
        toolbar_bg: '#0b0e11',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        details: true,
        hotlist: true,
        calendar: true,
        studies: ['STD;MA_Exp', 'STD;Bollinger_Bands'],
        show_volume: true,
        backgroundColor: '#0b0e11',
        gridColor: '#1e2329',
      })
    }
    document.head.appendChild(script)

    return () => {
      if (widgetRef.current) {
        try { widgetRef.current.remove() } catch {}
        widgetRef.current = null
      }
    }
  }, [symbol])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}
