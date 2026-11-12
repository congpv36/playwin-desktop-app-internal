import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'

import { logTime } from '@/worker/lib/logTime'

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB in bytes
//const MAX_FILE_SIZE = 500 * 1024 // 500KB in bytes

const MAX_BACKUP_FILES = 5

export async function systemLogToFile(message: string, typeFile: string) {
  const logMessage = `${logTime()} ${message}\n`
  const directoryPath = `BetLog/System`
  const baseFileName = `${typeFile}`
  const filePath = path.join(directoryPath, `${typeFile}.txt`)

  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true })
    }

    let fileSize = 0
    if (fs.existsSync(filePath)) {
      const stats = await fsPromises.stat(filePath)
      fileSize = stats.size
    }

    if (fileSize >= MAX_FILE_SIZE) {
      await rotateLogFiles(directoryPath, baseFileName)
    }

    await fsPromises.appendFile(filePath, logMessage, 'utf-8')
  } catch (err) {
    console.error('Error khi ghi log:', err)
  }
}

async function rotateLogFiles(directoryPath: string, baseFileName: string) {
  const currentFile = path.join(directoryPath, `${baseFileName}.txt`)

  try {
    const oldestBackup = path.join(directoryPath, `${baseFileName}_backup.${MAX_BACKUP_FILES}.txt`)
    if (fs.existsSync(oldestBackup)) {
      await fsPromises.unlink(oldestBackup)
    }

    for (let i = MAX_BACKUP_FILES - 1; i >= 1; i--) {
      const oldBackup = path.join(directoryPath, `${baseFileName}_backup.${i}.txt`)
      const newBackup = path.join(directoryPath, `${baseFileName}_backup.${i + 1}.txt`)
      if (fs.existsSync(oldBackup)) {
        await fsPromises.rename(oldBackup, newBackup)
      }
    }

    if (fs.existsSync(currentFile)) {
      const firstBackup = path.join(directoryPath, `${baseFileName}_backup.1.txt`)
      await fsPromises.rename(currentFile, firstBackup)
    }
  } catch (err) {
    console.error('Error khi rotate file log:', err)
  }
}
