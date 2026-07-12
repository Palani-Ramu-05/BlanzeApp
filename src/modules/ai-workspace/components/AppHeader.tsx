import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppHeaderProps {
  icon: React.ReactNode
  title: string
  gradient: string
  breadcrumbs: BreadcrumbItem[]
  subtitle?: string
  children?: React.ReactNode
}

export const AppHeader = ({ icon, title, gradient, breadcrumbs, subtitle, children }: AppHeaderProps) => {
  const navigate = useNavigate()

  return (
    <header className="flex items-center gap-3 px-6 py-3 border-b border-surface-700/40 bg-surface-900/50 backdrop-blur-sm flex-shrink-0">
      <button
        onClick={() => navigate('/ai')}
        className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
        aria-label="Back to AI Workspace"
      >
        <ArrowLeft size={18} />
      </button>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: gradient }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <nav className="flex items-center gap-1.5 text-xs text-surface-500 mb-0.5">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight size={10} />}
              {crumb.href ? (
                <button
                  onClick={() => navigate(crumb.href!)}
                  className="hover:text-surface-200 transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-surface-300">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="text-sm font-semibold text-[rgb(var(--color-text-primary))] leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[10px] text-surface-500 leading-tight mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </header>
  )
}
