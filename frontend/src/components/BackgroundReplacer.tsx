import { useState } from 'react'
import { supabase } from '../lib/supabase'
import ImageUpload from './ImageUpload'
import ImagePreview from './ImagePreview'
import { Loader2, Sparkles, MessageSquare, Image as ImageIcon, Layers } from 'lucide-react'

type Mode = 'text' | 'image' | 'hybrid'

interface ImageState {
  file: File | null
  previewUrl: string
}

interface BackgroundReplacerProps {
  subjectImage: ImageState
  setSubjectImage: (state: ImageState) => void
  backgroundImage: ImageState
  setBackgroundImage: (state: ImageState) => void
  isGenerating: boolean
  setIsGenerating: (value: boolean) => void
  resultUrl: string
  setResultUrl: (url: string) => void
}

export default function BackgroundReplacer({ 
  subjectImage, 
  setSubjectImage,
  backgroundImage,
  setBackgroundImage,
  isGenerating,
  setIsGenerating,
  resultUrl,
  setResultUrl
}: BackgroundReplacerProps) {
  const [textPrompt, setTextPrompt] = useState<string>('')
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string>('')

  const handleImageSelect = (file: File) => {
    setSubjectImage({
      file,
      previewUrl: URL.createObjectURL(file)
    })
    setResultUrl('')
    setError('')
  }

  const handleBackgroundSelect = (file: File) => {
    setBackgroundImage({
      file,
      previewUrl: URL.createObjectURL(file)
    })
    setResultUrl('')
    setError('')
  }

  const handleImageRemove = () => {
    setSubjectImage({ file: null, previewUrl: '' })
    setResultUrl('')
    setError('')
  }

  const handleBackgroundRemove = () => {
    setBackgroundImage({ file: null, previewUrl: '' })
    setResultUrl('')
    setError('')
  }

  const handleOptimizePrompt = async () => {
    if (!textPrompt.trim()) return

    setOptimizing(true)
    try {
      const { data, error: optimizeError } = await supabase.functions.invoke('optimize-prompt', {
        body: { userPrompt: textPrompt }
      })

      if (optimizeError) throw new Error(optimizeError.message)
      if (data.error) throw new Error(data.error.message)

      if (data.data) {
        if (data.data.optimizedPromptCn) {
          setTextPrompt(data.data.optimizedPromptCn)
        }
      }
    } catch (err: any) {
      setError(err.message || '优化失败')
    } finally {
      setOptimizing(false)
    }
  }

  const handleGenerate = async () => {
    if (!subjectImage.file) return
    if (!textPrompt.trim()) {
      setError('请输入背景描述')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.readAsDataURL(subjectImage.file)
      
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string

          const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-image', {
            body: { imageData: base64Data, fileName: subjectImage.file!.name }
          })

          if (uploadError) throw new Error(uploadError.message)
          if (uploadData.error) throw new Error(uploadData.error.message)

          const imageUrl = uploadData.data.publicUrl

          const { data: replaceData, error: replaceError } = await supabase.functions.invoke('replace-background', {
            body: {
              imageUrl,
              mode: 'text',
              textPrompt: textPrompt || undefined
            }
          })

          console.log('Edge Function 响应:', replaceData)

          if (replaceError) throw new Error(replaceError.message)
          if (replaceData?.error) throw new Error(replaceData.error.message || replaceData.error)

          // 多种格式兼容
          let generatedImageUrl = ''
          
          if (replaceData?.data?.images?.[0]) {
            generatedImageUrl = typeof replaceData.data.images[0] === 'string' 
              ? replaceData.data.images[0] 
              : replaceData.data.images[0].url
          } else if (replaceData?.images?.[0]) {
            generatedImageUrl = typeof replaceData.images[0] === 'string'
              ? replaceData.images[0]
              : replaceData.images[0].url
          } else if (replaceData?.data?.url) {
            generatedImageUrl = replaceData.data.url
          } else if (replaceData?.url) {
            generatedImageUrl = replaceData.url
          } else if (typeof replaceData === 'string') {
            generatedImageUrl = replaceData
          }

          if (generatedImageUrl) {
            console.log('设置结果 URL:', generatedImageUrl)
            setResultUrl(generatedImageUrl)
          } else {
            console.error('无法解析图片 URL，完整响应:', JSON.stringify(replaceData, null, 2))
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
      a.download = `background-replaced-${Date.now()}.png`
      a.click()
    }
  }

  return (
    <div className="flex items-center justify-center gap-8 max-w-5xl mx-auto">
      {/* 左侧上传区 */}
      <div className="w-80 h-80 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">上传图片</h2>
        <ImageUpload 
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          previewUrl={subjectImage.previewUrl}
        />
        {/* 文本描述 */}
        {subjectImage.previewUrl && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">背景描述</label>
            <div className="relative">
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="例如：现代简约客厅，温暖的自然光线，木地板背景"
                className="w-full h-16 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={handleOptimizePrompt}
                disabled={optimizing || isGenerating || !textPrompt.trim()}
                className="absolute bottom-2 right-2 px-2 py-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-md hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs"
              >
                {optimizing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span className="font-medium">优化</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 中间生成按钮 */}
      <div className="flex flex-col items-center">
        <button
          onClick={handleGenerate}
          disabled={!subjectImage.file || !textPrompt.trim() || isGenerating}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            !subjectImage.file || !textPrompt.trim()
              ? 'opacity-50 cursor-not-allowed bg-gray-400' 
              : isGenerating 
                ? 'opacity-75 cursor-wait bg-green-400'
                : 'hover:shadow-xl hover:scale-110 bg-gradient-to-r from-green-500 to-teal-500'
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
        <p className="text-sm text-gray-600 mt-2 text-center">
          {isGenerating ? '生成中...' : '开始生成'}
        </p>
      </div>

      {/* 右侧结果区 */}
      <div className="w-80 h-80 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">生成结果</h2>
        <div className="h-64">
          {isGenerating ? (
            <div className="h-full bg-gray-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-3" />
              <p className="text-gray-600 text-sm text-center">AI正在融合您的图片场景，请稍候...</p>
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
                <p className="text-gray-500 text-sm">上传图片并输入背景描述</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 left-4 right-4 p-2 bg-red-100 border border-red-300 rounded-md text-red-600 text-xs text-center">
          {error}
        </div>
      )}
    </div>
  )
}
