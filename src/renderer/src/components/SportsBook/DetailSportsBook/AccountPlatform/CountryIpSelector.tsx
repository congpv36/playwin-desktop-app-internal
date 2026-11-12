import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'

import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { COUNTRY_IP } from '@renderer/lib/country-ip.data'

export default function CountryIpSelector({ account, setCustomIP }) {
  const { t } = useTranslation('main')

  const [mode, setMode] = useState<'radio' | 'manual'>('radio')
  const [country, setCountry] = useState('Malaysia')
  const [ip, setIp] = useState(COUNTRY_IP['Malaysia'][0])
  const [manualIp, setManualIp] = useState('')

  const [openCountry, setOpenCountry] = useState(false)
  const [openIp, setOpenIp] = useState(false)

  const countryRef = useRef<HTMLDivElement>(null)
  const ipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mode === 'manual') {
      setCustomIP(manualIp || '')
    } else {
      setCustomIP(ip)
    }
  }, [mode, manualIp, ip])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setOpenCountry(false)
      }
      if (ipRef.current && !ipRef.current.contains(event.target as Node)) {
        setOpenIp(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    let foundCountry: string | null = null
    let foundIp: string | null = null

    for (const key of Object.keys(COUNTRY_IP)) {
      if (COUNTRY_IP[key].includes(account.customIP)) {
        foundCountry = key
        foundIp = account.customIP
        break
      }
    }

    if (foundCountry && foundIp) {
      setMode('radio')
      setCountry(foundCountry)
      setIp(foundIp)
    } else {
      setMode('manual')
      setManualIp(account.customIP)
    }
  }, [account])

  return (
    <RadioGroup
      value={mode}
      onValueChange={(val: 'radio' | 'manual') => setMode(val)}
      className="space-y-3 text-sm"
    >
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1 w-[85px]">
          <RadioGroupItem value="radio" />
          <span> {t('select_IP')}</span>
        </label>

        <div className={`flex gap-2 ${mode === 'manual' ? 'opacity-50 pointer-events-none' : ''}`}>
          <div ref={countryRef} className="relative w-32">
            <div
              onClick={() => {
                if (mode === 'manual') return
                setOpenCountry(!openCountry)
                setOpenIp(false)
              }}
              className=" px-2 py-1 rounded-md cursor-pointer border border-border-default flex justify-between items-center text-sm"
            >
              <span>{country}</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${openCountry ? 'rotate-180' : ''}`}
              />
            </div>

            {openCountry && (
              <div className="absolute z-10 mt-1 w-full border rounded-md max-h-40 overflow-y-auto border-border-default bg-white text-sm shadow-lg">
                {Object.keys(COUNTRY_IP).map((c) => (
                  <div
                    key={c}
                    onClick={() => {
                      setCountry(c)
                      setIp(COUNTRY_IP[c][0])
                      setOpenCountry(false)
                    }}
                    className="px-2 py-1 hover:bg-hover-default cursor-pointer"
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div ref={ipRef} className="relative w-40">
            <div
              onClick={() => {
                if (mode === 'manual') return
                setOpenIp(!openIp)
                setOpenCountry(false)
              }}
              className=" px-2 py-1 rounded-md cursor-pointer border border-border-default flex justify-between items-center text-sm"
            >
              <span>{ip}</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${openIp ? 'rotate-180' : ''}`}
              />
            </div>

            {openIp && (
              <div className="absolute z-10 mt-1 w-full  border rounded-md max-h-40 overflow-y-auto border-border-default bg-white text-sm shadow-lg">
                {COUNTRY_IP[country].map((item: string) => (
                  <div
                    key={item}
                    onClick={() => {
                      setIp(item)
                      setCustomIP(item)
                      setOpenIp(false)
                    }}
                    className="px-2 py-1 hover:bg-hover-default cursor-pointer"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1 w-[85px] cursor-pointer">
          <RadioGroupItem value="manual" id="manual" />
          <span> {t('enter_IP')}</span>
        </label>

        <input
          disabled={mode === 'radio'}
          className={`flex-1 bg-transparent border border-border-default rounded-md py-1 px-3 ${
            mode === 'radio' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          type="text"
          value={manualIp}
          onChange={(e) => {
            setManualIp(e.target.value)
            setCustomIP(e.target.value)
          }}
        />
      </div>
    </RadioGroup>
  )
}
