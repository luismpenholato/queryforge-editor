import type { QueryProvider } from '@luispenholato/queryforge-mcp';
import type { MinimumSeverity } from '../diagnostics/severity.js';
import { isValidSeverity } from '../diagnostics/severity.js';

export interface QueryForgeSettings {
  provider: QueryProvider;
  maxIssues: number;
  minimumSeverity: MinimumSeverity;
  showOnError: boolean;
}

const VALID_PROVIDERS: readonly QueryProvider[] = [
  'ef-core',
  'ef6',
  'linq',
  'dapper',
  'unknown',
];

const DEFAULT_SETTINGS: QueryForgeSettings = {
  provider: 'ef-core',
  maxIssues: 100,
  minimumSeverity: 'info',
  showOnError: true,
};

export interface ConfigurationReader {
  get<T>(section: string, key: string): T | undefined;
}

export class QueryForgeConfiguration {
  constructor(private readonly reader: ConfigurationReader) {}

  getSettings(): QueryForgeSettings {
    const provider = this.reader.get<string>('queryforge', 'analysis.provider');
    const maxIssues = this.reader.get<number>('queryforge', 'analysis.maxIssues');
    const minimumSeverity = this.reader.get<string>('queryforge', 'diagnostics.minimumSeverity');
    const showOnError = this.reader.get<boolean>('queryforge', 'output.showOnError');

    return {
      provider: sanitizeProvider(provider),
      maxIssues: sanitizeMaxIssues(maxIssues),
      minimumSeverity: sanitizeMinimumSeverity(minimumSeverity),
      showOnError: typeof showOnError === 'boolean' ? showOnError : DEFAULT_SETTINGS.showOnError,
    };
  }
}

export function sanitizeProvider(value: string | undefined): QueryProvider {
  if (value && (VALID_PROVIDERS as readonly string[]).includes(value)) {
    return value as QueryProvider;
  }

  return DEFAULT_SETTINGS.provider;
}

export function sanitizeMaxIssues(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_SETTINGS.maxIssues;
  }

  const rounded = Math.trunc(value);
  return Math.min(1000, Math.max(1, rounded));
}

export function sanitizeMinimumSeverity(value: string | undefined): MinimumSeverity {
  if (value && isValidSeverity(value)) {
    return value;
  }

  return DEFAULT_SETTINGS.minimumSeverity;
}

export function createVscodeConfigurationReader(
  getConfiguration: (section: string) => { get<T>(key: string): T | undefined },
): ConfigurationReader {
  return {
    get<T>(section: string, key: string): T | undefined {
      return getConfiguration(section).get<T>(key);
    },
  };
}
