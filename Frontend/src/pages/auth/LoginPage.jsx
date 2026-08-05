import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Rocket, Eye, EyeOff, GraduationCap, KeyRound, Mail, Presentation } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { cn } from '@/utils/cn'

const ROLE_HOME = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
}

const ROLES = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'teacher', label: 'Teacher', icon: Presentation },
]

const DEMO_CREDENTIALS = {
  teacher: { email: 'teacher@evalai.com', password: 'Teacher@123' },
  student: { email: 'student@evalai.com', password: 'Student@123' },
}

const DEMO_BUTTONS = [
  {
    key: 'teacher',
    label: 'Login as Teacher',
    icon: Presentation,
    className: 'border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-700 hover:border-emerald-500 hover:bg-emerald-500/15 hover:shadow-[0_10px_22px_-10px_rgba(16,185,129,0.5)]',
  },
  {
    key: 'student',
    label: 'Login as Student',
    icon: GraduationCap,
    className: 'border-blue-500/40 bg-blue-500/[0.06] text-blue-700 hover:border-blue-500 hover:bg-blue-500/15 hover:shadow-[0_10px_22px_-10px_rgba(59,130,246,0.5)]',
  },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [serverError, setServerError] = useState('')
  const [role, setRole] = useState('student')
  const [demoLoading, setDemoLoading] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } })

  const onSubmit = async (values) => {
    setServerError('')
    try {
      const user = await login({ ...values, remember })
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`)
      const from = location.state?.from
      if (from && !from.startsWith('/auth/')) return navigate(from, { replace: true })
      navigate(ROLE_HOME[user.role] ?? '/student/dashboard', { replace: true })
    } catch (err) {
      setServerError(err?.response?.data?.message ?? 'Sign in failed. Please try again.')
    }
  }

  const demoLogin = async (key) => {
    const creds = DEMO_CREDENTIALS[key]
    if (!creds || demoLoading) return
    setServerError('')
    setDemoLoading(key)
    try {
      const user = await login({ ...creds, remember })
      toast.success(`Signed in as ${key === 'teacher' ? 'Teacher' : 'Student'}.`)
      const from = location.state?.from
      if (from && !from.startsWith('/auth/')) return navigate(from, { replace: true })
      navigate(ROLE_HOME[user.role] ?? (key === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'), { replace: true })
    } catch {
      setServerError('Demo account not found. Please run the seed script.')
    } finally {
      setDemoLoading('')
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your EvalAI workspace."
      footer={
        <>
          New to EvalAI?{' '}
          <Link to="/auth/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {/* Role selection */}
        <div>
          <span className="mb-2 block text-sm font-medium text-foreground">I am a</span>
          <div className="relative grid grid-cols-2 rounded-2xl border border-border bg-background-soft/80 p-1">
            {ROLES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                className={cn(
                  'relative z-10 flex items-center justify-center gap-2 rounded-[13px] px-4 py-2.5 text-sm font-semibold transition-colors duration-200',
                  role === id ? 'text-white' : 'text-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
            <motion.span
              layoutId="auth-role-pill"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className={cn(
                'absolute inset-y-1 w-[calc(50%-4px)] rounded-[13px]',
                role === 'student' ? 'left-1' : 'left-[calc(50%+0px)]',
                'bg-gradient-to-br from-[#0F766E] to-[#22C55E] shadow-[0_8px_20px_-8px_rgba(15,118,110,0.6)]',
              )}
            />
          </div>
        </div>

        <Input
          label="Email address"
          type="email"
          size="xl"
          autoComplete="email"
          placeholder="you@school.edu"
          leftIcon={Mail}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required.',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
          })}
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          size="xl"
          autoComplete="current-password"
          placeholder="Your password"
          leftIcon={KeyRound}
          rightIcon={showPassword ? EyeOff : Eye}
          onRightIconClick={() => setShowPassword((v) => !v)}
          error={errors.password?.message}
          {...register('password', { required: 'Password is required.' })}
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <Checkbox checked={remember} onCheckedChange={setRemember} />
            Keep me signed in
          </label>
          <Link to="/auth/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        {serverError ? (
          <p className="rounded-xl border border-danger/25 bg-danger/5 px-3 py-2.5 text-sm text-danger-strong">{serverError}</p>
        ) : null}

        <Button
          type="submit"
          size="xl"
          loading={isSubmitting}
          className="mt-1 h-14 w-full rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#22C55E] text-base font-semibold text-white shadow-[0_14px_36px_-14px_rgba(15,118,110,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_22px_48px_-14px_rgba(15,118,110,0.7)] active:scale-[0.99]"
        >
          Sign in
        </Button>

        <div className="mt-3 w-full rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-3.5 shadow-[0_6px_20px_-14px_rgba(15,23,42,0.18)]">
          <div className="mb-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-foreground">
            <Rocket className="size-3.5 text-[#22C55E]" />
            Quick Demo Login
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_BUTTONS.map(({ key, label, icon: Icon, className }) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                size="md"
                leftIcon={Icon}
                loading={demoLoading === key}
                disabled={demoLoading !== ''}
                onClick={() => demoLogin(key)}
                className={cn(
                  'h-10 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]',
                  className,
                )}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}

export default LoginPage