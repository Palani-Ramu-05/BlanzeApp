import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../validators/auth.validators'
import { authService } from '../../services/auth.service'
import { Input, Button } from '@components/index'
import { usePageTitle } from '@core/hooks/usePageTitle'
import { ROUTES } from '@core/constants/constants'
import toast from 'react-hot-toast'
import AppLogoName from '@/assets/images/app/new-logo.png'

export const ForgotPasswordPage = () => {
  usePageTitle('Forgot Password')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setSentEmail(data.email)
      setSent(true)
      toast.success('Reset link sent! Check your inbox.')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-black mb-2">Check your email</h2>
          <p className="text-sm text-surface-400">
            We sent a reset link to{' '}
            <span className="font-semibold">{sentEmail}</span>
          </p>
        </div>
        <Link to={ROUTES.AUTH.SIGNIN}>
          <Button variant="secondary" fullWidth icon={<ArrowLeft size={15} />}>
            Back to Sign In
          </Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <img src={AppLogoName} alt="App Logo" style={{ height:'30vh', margin:'auto' }} />
      <div>
        <h1 className="text-2xl font-black mb-1">Reset your password</h1>
        <p className="text-sm text-surface-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={15} />}
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </Button>
      </form>

      <Link
        to={ROUTES.AUTH.SIGNIN}
        className="flex items-center justify-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Sign In
      </Link>
    </div>
  )
}
