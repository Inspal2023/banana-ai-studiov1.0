import { useState } from 'react'
import { supabase } from '../lib/supabase'
import ImageUpload from './ImageUpload'

import { Loader2 } from 'lucide-react'

interface ImageState {
  file: File | null
  previewUrl: string
}

interface MultiViewGeneratorProps {
  imageState: ImageState
  setImageState: (state: ImageState) => void
  isGenerating: boolean
  setIsGenerating: (value: boolean) => void
  resultUrl: string
  setResultUrl: (url: string) => void
}

export default function MultiViewGenerator({ 
  imageState, 
  setImageState,
  isGenerating,
  setIsGenerating,
  resultUrl,
  setResultUrl
}: MultiViewGeneratorProps) {
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

          const { data: multiViewData, error: multiViewError } = await supabase.functions.invoke('generate-multi-view', {
            body: { imageUrl }
          })

          console.log('Edge Function 响应:', multiViewData)

          if (multiViewError) throw new Error(multiViewError.message)
          if (multiViewData?.error) throw new Error(multiViewData.error.message || multiViewData.error)

          // 多种格式兼容
          let generatedImageUrl = ''
          
          if (multiViewData?.data?.images?.[0]) {
            generatedImageUrl = typeof multiViewData.data.images[0] === 'string' 
              ? multiViewData.data.images[0] 
              : multiViewData.data.images[0].url
          } else if (multiViewData?.images?.[0]) {
            generatedImageUrl = typeof multiViewData.images[0] === 'string'
              ? multiViewData.images[0]
              : multiViewData.images[0].url
          } else if (multiViewData?.data?.url) {
            generatedImageUrl = multiViewData.data.url
          } else if (multiViewData?.url) {
            generatedImageUrl = multiViewData.url
          } else if (typeof multiViewData === 'string') {
            generatedImageUrl = multiViewData
          }

          if (generatedImageUrl) {
            console.log('设置结果 URL:', generatedImageUrl)
            setResultUrl(generatedImageUrl)
          } else {
            console.error('无法解析图片 URL，完整响应:', JSON.stringify(multiViewData, null, 2))
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
      a.download = `multi-view-${Date.now()}.png`
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
        </div>

        {/* 右侧结果区 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">多视角预览</h2>
          <div className="h-72">
            {isGenerating ? (
              <div className="h-full bg-gray-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-600 text-sm text-center">AI正在生成您的多视角图，请稍候...</p>
              </div>
            ) : resultUrl ? (
              <div className="result-fade-in h-full relative">
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={resultUrl} 
                    alt="多视角预览" 
                    className="max-w-full max-h-full object-contain rounded-lg border border-gray-300 cursor-pointer"
                    onClick={() => {
                      console.log('多视角预览图片被点击:', resultUrl)
                      window.dispatchEvent(new CustomEvent('showImagePreview', { 
                        detail: { imageUrl: resultUrl, title: '多视角预览' } 
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
                  <p className="text-gray-500 text-sm">上传图片后点击下方按钮生成多视角图</p>
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
                ? 'opacity-75 cursor-wait bg-purple-400'
                : 'hover:shadow-2xl hover:scale-105 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-600'
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
              <span className="text-white font-medium text-lg">多视角生成</span>
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
