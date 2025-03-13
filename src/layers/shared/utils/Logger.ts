import winston from "winston";

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
  },
};

winston.addColors(customLevels.colors);

const isLocal = process.env.IS_LOCAL === "true";
function removeCircularReferences() {
  const seen = new WeakSet<any>();
  return (key: string, value: any) => {
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  };
}

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: "debug",
  transports: [
    new winston.transports.Console({
      level: "debug",
      format: winston.format.combine(
        isLocal ? winston.format.colorize({ all: true }) : winston.format.uncolorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          if (level === "http") return `${message}`;
          const formattedMessage =
            typeof message === "object" ? JSON.stringify(message, removeCircularReferences()) : message;
          const metaString =
            Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta, removeCircularReferences())}` : "";
          return `${formattedMessage}${metaString}`.trim();
        })
      ),
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});

export { logger };
