import { createLogger, transports, format } from 'winston'
import { Request, Response, NextFunction } from "express";

import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import fs from 'fs'

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Custom format for console output with colors
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    // Color codes for different log levels
    const colors = {
      error: '\x1b[31m',    // Red
      warn: '\x1b[33m',     // Yellow
      info: '\x1b[36m',     // Cyan
      debug: '\x1b[35m',    // Magenta
    }
    
    const reset = '\x1b[0m'
    const bold = '\x1b[1m'
    
    // Get color for log level
    const color = colors[level as keyof typeof colors] || colors.info
    
    // Format the main message
    let formattedMessage = `${color}${bold}[${timestamp}]${reset} ${color}${level.toUpperCase()}${reset} ${message}`
    
    // Add metadata if present (but not the default ones)
    const filteredMeta = { ...meta }
    delete filteredMeta.service
    delete filteredMeta.version
    delete filteredMeta.environment
    
    if (Object.keys(filteredMeta).length > 0) {
      const metaStr = JSON.stringify(filteredMeta, null, 2)
      formattedMessage += `\n${color}${metaStr}${reset}`
    }
    
    return formattedMessage
  })
)

// Custom format for file output (JSON structured logging)
const fileFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
)

// Create the main logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  defaultMeta: { 
    service: 'jafe-enterprise-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport with colors
    new transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }),
    
    // Daily rotating file for all logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',    
      maxFiles: '30d',
      format: fileFormat,
      level: 'debug'
    }),
    
    // Daily rotating file for errors only
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',    
      maxFiles: '30d',
      format: fileFormat,
      level: 'error'
    })
  ]
})

// Simple performance monitoring utility
export const performanceLogger = {
  start: (operation: string) => {
    const startTime = Date.now()
    return {
      end: (success = true, metadata = {}) => {
        const duration = Date.now() - startTime
        const level = duration > 1000 ? 'warn' : 'info'
        const status = success ? 'completed' : 'failed'
        
        logger.log(level, `Performance: ${operation} ${status} (${duration}ms)`, {
          operation,
          duration,
          success,
          ...metadata
        })
        
        return duration
      }
    }
  }
}
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

export default logger