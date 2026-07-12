const envConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://blanzeapp-server.onrender.com/api/v1',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'BlanzeApp',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  NODE_ENV: import.meta.env.MODE || 'development',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
} as const

export default envConfig
