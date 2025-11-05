// Pipeline Logger Utility

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  step?: string;
  message: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

class PipelineLogger {
  private logs: LogEntry[] = [];
  private stepStartTimes: Map<string, number> = new Map();

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private log(level: LogLevel, step: string | undefined, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      step,
      message,
      metadata,
    };

    this.logs.push(entry);

    // Console output with color
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const color = colors[level];

    const stepPrefix = step ? `[${step}] ` : '';
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    
    console.log(`${color}[${entry.timestamp}] [${level}] ${stepPrefix}${message}${metadataStr}${reset}`);
  }

  debug(step: string | undefined, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, step, message, metadata);
  }

  info(step: string | undefined, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, step, message, metadata);
  }

  warn(step: string | undefined, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, step, message, metadata);
  }

  error(step: string | undefined, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, step, message, metadata);
  }

  startStep(step: string) {
    this.stepStartTimes.set(step, Date.now());
    this.info(step, `Starting ${step}...`);
  }

  endStep(step: string, success: boolean = true) {
    const startTime = this.stepStartTimes.get(step);
    const duration_ms = startTime ? Date.now() - startTime : undefined;
    
    if (success) {
      this.info(step, `${step} completed`, { duration_ms });
    } else {
      this.error(step, `${step} failed`, { duration_ms });
    }
    
    this.stepStartTimes.delete(step);
    return duration_ms;
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.stepStartTimes.clear();
  }

  getLogsSummary(): string {
    const summary = {
      total: this.logs.length,
      by_level: {
        DEBUG: this.logs.filter(l => l.level === LogLevel.DEBUG).length,
        INFO: this.logs.filter(l => l.level === LogLevel.INFO).length,
        WARN: this.logs.filter(l => l.level === LogLevel.WARN).length,
        ERROR: this.logs.filter(l => l.level === LogLevel.ERROR).length,
      },
    };
    return JSON.stringify(summary, null, 2);
  }
}

// Export singleton instance
export const logger = new PipelineLogger();
