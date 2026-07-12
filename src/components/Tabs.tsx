import { cn } from '@utils/index'

interface Tab {
  id: string
  label: string
  badge?: string | number
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'underline' | 'pill'
  className?: string
}

export const Tabs = ({ tabs, activeTab, onChange, variant = 'underline', className }: TabsProps) => {
  if (variant === 'pill') {
    return (
      <div className={cn('flex gap-1 p-1 bg-surface-800/60 border border-surface-700/50 rounded-xl', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
              activeTab === tab.id
                ? 'bg-surface-700 text-surface-100 shadow-sm'
                : 'text-surface-400 hover:text-surface-200',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                  activeTab === tab.id ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-700 text-surface-400',
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex border-b border-surface-700/50 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'tab-item flex items-center gap-1.5 flex-shrink-0',
            activeTab === tab.id && 'tab-item-active',
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span className="text-[9px] font-bold bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
