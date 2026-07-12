import {
  PenTool,
  Mic,
  FileText,
  Image,
  Code2,
  Languages,
  Search,
  MessageSquare,
} from 'lucide-react'

export const studioConfig: Record<string, {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  gradient: string
}> = {
  chat: {
    id: 'chat',
    title: 'AI Chat',
    description: 'Chat with AI assistant',
    icon: <MessageSquare size={20} />,
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
  },
  writing: {
    id: 'writing',
    title: 'Writing Studio',
    description: 'Write, rewrite, and optimize content',
    icon: <PenTool size={20} />,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  },
  voice: {
    id: 'voice',
    title: 'Voice Studio',
    description: 'Speech to text, transcription, and more',
    icon: <Mic size={20} />,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
  },
  document: {
    id: 'document',
    title: 'Document Studio',
    description: 'Analyze, summarize, and extract from documents',
    icon: <FileText size={20} />,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
  },
  image: {
    id: 'image',
    title: 'Image Studio',
    description: 'OCR, caption, and analyze images',
    icon: <Image size={20} />,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
  },
  coding: {
    id: 'coding',
    title: 'Coding Studio',
    description: 'Generate, explain, and refactor code',
    icon: <Code2 size={20} />,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  },
  translation: {
    id: 'translation',
    title: 'Translation Studio',
    description: 'Translate and detect languages',
    icon: <Languages size={20} />,
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
  },
  research: {
    id: 'research',
    title: 'Research Studio',
    description: 'Research, summarize, and export findings',
    icon: <Search size={20} />,
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #fb923c)',
  },
}
