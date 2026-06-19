export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

export const logger = {
  log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    };

    // Console output with colors
    const colors = {
      info: "\x1b[36m", // Cyan
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
      debug: "\x1b[90m"  // Gray
    };

    console.log(
      `[${entry.timestamp}] ${colors[level]}[${level.toUpperCase()}]\x1b[0m ${message}`,
      data ? data : ""
    );

    if (typeof window !== "undefined") {
      try {
        const logs: LogEntry[] = JSON.parse(localStorage.getItem("cogniflow_system_logs") || "[]");
        logs.push(entry);
        // Keep last 100 log entries
        localStorage.setItem("cogniflow_system_logs", JSON.stringify(logs.slice(-100)));
      } catch (e) {
        // Ignore storage errors
      }
    }
  },

  info(message: string, data?: any) {
    this.log("info", message, data);
  },

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  },

  error(message: string, data?: any) {
    this.log("error", message, data);
  },

  debug(message: string, data?: any) {
    this.log("debug", message, data);
  }
};
