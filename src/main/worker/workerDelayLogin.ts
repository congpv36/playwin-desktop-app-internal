import { parentPort, workerData } from 'worker_threads'

const port = parentPort
if (!port) throw new Error('IllegalState')

const { numberDelay } = workerData

let remainingTime = numberDelay

const interval = setInterval(() => {
  remainingTime -= 1

  port.postMessage(remainingTime)
  if (remainingTime <= 0) {
    clearInterval(interval)
    process.exit(0)
  }
}, 1000)
