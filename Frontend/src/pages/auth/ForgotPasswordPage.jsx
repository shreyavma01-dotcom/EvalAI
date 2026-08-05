import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import authApi from '@/services/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } })

  const onSubmit = async ({ email }) => {
    try {
      const data = await authApi.forgotPassword(email)
      setSent(true)
      if (data?.resetToken) setResetToken(data.resetToken)
      toast.success('Reset link generated.')
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Something went wrong. Please try again.')
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle="If an account exists for that email, a password reset link has been generated."
        footer={
          <Link to="/auth/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-success-muted text-success-strong">
            <MailCheck className="size-6" />
          </span>
          <p className="text-sm leading-6 text-muted">
            Follow the link to choose a new password. Email delivery is not configured in this build, so the reset
            link is shown here instead.
          </p>
          {resetToken ? (
            <a
              href={`/auth/reset-password?token=${encodeURIComponent(resetToken)}`}
              className="w-full rounded-xl border border-primary/30 bg-primary-muted px-4 py-3 text-sm font-semibold break-all text-primary-strong hover:bg-primary/10"
            >
              Open reset page
            </a>
          ) : null}
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email you signed up with and we will generate a reset link."
      footer={
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
        <Button type="submit" size="xl" loading={isSubmitting} className="mt-1 w-full">
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  )
}

export default ForgotPasswordPage