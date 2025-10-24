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
  const [mode, setMode] = useState<Mode>('text')
  const [textPrompt, setTextPrompt] = useState<string>('')
  const [textPromptEn, setTextPromptEn] = useState<string>('')
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
        if (data.data.optimizedPromptEn) {
          setTextPromptEn(data.data.optimizedPromptEn)
        } else if (data.data.optimizedPrompt) {
          setTextPromptEn(data.data.optimizedPrompt)
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
    if (mode === 'text' && !textPrompt.trim()) {
      setError('请输入背景描述')
      return
    }
    if ((mode === 'image' || mode === 'hybrid') && !backgroundImage.file) {
      setError('请上传背景图片')
      return
    }
    if (mode === 'hybrid' && !textPrompt.trim()) {
      setError('请输入修改描述')
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
          let backgroundUrl = ''

          if (mode === 'image' || mode === 'hybrid') {
            if (!backgroundImage.file) throw new Error('缺少背景图片')
            
            const bgReader = new FileReader()
            bgReader.readAsDataURL(backgroundImage.file)
            
            await new Promise((resolve, reject) => {
              bgReader.onloadend = async () => {
                try {
                  const bgBase64Data = bgReader.result as string
                  const { data: bgUploadData, error: bgUploadError } = await supabase.functions.invoke('upload-image', {
                    body: { imageData: bgBase64Data, fileName: backgroundImage.file!.name }
                  })

                  if (bgUploadError) throw new Error(bgUploadError.message)
                  if (bgUploadData.error) throw new Error(bgUploadData.error.message)

                  backgroundUrl = bgUploadData.data.publicUrl
                  resolve(true)
                } catch (err) {
                  reject(err)
                }
              }
              bgReader.onerror = reject
            })
          }

          const { data: replaceData, error: replaceError } = await supabase.functions.invoke('replace-background', {
            body: {
              imageUrl,
              mode,
              textPrompt: textPromptEn || textPrompt || undefined,
              backgroundUrl: backgroundUrl || undefined
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
    <div className="flex gap-16 max-w-6xl mx-auto">
      {/* 左侧操作区 */}
      <div className="w-[300px] h-[300px] space-y-3">
        {/* 模式选择区域 */}
        <div className="p-3 border border-gray-200 bg-white/80 rounded-lg">
          <label className="section-title-decorated text-xs mb-2 block">选择模式</label>
          <div className="text-xs text-gray-600 mb-2">场景融合：让图片与新场景完美融合</div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setMode('text')}
              className={`option-button text-xs py-2 ${mode === 'text' ? 'option-selected' : 'option-unselected'}`}
              title="通过文字描述来修改主图图片背景/场景"
            >
              <span className="flex items-center justify-center gap-1">
                <MessageSquare className="w-3 h-3" />
                文字描述
              </span>
            </button>
            <button
              onClick={() => setMode('image')}
              className={`option-button text-xs py-2 ${mode === 'image' ? 'option-selected' : 'option-unselected'}`}
              title="通过上传另外的图片来修改主图背景/场景"
            >
              <span className="flex items-center justify-center gap-1">
                <ImageIcon className="w-3 h-3" />
                上传图片
              </span>
            </button>
            <button
              onClick={() => setMode('hybrid')}
              className={`option-button text-xs py-2 ${mode === 'hybrid' ? 'option-selected' : 'option-unselected'}`}
              title="通过文字描述和另外的图片来修改主图背景/场景"
            >
              <span className="flex items-center justify-center gap-1">
                <Layers className="w-3 h-3" />
                混合模式
              </span>
            </button>
          </div>
        </div>

        {/* 主体图片上传 */}
        <div className="p-3 border border-gray-200 bg-white/80 rounded-lg">
          <label className="section-title-decorated text-xs mb-2">主体图片</label>
          <ImageUpload 
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            previewUrl={subjectImage.previewUrl}
            label="上传主体图片" 
          />
        </div>

        {subjectImage.previewUrl && (
          <>
            {/* 背景图片（图片模式/混合模式） */}
            {(mode === 'image' || mode === 'hybrid') && (
              <div className="p-3 border border-gray-200 bg-white/80 rounded-lg">
                <label className="section-title-decorated text-xs mb-2">背景图片</label>
                <ImageUpload 
                  onImageSelect={handleBackgroundSelect}
                  onImageRemove={handleBackgroundRemove}
                  previewUrl={backgroundImage.previewUrl}
                  label="上传背景图片" 
                />
              </div>
            )}

            {/* 文本描述（文字模式/混合模式） */}
            {(mode === 'text' || mode === 'hybrid') && (
              <div className="p-3 border border-gray-200 bg-white/80 rounded-lg">
                <label className="section-title-decorated text-xs mb-2">
                  {mode === 'hybrid' ? '修改描述' : '背景描述'}
                </label>
                <div className="relative">
                  <textarea
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="例如：现代简约客厅，温暖的自然光线，木地板背景"
                    className="input-elevated w-full h-16 px-3 py-2 pb-8 text-neutral-900 placeholder-neutral-600 resize-none text-xs"
                  />
                  <button
                    onClick={handleOptimizePrompt}
                    disabled={optimizing || isGenerating || !textPrompt.trim()}
                    className="absolute bottom-1 right-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs hover:scale-105 shadow-md"
                  >
                    {optimizing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span className="font-medium">{optimizing ? '优化中' : '优化'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={!subjectImage.file || isGenerating}
              className={`w-full btn-primary flex items-center justify-center py-3 text-sm font-medium transition-all duration-300 ${
                !subjectImage.file 
                  ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                  : isGenerating 
                    ? 'opacity-75 cursor-wait'
                    : 'hover:shadow-xl hover:from-green-600 hover:to-teal-600'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="button-text-enhanced">生成中...</span>
                </>
              ) : (
                <span className="button-text-enhanced">开始生成</span>
              )}
            </button>
          </>
        )}
      </div>

      {/* 右侧结果区 */}
      <div className="w-[300px] h-[300px]">
        <div className="p-3 border border-gray-200 bg-white/80 rounded-lg h-full">
          <h2 className="section-title-decorated text-sm mb-3">生成结果</h2>
          {isGenerating ? (
            <div className="h-full bg-neutral-50 rounded-md flex flex-col items-center justify-center">
              <div className="image-skeleton w-full h-[200px] rounded-md"></div>
              <p className="mt-2 text-neutral-600 text-xs">AI正在融合您的图片场景，请稍候...</p>
            </div>
          ) : resultUrl ? (
            <div className="result-fade-in h-full">
              <ImagePreview imageUrl={resultUrl} onDownload={handleDownload} />
            </div>
          ) : (
            <div className="h-full bg-neutral-50 rounded-md flex items-center justify-center">
              <p className="description-text-gradient text-neutral-600 text-xs text-center px-4">上传图片后点击"开始生成"，融合后的图片将显示在这里</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="absolute bottom-4 left-4 right-4 p-2 bg-semantic-error/10 border border-semantic-error rounded-md text-semantic-error text-xs">
          {error}
        </div>
      )}
    </div>
  )
}
