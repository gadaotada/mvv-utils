type LogLevel = "debug" | "info" | "warn" | "error" | "silent";
type LogMethod = "log" | "info" | "warn" | "error";
type RuntimeKind = "browser" | "node";

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4,
};

const DEFAULT_TIMEZONE = "Europe/Sofia";
const RUNTIME_KIND: RuntimeKind = typeof window === "undefined" ? "node" : "browser";

const LEVEL_STYLES: Record<Exclude<LogLevel, "silent">, string> = {
    debug: "color:#0891b2;font-weight:700;",
    info: "color:#15803d;font-weight:700;",
    warn: "color:#a16207;font-weight:700;",
    error: "color:#b91c1c;font-weight:700;",
};

const ANSI = {
    debug: "\x1b[36m",
    info: "\x1b[32m",
    warn: "\x1b[33m",
    error: "\x1b[31m",
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
};

class Logger {
    private _level: LogLevel = "info";
    private _timezone: string = DEFAULT_TIMEZONE;
    private context?: string;
    private parent?: Logger;

    constructor(context?: string, parent?: Logger) {
        this.context = context;
        this.parent = parent;
    }

    get level(): LogLevel {
        return this.parent ? this.parent.level : this._level;
    }

    get timezone(): string {
        return this.parent ? this.parent.timezone : this._timezone;
    }

    public setLevel(level: LogLevel) {
        this._level = level;
        this.info(`Log level changed to: ${level}`);
    }

    public setTimezone(timezone: string) {
        this._timezone = timezone;
    }

    public child(context: string): Logger {
        return new Logger(context, this);
    }

    public debug(message: string, data?: unknown) {
        this.log("debug", message, data);
    }

    public info(message: string, data?: unknown) {
        this.log("info", message, data);
    }

    public warn(message: string, data?: unknown) {
        this.log("warn", message, data);
    }

    public error(message: string, data?: unknown) {
        this.log("error", message, data);
    }

    private log(level: Exclude<LogLevel, "silent">, message: string, data?: unknown) {
        if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) return;

        const timestamp = new Date().toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: this.timezone,
        });
        const consoleMethod: LogMethod = level === "debug" ? "log" : level;
        if (RUNTIME_KIND === "node") {
            const prefix = this.context
                ? `${ANSI.dim}[${this.context}]${ANSI.reset} `
                : "";
            const line = `${ANSI.dim}[${timestamp}]${ANSI.reset} ${ANSI.bold}${ANSI[level]}${level
                .toUpperCase()
                .padEnd(5)}${ANSI.reset} ${prefix}${message}`;
            if (data !== undefined) {
                console[consoleMethod](line, data);
            } else {
                console[consoleMethod](line);
            }
            return;
        }

        const contextLabel = this.context ? ` [%s]` : "";
        const format = `%c${timestamp}%c %c${level.toUpperCase().padEnd(5)}%c${contextLabel} ${message}`;
        const args: unknown[] = [
            "color:#64748b;",
            "color:inherit;",
            LEVEL_STYLES[level],
            "color:#64748b;",
        ];

        if (this.context) {
            args.push(this.context);
        }

        if (data !== undefined) {
            args.push(data);
        }

        console[consoleMethod](format, ...args);
    }
}

const logger = new Logger();

const generalLogger = logger.child("GENERAL")
const authLogger    = logger.child("AUTH");
const queueLogger   = logger.child("QUEUE");
const eventLogger   = logger.child("EVENT");

export { generalLogger, authLogger, queueLogger, eventLogger };
