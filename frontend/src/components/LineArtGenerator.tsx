import { useState } from 'react'
import { supabase } from '../lib/supabase'
import ImageUpload from './ImageUpload'

import { Loader2 } from 'lucide-react'

interface ImageState {
  file: File | null
  previewUrl: string
}

interface LineArtGeneratorProps {
  imageState: ImageState
  setImageState: (state: ImageState) => void
  isGenerating: boolean
  setIsGenerating: (value: boolean) => void
  resultUrl: string
  setResultUrl: (url: string) => void
}

export default function LineArtGenerator({ 
  imageState, 
  setImageState,
  isGenerating,
  setIsGenerating,
  resultUrl,
  setResultUrl
}: LineArtGeneratorProps) {
  const [lineArtType, setLineArtType] = useState<'technical' | 'concept'>('technical')
  const [error, setError] = useState<string>('')

  const handleImageSelect = (file: File) => {
    setImageState({
      file,
      previewUrl: URL.createObjectURL(file)
    })
    setResultUrl('')
    setError('')
  }

  const handleImageRemove = () => {
    setImageState({ file: null, previewUrl: '' })
    setResultUrl('')
    setError('')
  }

  const handleGenerate = async () => {
    if (!imageState.file) return

    setIsGenerating(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.readAsDataURL(imageState.file)
      
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string

          const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-image', {
            body: { imageData: base64Data, fileName: imageState.file!.name }
          })

          if (uploadError) throw new Error(uploadError.message)
          if (uploadData.error) throw new Error(uploadData.error.message)

          const imageUrl = uploadData.data.publicUrl

          const { data: lineArtData, error: lineArtError } = await supabase.functions.invoke('generate-line-art', {
            body: { imageUrl, lineArtType }
          })

          console.log('Edge Function 响应:', lineArtData)

          if (lineArtError) throw new Error(lineArtError.message)
          if (lineArtData?.error) throw new Error(lineArtData.error.message || lineArtData.error)

          // 多种格式兼容
          let generatedImageUrl = ''
          
          if (lineArtData?.data?.images?.[0]) {
            // 格式1: { data: { images: [url] } }
            generatedImageUrl = typeof lineArtData.data.images[0] === 'string' 
              ? lineArtData.data.images[0] 
              : lineArtData.data.images[0].url
          } else if (lineArtData?.images?.[0]) {
            // 格式2: { images: [url] }
            generatedImageUrl = typeof lineArtData.images[0] === 'string'
              ? lineArtData.images[0]
              : lineArtData.images[0].url
          } else if (lineArtData?.data?.url) {
            // 格式3: { data: { url: string } }
            generatedImageUrl = lineArtData.data.url
          } else if (lineArtData?.url) {
            // 格式4: { url: string }
            generatedImageUrl = lineArtData.url
          } else if (typeof lineArtData === 'string') {
            // 格式5: 直接返回 URL 字符串
            generatedImageUrl = lineArtData
          }

          if (generatedImageUrl) {
            console.log('设置结果 URL:', generatedImageUrl)
            setResultUrl(generatedImageUrl)
          } else {
            console.error('无法解析图片 URL，完整响应:', JSON.stringify(lineArtData, null, 2))
            throw new Error('生成失败，未返回图片')
          }
        } catch (err: any) {
          setError(err.message || '生成失败，请重试')
        } finally {
          setIsGenerating(false)
        }
      }

      reader.onerror = () => {
        setError('文件读取失败，请重试')
        setIsGenerating(false)
      }
    } catch (err: any) {
      setError(err.message || '生成失败，请重试')
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (resultUrl) {
      const a = document.createElement('a')
      a.href = resultUrl
      a.download = `line-art-${Date.now()}.png`
      a.click()
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto overflow-hidden space-y-8">
      {/* 双栏主布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧上传区 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">上传图片</h2>
          <div className="h-72">
            <ImageUpload 
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              previewUrl={imageState.previewUrl}
            />
          </div>
          
          {/* 线稿类型选择 */}
          {imageState.previewUrl && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">线稿类型</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setLineArtType('technical')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    lineArtType === 'technical' 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  工程线稿
                </button>
                <button
                  onClick={() => setLineArtType('concept')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    lineArtType === 'concept' 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  概念线稿
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右侧结果区 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">线稿预览</h2>
          <div className="h-72">
            {isGenerating ? (
              <div className="h-full bg-gray-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                <p className="text-gray-600 text-sm text-center">AI正在生成您的线稿图，请稍候...</p>
              </div>
            ) : resultUrl ? (
              <div className="result-fade-in h-full relative">
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={resultUrl} 
                    alt="线稿预览" 
                    className="max-w-full max-h-full object-contain rounded-lg border border-gray-300 cursor-pointer"
                    onClick={() => {
                      console.log('线稿预览图片被点击:', resultUrl)
                      // 触发独立预览窗口
                      window.dispatchEvent(new CustomEvent('showImagePreview', { 
                        detail: { imageUrl: resultUrl, title: '线稿预览' } 
                      }))
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <p className="text-gray-500 text-sm">上传图片后点击下方按钮生成线稿图</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 居中生成按钮 */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={!imageState.file || isGenerating}
          className={`w-80 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl ${
            !imageState.file 
              ? 'opacity-50 cursor-not-allowed bg-gray-400' 
              : isGenerating 
                ? 'opacity-75 cursor-wait bg-amber-400'
                : 'hover:shadow-2xl hover:scale-105 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600'
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
              <span className="text-white font-medium text-lg">生成中...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-white font-medium text-lg">生成线稿</span>
            </div>
          )}
        </button>
      </div>

      {error && (
        <div className="fixed bottom-4 left-4 right-4 p-2 bg-semantic-error/10 border border-semantic-error rounded-md text-semantic-error text-xs z-50">
          {error}
        </div>
      )}
    </div>
  )
}
