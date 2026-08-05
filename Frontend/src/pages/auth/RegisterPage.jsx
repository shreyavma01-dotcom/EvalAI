import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, KeyRound, Mail, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'student' },
  })

  const watchPassword = watch('password')

  const onSubmit = async (values) => {
    setServerError('')
    try {
      const user = await registerUser(values)
      toast.success(`Account created. Welcome, ${user.name.split(' ')[0]}.`)
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard', { replace: true })
    } catch (err) {
      setServerError(err?.response?.data?.message ?? 'Account creation failed. Please try again.')
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Students submit answer sheets; teachers review them. Choose the role that fits."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/auth/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background-soft p-3 transition-colors has-[:checked]:border-primary/60 has-[:checked]:bg-primary-muted">
            <input
              type="radio"
              value="student"
              className="sr-only"
              {...register('role')}
            />
            <span className="grid size-9 place-items-center rounded-lg bg-primary-muted text-primary-strong">
              <GraduationCap className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">Student</span>
              <span className="block text-xs text-muted">Submit and track</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background-soft p-3 transition-colors has-[:checked]:border-primary/60 has-[:checked]:bg-primary-muted">
            <input type="radio" value="teacher" className="sr-only" {...register('role')} />
            <span className="grid size-9 place-items-center rounded-lg bg-secondary-muted text-secondary-strong">
              <UserRound className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">Teacher</span>
              <span className="block text-xs text-muted">Review and grade</span>
            </span>
          </label>
        </div>

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Ananya Sharma"
          leftIcon={UserRound}
          error={errors.name?.message}
          {...register('name', { required: 'Full name is required.' })}
        />
        <Input
          label="Email address"
          type="email"
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          leftIcon={KeyRound}
          rightIcon={showPassword ? EyeOff : Eye}
          onRightIconClick={() => setShowPassword((v) => !v)}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required.',
            minLength: { value: 8, message: 'Password must be at least 8 characters.' },
          })}
        />
        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          leftIcon={KeyRound}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Confirm your password.',
            validate: (value) => value === watchPassword || 'Passwords do not match.',
          })}
        />

        {serverError ? (
          <p className="rounded-xl border border-danger/25 bg-danger/5 px-3 py-2.5 text-sm text-danger-strong">{serverError}</p>
        ) : null}

        <Button type="submit" size="xl" loading={isSubmitting} className="mt-1 w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage