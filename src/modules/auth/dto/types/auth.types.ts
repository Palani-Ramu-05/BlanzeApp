export interface SignInDto {
  email: string
  password: string
  rememberMe: boolean
}

export interface SignUpDto {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface ForgotPasswordDto {
  email: string
}

export interface ResetPasswordDto {
  password: string
  confirmPassword: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'viewer'
  createdAt: string
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  initializing: boolean
  error: string | null
}
