export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'log';

export type Logger = {
  [K in LogLevel]: (message: string, ...args: unknown[]) => void;
};

export class ConsoleLogger implements Logger {
  private static instance: ConsoleLogger | null = null;
  private static lock = false;

  private constructor() {}

  public static getInstance(): ConsoleLogger {
    if (!ConsoleLogger.instance) {
      if (ConsoleLogger.lock) {
        throw new Error('Logger is being initialized');
      }
      ConsoleLogger.lock = true;
      ConsoleLogger.instance = new ConsoleLogger();
      ConsoleLogger.lock = false;
    }
    return ConsoleLogger.instance;
  }

  log(message: string, ...args: unknown[]): void {
    console.log(message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    console.debug(message, ...args);
  }
}

export const logger = ConsoleLogger.getInstance();
