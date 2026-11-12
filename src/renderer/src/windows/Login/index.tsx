import { useCallback, useEffect, useRef, useState } from 'react'
import LoadingLogin from '@renderer/windows/Login/LoadingLogin'
import LoadingUpdateApp from '@renderer/windows/Login/LoadingUpdateApp'

import { Checkbox } from '@renderer/components/ui/checkbox'
import Eye from '@renderer/icons/eye'
import EyeSlash from '@renderer/icons/eye-slash'

export default function Login() {
  const isAttemptingLogin = useRef(false)

  const [loadingLogin, setLoadingLogin] = useState(false)
  const [loadingUpdateApp, setLoadingUpdateApp] = useState(false)

  const [username, setUserName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isSaveLogin, setIsSaveLogin] = useState<boolean>(() => {
    const savedState = localStorage.getItem('isSaveLogin')
    return savedState !== null ? JSON.parse(savedState) : false
  })

  useEffect(() => {
    localStorage.setItem('isSaveLogin', JSON.stringify(isSaveLogin))

    if (isSaveLogin) {
      const savedUserName = localStorage.getItem('username')
      const savedPassword = localStorage.getItem('password')
      if (savedUserName && savedPassword) {
        setUserName(savedUserName)
        setPassword(savedPassword)
      }
    } else {
      localStorage.removeItem('username')
      localStorage.removeItem('password')
    }
  }, [isSaveLogin])

  const CloseLoginWindow = useCallback(() => {
    window.electron.ipcRenderer.send('CloseLoginWindow')
  }, [])

  const checkInternetConnection = () => {
    return navigator.onLine
  }

  const handleLogin = useCallback(() => {
    if (isAttemptingLogin.current) return

    setErrorMessage('')

    if (!username || !password) {
      setErrorMessage('Please enter both username and password.')
      return
    }

    if (!checkInternetConnection()) {
      setErrorMessage('No internet. Please check your connection and try again.')
      return
    }
    setLoadingLogin(true)
    isAttemptingLogin.current = true
    window.electron.ipcRenderer.send('AttemptLogin', { username, password })

    window.electron.ipcRenderer.once('LoginResult', (_event, { success, message, data }) => {
      setLoadingLogin(false)
      isAttemptingLogin.current = false
      if (success) {
        const profile = {
          username: username,
          expiredDate: data?.account?.expiredDate || '',
          password: password,
          isTrialAccount: data?.account?.isTrialAccount || false
        }

        localStorage.setItem('profile', JSON.stringify(profile))
        if (isSaveLogin) {
          localStorage.setItem('username', username)
          localStorage.setItem('password', password)
          localStorage.setItem('expiredDate', data?.account?.expiredDate)
        } else {
          localStorage.removeItem('username')
          localStorage.removeItem('password')
          localStorage.removeItem('expiredDate')
        }
      } else {
        setErrorMessage(message || 'Login failed. Please try again.')
        localStorage.removeItem('profile')
      }
    })
  }, [username, password, isSaveLogin])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleLogin()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleLogin])

  useEffect(() => {
    const showLoading = () => setLoadingUpdateApp(true)
    window.electron.ipcRenderer.on('show-loading', showLoading)
    return () => {
      window.electron.ipcRenderer.removeAllListeners('show-loading')
    }
  }, [])

  return (
    <div className="h-full py-[64px] px-[48px] border border-border-default bg-white">
      <div
        className="absolute top-0 left-0 w-full h-[40px]"
        style={{ ['-webkit-app-region']: 'drag' } as React.CSSProperties}
      />
      <div className="h-full">
        <div className="mb-[32px]">
          <div className="pb-[16px] flex justify-center">
            <img src="images/logo-app.png" alt="LogoLogin" className="cursor-pointer" />
          </div>
          <div className="flex flex-col gap-3 items-center">
            <span className="px-2 py-[2px] rounded-full bg-brand-color/10 text-brand-color text-xs font-semibold tracking-widest">
              INTERNAL
            </span>
            <p className="text-3xl font-bold">{`Log in to ${import.meta.env.VITE_APP_DISPLAY_NAME}`}</p>
            <p className="text-base text-[#94979C]">Welcome back! Please enter your details.</p>
          </div>
          <div className="text-[#FF0000] font-semibold text-center h-1 mb-9">
            {errorMessage ?? ''}
          </div>
        </div>

        <div>
          <div>
            <div className="mb-[20px]">
              <p className="text-sm mb-[6px]">Username</p>
              <input
                type="text"
                maxLength={20}
                className={`focus-within:border-brand-color w-full h-[44px] outline-none  bg-white border border-border-default rounded-[8px] px-[14px] py-[10px]`}
                value={username}
                onChange={(e) => {
                  setUserName(e.target.value)
                  setErrorMessage('')
                }}
              />
            </div>

            <div>
              <p className="text-sm mb-[6px]">Password</p>
              <div
                className={`focus-within:border-brand-color border h-[44px] border-border-default rounded-[8px] bg-white flex  items-center justify-between`}
              >
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  maxLength={20}
                  value={password}
                  className="w-full outline-none bg-white  px-[14px]"
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrorMessage('')
                  }}
                />
                <button
                  type="button"
                  className=" w-4 text-gray-400 hover:text-gray-200 mr-1"
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                >
                  {isPasswordVisible ? <Eye /> : <EyeSlash />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex my-[24px] justify-between">
            <div className="flex items-center">
              <Checkbox
                id="checkboxLogin"
                checked={isSaveLogin}
                onCheckedChange={(checked) => setIsSaveLogin(checked === true)}
                className="mr-[8px]"
              />
              <label htmlFor="checkboxLogin" className="cursor-pointer">
                Remember me
              </label>
            </div>
            <div className="underline cursor-pointer" onClick={handleLogin}>
              Re-update
            </div>
          </div>

          <div>
            <button
              className={` h-[44px] w-full rounded-[8px] mb-[16px] hover:opacity-90 bg-brand-color text-white`}
              onClick={handleLogin}
            >
              Login
            </button>
            <button
              className=" h-[44px] w-full rounded-[8px] border border-border-default hover:opacity-90 hover:border-gray-700"
              onClick={CloseLoginWindow}
            >
              Exit
            </button>
          </div>
        </div>
      </div>
      {loadingLogin && <LoadingLogin />}
      {loadingUpdateApp && <LoadingUpdateApp />}
    </div>
  )
}
