import { useEffect, useState } from 'react'
import AppLayout from '@renderer/layouts/AppLayout'

import DialogWithCountdown from '@renderer/components/Dialog/DialogWithCountdownProps'
import Ps3838AccountLockedModal from '@renderer/components/Dialog/Ps3838AccountLockedModal'
import Ps3838OtpModal from '@renderer/components/Dialog/Ps3838OtpModal'
import Ps3838RateLimitedModal from '@renderer/components/Dialog/Ps3838RateLimitedModal'
import SessionExpirePopup from '@renderer/components/Dialog/SessionExpirePopup'
import { useCount } from '@renderer/context/CountContext'
export default function Main() {
  const {
    setTotalBetList,
    setTotalWaitingList,
    setTotalContraList,
    setTotalSuccessList,
    setTotalSuccessListShowOdd,
    setTotalFailedBetList
  } = useCount()

  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const listenerMapping = [
      { event: 'TotalBetList', setState: setTotalBetList },
      { event: 'TotalWaitingList', setState: setTotalWaitingList },
      { event: 'TotalContraList', setState: setTotalContraList },
      { event: 'TotalSuccessList', setState: setTotalSuccessList },
      { event: 'TotalSuccessListShowOdd', setState: setTotalSuccessListShowOdd },
      { event: 'TotalFailedBetList', setState: setTotalFailedBetList }
    ]

    listenerMapping.forEach(({ event, setState }) => {
      window.electron.ipcRenderer.on(event, (_, data: number) => {
        if (event === 'TotalWaitingList') {
          setState(data)
        } else {
          setState((prev) => prev + 1)
        }
      })
    })

    return () => {
      listenerMapping.forEach(({ event }) => {
        window.electron.ipcRenderer.removeAllListeners(event)
      })
    }
  }, [])
  useEffect(() => {
    window.electron.onForceLogout((_event, data) => {
      if (data.message) {
        setMessage(data.message)

        setOpen(true)

        setTimeout(() => {
          window.electron.ipcRenderer.send('CloseAppByToken')
        }, 3000)
      }
    })
  }, [])

  useEffect(() => {
    window.electron.syncExpiredDate((_event, data) => {
      const expiredDate = new Date(data?.expiredDate)

      const formattedDate =
        expiredDate.getUTCFullYear() +
        '-' +
        String(expiredDate.getUTCMonth() + 1).padStart(2, '0') +
        '-' +
        String(expiredDate.getUTCDate()).padStart(2, '0') +
        ' ' +
        String(expiredDate.getUTCHours()).padStart(2, '0') +
        ':' +
        String(expiredDate.getUTCMinutes()).padStart(2, '0') +
        ':' +
        String(expiredDate.getUTCSeconds()).padStart(2, '0')

      window.electron.ipcRenderer.send('setExpiredDate', formattedDate, data?.versionLatest)
    })
  }, [])

  useEffect(() => {
    window.electron.ipcRenderer.on('ShowForceLogoutMessage', (message) => {
      alert(message || 'You have been logged out by server.')
    })
  }, [])

  const [sessionPopup, setSessionPopup] = useState<{
    expiredDate: string
    autoCloseMs: number
  } | null>()

  useEffect(() => {
    window.electron.ipcRenderer.on('show-session-expire-popup', (_event, payload) => {
      setSessionPopup(payload)
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('show-session-expire-popup')
    }
  }, [])

  const [otpRequest, setOtpRequest] = useState<{
    accountId: string
    loginID: string
    platformName: string
    autoOtpFailed?: boolean
  } | null>(null)
  const [otpInvalid, setOtpInvalid] = useState(false)
  const [otpErrorToken, setOtpErrorToken] = useState(0)
  const [otpSubmitting, setOtpSubmitting] = useState(false)

  useEffect(() => {
    window.electron.ipcRenderer.on(
      'Ps3838RequireOtp',
      (
        _event,
        data: {
          accountId: string
          loginID: string
          platformName: string
          autoOtpFailed?: boolean
        }
      ) => {
        setOtpRequest(data)
        setOtpInvalid(false)
        setOtpSubmitting(false)
        setRateLimitNotice(null)
      }
    )

    window.electron.ipcRenderer.on('Ps3838OtpInvalid', () => {
      setOtpInvalid(true)
      setOtpErrorToken((token) => token + 1)
      setOtpSubmitting(false)
    })

    window.electron.ipcRenderer.on('Ps3838OtpVerified', () => {
      setOtpRequest(null)
      setOtpInvalid(false)
      setOtpSubmitting(false)
    })

    window.electron.ipcRenderer.on(
      'Ps3838AccountLocked',
      (
        _event,
        data: { accountId: string; loginID: string; platformName: string; failedAttempts?: number }
      ) => {
        setOtpRequest(null)
        setOtpInvalid(false)
        setOtpSubmitting(false)
        setRateLimitNotice(null)
        setAccountLockNotice({ variant: 'temporary', ...data })
      }
    )

    window.electron.ipcRenderer.on(
      'Ps3838AccountDisabled',
      (_event, data: { accountId: string; loginID: string; platformName: string }) => {
        setOtpRequest(null)
        setOtpInvalid(false)
        setOtpSubmitting(false)
        setRateLimitNotice(null)
        setAccountLockNotice({ variant: 'disabled', ...data })
      }
    )

    window.electron.ipcRenderer.on(
      'Ps3838LoginNameExpired',
      (_event, data: { accountId: string; loginID: string; platformName: string }) => {
        setOtpRequest(null)
        setOtpInvalid(false)
        setOtpSubmitting(false)
        setRateLimitNotice(null)
        setAccountLockNotice({ variant: 'loginNameExpired', ...data })
      }
    )

    window.electron.ipcRenderer.on(
      'Ps3838RateLimited',
      (
        _event,
        data: { accountId: string; loginID: string; platformName: string; retryAfterSec: number }
      ) => {
        setRateLimitNotice(data)
      }
    )

    window.electron.ipcRenderer.on(
      'Ps3838RateLimitCleared',
      (_event, data: { accountId: string }) => {
        setRateLimitNotice((current) => (current?.accountId === data.accountId ? null : current))
      }
    )

    return () => {
      window.electron.ipcRenderer.removeAllListeners('Ps3838RequireOtp')
      window.electron.ipcRenderer.removeAllListeners('Ps3838OtpInvalid')
      window.electron.ipcRenderer.removeAllListeners('Ps3838OtpVerified')
      window.electron.ipcRenderer.removeAllListeners('Ps3838AccountLocked')
      window.electron.ipcRenderer.removeAllListeners('Ps3838AccountDisabled')
      window.electron.ipcRenderer.removeAllListeners('Ps3838LoginNameExpired')
      window.electron.ipcRenderer.removeAllListeners('Ps3838RateLimited')
      window.electron.ipcRenderer.removeAllListeners('Ps3838RateLimitCleared')
    }
  }, [])

  const [accountLockNotice, setAccountLockNotice] = useState<{
    variant: 'temporary' | 'disabled' | 'loginNameExpired'
    accountId: string
    loginID: string
    platformName: string
    failedAttempts?: number
  } | null>(null)

  const [rateLimitNotice, setRateLimitNotice] = useState<{
    accountId: string
    loginID: string
    platformName: string
    retryAfterSec: number
  } | null>(null)

  const handleOtpSubmit = (otp: string) => {
    if (!otpRequest) return
    setOtpSubmitting(true)
    window.electron.ipcRenderer.send('Ps3838SubmitOtp', { accountId: otpRequest.accountId, otp })
  }

  const handleOtpClose = () => {
    if (otpRequest) {
      window.electron.ipcRenderer.send('Ps3838CancelOtp', { accountId: otpRequest.accountId })
    }
    setOtpRequest(null)
    setOtpInvalid(false)
    setOtpSubmitting(false)
  }

  const handleAccountLockedClose = () => {
    if (accountLockNotice) {
      window.electron.ipcRenderer.send('Ps3838CancelOtp', {
        accountId: accountLockNotice.accountId
      })
    }
    setAccountLockNotice(null)
  }

  const handleRateLimitCancel = () => {
    if (rateLimitNotice) {
      window.electron.ipcRenderer.send('Ps3838CancelRateLimit', {
        accountId: rateLimitNotice.accountId
      })
    }
    setRateLimitNotice(null)
  }

  return (
    <>
      <AppLayout />
      {sessionPopup && (
        <SessionExpirePopup
          expiredDate={sessionPopup.expiredDate}
          autoCloseMs={sessionPopup.autoCloseMs}
          onClose={() => setSessionPopup(null)}
        />
      )}
      {open && (
        <DialogWithCountdown
          open={open}
          setOpen={() => setOpen(false)}
          message={message || 'Your session has expired, please login again.'}
        />
      )}
      {otpRequest && (
        <Ps3838OtpModal
          loginID={otpRequest.loginID}
          platformName={otpRequest.platformName}
          invalid={otpInvalid}
          errorToken={otpErrorToken}
          submitting={otpSubmitting}
          autoOtpFailed={otpRequest.autoOtpFailed}
          onSubmit={handleOtpSubmit}
          onClose={handleOtpClose}
        />
      )}
      {accountLockNotice && (
        <Ps3838AccountLockedModal
          variant={accountLockNotice.variant}
          platformName={accountLockNotice.platformName}
          loginID={accountLockNotice.loginID}
          failedAttempts={accountLockNotice.failedAttempts}
          onClose={handleAccountLockedClose}
        />
      )}
      {rateLimitNotice && (
        <Ps3838RateLimitedModal
          loginID={rateLimitNotice.loginID}
          platformName={rateLimitNotice.platformName}
          retryAfterSec={rateLimitNotice.retryAfterSec}
          onCancel={handleRateLimitCancel}
        />
      )}
    </>
  )
}
