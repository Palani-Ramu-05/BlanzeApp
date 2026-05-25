import type { AuthUser } from '../dto/types/auth.types'

export const MOCK_CREDENTIALS = {
  email: 'demo@blanzeapp.com',
  password: 'Demo@1234',
} as const

export const MOCK_USER: AuthUser = {
  id: 'mock-user-001',
  name: 'Alex Johnson',
  email: MOCK_CREDENTIALS.email,
  role: 'admin',
  avatar: undefined,
  createdAt: new Date().toISOString(),
}

export const MOCK_TOKEN = 'mock-jwt-token-blanzeapp-dev-2026'
