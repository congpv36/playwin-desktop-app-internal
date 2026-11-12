import { Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

import { AccountType } from '@shared/common/types'

export function isProxyConfigValid(account: AccountType) {
  const setting = Setting.findAll()[0] as SettingSchemaType
  const {
    ipAddress: serverIp,
    port: serverPort,
    username: serverUser,
    password: serverPass
  } = setting
  const { proxyIP, proxyPort, proxyUsername, proxyPassword, proxyScope } = account

  const newIpAddress = proxyIP ? proxyIP : serverIp
  const newPort = proxyPort && proxyPort !== '0' ? proxyPort : serverPort
  const newUsername = proxyUsername ? proxyUsername : serverUser
  const newPassword = proxyPassword ? proxyPassword : serverPass

  const ipRegex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
  const portRegex = /^\d+$/

  const isIpValid = ipRegex.test(newIpAddress)
  const isPortValid = portRegex.test(newPort)

  if (
    proxyScope !== 'None' &&
    (!newIpAddress ||
      !newPort ||
      newPort === '0' ||
      !newUsername ||
      !newPassword ||
      !isIpValid ||
      !isPortValid)
  ) {
    return { status: false, data: { proxyScope, newIpAddress, newPort, newUsername, newPassword } }
  }

  return { status: true, data: { proxyScope, newIpAddress, newPort, newUsername, newPassword } }
}
