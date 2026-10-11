/** Minimal structured logger. ponytail: console is enough until we ship real tracing. */
type Fields = Record<string, unknown>;

export const logger = {
  info: (msg: string, fields: Fields = {}) =>
    console.log(JSON.stringify({ level: "info", msg, ...fields })),
  warn: (msg: string, fields: Fields = {}) =>
    console.warn(JSON.stringify({ level: "warn", msg, ...fields })),
  error: (msg: string, fields: Fields = {}) =>
    console.error(JSON.stringify({ level: "error", msg, ...fields })),
};
