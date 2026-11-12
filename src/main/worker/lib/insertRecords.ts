import Model from '@db/model'

export const insertRecords = (records, Model: Model) => {
  for (const record of records) {
    Model.insertMany([record])
  }
  records.length = 0
}
