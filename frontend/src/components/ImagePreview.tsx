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

      {/* 独立弹窗全屏玻璃质感预览窗口 */}
      {isZoomed && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-2xl flex items-center justify-center animate-in fade-in-0 duration-300">
          {/* 独立弹窗容器 */}
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-4 bg-white/80 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden flex flex-col">
            
            {/* 顶部关闭按钮 */}
            <div className="absolute top-6 right-6 z-20">
              <button
                className="w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full transition-all duration-200 group backdrop-blur-sm border border-white/20"
                onClick={() => setIsZoomed(false)}
                title="关闭预览"
              >
                <svg className="w-6 h-6 text-white/90 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            {/* 主图片展示区域 */}
            <div className="flex-1 flex items-center justify-center p-8 md:p-12 lg:p-16">
              <div className="relative max-w-full max-h-full">
                <img 
                  src={imageUrl} 
                  alt="独立预览窗口" 
                  className="max-w-[85vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/30"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
            
            {/* 底部提示栏 */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="px-6 py-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                <p className="text-white text-sm font-medium text-center">
                  独立弹窗预览 • 点击关闭按钮或背景退出
                </p>
              </div>
            </div>
            
            {/* 点击背景关闭 */}
            <div 
              className="absolute inset-0 -z-10 cursor-pointer" 
              onClick={() => setIsZoomed(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}