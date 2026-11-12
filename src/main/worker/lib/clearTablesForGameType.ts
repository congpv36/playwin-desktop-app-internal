import { clearTable } from '@db/model'

export function clearTablesForGameType() {
  const tables = ['PerMatchLimit', 'DataBet']
  tables.forEach((table) => clearTable(table))
}
