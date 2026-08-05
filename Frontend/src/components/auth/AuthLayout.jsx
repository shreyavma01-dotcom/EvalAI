import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Gem, ScanText, Sparkles } from 'lucide-react'
import EducationIllustration from '@/assets/Education-rafiki.svg'
import { Logo } from '@/components/common/Logo'

const NOISE_DATA_URI =
  'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22/><feColorMatrix type=%22saturate%22 values=%220%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")'

const FEATURES = [
  { label: 'AI Evaluation' },
  { label: 'OCR Recognition' },
  { label: 'Instant Results' },
]

const PARTICLES = [
  { left: '8%', top: '20%', size: 5, delay: 0, duration: 7 },
  { left: '86%', top: '14%', size: 4, delay: 1.2, duration: 8 },
  { left: '14%', top: '78%', size: 6, delay: 0.6, duration: 9 },
  { left: '72%', top: '72%', size: 3, delay: 2, duration: 6.5 },
  { left: '48%', top: '10%', size: 4, delay: 1.6, duration: 7.5 },
  { left: '90%', top: '50%', size: 5, delay: 0.3, duration: 8.5 },
]

const GLASS_CARDS = [
  {
    className: 'right-[4%] top-[10%]',
    icon: ScanText,
    accent: 'text-emerald-300',
    title: 'OCR complete',
    sub: '4 pages scanned',
    offset: -10,
    delay: 0.4,
  },
  {
    className: 'left-[3%] bottom-[20%]',
    icon: Check,
    accent: 'text-cyan-300',
    title: 'Answer evaluated',
    sub: '92% score',
    offset: 10,
    delay: 1,
  },
]

/** Decorative full-page background: gradient mesh + blurred glows + noise. */
function BackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#F8FAFC]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(60% 50% at 18% 8%, rgba(31,178,143,0.16), transparent 70%),' +
            'radial-gradient(50% 45% at 88% 12%, rgba(34,197,94,0.14), transparent 70%),' +
            'radial-gradient(55% 55% at 82% 92%, rgba(13,148,136,0.14), transparent 70%),' +
            'radial-gradient(45% 45% at 8% 88%, rgba(16,185,129,0.12), transparent 70%)',
        }}
      />
      <div className="absolute -left-32 -top-28 size-[26rem] rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute -right-24 top-1/3 size-80 rounded-full bg-teal-200/40 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 size-80 rounded-full bg-green-200/35 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: NOISE_DATA_URI }}
      />
    </div>
  )
}

/** Dark green brand panel: logo, hero illustration, value proposition, feature pills. */
function BrandPanel() {
  return (
    <div className="relative flex flex-col overflow-hidden bg-gradient-to-br from-[#0E2A20] via-[#123528] to-[#0A1F16] p-6 sm:p-8 lg:p-10 xl:p-12">
      {/* Soft radial glow behind the hero */}
      <div className="pointer-events-none absolute left-1/2 top-[44%] size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2F8F6B]/35 blur-3xl" />

      {/* Blurred glowing circles */}
      <div className="pointer-events-none absolute -left-20 top-16 size-44 rounded-full bg-[#58C49B]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-40 size-56 rounded-full bg-[#2F8F6B]/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 left-1/3 size-24 rounded-full bg-[#8CE0B8]/20 blur-2xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 size-16 rounded-full bg-[#58C49B]/20 blur-xl" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Brand mark + AI badge, top-left */}
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2F8F6B] to-[#58C49B] text-white shadow-[0_10px_24px_-8px_rgba(47,143,107,0.55)]">
              <Sparkles className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-white">EvalAI</span>
          </div>
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur-md"
          >
            <Gem className="size-3 text-emerald-300" />
            Powered by Gemini AI
          </motion.span>
        </div>

        {/* Hero illustration — floats slowly, sized to ~80% of the panel */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center py-6 sm:py-8 lg:py-10">
          {/* Floating glass cards */}
          {GLASS_CARDS.map(({ className, icon: Icon, accent, title, sub, offset, delay }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: [offset * 0.5, -offset, offset * 0.5], x: [0, 0, 0] }}
              transition={{
                opacity: { duration: 0.7, delay },
                y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
              }}
              className={`absolute z-20 hidden items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 shadow-[0_16px_36px_-16px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:flex ${className}`}
            >
              <span className="grid size-9 place-items-center rounded-xl bg-white/10">
                <Icon className={`size-4 ${accent}`} />
              </span>
              <span className="text-left">
                <span className="block text-xs font-semibold text-white">{title}</span>
                <span className="block text-[11px] text-white/60">{sub}</span>
              </span>
            </motion.div>
          ))}

          {/* Animated particles */}
          {PARTICLES.map(({ left, top, size, delay, duration }, i) => (
            <motion.span
              key={i}
              className="absolute z-10 rounded-full bg-gradient-to-br from-emerald-300/70 to-teal-400/40"
              style={{ left, top, width: size, height: size }}
              animate={{ y: [0, -22, 0], opacity: [0.15, 0.8, 0.15] }}
              transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
            />
          ))}

          <motion.img
            src={EducationIllustration}
            alt="AI-powered handwritten answer sheet evaluation illustration"
            className="h-auto w-full max-w-[300px] object-contain drop-shadow-[0_36px_60px_rgba(0,0,0,0.4)] sm:max-w-[420px] lg:max-w-[82%]"
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Value proposition + feature pills */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <h2 className="text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl">
              AI-Powered Answer Evaluation
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-6 text-[#7FB49A] sm:text-sm">
              Automatically evaluate handwritten answer sheets using OCR + Gemini AI with
              teacher-level feedback and analytics.
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center gap-2">
            {FEATURES.map(({ label }, i) => (
              <motion.span
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.12 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-4 text-[13px] font-medium text-white/90 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md"
              >
                <span className="grid size-5 place-items-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 text-[10px] font-bold text-[#0B2A1E]">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {label}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Premium split-shell for the auth pages. */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-3 sm:p-5 lg:p-8">
      <BackgroundFX />

      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-center"
      >
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 shadow-[0_50px_140px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:grid-cols-[48fr_52fr] lg:min-h-[min(92vh,920px)]">
          <BrandPanel />

          {/* Form panel */}
          <div className="flex flex-col justify-center p-6 sm:p-9 md:p-12 lg:p-12 xl:p-16">
            <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
              <Logo />
              <span className="text-lg font-bold tracking-tight text-foreground">EvalAI</span>
            </Link>

            <div className="mx-auto flex w-full max-w-xl flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              {subtitle ? <p className="mt-2.5 text-sm leading-6 text-muted sm:text-[15px]">{subtitle}</p> : null}
              <div className="mt-8">{children}</div>
            </div>

            {footer ? (
              <div className="mx-auto mt-8 w-full max-w-xl border-t border-border/60 pt-6 text-center text-sm text-muted">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthLayout