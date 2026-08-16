// Minimal console logger (drop-in replacement for the pino logger used in the
// original Replit project). Supports the pino-style call signatures used across
// the codebase: logger.info("msg") and logger.info({ some: "context" }, "msg").

type LogArgs = [message: string] | [context: unknown, message?: string];

function emit(
  write: (...data: unknown[]) => void,
  level: string,
  args: LogArgs,
): void {
  const time = new Date().toISOString();
  if (typeof args[0] === "string") {
    write(`[${time}] ${level}: ${args[0]}`);
    return;
  }
  const context = args[0];
  const message = typeof args[1] === "string" ? args[1] : "";
  if (context && Object.keys(context as object).length > 0) {
    write(`[${time}] ${level}: ${message}`, context);
  } else {
    write(`[${time}] ${level}: ${message}`);
  }
}

export const logger = {
  info: (...args: LogArgs) => emit(console.log, "INFO", args),
  warn: (...args: LogArgs) => emit(console.warn, "WARN", args),
  error: (...args: LogArgs) => emit(console.error, "ERROR", args),
  debug: (...args: LogArgs) => emit(console.debug, "DEBUG", args),
};

export type Logger = typeof logger;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      log: Logger;
    }
  }
}
