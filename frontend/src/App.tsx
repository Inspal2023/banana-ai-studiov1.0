import { useState, useCallback } from 'react'
import { Pen, Box, Image as ImageIcon } from 'lucide-react'
import LineArtGenerator from './components/LineArtGenerator'
import MultiViewGenerator from './components/MultiViewGenerator'
import BackgroundReplacer from './components/BackgroundReplacer'

type Tab = 'line-art' | 'multi-view' | 'background'

// 图片状态类型
interface ImageState {
  file: File | null
  previewUrl: string
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('line-art')
  
  // 所有功能共享的主图片状态
  const [sharedImage, setSharedImage] = useState<ImageState>({ file: null, previewUrl: '' })
  // 背景替换功能的背景图片（独立状态）
  const [backgroundImage, setBackgroundImage] = useState<ImageState>({ file: null, previewUrl: '' })
  // 全局生图加载状态
  const [isGenerating, setIsGenerating] = useState(false)
  // 每个功能的独立结果URL状态（防止切换tab时丢失）
  const [lineArtResult, setLineArtResult] = useState<string>('')
  const [multiViewResult, setMultiViewResult] = useState<string>('')
  const [backgroundResult, setBackgroundResult] = useState<string>('')

  const tabs = [
    {
      id: 'line-art' as Tab,
      label: '线稿图',
      icon: Pen,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-300'
    },
    {
      id: 'multi-view' as Tab,
      label: '三视图',
      icon: Box,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-300'
    },
    {
      id: 'background' as Tab,
      label: '场景融合',
      icon: ImageIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300'
    },
  ]

  // 为每个tab创建独立的点击处理器
  const handleLineArtClick = () => {
    console.log('按钮被点击:', 'line-art', '标签:', '线稿图')
    setActiveTab('line-art')
  }

  const handleMultiViewClick = () => {
    console.log('按钮被点击:', 'multi-view', '标签:', '三视图')
    setActiveTab('multi-view')
  }

  const handleBackgroundClick = () => {
    console.log('按钮被点击:', 'background', '标签:', '场景融合')
    setActiveTab('background')
  }

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* 主内容区域 */}
      <div className="relative z-10">
        {/* 标题区域 - 暖黄渐变风格 */}
        <header className="text-center py-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/banana-superhero-logo-transparent.png" 
              alt="香蕉小超人" 
              className="w-14 h-14 object-contain mr-3"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
              香蕉AI工作室
            </h1>
          </div>
          <p className="text-lg text-amber-800 max-w-2xl mx-auto px-4 font-medium">
            上传您的图片，体验AI驱动的强大图像处理技术
          </p>
        </header>

        {/* 功能选择区域 - 暖黄渐变风格 */}
        <section className="max-w-3xl mx-auto px-4 mb-8">
          <div className="flex justify-center gap-4">
            {/* 线稿图按钮 */}
            <button
              onClick={handleLineArtClick}
              className={`px-6 py-3 rounded-xl border-2 transition-all duration-300 font-medium ${
                activeTab === 'line-art' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-lg scale-105' 
                  : 'bg-white/90 backdrop-blur-sm text-amber-700 border-amber-300 hover:border-amber-400 hover:text-amber-800 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2">
                <Pen className={`w-5 h-5 ${activeTab === 'line-art' ? 'text-white' : 'text-amber-600'}`} />
                <span>线稿图</span>
              </div>
            </button>

            {/* 三视图按钮 */}
            <button
              onClick={handleMultiViewClick}
              className={`px-6 py-3 rounded-xl border-2 transition-all duration-300 font-medium ${
                activeTab === 'multi-view' 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-500 shadow-lg scale-105' 
                  : 'bg-white/90 backdrop-blur-sm text-yellow-700 border-yellow-300 hover:border-yellow-400 hover:text-yellow-800 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2">
                <Box className={`w-5 h-5 ${activeTab === 'multi-view' ? 'text-white' : 'text-yellow-600'}`} />
                <span>三视图</span>
              </div>
            </button>

            {/* 场景融合按钮 */}
            <button
              onClick={handleBackgroundClick}
              className={`px-6 py-3 rounded-xl border-2 transition-all duration-300 font-medium ${
                activeTab === 'background' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-lg scale-105' 
                  : 'bg-white/90 backdrop-blur-sm text-orange-700 border-orange-300 hover:border-orange-400 hover:text-orange-800 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className={`w-5 h-5 ${activeTab === 'background' ? 'text-white' : 'text-orange-600'}`} />
                <span>场景融合</span>
              </div>
            </button>
          </div>
        </section>

        {/* 主内容区域 */}
        <main className="max-w-6xl mx-auto px-6 pb-8">
          <div className="bg-yellow-50/90 backdrop-blur-md rounded-xl shadow-xl p-6 border border-yellow-200/60">
            {activeTab === 'line-art' && (
              <LineArtGenerator 
                imageState={sharedImage}
                setImageState={setSharedImage}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                resultUrl={lineArtResult}
                setResultUrl={setLineArtResult}
              />
            )}
            {activeTab === 'multi-view' && (
              <MultiViewGenerator 
                imageState={sharedImage}
                setImageState={setSharedImage}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                resultUrl={multiViewResult}
                setResultUrl={setMultiViewResult}
              />
            )}
            {activeTab === 'background' && (
              <BackgroundReplacer 
                subjectImage={sharedImage}
                setSubjectImage={setSharedImage}
                backgroundImage={backgroundImage}
                setBackgroundImage={setBackgroundImage}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                resultUrl={backgroundResult}
                setResultUrl={setBackgroundResult}
              />
            )}
          </div>
        </main>

        {/* 使用说明 */}
        <div className="relative">
          <section className="max-w-4xl mx-auto px-4 pb-8 mt-16">
            <div className="bg-gray-50/90 backdrop-blur-md rounded-xl p-8 border border-gray-200/60 shadow-2xl">
              <h2 className="text-2xl font-bold text-amber-800 mb-8 text-center tracking-wide">如何使用</h2>
              
              {/* 主要流程布局 */}
              <div className="flex items-center justify-between mb-8 space-x-4">
                {/* 第一步：上传照片 */}
                <div className="flex-1">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-amber-800 mb-3">上传照片</h3>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-dashed border-amber-300/60">
                      <p className="text-amber-700 text-sm font-medium">选择或拖拽图片</p>
                      <p className="text-xs text-amber-600 mt-1">支持 JPG, PNG, WEBP 格式</p>
                    </div>
                  </div>
                </div>

                {/* 箭头指示 */}
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* 第二步：选择功能 */}
                <div className="flex-1">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-amber-800 mb-3">选择功能</h3>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-dashed border-purple-300/60">
                      <p className="text-purple-700 text-sm font-medium">线稿图 / 三视图 / 场景融合</p>
                      <p className="text-xs text-purple-600 mt-1">点击功能按钮开始生成</p>
                    </div>
                  </div>
                </div>

                {/* 箭头指示 */}
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* 第三步：获得结果 */}
                <div className="flex-1">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-amber-800 mb-3">获得结果</h3>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-dashed border-green-300/60">
                      <p className="text-green-700 text-sm font-medium">等待AI处理完成</p>
                      <p className="text-xs text-green-600 mt-1">下载高质量处理结果</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部提示 */}
              <div className="text-center bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/40">
                <p className="text-sm text-amber-700 font-medium">
                  💡 <strong>小贴士：</strong>上传清晰的图片可获得更好的处理效果
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* 版权信息 */}
        <footer className="text-center py-6">
          <p className="text-sm text-amber-600 font-medium">Created by 香蕉AI工作室</p>
        </footer>
      </div>
    </div>
  )
}

export default App
