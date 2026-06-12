import { useEffect, useRef } from 'react'

interface Props {
  symbol: string
}

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

    // Clear container
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true

    script.onload = () => {
      if (!containerRef.current || !(window as any).TradingView) return

      widgetRef.current = new (window as any).TradingView.widget({
        container: containerRef.current,
        width: '100%',
        height: '100%',
        symbol: `NASDAQ:${symbol}`,
        interval: 'D',
        timezone: 'America/New_York',
        theme: 'dark',
        style: '1',
        locale: 'zh_CN',
        toolbar_bg: '#000000',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        show_popup_button: false,
        details: false,
        hotlist: false,
        calendar: false,
        studies: [],
        show_volume: true,
        backgroundColor: '#000000',
        gridColor: '#1c1c1e',
        hide_top_toolbar: false,
        save_image: false,
        withdateranges: true,
        range: '1M',
        disabled_features: [
          'header_symbol_search',
          'header_compare',
          'header_undo_redo',
          'header_screenshot',
          'use_localstorage_for_settings',
        ],
        enabled_features: ['hide_left_toolbar_by_default'],
      })
    }

    document.head.appendChild(script)

    return () => {
      if (widgetRef.current) {
        try { widgetRef.current.remove() } catch {}
        widgetRef.current = null
      }
      // Remove script tag
      try {
        if (script.parentNode) script.parentNode.removeChild(script)
      } catch {}
    }
  }, [symbol])

  return <div ref={containerRef} className="w-full h-full" />
}
