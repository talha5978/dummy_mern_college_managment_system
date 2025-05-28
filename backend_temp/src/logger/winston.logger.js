import winston from "winston";

// Severity levels.
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Get the severity level based on the NODE_ENV
const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

//colors for different levels
const colors = {
  error: "red",
  warn: "yellow",
  info: "blue",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Chose the aspect of your log customizing the log format.
const format = winston.format.combine(
  winston.format.timestamp({ format: "DD MMM, YYYY - HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
);

// Define which transports the logger must use to print out messages.
const transports = [
  new winston.transports.Console(),
  new winston.transports.File({ filename: "logs/errors.log", level: "error" }),
  new winston.transports.File({ filename: "logs/info.log", level: "info" }),
  new winston.transports.File({ filename: "logs/http.log", level: "http" }),
];

// Create the logger instance that has to be exported and used to log messages.
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger;
