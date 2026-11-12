/* eslint-disable @typescript-eslint/no-explicit-any */
import { SportBookCombination } from '@db/model'
import { SportBookCombinationDBType } from '@db/schema/sportBookCombination'
import { BrowserWindow } from 'electron'

import handleFailedBetList from '../lib/handleFailedBetList'
import createWorker from './worker?nodeWorker'

import handleBetList from '@/worker/lib/handleBetList'

const activeWorkers = new Map()

export const platformPairStatusManager = (mainWindow: BrowserWindow) => {
  const listPlatformPair = SportBookCombination.findAll({
    isValid: 1
  }) as SportBookCombinationDBType[]

  const newPairs = listPlatformPair.map((item) => item.key)

  newPairs.forEach((pair) => {
    if (!activeWorkers.has(pair)) {
      const worker = createWorker({ workerData: { pair } })

      worker.on('message', async (msg) => {
        if (!mainWindow.isDestroyed()) {
          if (msg.type == 'BetList') {
            await handleBetList(msg.recordDB, mainWindow)
          } else if (msg.type == 'FailedBetList') {
            await handleFailedBetList(msg.recordDB, mainWindow)
          } else {
            console.log(`Worker [${pair}] say: ${msg.type}`)
          }
        }
      })

      worker.on('error', (err) => {
        console.error(`Worker [${pair}] error:`, err)
        activeWorkers.delete(pair)
      })

      worker.on('exit', (code) => {
        console.log(`Worker [${pair}] exited with code ${code}`)
        activeWorkers.delete(pair)
      })

      activeWorkers.set(pair, worker)
      console.log(`Worker [${pair}] created.`)
    }
  })

  for (const existingPair of activeWorkers.keys()) {
    if (!newPairs.includes(existingPair)) {
      const workerToRemove = activeWorkers.get(existingPair)
      workerToRemove.terminate()
      activeWorkers.delete(existingPair)
      console.log(`Remove Worker [${existingPair}] terminated.`)
    }
  }
}
