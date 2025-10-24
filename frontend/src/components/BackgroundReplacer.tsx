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
    <div className="flex gap-4">
      {/* 左侧操作区 */}
      <div className="card-elevated w-[400px] flex-shrink-0 p-4">
          <h2 className="section-title-decorated text-lg mb-3">上传图片</h2>

          {/* 模式选择 */}
          <div className="mb-3">
            <label className="section-title-decorated text-sm mb-2">选择模式</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('text')}
                className={`option-button text-xs ${mode === 'text' ? 'option-selected' : 'option-unselected'}`}
              >
                <span className="flex items-center justify-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  文字描述
                </span>
              </button>
              <button
                onClick={() => setMode('image')}
                className={`option-button text-xs ${mode === 'image' ? 'option-selected' : 'option-unselected'}`}
              >
                <span className="flex items-center justify-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  上传图片
                </span>
              </button>
              <button
                onClick={() => setMode('hybrid')}
                className={`option-button text-xs ${mode === 'hybrid' ? 'option-selected' : 'option-unselected'}`}
              >
                <span className="flex items-center justify-center gap-1">
                  <Layers className="w-3 h-3" />
                  混合模式
                </span>
              </button>
            </div>
          </div>

          {/* 主体图片 */}
          <div className="mb-3">
            <label className="section-title-decorated text-sm mb-2">主体图片</label>
            <ImageUpload 
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              previewUrl={subjectImage.previewUrl}
              label="上传主体图片" 
            />
          </div>

          {subjectImage.previewUrl && (
            <div className="space-y-3">
              {/* 背景图片（图片模式/混合模式） */}
              {(mode === 'image' || mode === 'hybrid') && (
                <div>
                  <label className="section-title-decorated text-sm mb-2">背景图片</label>
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
                <div>
                  <label className="section-title-decorated text-sm mb-2">
                    {mode === 'hybrid' ? '修改描述' : '背景描述'}
                  </label>
                  <div className="relative">
                    <textarea
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      placeholder="例如：现代简约客厅，温暖的自然光线，木地板背景"
                      className="input-elevated w-full h-20 px-3 py-2 pb-10 text-neutral-900 placeholder-neutral-600 resize-none text-sm"
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
                disabled={isGenerating}
                className="btn-primary flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="button-text-enhanced text-sm">生成中...</span>
                  </>
                ) : (
                  <span className="button-text-enhanced text-sm">开始生成</span>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-semantic-error/10 border-2 border-semantic-error rounded-md text-semantic-error text-xs">
              {error}
            </div>
          )}
        </div>

      {/* 右侧结果区 */}
      <div className="card-result w-[420px] flex-shrink-0 p-4">
          <h2 className="section-title-decorated text-lg mb-3">生成结果</h2>

          {isGenerating ? (
            <div className="h-[300px] bg-neutral-50 rounded-md flex flex-col items-center justify-center">
              <div className="image-skeleton w-full h-full rounded-md"></div>
            </div>
          ) : resultUrl ? (
            <div className="result-fade-in">
              <ImagePreview imageUrl={resultUrl} onDownload={handleDownload} />
            </div>
          ) : (
            <div className="h-[300px] bg-neutral-50 rounded-md flex items-center justify-center">
              <p className="description-text-gradient text-neutral-600 text-sm">更换后的图片将显示在这里</p>
            </div>
          )}
        </div>
    </div>
  )
}
