import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, RotateCcw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import authApi from '@/services/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: '', confirmPassword: '' } })

  const watchPassword = useMemo(() => watch('password'), [watch])

  const onSubmit = async ({ password }) => {
    setServerError('')
    try {
      if (!token) throw { response: { data: { message: 'The reset link is missing a token. Request a new link.' } } }
      await authApi.resetPassword({ token, password })
      toast.success('Password updated. Sign in with your new password.')
      navigate('/auth/login', { replace: true })
    } catch (err) {
      setServerError(err?.response?.data?.message ?? 'Password reset failed. Please try again.')
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick a strong password you have not used here before."
      footer={
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          label="New password"
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
          label="Confirm new password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          leftIcon={RotateCcw}
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
          Reset password
        </Button>
      </form>
    </AuthLayout>
  )
}

export default ResetPasswordPage