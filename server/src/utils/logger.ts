const COLORS = {
  reset: '\x1b[0m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  success: '\x1b[32m',
  critical: '\x1b[35m',
};

const timeStamp =(): string =>new Date().toISOString();

const messageFormat =(level: keyof typeof COLORS,
                     message: string,
                     meta?: unknown
              ): string => {
    const color = COLORS[level] || COLORS.reset;
    const metaText = meta ? ` ${JSON.stringify(meta)}` : '';

    return `${color}[${timeStamp()}] [${level.toUpperCase()}] ${message}${metaText}${COLORS.reset}`;
};

const logger = {
    info(message: string, meta?: unknown): void {
        console.log(messageFormat('info', message, meta));
    },
    warn(message: string, meta?: unknown): void{
        console.log(messageFormat('warn', message, meta));
    },
    error(message: string, meta?: unknown): void{
        console.log(messageFormat('error', message, meta));
    },

    success(message: string, meta?: unknown): void{
        console.log(messageFormat('success', message, meta));
    },

    critical(message: string, meta?: unknown):void{
        console.log(messageFormat('critical', message, meta));
    },

}

export default logger;