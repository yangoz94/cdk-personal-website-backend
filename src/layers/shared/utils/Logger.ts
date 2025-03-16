import { Logger } from "tslog";

const isLocal = process.env.IS_LOCAL === "true";

const logger = new Logger({
  type: isLocal ? "pretty" : "json",
  prettyLogTemplate: "{{timestamp}} [{{logLevelName}}] - {{message}}",
  prettyErrorTemplate: "{{timestamp}} [{{logLevelName}}] - {{message}}\n{{stack}}",
  prettyErrorLoggerNameDelimiter: "|",
  prettyErrorParentNamesSeparator: "|",
  prettyLogTimeZone: "local",
  prettyInspectOptions: {
    depth: 2,
    colors: false,
    compact: true,
  },
  hideLogPositionForProduction: !isLocal, 
  minLevel: 0,
});

export { logger };
