import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { CheckCircle } from 'lucide-react'

import { PasswordChangeModal } from '@renderer/components/PasswordChangeModal'
import { useCount } from '@renderer/context/CountContext'
import { useSidebar } from '@renderer/context/SidebarContext'
import BookOpen from '@renderer/icons/book-open'
import ChevronLeft from '@renderer/icons/chevron-left'
import ChevronRight from '@renderer/icons/chevron-right'
import ClipBoard from '@renderer/icons/clipboard'
import DataFlow from '@renderer/icons/dataflow'
import DocumentCurrencyDollar from '@renderer/icons/dollar'
import Feature from '@renderer/icons/feature'
import File from '@renderer/icons/file'
import LineChartUp from '@renderer/icons/line-chart-up'
import Settings from '@renderer/icons/settings'
import SwitchHorizontal from '@renderer/icons/switch-horizontal'

type NavItem = {
  name: string
  icon: React.ReactNode
  path: string
  badgeKey?: string
}

const NavItemComponent = ({
  item,
  collapsed,
  isActive
}: {
  item: NavItem
  collapsed: boolean
  isActive: boolean
}) => {
  const { totalBetList, totalWaitingList, totalContraList, totalSuccessList } = useCount()
  const badgeValueMap: Record<string, number> = {
    totalBetList,
    totalWaitingList,
    totalContraList,
    totalSuccessList
  }

  const badgeValue = item.badgeKey ? badgeValueMap[item.badgeKey] : null
  return (
    <Link to={item.path} title={collapsed ? item.name : ''}>
      <li
        className={clsx(
          'flex items-center px-4 py-[10px] my-[4px] rounded-[6px] hover:bg-border-default',
          isActive && 'bg-border-default'
        )}
      >
        <span className="relative menu-item-icon-size">
          {item.icon}
          {badgeValue !== null && badgeValue > 0 && (
            <span className="absolute -top-[12px] -left-[10px] bg-brand-color min-w-[18px] text-white text-[9px] p-1 rounded-full leading-none flex items-center justify-center">
              {badgeValue}
            </span>
          )}
        </span>
        {!collapsed && <span className="leading-none font-bold ml-2">{item.name}</span>}
      </li>
    </Link>
  )
}

const BREAKPOINT = 1200

const AppSidebar: React.FC = () => {
  const { t } = useTranslation('layout')

  const navItems: NavItem[] = [
    { icon: <BookOpen />, name: t('sports_book'), path: 'sports-book' },
    { icon: <File />, name: t('bet_list'), path: 'bet-list' },
    {
      icon: <ClipBoard />,
      name: t('waiting_list'),
      path: 'waiting-list',
      badgeKey: 'totalWaitingList'
    },
    {
      icon: <SwitchHorizontal />,
      name: t('contra_list'),
      path: 'contra-list',
      badgeKey: 'totalContraList'
    },
    {
      icon: <LineChartUp />,
      name: t('success_list'),
      path: 'success-list',
      badgeKey: 'totalSuccessList'
    },
    { icon: <DataFlow />, name: t('league_filter'), path: 'league-filter' },
    {
      icon: <DocumentCurrencyDollar />,
      name: t('point_randomizer'),
      path: 'league-point-randomizer'
    }
  ]

  const [isBreakpoint, setIsBreakpoint] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= BREAKPOINT : false
  )

  const { collapsed, setCollapsed } = useSidebar()
  const location = useLocation()
  const toggleSidebar = () => setCollapsed((prev) => !prev)
  const username = localStorage.getItem('username')
  const expiredDate = localStorage.getItem('expiredDate')
  const profile = JSON.parse(localStorage.getItem('profile') || '{}')
  const [noticeUpdate, setNoticeUpdate] = useState(() => {
    const savedNotice = sessionStorage.getItem('noticeUpdate')
    return savedNotice ? JSON.parse(savedNotice) : false
  })

  // user popup state
  const [showUserPopup, setShowUserPopup] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const userContainerRef = useRef<HTMLDivElement | null>(null)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)
  const version = localStorage.getItem('version')
  const toggleUserPopup = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setShowUserPopup((s) => !s)
  }

  const openPasswordModal = () => {
    setShowPasswordModal(true)
    setShowUserPopup(false) // Hide popup when modal opens
  }

  const resetPasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
  }

  const closePasswordModal = () => {
    setShowPasswordModal(false)
    resetPasswordForm()
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      setPasswordError('Current password is required')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    try {
      const result = await window.electron.ipcRenderer.invoke('ChangePassword', {
        currentPassword,
        newPassword
      })

      if (!result.success) {
        throw new Error(result.message)
      }

      closePasswordModal()

      setShowSaveSuccess(true)
      setMessageSuccess('Save successful!')
      setTimeout(() => {
        setShowSaveSuccess(false)
      }, 1500)
    } catch (error) {
      setPasswordError((error as Error).message)
    }
  }

  useEffect(() => {
    const updateAvailableListener = () => {
      setNoticeUpdate(true)
      sessionStorage.setItem('noticeUpdate', JSON.stringify(true))
    }
    window.electron.ipcRenderer.on('UpdateAvailable', updateAvailableListener)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('UpdateAvailable')
    }
  }, [])

  // close user popup on outside click or Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!userContainerRef.current) return
      if (!userContainerRef.current.contains(e.target as Node)) {
        setShowUserPopup(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserPopup(false)
      }
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // --- Breakpoint logic ---
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`)

    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in e ? e.matches : mq.matches
      setIsBreakpoint((prev) => (prev === matches ? prev : matches))
    }

    handler(mq)

    if ('addEventListener' in mq) {
      mq.addEventListener('change', handler as EventListener)
    } else {
      // @ts-ignore legacy
      mq.addListener(handler)
    }

    return () => {
      if ('removeEventListener' in mq) {
        mq.removeEventListener('change', handler as EventListener)
      } else {
        // @ts-ignore legacy
        mq.removeListener(handler)
      }
    }
  }, [])

  useEffect(() => {
    setCollapsed(isBreakpoint)
  }, [isBreakpoint])
  // --- end breakpoint logic ---

  return (
    <>
      <aside className="h-full flex flex-col  transition-all duration-300 ease-in-out border-r border-border-default">
        {/* Logo + Toggle */}
        <div
          className={clsx('flex items-center m-[20px]', {
            'justify-center': collapsed,
            'justify-between': !collapsed
          })}
        >
          {!collapsed && (
            <Link to="sports-book">
              <div className="flex flex-col items-start gap-1">
                <img src="images/logo-app.png" alt="Logo" className="w-20 h-auto cursor-pointer" />
                <span className="px-[6px] py-[1px] rounded bg-brand-color text-white text-[9px] font-bold tracking-widest leading-tight">
                  INTERNAL
                </span>
              </div>
            </Link>
          )}
          <button className="cursor-pointer" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        <div className={clsx('flex-1 flex flex-col justify-between ', { 'w-[177px]': !collapsed })}>
          {/* Nav Items */}
          <ul className="list-none mx-3 text-sm">
            {navItems.map((item, index) => (
              <NavItemComponent
                key={index}
                item={item}
                collapsed={collapsed}
                isActive={location.pathname.includes(item.path)}
              />
            ))}
          </ul>

          {/* Footer */}
          <div className="px-3 pb-5 text-sm">
            {/* Settings */}
            <ul className="list-none mb-4">
              <Link to="program-settings">
                <li
                  className={clsx(
                    'flex items-center px-4 py-[10px] my-[2px] hover:bg-hover-default rounded-[6px]',
                    location.pathname.includes('program-settings') && 'bg-hover-default'
                  )}
                  title={collapsed ? t('program_settings') : ''}
                >
                  <span className="menu-item-icon-size">
                    <Settings />
                  </span>
                  {!collapsed && (
                    <span className="leading-none font-bold ml-2">{t('program_settings')}</span>
                  )}
                </li>
              </Link>
            </ul>

            {/* Feature Box */}
            {noticeUpdate && (
              <div
                className={clsx('mb-4 rounded-[6px]', {
                  'p-2 bg-white': !collapsed
                })}
              >
                <div className={clsx({ 'flex justify-center': collapsed })}>
                  <Feature />
                </div>
                {!collapsed && (
                  <div className="mt-2">
                    <p className="font-bold">{t('update_available')}</p>
                    <span className="text-xs">{t('update_available_desc')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Admin Info + user popup */}
            <div className="border-t border-border-default pt-4">
              {!collapsed && (
                <div className="flex items-center gap-2 justify-center">
                  <div className=" relative flex items-center pb-4 text-base font-bold leading-none ">
                    <span className="mr-1">{import.meta.env.VITE_APP_DISPLAY_NAME}</span>
                    <span>{version || '1.0.0'}</span>
                    <div
                      className={` absolute  top-0 right-[-10px] w-2 h-2 rounded-full bg-green-color animate-pulse`}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center px-1 relative" ref={userContainerRef}>
                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none bg-brand-color cursor-pointer"
                  aria-expanded={showUserPopup}
                >
                  {username?.charAt(0) ?? profile?.username?.charAt(0)}
                </button>
                {!collapsed && (
                  <div
                    className="ml-2 cursor-pointer"
                    onClick={toggleUserPopup}
                    role="button"
                    tabIndex={0}
                    aria-label="User info"
                  >
                    <p className="text-sm font-medium truncate leading-none">
                      {username ?? profile?.username}
                    </p>
                    <p className="text-xs mt-1 flex items-center">
                      <span>{t('exp')}:</span>
                      <span className={`text-brand-color ml-1 font-bold`}>
                        {expiredDate
                          ? new Date(expiredDate).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : profile?.expiredDate
                            ? new Date(profile.expiredDate).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            : '--/--/----'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
      {showSaveSuccess && (
        <div className="fixed top-[5%] right-[2%] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center z-50 animate-pulse">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>{messageSuccess}</span>
        </div>
      )}
      {showPasswordModal && (
        <PasswordChangeModal
          account={{
            userName: username ?? profile?.username,
            expiredDate: expiredDate
              ? new Date(expiredDate).toLocaleString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })
              : profile?.expiredDate
                ? new Date(profile.expiredDate).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                : '--/--/----'
          }}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          passwordError={passwordError}
          handlePasswordSubmit={handlePasswordSubmit}
          onClose={closePasswordModal}
        />
      )}
    </>
  )
}

export default AppSidebar
