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
  const [mode, setMode] = useState<Mode>('text')
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
    
    // 根据模式验证输入
    if (mode === 'text' && !textPrompt.trim()) {
      setError('请输入背景描述')
      return
    }
    if (mode === 'image' && !backgroundImage.file) {
      setError('请上传背景图片')
      return
    }
    if (mode === 'hybrid' && (!textPrompt.trim() || !backgroundImage.file)) {
      setError('请同时输入背景描述和上传背景图片')
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
              mode: mode,
              textPrompt: mode === 'text' || mode === 'hybrid' ? textPrompt : undefined,
              backgroundImageUrl: mode === 'image' || mode === 'hybrid' ? imageUrl : undefined
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
    <div className="w-full max-w-6xl mx-auto overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* 左侧上传区 */}
        <div className="w-full h-80 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">上传图片</h2>
          <div className="h-64">
            <ImageUpload 
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              previewUrl={subjectImage.previewUrl}
            />
          </div>
        </div>

        {/* 中间生成按钮区域 - 更居中显示 */}
        <div className="flex flex-col items-center justify-center gap-4 lg:col-span-1">
          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={!subjectImage.file || isGenerating}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              !subjectImage.file 
                ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                : isGenerating 
                  ? 'opacity-75 cursor-wait bg-green-400'
                  : 'hover:shadow-2xl hover:scale-110 bg-gradient-to-r from-green-500 to-teal-500 animate-star-rotate'
            }`}
          >
            {isGenerating ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            )}
          </button>
          
          {/* 模式选择 */}
          {subjectImage.previewUrl && (
            <div className="w-48 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md border border-gray-200/50">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">融合模式</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setMode('text')}
                className={`py-1 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                  mode === 'text' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                文本模式
              </button>
              <button
                onClick={() => setMode('image')}
                className={`py-1 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                  mode === 'image' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                图片模式
              </button>
              <button
                onClick={() => setMode('hybrid')}
                className={`py-1 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                  mode === 'hybrid' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                混合模式
              </button>
            </div>
          </div>
        )}
        
        {/* 文本描述输入区 */}
        {(mode === 'text' || mode === 'hybrid') && subjectImage.previewUrl && (
          <div className="w-48 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md border border-gray-200/50">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">背景描述</label>
            <div className="relative">
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="例如：现代简约客厅，温暖的自然光线，木地板背景"
                className="w-full h-16 px-2 py-1 text-xs border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={handleOptimizePrompt}
                disabled={optimizing || isGenerating || !textPrompt.trim()}
                className="absolute bottom-1 right-1 px-2 py-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-md hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs"
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
        
        {/* 背景图片上传区 */}
        {(mode === 'image' || mode === 'hybrid') && subjectImage.previewUrl && (
          <div className="w-48 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md border border-gray-200/50">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">背景图片</label>
            {backgroundImage.previewUrl ? (
              <div className="relative">
                <img 
                  src={backgroundImage.previewUrl} 
                  alt="Background" 
                  className="w-full h-16 object-cover rounded-md"
                />
                <button
                  onClick={handleBackgroundRemove}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="h-16 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-green-400 transition-colors">
                <label className="text-xs text-gray-500 text-center cursor-pointer">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                  点击上传
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleBackgroundSelect(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}
      </div>

        {/* 右侧结果区 */}
        <div className="w-full h-80 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6">
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
                  <p className="text-gray-500 text-sm">
                    {mode === 'text' && '输入背景描述后点击按钮生成'}
                    {mode === 'image' && '上传背景图片后点击按钮生成'}
                    {mode === 'hybrid' && '输入描述并上传背景图片后点击按钮生成'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 left-4 right-4 p-2 bg-red-100 border border-red-300 rounded-md text-red-600 text-xs text-center z-50">
          {error}
        </div>
      )}
    </div>
  )
}
