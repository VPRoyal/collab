/*
 Centralized application logger with dual-mode output:
 - Production: structured JSON (machine-parseable)
 - Development: colorful, pretty, single-line logs with context and emojis

 Customize via env:
 - NODE_ENV=production -> JSON logs
 - LOG_PRETTY=false -> force JSON logs in dev
 - LOG_LEVEL=debug|info|... -> control verbosity (default: info)
*/

import { Request, Response, NextFunction } from "express";

type LogLevel = "fatal" | "error" | "warn" | "info" | "http" | "debug" | "trace";

type LogContext = Record<string, unknown>;

const levels: LogLevel[] = ["fatal", "error", "warn", "info", "http", "debug", "trace"];

const isProd = process.env.NODE_ENV === "production";
const prettyEnabled = !isProd && (process.env.LOG_PRETTY ?? "true") !== "false";

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
};

type ConsoleMethod = "error" | "warn" | "info" | "debug" | "log";
const levelStyles: Record<LogLevel, { color: string; emoji: string; method: ConsoleMethod }> = {
  fatal: { color: colors.red, emoji: "💥", method: "error" },
  error: { color: colors.red, emoji: "❌", method: "error" },
  warn: { color: colors.yellow, emoji: "⚠", method: "warn" },
  info: { color: colors.blue, emoji: "ℹ", method: "info" },
  http: { color: colors.green, emoji: "🌐", method: "info" },
  debug: { color: colors.magenta, emoji: "🐛", method: "debug" },
  trace: { color: colors.gray, emoji: "🔍", method: "debug" },
};

function nowISO() {
  return new Date().toISOString();
}

function fmtTimeShort(d = new Date()) {
  // 12:34:56.789
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function levelEnabled(target: LogLevel): boolean {
  const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
  const currentIdx = levels.indexOf(envLevel);
  const targetIdx = levels.indexOf(target);
  return targetIdx <= currentIdx;
}

function serializeError(err: unknown) {
  if (!err) return undefined;
  if (err instanceof Error) {
    const anyErr = err as any;
    return {
      name: err.name,
      message: err.message,
      stack: !isProd ? err.stack : undefined,
      code: anyErr.code,
      status: anyErr.status,
      details: anyErr.details,
    };
  }
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: String(err) };
  }
}

interface LogPayload {
  time: string;
  level: LogLevel;
  msg: string;
  context?: LogContext;
  err?: ReturnType<typeof serializeError>;
}

function kv(v: unknown): string {
  if (typeof v === "number") return `${colors.cyan}${v}${colors.reset}`;
  if (typeof v === "boolean") return `${colors.magenta}${v}${colors.reset}`;
  if (v === null) return `${colors.gray}null${colors.reset}`;
  if (v === undefined) return `${colors.gray}undefined${colors.reset}`;
  if (v instanceof Date) return `${colors.cyan}${v.toISOString()}${colors.reset}`;
  if (typeof v === "string") {
    // collapse whitespace
    const s = v.includes(" ") || v.includes(":") ? `'${v}'` : v;
    return `${colors.white}${s}${colors.reset}`;
  }
  try {
    return `${colors.white}${JSON.stringify(v)}${colors.reset}`;
  } catch {
    return `${colors.white}${String(v)}${colors.reset}`;
  }
}

function formatContext(ctx?: LogContext): string {
  if (!ctx || Object.keys(ctx).length === 0) return "";
  const pairs = Object.entries(ctx).map(([k, v]) => `${colors.gray}${k}${colors.reset}=${kv(v)}`);
  return pairs.join(" ");
}

function formatError(err?: ReturnType<typeof serializeError>): string {
  if (!err) return "";
  const head = `${colors.red}${err.name || "Error"}${colors.reset}: ${colors.red}${err.message}${colors.reset}`;
  const stack = err.stack ? `\n${colors.gray}${err.stack}${colors.reset}` : "";
  return `${head}${stack}`;
}

function writePretty(payload: LogPayload) {
  const { level, msg, context, err } = payload;
  const style = levelStyles[level];
  const time = `${colors.dim}${fmtTimeShort()}${colors.reset}`;
  const lvl = `${style.color}${style.emoji} ${level.toUpperCase()}${colors.reset}`;

  // Hoist common fields if present
  const base: LogContext = { ...(context || {}) };
  const service = base.service as string | undefined;
  if (service) delete base.service;

  const ctxStr = formatContext(base);
  const errStr = formatError(err);

  const line = `${time} ${lvl} ${colors.bold}${msg}${colors.reset}`
    + (service ? ` ${colors.dim}[${service}]${colors.reset}` : "")
    + (ctxStr ? ` — ${ctxStr}` : "")
    + (errStr ? `\n${errStr}` : "");

  const m = (console as any)[style.method] as ((...args: any[]) => void) | undefined;
  (m || console.log)(line);
}

function writeJSON(payload: LogPayload) {
  const line = JSON.stringify(payload);
  switch (payload.level) {
    case "fatal":
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "info":
    case "http":
      console.info(line);
      break;
    case "debug":
    case "trace":
      console.debug(line);
      break;
    default:
      console.log(line);
  }
}

function write(payload: LogPayload) {
  if (prettyEnabled) return writePretty(payload);
  return writeJSON(payload);
}

export class Logger {
  private base: LogContext;

  constructor(base: LogContext = {}) {
    this.base = base;
  }

  child(ctx: LogContext) {
    return new Logger({ ...this.base, ...ctx });
  }

  private log(level: LogLevel, msg: string, meta?: LogContext & { err?: unknown }) {
    if (!levelEnabled(level)) return;
    const { err, ...context } = meta || {};
    write({ time: nowISO(), level, msg, context: { ...this.base, ...context }, err: serializeError(err) });
  }

  fatal(msg: string, meta?: LogContext & { err?: unknown }) { this.log("fatal", msg, meta); }
  error(msg: string, meta?: LogContext & { err?: unknown }) { this.log("error", msg, meta); }
  warn(msg: string, meta?: LogContext & { err?: unknown }) { this.log("warn", msg, meta); }
  info(msg: string, meta?: LogContext & { err?: unknown }) { this.log("info", msg, meta); }
  http(msg: string, meta?: LogContext & { err?: unknown }) { this.log("http", msg, meta); }
  debug(msg: string, meta?: LogContext & { err?: unknown }) { this.log("debug", msg, meta); }
  trace(msg: string, meta?: LogContext & { err?: unknown }) { this.log("trace", msg, meta); }
}

// Root logger instance
const logger = new Logger({ service: "COLLAB-SERVER" });
export default logger;

// Express middleware for request logging
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const reqLogger = logger.child({ method: req.method, url: req.originalUrl, ip: req.ip });
  reqLogger.http("request:start");

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const status = res.statusCode;
    reqLogger.http("request:finish", { status, durationMs: Math.round(durationMs) });
  });

  next();
}
