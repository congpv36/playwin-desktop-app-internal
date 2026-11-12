export type LoginResponse = {
  status: 'success' | 'error'
  msg: number
  codeMessage: string
  username?: string
  mid?: number
  uid?: string
  passwdSafe?: string
  ltype?: number
  currency?: string
  oddF?: string[]
  payType?: number
  blackBoxStatus: boolean
}

export type DataProxy = {
  proxyScope: string
  newIpAddress: string
  newPort: string
  newUsername: string
  newPassword: string
}

export type GetTicketResponse = {
  code: number
  game_sc: number
  game_so: number
  mem_sc: number
  mem_so: number
  gold_gmin: number
  gold_gmax: number
  maxcredit: number
  con: number
  ratio: number
  ioratio: number
  spread: string
  strong: 'H' | 'C' | string
  restsinglecredit: number
  league_id: number
  dates: string
  times: string
  num_c: number
  num_h: number
  team_id_c: number
  team_id_h: number
  currency: string
  currency_value: number
  ltype: number
  pay_type: number
  username: string
  aid: number
  ms: string
  league_name: string
  team_name_c: string
  team_name_h: string
  max_gold: number
  dg: string
  ts: string
  ptype: string
  important: 'Y' | 'N'
  systime: string
  fast_check: string
}

export type TypeGetTickets_SingBet = {
  p: string
  uid: string
  ver: string
  langx: string
  odd_f_type: string
  golds: string
  gid: number
  gtype: string
  wtype: string

  rtype: string | number
  chose_team: string
  ioratio: number
  con: number
  ratio: number

  autoOdd: string
  timestamp: number
  timestamp2: string
  isRB: string
  imp: string
  ptype: string
  isYesterday: string
  f: string
}

export interface FtBetResponse {
  nowcredit: string
  code: string
  ticket_id: string
  gid: string
  gtype: 'FT'
  wtype: string
  rtype: string
  type: 'H' | 'C'
  strong: 'Y' | 'N'
  ioratio: string
  gold: string
  concede: string
  ratio: string
  spread: string
  date: string
  time: string
  team_id_h: string
  team_id_c: string
  league_id: string
  maxcredit: string
  mid: string
  username: string
  mtype: string
  league: string
  team_c: string
  team_h: string
  ball_act: string
  dg_mode: string
  ms: string
  timestamp: string
  ptype: string
  imp: 'Y' | 'N'
  systime: string
  isyesterday: 'Y' | 'N'
}
