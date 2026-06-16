type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  const ts = new Date().toISOString()
  const prefix = `[${ts}] [${level.toUpperCase()}] [${module}]`
  // ESLint only permits warn/error — route debug/info through warn
  const fn = level === 'error' ? console.error : console.warn
  if (data !== undefined) {
    fn(`${prefix} ${message}`, data)
  } else {
    fn(`${prefix} ${message}`)
  }
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, data?: unknown) => log('debug', module, msg, data),
    info:  (msg: string, data?: unknown) => log('info',  module, msg, data),
    warn:  (msg: string, data?: unknown) => log('warn',  module, msg, data),
    error: (msg: string, data?: unknown) => log('error', module, msg, data),
  }
}

export const logger = createLogger('app')
