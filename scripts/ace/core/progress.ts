export type ProgressStage =
  | 'reading'
  | 'normalizing'
  | 'validating'
  | 'inspecting'
  | 'reading_catalog'
  | 'planning'
  | 'enriching'
  | 'writing'
  | 'completed'
  | 'failed'

export type ProgressSnapshot = {
  stage: ProgressStage
  current: number
  total: number
  percentage: number
  message: string
  startedAt: number
  elapsedMs: number
}

export type ProgressCallback = (
  snapshot: ProgressSnapshot
) => void

export class AceProgress {
  private stage: ProgressStage = 'reading'

  private current = 0

  private total = 0

  private message = ''

  private readonly startedAt = Date.now()

  private readonly callback?: ProgressCallback

  constructor(
    callback?: ProgressCallback
  ) {
    this.callback = callback
  }

  startStage(
    stage: ProgressStage,
    total: number,
    message: string
  ): void {
    this.stage = stage
    this.current = 0
    this.total = Math.max(total, 0)
    this.message = message

    this.emit()
  }

  update(
    current: number,
    message?: string
  ): void {
    this.current = Math.max(
      0,
      Math.min(
        current,
        this.total || current
      )
    )

    if (message) {
      this.message = message
    }

    this.emit()
  }

  increment(
    amount = 1,
    message?: string
  ): void {
    this.update(
      this.current + amount,
      message
    )
  }

  completeStage(
    message?: string
  ): void {
    if (this.total > 0) {
      this.current = this.total
    }

    if (message) {
      this.message = message
    }

    this.emit()
  }

  complete(
    message =
      'ACE terminó correctamente.'
  ): void {
    this.stage = 'completed'

    if (this.total > 0) {
      this.current = this.total
    }

    this.message = message

    this.emit()
  }

  fail(
    message: string
  ): void {
    this.stage = 'failed'
    this.message = message

    this.emit()
  }

  snapshot(): ProgressSnapshot {
    const percentage =
      this.total > 0
        ? Math.round(
            (this.current / this.total) *
              100
          )
        : 0

    return {
      stage: this.stage,
      current: this.current,
      total: this.total,
      percentage,
      message: this.message,
      startedAt: this.startedAt,
      elapsedMs:
        Date.now() -
        this.startedAt,
    }
  }

  private emit(): void {
    const snapshot =
      this.snapshot()

    if (this.callback) {
      this.callback(snapshot)
    }
  }
}

/**
 * Render simple para terminal.
 */
export function printProgress(
  snapshot: ProgressSnapshot
): void {
  const barWidth = 30

  const filled =
    Math.round(
      (snapshot.percentage / 100) *
        barWidth
    )

  const empty =
    Math.max(
      0,
      barWidth - filled
    )

  const bar =
    '█'.repeat(filled) +
    '░'.repeat(empty)

  const elapsedSeconds =
    (
      snapshot.elapsedMs / 1000
    ).toFixed(1)

  console.log(
    `[${bar}] ` +
      `${String(snapshot.percentage).padStart(3, ' ')}% ` +
      `| ${snapshot.message} ` +
      `| ${elapsedSeconds}s`
  )
}