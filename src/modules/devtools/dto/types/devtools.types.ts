export type FilterId = 'all' | 'popular' | 'new' | 'favorites' | 'recent' | 'advanced'

export type CategoryId =
  | 'encoding'
  | 'json-data'
  | 'design'
  | 'text-tools'
  | 'utilities'
  | 'security'

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
