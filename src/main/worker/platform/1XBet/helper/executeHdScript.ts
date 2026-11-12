import crypto from 'crypto'

import { JSDOM, VirtualConsole } from 'jsdom'

export async function executeHdScript1XBet(
  scriptSource: string,
  options: { url: string; userAgent: string; xHdTraceId: string }
): Promise<string> {
  const virtualConsole = new VirtualConsole().sendTo(console, { omitJSDOMErrors: true })

  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: options.url,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    userAgent: options.userAgent,
    virtualConsole
  })

  const { window } = dom

  try {
    const meta = window.document.createElement('meta')
    meta.setAttribute('name', 'x-hd-trace-id')
    meta.setAttribute('content', options.xHdTraceId)
    window.document.head.appendChild(meta)

    window.MessageChannel = MessageChannel
    window.TextEncoder = TextEncoder
    window.TextDecoder = TextDecoder
    window.crypto.subtle = crypto.webcrypto.subtle

    const result = await window.eval(scriptSource)

    if (typeof result !== 'string' || !result) {
      throw new Error(`Unexpected hd-script result: ${JSON.stringify(result)}`)
    }

    return result
  } finally {
    window.close()
  }
}
