import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from './ui/button'

export const PasswordChangeModal = ({
  account,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordError,
  handlePasswordSubmit,
  onClose
}: {
  account: { userName: string; expiredDate: string }
  currentPassword: string
  setCurrentPassword: (value: string) => void
  newPassword: string
  setNewPassword: (value: string) => void
  confirmPassword: string
  setConfirmPassword: (value: string) => void
  passwordError: string
  handlePasswordSubmit: (e: React.FormEvent) => Promise<void>
  onClose: () => void
}) => {
  const { t } = useTranslation('layout')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const EyeIcon = ({ open = true }: { open?: boolean }) =>
    open ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
        <path
          d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"></circle>
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
        <path
          d="M1 1l22 22"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <path
          d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.82 21.82 0 0 1 4.11-5.13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </svg>
    )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border border-border-default rounded-lg w-[700px] min-w-[700px] overflow-hidden shadow-xl">
        <div className="relative px-6 py-4 border-b border-border-default flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('change_password')}</h2>
          <div className="flex items-center gap-3">
            <button
              className="absolute top-[6px] right-[6px] font-normal block w-9 h-9 leading-none  hover:bg-gray-200 hover:rounded-full"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="grid grid-cols-2 gap-0">
          <div className="p-6 md:border-r md:border-border-default">
            <div className="grid grid-cols-2 gap-3 mb-3 items-center">
              <div className="text-sm font-bold">{t('account_id')}</div>
              <div className="text-brand-color text-sm">{account.userName}</div>

              <div className="text-sm font-bold">{t('expired_date')}</div>
              <div className="text-brand-color text-sm">{account.expiredDate}</div>
            </div>

            <p className="text-xs text-gray-500 mt-2">{t('note_change_password')}</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">{t('current_password')}</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pr-10 px-3 py-[6px]  border border-border-default rounded-md text-sm  focus:outline-none focus:ring-1 focus:ring-brand-color focus:border-brand-color"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((s) => !s)}
                    className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400"
                    aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  >
                    <EyeIcon open={showCurrent} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">{t('new_password')}</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pr-10 px-3 py-[6px]   border border-border-default rounded-md text-sm  focus:outline-none focus:ring-1 focus:ring-brand-color focus:border-brand-color"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400"
                    aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  >
                    <EyeIcon open={showNew} />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">{t('note_new_password')}</div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">{t('confirm_password')}</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pr-10 px-3 py-[6px]   border border-border-default rounded-md text-sm  focus:outline-none focus:ring-1 focus:ring-brand-color focus:border-brand-color"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400"
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>
            </div>
            {passwordError && (
              <div className="bg-red-900/20 text-red-400 px-3 py-2 rounded-md mt-4 text-xs border border-red-800/30">
                {passwordError}
              </div>
            )}
          </div>

          <div className="col-span-full px-6 py-4 border-t border-border-default flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className=" border-border-default hover:border-gray-400 hover:bg-transparent min-w-[96px] text-text-default"
              type="button"
            >
              {t('cancel')}
            </Button>
            <Button type="submit" className="min-w-[96px]">
              {t('update')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
