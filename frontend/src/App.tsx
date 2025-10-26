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
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6">
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
          <section className="max-w-3xl mx-auto px-4 pb-8 mt-16">
            <div className="bg-white/85 backdrop-blur-sm rounded-xl p-6 border border-amber-200/50 shadow-xl">
              <h2 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-4 text-center">如何使用</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold shadow-lg">1</div>
                  <h3 className="font-semibold text-amber-800 mb-2">上传照片</h3>
                  <p className="text-sm text-amber-700">选择一张清晰的图片，支持JPG、PNG、WEBP格式</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold shadow-lg">2</div>
                  <h3 className="font-semibold text-amber-800 mb-2">AI处理</h3>
                  <p className="text-sm text-amber-700">选择功能后，AI会分析您的图片并进行相应的处理</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold shadow-lg">3</div>
                  <h3 className="font-semibold text-amber-800 mb-2">获得结果</h3>
                  <p className="text-sm text-amber-700">几秒钟后，您将获得处理后的创意图片结果</p>
                </div>
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
