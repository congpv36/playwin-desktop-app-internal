import { initReactI18next } from 'react-i18next'
import LAYOUT_EN from '@renderer/locales/en/layout.json'
import MAIN_EN from '@renderer/locales/en/main.json'
import LAYOUT_VI from '@renderer/locales/vi/layout.json'
import MAIN_VI from '@renderer/locales/vi/main.json'
import LAYOUT_ZH from '@renderer/locales/zh/layout.json'
import MAIN_ZH from '@renderer/locales/zh/main.json'
import i18n from 'i18next'

export const resources = {
  en: {
    main: MAIN_EN,
    layout: LAYOUT_EN
  },
  vi: {
    main: MAIN_VI,
    layout: LAYOUT_VI
  },
  zh: {
    main: MAIN_ZH,
    layout: LAYOUT_ZH
  }
}
export const defaultNS = 'main'

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  ns: ['main', 'layout'],
  fallbackLng: 'en',
  defaultNS,
  interpolation: {
    escapeValue: false
  }
})

export default i18n
