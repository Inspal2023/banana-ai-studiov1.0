import { Download, ZoomIn } from 'lucide-react'
import { useState } from 'react'

interface ImagePreviewProps {
  imageUrl: string
  onDownload?: () => void
  onZoom?: () => void
}

export default function ImagePreview({ imageUrl, onDownload, onZoom }: ImagePreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    // 立即阻止所有事件传播和默认行为
    e.stopPropagation() // 阻止事件冒泡到父元素
    e.preventDefault() // 阻止浏览器默认行为
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation() // 阻止同一元素上的其他监听器
    }
    
    // 异步执行下载，但不阻塞事件处理
    setTimeout(async () => {
      try {
        // 使用fetch获取图片blob
        const response = await fetch(imageUrl, {
          mode: 'cors',
          credentials: 'omit'
        })
        
        if (!response.ok) throw new Error('Download failed')
        
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        
        // 创建临时下载链接
        const a = document.createElement('a')
        a.href = url
        a.download = `banana-ai-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        // 清理临时URL
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Download error:', error)
        // 如果fetch失败，使用传统方式
        const a = document.createElement('a')
        a.href = imageUrl
        a.download = `banana-ai-${Date.now()}.png`
        a.target = '_blank'
        a.click()
      }
    }, 0)
  }

  const handleZoomClick = (e: React.MouseEvent) => {
    // 立即阻止所有事件传播和默认行为
    e.stopPropagation()
    e.preventDefault()
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation() // 阻止同一元素上的其他监听器
    }
    
    if (onZoom) {
      onZoom()
    } else {
      setIsZoomed(true)
    }
  }

  return (
    <>
      <div className="relative group">
        <img 
          src={imageUrl} 
          alt="Generated" 
          className="w-full h-64 object-contain rounded-md border-2 border-neutral-300"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
        
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-y-1 group-hover:translate-y-0">
          <button
            onClick={handleZoomClick}
            className="w-11 h-11 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all hover:scale-110 shadow-xl border border-white/20"
            title="放大预览"
          >
            <ZoomIn className="w-5 h-5 text-white drop-shadow-sm" />
          </button>
          <button
            onClick={handleDownload}
            className="w-11 h-11 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all hover:scale-110 shadow-xl border border-white/20"
            title="下载图片"
          >
            <Download className="w-5 h-5 text-white drop-shadow-sm" />
          </button>
        </div>
      </div>

      {/* 全屏玻璃质感预览窗口 */}
      {isZoomed && (
        <>
          {/* 全屏背景遮罩层 */}
          <div 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-all duration-300"
            onClick={() => setIsZoomed(false)}
          />
          
          {/* 全屏主窗口 */}
          <div 
            className="fixed inset-0 z-50 animate-in fade-in-0 duration-300"
            onClick={() => setIsZoomed(false)}
          >
            {/* 全屏玻璃容器 */}
            <div 
              className="relative w-full h-full bg-white/70 backdrop-blur-2xl border-0 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 顶部工具栏 */}
              <div className="absolute top-8 right-8 z-20 flex gap-4">
                <button
                  className="text-white hover:text-gray-200 text-xl w-14 h-14 flex items-center justify-center bg-white/20 hover:bg-black/40 rounded-2xl transition-all duration-300 backdrop-blur-xl border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl hover:scale-105"
                  onClick={() => setIsZoomed(false)}
                  title="关闭预览 (Esc)"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* 主图片展示区域 */}
              <div className="flex-1 flex items-center justify-center p-8 md:p-16 lg:p-24">
                <div className="relative max-w-full max-h-full">
                  <img 
                    src={imageUrl} 
                    alt="全屏高清预览" 
                    className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/30 hover:shadow-3xl transition-all duration-300 cursor-zoom-out"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              
              {/* 底部信息栏 */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/30 via-black/10 to-transparent">
                <div className="flex items-center justify-center">
                  <div className="text-white/80 text-sm font-medium px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                    点击图片或任意位置关闭 • 玻璃质感全屏预览
                  </div>
                </div>
              </div>
              
              {/* 侧边装饰 */}
              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-white/40 via-white/20 to-white/40" />
              <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-white/40 via-white/20 to-white/40" />
            </div>
          </div>
        </>
      )}
    </>
  )
}