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

      {/* 放大预览模态框 */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <img 
            src={imageUrl} 
            alt="放大预览" 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 text-white text-3xl hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all"
            onClick={() => setIsZoomed(false)}
            title="关闭预览"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}