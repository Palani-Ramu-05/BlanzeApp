import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema, type SignInFormData } from '../../validators/auth.validators'
import { signIn } from '../../store/authSlice'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { Input, Button, Checkbox } from '@components/index'
import { usePageTitle } from '@core/hooks/usePageTitle'
import { ROUTES } from '@core/constants/constants'
import toast from 'react-hot-toast'

// Cast needed because Zod default() makes the input type differ from output
const signInResolver = zodResolver(signInSchema) as Resolver<SignInFormData>

export const SignInPage = () => {
  usePageTitle('Sign In')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((s) => s.auth)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: signInResolver,
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const rememberMe = watch('rememberMe')

  const onSubmit = async (data: SignInFormData) => {
    const result = await dispatch(signIn(data))
    if (signIn.fulfilled.match(result)) {
      navigate(ROUTES.DASHBOARD, { replace: true })
    } else {
      toast.error(result.payload as string || 'Sign in failed')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Welcome back</h1>
        <p className="text-sm text-surface-400">Sign in to your account to continue</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

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

        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          leftIcon={<Lock size={15} />}
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <Checkbox
            label="Remember me"
            checked={rememberMe}
            onChange={(v) => setValue('rememberMe', v)}
          />
          <Link
            to={ROUTES.AUTH.FORGOT_PASSWORD}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          iconRight={!loading ? <ArrowRight size={16} /> : undefined}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </Button> */}
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-surface-950 text-surface-500">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-surface-400">
        Don't have an account?{' '}
        <Link
          to={ROUTES.AUTH.SIGNUP}
          className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
        >
          Sign up free
        </Link>
      </p>
    </div>
  )
}
