import { supabase } from '@core/config/supabaseClient'
import type { AuthUser, SignInDto, SignUpDto } from '../dto/types/auth.types'

const mapSupabaseUser = (sbUser: { id: string; email?: string; user_metadata?: Record<string, string>; created_at?: string }): AuthUser => ({
  id: sbUser.id,
  name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
  email: sbUser.email || '',
  avatar: sbUser.user_metadata?.avatar_url,
  role: 'user',
  createdAt: sbUser.created_at || new Date().toISOString(),
})

export const authService = {
  signIn: async (dto: SignInDto) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email.trim(),
      password: dto.password,
    })
    if (error) throw new Error(error.message)
    if (!data.user || !data.session) throw new Error('Authentication failed')
    return {
      user: mapSupabaseUser(data.user),
      token: data.session.access_token,
    }
  },

  signUp: async (dto: SignUpDto) => {
    const { data, error } = await supabase.auth.signUp({
      email: dto.email.trim(),
      password: dto.password,
      options: {
        data: { full_name: dto.name },
        emailRedirectTo: `${window.location.origin}/auth/signin`,
      },
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Signup failed')
    // If email confirmation required, session may be null
    return {
      user: mapSupabaseUser(data.user),
      token: data.session?.access_token || '',
      emailConfirmationRequired: !data.session,
    }
  },

  forgotPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw new Error(error.message)
    return { message: `Reset link sent to ${email}` }
  },

  resetPassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
    return { message: 'Password updated successfully' }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) return null
    return {
      user: mapSupabaseUser(data.session.user),
      token: data.session.access_token,
    }
  },
}
