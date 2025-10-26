import { useState } from 'react'
import { supabase } from '../lib/supabase'
import ImageUpload from './ImageUpload'
import ImagePreview from './ImagePreview'
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
    <div className="flex items-center justify-center gap-6 max-w-5xl mx-auto">
      {/* 左侧按钮区 */}
      <div className="flex flex-col gap-4">
        {/* 生成按钮 */}
        <button
          onClick={handleGenerate}
          disabled={!imageState.file || isGenerating}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            !imageState.file 
              ? 'opacity-50 cursor-not-allowed bg-gray-400' 
              : isGenerating 
                ? 'opacity-75 cursor-wait bg-amber-400'
                : 'hover:shadow-xl hover:scale-110 bg-gradient-to-r from-amber-500 to-orange-500 animate-star-rotate'
          }`}
        >
          {isGenerating ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          )}
        </button>
        
        {/* 线稿类型选择 */}
        {imageState.previewUrl && (
          <div className="w-32 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md border border-gray-200/50">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">线稿类型</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setLineArtType('technical')}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  lineArtType === 'technical' 
                    ? 'bg-amber-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                工程线稿
              </button>
              <button
                onClick={() => setLineArtType('concept')}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
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

      {/* 右侧内容区 */}
      <div className="flex gap-6 flex-1">
        {/* 上传区 */}
        <div className="w-80 h-80 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">上传图片</h2>
          <ImageUpload 
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            previewUrl={imageState.previewUrl}
          />
        </div>

        {/* 结果区 */}
        <div className="w-80 h-80 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">生成结果</h2>
          <div className="h-64">
            {isGenerating ? (
              <div className="h-full bg-gray-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                <p className="text-gray-600 text-sm text-center">AI正在生成您的线稿图，请稍候...</p>
              </div>
            ) : resultUrl ? (
              <div className="result-fade-in h-full">
                <ImagePreview imageUrl={resultUrl} onDownload={handleDownload} />
              </div>
            ) : (
              <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <p className="text-gray-500 text-sm">上传图片后点击左侧按钮生成线稿图</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 left-4 right-4 p-2 bg-semantic-error/10 border border-semantic-error rounded-md text-semantic-error text-xs z-50">
          {error}
        </div>
      )}
    </div>
  )
}
