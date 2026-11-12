import JSEncrypt from 'jsencrypt'

import { AccountType } from '@shared/common/types'

export const configHeaders = (
  accountInfo: AccountType,
  contentType = 'application/x-www-form-urlencoded; charset=UTF-8'
) => ({
  Referer: `${accountInfo.host}/sports`,
  custid: accountInfo.parent_id ?? '',
  'Accept-Language': 'en-US,en;q=0.9,th;q=0.8,zh-CN;q=0.7,zh;q=0.6,ja;q=0.5,cs;q=0.4,zh-TW;q=0.3',
  'Accept-Encoding': 'gzip, deflate, br',
  Username: accountInfo.loginID,
  Devicetype: '1',
  Uid: accountInfo.loginID,
  Origin: accountInfo.host,
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'X-Requested-With': 'XMLHttpRequest',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Content-Type': contentType,
  Cookie: accountInfo.cookie,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  ...(accountInfo.customIP ? { 'X-Forwarded-For': accountInfo.customIP } : {})
})

export const toJsonPayload = (
  itemList: Record<string, unknown>[],
  additionalParams: Record<string, unknown>
) => {
  const payload = { ItemList: [] as Record<string, unknown>[] }

  itemList.forEach((item) => {
    payload.ItemList.push({ ...item })
  })

  Object.assign(payload, additionalParams)

  return JSON.stringify(payload)
}

export function CFS(codeStr, IsSecond = null) {
  function CfsCode(nWord) {
    let result = ''
    for (let cc = 1; cc <= nWord.length; cc++) {
      result += nWord.charAt(cc - 1).charCodeAt(0)
    }
    const DecimalValue = new Number(result)
    result = DecimalValue.toString(16)
    return result
  }

  const CodeLen = 30
  const CodeSpace = CodeLen - codeStr.length

  if (CodeSpace > 1) {
    for (let cecr = 1; cecr <= CodeSpace; cecr++) {
      codeStr += String.fromCharCode(21)
    }
  }
  let NewCode = 1

  for (let cecb = 1; cecb <= CodeLen; cecb++) {
    const Been = CodeLen + codeStr.charAt(cecb - 1).charCodeAt(0) * cecb
    NewCode *= Been
  }

  const tmpNewCode = new Number(NewCode.toPrecision(15))
  codeStr = tmpNewCode.toString().toUpperCase()

  if (IsSecond != null) {
    let atemp = +new Number(codeStr.substring(0, codeStr.indexOf('E')))
    atemp -= 0.00000000000001
    const btemp = codeStr.substring(codeStr.indexOf('E'), codeStr.length)
    codeStr = atemp + btemp
  }
  let NewCode2 = ''

  for (let cec = 1; cec <= codeStr.length; cec++) {
    NewCode2 += CfsCode(codeStr.substring(cec - 1, cec + 2))
  }

  let CfsEncodeStr = ''
  for (let cec = 20; cec <= NewCode2.length - 18; cec += 2) {
    CfsEncodeStr += NewCode2.charAt(cec - 1)
  }
  return CfsEncodeStr.toUpperCase()
}

export const RSA = (password, rsaInfo: { mkey: string; ekey: string }) => {
  const rsaPublicKey = rsaInfo?.mkey || ''
  const exponentHex = rsaInfo?.ekey || ''

  if (rsaPublicKey === '' || exponentHex === '') {
    return ''
  }

  const encryptor = new JSEncrypt()
  const key = encryptor.getKey()
  key.setPublic(rsaPublicKey, exponentHex)
  const encryptedPassword = encryptor.encrypt(password)

  if (encryptedPassword) {
    // JSEncrypt returns Base64, convert to Hex
    const bytes = atob(encryptedPassword)
      .split('')
      .map((c) => {
        return `0${c.charCodeAt(0).toString(16)}`.slice(-2)
      })
      .join('')
    return bytes.toUpperCase()
  }

  return encryptedPassword
}

export async function extractTkAndId(html) {
  try {
    // Regex tìm giá trị chuỗi trong MS2.id và MS2.at
    const idRegex = /MS2\.id\s*=\s*"([^"]+)"/
    const atRegex = /MS2\.at\s*=\s*"([^"]+)"/

    const matchId = html.match(idRegex)
    const matchAt = html.match(atRegex)

    if (!matchId || !matchAt) {
      throw new Error('MS2.id or MS2.at not found in HTML')
    }

    // Lấy giá trị thực (group 1)
    const id = matchId[1]
    const tk = matchAt[1]

    if (!tk || !id) {
      throw new Error('tk or ID not found in MS2.account')
    }

    return { tk, ID: id }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error extracting tk and ID:', error.message)
    } else {
      console.error('Error extracting tk and ID:', error)
    }
    return null
  }
}

export function buildSocketIoWsUrl(token: string, id: string) {
  const crypto = require('crypto')
  // Tạo gid random 16 hex
  function createGid() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint8Array(8)
      crypto.getRandomValues(arr)
      return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
    } else {
      const nodeCrypto = require('crypto')
      return nodeCrypto.randomBytes(8).toString('hex')
    }
  }

  const gid = createGid()
  const rid = 'jwt'
  const host = 'agnj3.viva88.net'

  return `wss://${host}/socket.io/?gid=${gid}&token=${token}&id=${id}&rid=${rid}&EIO=3&transport=websocket`
}
