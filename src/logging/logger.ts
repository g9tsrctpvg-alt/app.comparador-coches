const SERVICE_NAME = 'comparador-coches-web';

// OpenTelemetry Logs Data Model severity number for ERROR.
// https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber
const ERROR_SEVERITY_NUMBER = 17;

export interface LogAttributes {
  [key: string]: string | number | boolean;
}

interface LogEntry {
  Timestamp: string;
  SeverityText: 'ERROR';
  SeverityNumber: number;
  Body: string;
  Attributes: LogAttributes;
  Resource: { 'service.name': string };
}

export function buildErrorLogEntry(
  body: string,
  attributes: LogAttributes = {},
): LogEntry {
  return {
    Timestamp: new Date().toISOString(),
    SeverityText: 'ERROR',
    SeverityNumber: ERROR_SEVERITY_NUMBER,
    Body: body,
    Attributes: attributes,
    Resource: { 'service.name': SERVICE_NAME },
  };
}

export function logError(body: string, attributes: LogAttributes = {}): void {
  console.error(JSON.stringify(buildErrorLogEntry(body, attributes)));
}
