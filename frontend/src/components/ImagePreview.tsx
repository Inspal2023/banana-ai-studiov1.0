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

      {/* 正方形液体透明玻璃预览窗口 */}
      {isZoomed && (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900/60 via-purple-900/40 to-indigo-900/60 backdrop-blur-2xl animate-in fade-in-0 duration-300">
          
          {/* 液体玻璃效果装饰层 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-400/30 via-purple-500/20 to-indigo-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/5 via-transparent to-transparent rounded-full blur-2xl"></div>
          </div>

          {/* 正方形玻璃窗口容器 */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-[90vmin] h-[90vmin] max-w-[800px] max-h-[800px] min-w-[400px] min-h-[400px]">
              
              {/* 液体玻璃窗口本体 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/15 to-white/10 backdrop-blur-3xl border border-white/30 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
                
                {/* 内部光晕效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-500/10 via-transparent to-purple-500/10 rounded-3xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 via-transparent to-blue-500/5 rounded-3xl"></div>
                
                {/* 玻璃反射效果 */}
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-tl-3xl"></div>
              </div>

              {/* 主图片展示区域 - 全屏显示 */}
              <div className="absolute inset-4 flex items-center justify-center">
                <img 
                  src={imageUrl} 
                  alt="全屏预览窗口" 
                  className="w-full h-full object-contain rounded-2xl shadow-2xl"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>

              {/* 关闭按钮 */}
              <button
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full transition-all duration-200 group backdrop-blur-xl border border-white/30 shadow-xl"
                onClick={() => setIsZoomed(false)}
                title="关闭预览"
              >
                <svg className="w-6 h-6 text-white/90 group-hover:text-white transition-colors drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>

              {/* 点击背景关闭 */}
              <div 
                className="absolute inset-0 cursor-pointer" 
                onClick={() => setIsZoomed(false)}
              />
            </div>
          </div>

          {/* 底部提示栏 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="px-6 py-3 bg-black/50 backdrop-blur-xl rounded-full border border-white/20 shadow-xl">
              <p className="text-white text-sm font-medium text-center drop-shadow-lg">
                正方形玻璃预览 • 点击背景或关闭按钮退出
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}