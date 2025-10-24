import { useState } from 'react'
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
      label: '线稿图生成',
      icon: Pen,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-300'
    },
    {
      id: 'multi-view' as Tab,
      label: '三视图生成',
      icon: Box,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-300'
    },
    {
      id: 'background' as Tab,
      label: '背景替换',
      icon: ImageIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300'
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-200 relative">
      {/* 香蕉小超人Logo作为背景装饰 */}
      <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
        <div className="absolute top-10 right-10 w-64 h-64 transform rotate-12">
          <img 
            src="/banana-superhero-logo-transparent.png" 
            alt="" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute bottom-20 left-10 w-48 h-48 transform -rotate-12">
          <img 
            src="/banana-superhero-logo-transparent.png" 
            alt="" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-5">
          <img 
            src="/banana-superhero-logo-transparent.png" 
            alt="" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10">
        {/* 标题区域 */}
        <header className="text-center py-6">
          <div className="flex items-center justify-center mb-2">
            <img 
              src="/banana-superhero-logo-transparent.png" 
              alt="香蕉小超人" 
              className="w-16 h-16 object-contain mr-3"
            />
            <h1 className="text-3xl font-bold text-amber-800">香蕉AI工作室</h1>
          </div>
          <p className="text-sm text-amber-700 max-w-2xl mx-auto px-4">
            上传您的图片，体验AI驱动的创意图像处理技术
          </p>
        </header>

        {/* 功能选择区域 */}
        <section className="max-w-4xl mx-auto px-4 mb-6">
          <div className="flex justify-center gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-300 ${
                    isActive 
                      ? `${tab.bgColor} ${tab.borderColor} shadow-lg` 
                      : 'bg-white border-gray-200 hover:shadow-md'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-1 ${isActive ? tab.color : 'text-gray-600'}`} />
                  <span className={`text-xs font-medium ${
                    isActive ? tab.color : 'text-gray-700'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* 主内容区域 */}
        <main className="max-w-5xl mx-auto px-4 pb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-4">
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
        <section className="max-w-4xl mx-auto px-4 pb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
            <h2 className="text-lg font-bold text-amber-800 mb-3 text-center">如何使用</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">1</div>
                <h3 className="font-semibold text-amber-800 mb-1">上传照片</h3>
                <p className="text-xs text-amber-700">选择一张清晰的图片，支持JPG、PNG、WEBP格式</p>
              </div>
              <div className="text-center">
                <div className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">2</div>
                <h3 className="font-semibold text-amber-800 mb-1">AI处理</h3>
                <p className="text-xs text-amber-700">选择功能后，AI会分析您的图片并进行相应的处理</p>
              </div>
              <div className="text-center">
                <div className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">3</div>
                <h3 className="font-semibold text-amber-800 mb-1">获得结果</h3>
                <p className="text-xs text-amber-700">几秒钟后，您将获得处理后的创意图片结果</p>
              </div>
            </div>
          </div>
        </section>

        {/* 版权信息 */}
        <footer className="text-center py-4">
          <p className="text-sm text-amber-600">Created by 香蕉AI工作室</p>
        </footer>
      </div>
    </div>
  )
}

export default App
