export const APP_NAME = 'BlanzeApp'

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'blanze_auth_token',
  REFRESH_TOKEN: 'blanze_refresh_token',
  USER: 'blanze_user',
  THEME: 'blanze_theme',
} as const

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  FETCHLAB: '/dashboard/fetchlab',
  VAULTDROP: '/dashboard/vaultdrop',
  DEVTOOLS: '/dashboard/devtools',
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const

export const AUTH_TYPES = ['none', 'bearer', 'basic', 'apikey', 'oauth2'] as const

export const BODY_TYPES = ['none', 'json', 'xml', 'text', 'form', 'formencode', 'graphql', 'binary'] as const
