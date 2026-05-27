export type CategoryId =
  | 'encode-decode'
  | 'ui-design'
  | 'data'
  | 'text'
  | 'utility'
  | 'cryptography'

export interface ToolDef {
  id: string
  name: string
  description: string
  category: CategoryId
  keywords: string[]
  badge?: 'new' | 'popular' | 'advanced'
}

export interface Category {
  id: CategoryId
  label: string
  description: string
  accentClass: string
  gradientFrom: string
  gradientTo: string
}
