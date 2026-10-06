export type DataOperation = 'read' | 'create' | 'update';

export class DataError extends Error {
  readonly table: string;
  readonly operation: DataOperation;
  readonly code?: string;

  constructor(table: string, operation: DataOperation, cause: unknown) {
    const message = cause instanceof Error ? cause.message : 'Unknown data error';
    super(message);
    this.name = 'DataError';
    this.table = table;
    this.operation = operation;
    this.code = readCode(cause);
  }
}

function readCode(cause: unknown): string | undefined {
  if (typeof cause !== 'object' || cause === null) return undefined;
  const record = cause as Record<string, unknown>;
  const code = record.code ?? record.status ?? record.statusCode;
  return code === undefined ? undefined : String(code);
}
