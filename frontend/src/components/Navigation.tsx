type Tab = 'line-art' | 'multi-view' | 'background'

interface NavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'line-art', label: '线稿图生成' },
    { id: 'multi-view', label: '三视图生成' },
    { id: 'background', label: '背景替换' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/15 backdrop-blur-lg border-b border-white/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-18">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#shadow)">
                  <path d="M12 24 C 8 20, 8 16, 12 14 C 16 12, 22 14, 26 18 C 30 22, 32 28, 30 32 C 28 36, 22 38, 18 36 C 14 34, 12 28, 12 24 Z" 
                        fill="#FCD34D" stroke="#F59E0B" strokeWidth="2"/>
                  <path d="M16 18 C 18 16, 22 16, 24 18 C 22 20, 18 20, 16 18 Z" 
                        fill="#FEF3C7" opacity="0.7"/>
                  <path d="M12 14 C 14 12, 16 12, 18 14" 
                        fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M28 32 C 30 30, 32 30, 34 32" 
                        fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
                </g>
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="1" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.3"/>
                  </filter>
                </defs>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-50">香蕉AI工作室</h1>
          </div>

          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-6 py-3 rounded-lg text-base font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-500 border border-primary-500/40'
                    : 'text-neutral-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}