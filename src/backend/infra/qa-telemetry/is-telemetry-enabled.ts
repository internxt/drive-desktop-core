export function isTelemetryEnabled() {
  return process.env.NODE_ENV === 'development' || process.env.ENABLE_QA_TELEMETRY === 'true';
}
