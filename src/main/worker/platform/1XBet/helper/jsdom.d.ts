declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: Record<string, unknown>)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly window: any
  }

  export class VirtualConsole {
    sendTo(console: Console, options?: { omitJSDOMErrors?: boolean }): this
  }
}
