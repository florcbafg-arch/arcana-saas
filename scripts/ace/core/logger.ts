import fs from 'node:fs'
import path from 'node:path'

export type AceLogLevel =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'

export type AceLogEntry = {
  timestamp: string
  level: AceLogLevel
  message: string
  data?: unknown
}

export class AceLogger {
  private readonly logDirectory: string

  private readonly logFilePath: string

  constructor(
    filePrefix = 'ace'
  ) {
    this.logDirectory =
      path.resolve(
        process.cwd(),
        'logs',
        'ace'
      )

    fs.mkdirSync(
      this.logDirectory,
      {
        recursive: true,
      }
    )

    const timestamp =
      new Date()
        .toISOString()
        .replace(/[:.]/g, '-')

    this.logFilePath =
      path.join(
        this.logDirectory,
        `${filePrefix}-${timestamp}.log`
      )
  }

  info(
    message: string,
    data?: unknown
  ): void {
    this.write(
      'INFO',
      message,
      data
    )
  }

  success(
    message: string,
    data?: unknown
  ): void {
    this.write(
      'SUCCESS',
      message,
      data
    )
  }

  warning(
    message: string,
    data?: unknown
  ): void {
    this.write(
      'WARNING',
      message,
      data
    )
  }

  error(
    message: string,
    data?: unknown
  ): void {
    this.write(
      'ERROR',
      message,
      data
    )
  }

  getFilePath(): string {
    return this.logFilePath
  }

  private write(
    level: AceLogLevel,
    message: string,
    data?: unknown
  ): void {
    const entry: AceLogEntry = {
      timestamp:
        new Date().toISOString(),

      level,

      message,

      ...(data !== undefined
        ? { data }
        : {}),
    }

    const line =
      JSON.stringify(entry) +
      '\n'

    fs.appendFileSync(
      this.logFilePath,
      line,
      'utf8'
    )
  }
}