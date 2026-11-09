export type HttpTelemetryPayload = {
  method: string;
  url: string;
  durationMs: number;
  status: number;
  error?: string;
};

export type HttpTelemetryEntry = {
  category: 'HTTP';
  timestamp: string;
} & HttpTelemetryPayload;
