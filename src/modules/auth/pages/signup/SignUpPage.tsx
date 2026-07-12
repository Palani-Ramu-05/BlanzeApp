import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema, type SignUpFormData } from '../../validators/auth.validators'
import { signUp } from '../../store/authSlice'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { Input, Button } from '@components/index'
import { usePageTitle } from '@core/hooks/usePageTitle'
import { ROUTES } from '@core/constants/constants'
import toast from 'react-hot-toast'
import { useState } from 'react'
import AppLogoName from '@/assets/images/app/new-logo.png'

export const SignUpPage = () => {
  usePageTitle('Create Account')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: SignUpFormData) => {
    const result = await dispatch(signUp(data))
    if (signUp.fulfilled.match(result)) {
      if (result.payload.emailConfirmationRequired) {
        setEmailSent(true)
        toast.success('Check your email to confirm your account!')
      } else {
        navigate(ROUTES.DASHBOARD, { replace: true })
      }
    } else {
      toast.error(result.payload as string || 'Sign up failed')
    }
  }

  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-5 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center mx-auto">
          <CheckCircle size={28} className="text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black mb-2">Check your email</h1>
          <p className="text-sm text-surface-400">
            We sent a confirmation link to your email address. Click it to activate your account.
          </p>
        </div>
        <Link
          to={ROUTES.AUTH.SIGNIN}
          className="inline-block text-sm text-brand-400 hover:text-brand-300 font-semibold transition-colors"
        >
          Back to Sign In
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="space-y-1">
      <img src={AppLogoName} alt="App Logo" style={{ height:'25vh', margin:'auto' }} />
      <div>
        <h1 className="text-2xl font-black mb-1">Create your account</h1>
        <p className="text-sm text-surface-400">Start building with BlanzeApp today</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="name"
          label="Full name"
          type="text"
          placeholder="John Doe"
          leftIcon={<User size={15} />}
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />

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

        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          leftIcon={<Lock size={15} />}
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          id="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="Repeat your password"
          leftIcon={<Lock size={15} />}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          iconRight={!loading ? <ArrowRight size={16} /> : undefined}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-xs text-surface-500">
        By signing up, you agree to our{' '}
        <span className="text-brand-400 cursor-pointer hover:underline">Terms of Service</span>{' '}
        and{' '}
        <span className="text-brand-400 cursor-pointer hover:underline">Privacy Policy</span>
      </p>

      <p className="text-center text-sm text-surface-400">
        Already have an account?{' '}
        <Link
          to={ROUTES.AUTH.SIGNIN}
          className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
