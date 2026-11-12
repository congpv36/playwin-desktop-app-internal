import { AccountType } from '@shared/common/types'

export function buildPlatformUrl_3In1Bet(account: AccountType, type?: string) {
  const url = account.loginURL

  if (!type) return url

  const urlMap = {
    CHECK: `${url}check.aspx`,
    PROCESSLOGIN: `${url}main/processlogin.aspx`,
    MAIN_TOP_HEADER: `${url}main/topheader.aspx?lan=en-US`,
    USER_INFO_PANEL_HOST: `${url}member/betsview/UserInfoPanelHost.aspx?Ajax=1`,
    DATA_ODDS: `${url}Member/BetsView/BetLight/DataOdds.ashx`,
    SET_DATA: `${url}member/betsview/Bet.asmx/SetData`,
    BET_NOW: `${url}member/betsview/Bet.asmx/BetNow`,
    AR: `${url}member/betsview/data.asmx/sports/order/unify`
  }

  return urlMap[type] ?? url
}

export function buildHdpDoubleUrl(type: string, API_BASE_URL: string): string {
  return `${API_BASE_URL}Member/BetOdds/HdpDouble.aspx?v=1&m1=${type}&sports=S_&isHighlight=false`
}

export function createPayload(gameType) {
  const fcMap = {
    Early: '6',
    Today: '1',
    Running: '4'
  }

  return {
    fc: fcMap[gameType],
    m_accType: 'MY+MR',
    SystemLanguage: 'en-US',
    TimeFilter: '0',
    m_gameType: 'S_',
    m_SortByTime: '0',
    m_LeagueList: '',
    SingleDouble: 'double',
    clientTime: '',
    c: 'A',
    fav: '',
    exlist: '0',
    keywords: '',
    m_sp: '0'
  }
}

export function isArError(res: unknown): res is { Au: number } {
  return typeof res === 'object' && res !== null && 'Au' in res
}

export function formatStat(text: string | null): string | null {
  if (text === null) return null
  if (text === 'HT') return 'HT'

  // Trường hợp có cộng thêm phút, ví dụ "1H 46+1"
  const extraMatch = text.match(/^(\d+)H\s*(\d+)\+(\d+)$/)
  if (extraMatch) {
    const hour = extraMatch[1]
    const minute = parseInt(extraMatch[2], 10)
    const extra = parseInt(extraMatch[3], 10)
    return `${hour}H ${minute + extra}'`
  }

  // Trường hợp bình thường: "1H 46"
  const match = text.match(/^(\d+)H\s*(\d+)$/)
  if (match) {
    return text + "'"
  }

  return text
}
