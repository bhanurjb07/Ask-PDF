const COLORS={
  reset: "\x1b[0m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  success: "\x1b[32m",
}as const;

type LogLevel = keyof typeof COLORS;

interface LogPayload {
  documentId?: string;
  jobId?: string;
  status?: string;
  executionTimeMs?: number;
  message?: string;
}

const timestamp=(): string => new Date().toISOString();

const format=(level: LogLevel, payload: LogPayload): string=>{
  const color=COLORS[level] || COLORS.reset;

  const{
    documentId = "-",
    jobId= "-",
    status= "-",
    executionTimeMs,
    message = "",
  }=payload;

  const timing =typeof executionTimeMs === "number"
      ? ` timeMs=${executionTimeMs}` : "";

  return(
    `${color}[${timestamp()}] [WORKER] [${level.toUpperCase()}] ` +
    `documentId=${documentId} jobId=${jobId} status=${status}${timing}` +
    (message ? ` | ${message}` : "") +
    COLORS.reset
  );
};

const workerLogger ={
  info(payload: LogPayload): void{
    console.log(format("info", payload));
  },

  warn(payload: LogPayload): void {
    console.warn(format("warn", payload));
  },

  error(payload: LogPayload): void {
    console.error(format("error", payload));
  },

  success(payload: LogPayload): void {
    console.log(format("success", payload));
  },
};

export default workerLogger;