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

      {/* 玻璃质感半透明大窗口 - 完美预览 */}
      {isZoomed && (
        <>
          {/* 背景遮罩层 */}
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-300"
            onClick={() => setIsZoomed(false)}
          />
          
          {/* 主模态窗口 */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={() => setIsZoomed(false)}
          >
            {/* 玻璃质感容器 */}
            <div 
              className="relative bg-white/80 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden max-w-[92vw] max-h-[92vh] min-w-[300px] transform transition-all duration-300 hover:shadow-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 顶部关闭按钮区域 */}
              <div className="absolute top-6 right-6 z-20 flex gap-2">
                <button
                  className="text-gray-600 hover:text-white text-2xl w-12 h-12 flex items-center justify-center bg-white/30 hover:bg-black/50 rounded-full transition-all duration-300 backdrop-blur-xl border border-white/30 hover:border-white/60 shadow-lg hover:shadow-xl hover:scale-105"
                  onClick={() => setIsZoomed(false)}
                  title="关闭预览"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* 图片展示区域 */}
              <div className="flex items-center justify-center p-10 min-h-[400px] bg-gradient-to-br from-white/10 to-white/5">
                <img 
                  src={imageUrl} 
                  alt="高清预览" 
                  className="max-w-full max-h-[calc(92vh-6rem)] object-contain rounded-2xl shadow-2xl ring-1 ring-white/20 hover:shadow-3xl transition-all duration-300"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              {/* 底部装饰条 */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </div>
        </>
      )}
    </>
  )
}