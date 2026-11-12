/* eslint-disable @typescript-eslint/no-explicit-any */
import fsPromises from 'fs/promises'
import path from 'path'
import { setTimeout as delay } from 'timers/promises'

import { logTime } from '@/worker/lib/logTime'

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB
const MAX_BACKUP_FILES = 5

// Map lưu queue riêng cho từng file log
const logQueues = new Map<string, Promise<void>>()

export async function accountLogToFile(
  platformName: string,
  loginID: string,
  message: string,
  typeFile: string
) {
  const logMessage = `${logTime()} ${message}\n`
  const directoryPath = `BetLog/AccountLog/${platformName}_${loginID}`
  const baseFileName = `${platformName}_${loginID}_${typeFile}`
  const filePath = path.join(directoryPath, `${baseFileName}.txt`)

  const key = filePath
  const prevQueue = logQueues.get(key) || Promise.resolve()

  // Xếp công việc mới vào queue của file này
  const newQueue = prevQueue.then(async () => {
    try {
      await fsPromises.mkdir(directoryPath, { recursive: true })

      let fileSize = 0
      try {
        const stats = await fsPromises.stat(filePath)
        fileSize = stats.size
      } catch (err: any) {
        if (err.code !== 'ENOENT') throw err
      }

      if (fileSize >= MAX_FILE_SIZE) {
        await rotateLogFiles(directoryPath, baseFileName)
      }

      await fsPromises.appendFile(filePath, logMessage, 'utf-8')
    } catch (err) {
      console.error(`Error khi ghi log [${platformName}:${loginID}:${typeFile}]:`, err)
    }
  })

  logQueues.set(key, newQueue)

  await delay(100)
}

// Retry rename an toàn
async function safeRename(oldPath: string, newPath: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await fsPromises.rename(oldPath, newPath)
      return
    } catch (err: any) {
      if (err.code === 'EPERM' || err.code === 'EBUSY') {
        await new Promise((r) => setTimeout(r, 100 * 2 ** attempt)) // exponential backoff
      } else if (err.code === 'ENOENT') {
        return
      } else {
        throw err
      }
    }
  }
  throw new Error(`Không thể rename ${oldPath} -> ${newPath}`)
}

async function rotateLogFiles(directoryPath: string, baseFileName: string) {
  const currentFile = path.join(directoryPath, `${baseFileName}.txt`)

  try {
    const oldestBackup = path.join(directoryPath, `${baseFileName}_backup.${MAX_BACKUP_FILES}.txt`)
    try {
      await fsPromises.unlink(oldestBackup)
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err
    }

    for (let i = MAX_BACKUP_FILES - 1; i >= 1; i--) {
      const oldBackup = path.join(directoryPath, `${baseFileName}_backup.${i}.txt`)
      const newBackup = path.join(directoryPath, `${baseFileName}_backup.${i + 1}.txt`)
      try {
        await safeRename(oldBackup, newBackup)
      } catch (err: any) {
        if (err.code !== 'ENOENT') throw err
      }
    }

    try {
      await safeRename(currentFile, path.join(directoryPath, `${baseFileName}_backup.1.txt`))
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err
    }
  } catch (err) {
    console.error('Error khi rotate file log:', err)
  }
}

export async function flushLogQueue(platformName: string, loginID: string, typeFile: string) {
  const filePath = path.join(
    `BetLog/AccountLog/${platformName}_${loginID}`,
    `${platformName}_${loginID}_${typeFile}.txt`
  )
  const queue = logQueues.get(filePath)
  if (queue) await queue
}
