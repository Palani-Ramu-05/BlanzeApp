import {
  LayoutDashboard, Bot, Zap, CloudUpload, FileStack,
  Timer, KanbanSquare, NotebookPen, ScanSearch,
  BarChart3, Users, Package, Shield, Bell,
  Settings, HelpCircle,
  Code2, Wrench, Database, Box, Globe, TimerReset, ListChecks,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { ROUTES } from '@core/constants/constants'

export interface SidebarItemConfig {
  id: string
  title: string
  icon?: ReactNode
  route?: string
  children?: SidebarItemConfig[]
  badge?: string
  disabled?: boolean
  permissions?: string[]
}

export interface SidebarGroup {
  id: string
  label?: string
  items: SidebarItemConfig[]
}

export const sidebarGroups: SidebarGroup[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { id: 'dashboard', title: 'Dashboard', icon: <LayoutDashboard size={18} />, route: ROUTES.DASHBOARD },
      { id: 'ai-workspace', title: 'AI Workspace', icon: <Bot size={18} />, route: ROUTES.AI },
      { id: 'fetchlab', title: 'FetchLab', icon: <Zap size={18} />, route: ROUTES.FETCHLAB, badge: 'Pro' },
      { id: 'vaultdrop', title: 'VaultDrop', icon: <CloudUpload size={18} />, route: ROUTES.VAULTDROP },
      { id: 'filestudio', title: 'File Studio', icon: <FileStack size={18} />, route: ROUTES.FILESTUDIO },
    ],
  },
  {
    id: 'developer-studio',
    label: 'Developer Studio',
    items: [
      {
        id: 'developer-studio-group',
        title: 'Developer Studio',
        icon: <Code2 size={18} />,
        children: [
          { id: 'devtools', title: 'DevTools', icon: <Wrench size={18} />, route: ROUTES.DEVTOOLS },
          { id: 'api-mock-server', title: 'API Mock Server', icon: <Database size={18} />, route: ROUTES.API_MOCK_SERVER },
          { id: 'database-studio', title: 'Database Studio', icon: <Box size={18} />, disabled: true, badge: 'Coming Soon' },
          { id: 'env-manager', title: 'Environment Manager', icon: <Globe size={18} />, disabled: true, badge: 'Coming Soon' },
          { id: 'log-explorer', title: 'Log Explorer', icon: <ListChecks size={18} />, disabled: true, badge: 'Coming Soon' },
          { id: 'cron-builder', title: 'Cron Builder', icon: <TimerReset size={18} />, disabled: true, badge: 'Coming Soon' },
        ],
      },
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    items: [
      { id: 'countdown-timer', title: 'Countdown Timer', icon: <Timer size={18} />, route: ROUTES.TIMER },
      { id: 'task-board', title: 'Task Board', icon: <KanbanSquare size={18} />, route: ROUTES.TASKBOARD },
      { id: 'notes', title: 'Notes', icon: <NotebookPen size={18} />, route: ROUTES.NOTES },
      { id: 'web-scraper', title: 'Web Scraper', icon: <ScanSearch size={18} />, route: ROUTES.WEBSCRAPER },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'analytics', title: 'Analytics', icon: <BarChart3 size={18} />, route: '/analytics' },
      { id: 'users', title: 'Users', icon: <Users size={18} />, route: '/users' },
      { id: 'packages', title: 'Packages', icon: <Package size={18} />, route: '/packages' },
      { id: 'security', title: 'Security', icon: <Shield size={18} />, route: '/security' },
      { id: 'notifications', title: 'Notifications', icon: <Bell size={18} />, route: '/notifications' },
    ],
  },
]

export const sidebarBottomItems: SidebarItemConfig[] = [
  { id: 'settings', title: 'Settings', icon: <Settings size={18} />, route: '/settings' },
  { id: 'help', title: 'Help', icon: <HelpCircle size={18} />, route: '/help' },
]
