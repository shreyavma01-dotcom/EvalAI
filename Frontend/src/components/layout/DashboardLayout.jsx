import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { Logo } from '@/components/common/Logo'
import { Badge } from '@/components/feedback/Badge'
import { notificationsApi } from '@/services/submissions'
import { getSocket } from '@/services/socket'
import { Spinner } from '@/components/feedback/Spinner'

const NAV = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/submit', label: 'Submit Assignment', icon: PlusCircle },
    { to: '/student/results', label: 'Results', icon: BookOpenCheck },
    { to: '/student/history', label: 'History', icon: History },
  ],
  teacher: [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/submissions', label: 'Assignments', icon: ClipboardList },
    { to: '/teacher/ai-evaluation', label: 'AI Evaluation', icon: Sparkles },
    { to: '/teacher/students', label: 'Students', icon: GraduationCap },
    { to: '/teacher/reports', label: 'Reports', icon: FileText },
    { to: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  admin: [{ to: '/admin/dashboard', label: 'Dashboard', icon: ShieldCheck }],
}

const ROLE_BADGE = {
  student: { label: 'Student', variant: 'primary-soft' },
  teacher: { label: 'Teacher', variant: 'secondary' },
  admin: { label: 'Admin', variant: 'warning' },
}

function pillClasses(isActive) {
  return cn(
    'relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-gradient-to-r from-[#0F766E] to-[#22C55E] text-white shadow-[0_6px_18px_-6px_rgba(34,197,94,0.55)]'
      : 'text-muted hover:bg-black/[0.05] hover:text-foreground',
  )
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const notifRef = useRef(null)
  const menuRef = useRef(null)

  const role = user?.role ?? 'student'
  const items = NAV[role] ?? []
  const roleBadge = ROLE_BADGE[role] ?? ROLE_BADGE.student
  const unread = notifications.filter((n) => !n.read).length
  const home = role === 'admin' ? '/admin/dashboard' : `/${role}/dashboard`
  const initials = (user?.name ?? 'U')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  useEffect(() => {
    if (role === 'admin') return
    setNotifLoading(true)
    notificationsApi
      .list()
      .then((data) => setNotifications(data.items ?? []))
      .catch(() => {})
      .finally(() => setNotifLoading(false))
  }, [role])

  useEffect(() => {
    if (role === 'admin') return undefined
    const socket = getSocket()
    const onNotification = (payload) => {
      if (!payload?.id && !payload?._id) return
      setNotifications((prev) => {
        const existing = prev.some((n) => (n.id ?? n._id) === (payload.id ?? payload._id))
        return existing ? prev : [{ ...payload, read: false }, ...prev]
      })
    }
    socket.on('notification:new', onNotification)
    socket.emit('join:user', user?.id ?? user?._id)
    return () => {
      socket.off('notification:new', onNotification)
      socket.emit('leave:user', user?.id ?? user?._id)
    }
  }, [role, user?.id, user?._id])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!notifRef.current?.contains(event.target)) setNotifOpen(false)
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id ?? n._id)
    if (ids.length === 0) return
    for (const id of ids) {
      await notificationsApi.markRead(id).catch(() => {})
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login', { replace: true })
  }

  const closeDrawer = () => setDrawerOpen(false)

  const navLinks = (item, onClick) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={onClick}
      className={({ isActive }) => pillClasses(isActive)}
    >
      <item.icon className="size-4" />
      {item.label}
    </NavLink>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top navigation */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-background-soft hover:text-foreground lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>

            <NavLink to={home} className="flex shrink-0 items-center gap-2.5">
              <Logo size="md" />
              
            </NavLink>

            <nav className="ml-3 hidden items-center gap-1 lg:flex" aria-label="Primary">
              {items.map((item) => navLinks(item, undefined))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {role !== 'admin' ? (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen((v) => !v)
                    setMenuOpen(false)
                  }}
                  className="relative grid size-10 place-items-center rounded-full text-muted transition-all duration-200 hover:bg-background-soft hover:text-foreground"
                  aria-label="Notifications"
                >
                  <Bell className="size-4.5" />
                  {unread > 0 ? (
                    <span className="absolute right-2 top-1.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                      {unread}
                    </span>
                  ) : null}
                </button>

                {notifOpen ? (
                  <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-floating">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                      <span className="text-sm font-semibold text-foreground">Notifications</span>
                      {unread > 0 ? (
                        <button type="button" onClick={markAllRead} className="text-xs font-semibold text-primary hover:underline">
                          Mark all read
                        </button>
                      ) : null}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifLoading ? (
                        <div className="grid h-24 place-items-center">
                          <Spinner size="sm" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id ?? n._id}
                            type="button"
                            onClick={() => {
                              if (!n.read) notificationsApi.markRead(n.id ?? n._id).catch(() => {})
                              setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
                              if (n.type === 'result' && n.data?.submissionId) {
                                setNotifOpen(false)
                                navigate(`/student/results/submission/${n.data.submissionId}`)
                              }
                            }}
                            className={cn(
                              'block w-full border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-background-soft',
                              !n.read && 'bg-primary-muted/40',
                            )}
                          >
                            <div className="text-sm font-semibold text-foreground">{n.title}</div>
                            <div className="mt-0.5 text-xs leading-5 text-muted">{n.message}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen((v) => !v)
                  setNotifOpen(false)
                }}
                className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#0F766E] to-[#22C55E] text-xs font-bold text-white shadow-[0_6px_16px_-6px_rgba(34,197,94,0.5)] transition-all duration-200 hover:shadow-[0_8px_20px_-6px_rgba(34,197,94,0.6)]"
                aria-label="Account menu"
              >
                {initials}
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-floating">
                  <div className="border-b border-border/60 px-4 py-3.5">
                    <div className="truncate text-sm font-semibold text-foreground">{user?.name}</div>
                    <div className="mt-0.5 truncate text-xs text-muted">{user?.email}</div>
                    <Badge variant={roleBadge.variant} size="xs" className="mt-2">
                      {roleBadge.label}
                    </Badge>
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger-strong transition-colors hover:bg-danger/10"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={closeDrawer} />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/60 bg-surface transition-transform duration-300 lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
          <NavLink to={home} onClick={closeDrawer}>
            <Logo size="md" />
          </NavLink>
          <button
            type="button"
            onClick={closeDrawer}
            className="grid size-8 place-items-center rounded-lg text-muted hover:bg-background-soft"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Primary mobile">
          {items.map((item) => navLinks(item, closeDrawer))}
        </nav>

        <div className="border-t border-border/60 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-background-soft p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0F766E] to-[#22C55E] text-xs font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">{user?.name}</div>
              <Badge variant={roleBadge.variant} size="xs" className="mt-0.5">
                {roleBadge.label}
              </Badge>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger-strong"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout