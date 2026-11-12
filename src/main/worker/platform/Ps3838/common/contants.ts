import crypto from 'crypto'

export const gameTypeMapPs3838: { [key: string]: number } = {
  Early: 0,
  Today: 1,
  Running: 2
}

export const ODD_CODE = {
  FT: {
    HDP: {
      HOME: '0|2|0|1',
      AWAY: '0|2|1|1',
      '0HOME': '0|2|0|0',
      '0AWAY': '0|2|1|0'
    },
    POINT: {
      OVER: '0|3|3|1',
      UNDER: '0|3|4|1',
      '0OVER': '0|3|3|0',
      '0UNDER': '0|3|4|0'
    }
  },
  FH: {
    HDP: {
      HOME: '1|2|0|1',
      AWAY: '1|2|1|1',
      '0HOME': '1|2|0|0',
      '0AWAY': '1|2|1|0'
    },
    POINT: {
      OVER: '1|3|3|1',
      UNDER: '1|3|4|1',
      '0OVER': '1|3|3|0',
      '0UNDER': '1|3|4|0'
    }
  }
}

export const buildHeadersPs3838 = (
  account: { customIP?: string | null; loginURL: string },
  vHucode?: string
) => ({
  'Accept-Language':
    'en-US,en;q=0.9,th;q=0.8,zh-CN;q=0.7,zh;q=0.6,ja;q=0.5,cs;q=0.4,zh-TW;q=0.3,ms;q=0.2',
  'Accept-Encoding': 'gzip, deflate, br',
  Referer: `${account.loginURL}en/sports`,
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'X-Requested-With': 'XMLHttpRequest',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  ...(vHucode ? { 'V-Hucode': vHucode } : {}),
  ...(account?.customIP ? { 'X-Forwarded-For': account.customIP } : {})
})

export const buildHeadersBalancePs3838 = (
  account: { customIP?: string | null; loginURL: string },
  vHucode?: string
) => ({
  accept: 'application/json, text/plain, */*',
  'accept-language': 'vi,en-US;q=0.9,en;q=0.8,ko;q=0.7',
  'cache-control': 'no-cache',
  'content-type': 'application/x-www-form-urlencoded',
  origin: account.loginURL.replace(/\/$/, ''),
  pragma: 'no-cache',
  referer: `${account.loginURL}en/sports/soccer`,
  'sec-ch-ua': `"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"`,
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': `"Windows"`,
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest',
  ...(vHucode ? { 'v-hucode': vHucode } : {}),
  ...(account?.customIP ? { 'X-Forwarded-For': account.customIP } : {})
})

export const buildHeadersLogin = (account: {
  customIP?: string | null
  loginURL: string
  loginID: string
}) => ({
  accept: 'application/json, text/plain, */*',
  'accept-language': 'vi,en-US;q=0.9,en;q=0.8,ko;q=0.7',
  'content-type': 'application/x-www-form-urlencoded',
  origin: account.loginURL,
  referer: `${account.loginURL}en/sports/soccer`,
  'sec-ch-ua': `"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"`,
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': `"Windows"`,
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'trust-code': '',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'X-User-Identifier': crypto.createHash('md5').update(account.loginID).digest('hex'),
  'x-app-data': 'directusToken=TwEdnphtyxsfMpXoJkCkWaPsL2KJJ3lo;dp5W=2rxe_eQHnXpR4ucTrt;lang=en_US',
  'x-trust-client': 'false',
  ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
})

export const buildHeadersVerifyOtp = (account: { customIP?: string | null; loginURL: string }) => ({
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  'content-type': 'application/json;charset=UTF-8',
  origin: account.loginURL,
  referer: `${account.loginURL}en/sports/soccer`,
  'sec-ch-ua': `"Chromium";v="151", "Not=A?Brand";v="99"`,
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': `"Linux"`,
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
  'x-app-data': 'directusToken=TwEdnphtyxsfMpXoJkCkWaPsL2KJJ3lo;dpAOW=q9pmurY_jhI_X;lang=en_US',
  ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
})
