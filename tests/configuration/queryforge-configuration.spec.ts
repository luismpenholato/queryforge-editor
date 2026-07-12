import { describe, expect, it } from 'vitest';
import {
  QueryForgeConfiguration,
  sanitizeMaxIssues,
  sanitizeMinimumSeverity,
  sanitizeProvider,
} from '../../src/configuration/queryforge-configuration.js';
import { createConfigurationReader } from '../support/fakes.js';

describe('QueryForgeConfiguration', () => {
  it('uses valid provider', () => {
    const config = new QueryForgeConfiguration(
      createConfigurationReader({
        'queryforge.analysis.provider': 'dapper',
      }),
    );

    expect(config.getSettings().provider).toBe('dapper');
  });

  it('falls back when provider is invalid', () => {
    expect(sanitizeProvider('invalid')).toBe('ef-core');
  });

  it('clamps maxIssues below minimum', () => {
    expect(sanitizeMaxIssues(0)).toBe(1);
  });

  it('clamps maxIssues above maximum', () => {
    expect(sanitizeMaxIssues(5000)).toBe(1000);
  });

  it('falls back when minimum severity is invalid', () => {
    expect(sanitizeMinimumSeverity('urgent')).toBe('info');
  });

  it('reads showOnError setting', () => {
    const config = new QueryForgeConfiguration(
      createConfigurationReader({
        'queryforge.output.showOnError': false,
      }),
    );

    expect(config.getSettings().showOnError).toBe(false);
  });

  it('defaults runOnSave to false', () => {
    const config = new QueryForgeConfiguration(createConfigurationReader({}));
    expect(config.getSettings().runOnSave).toBe(false);
  });

  it('reads runOnSave setting', () => {
    const config = new QueryForgeConfiguration(
      createConfigurationReader({
        'queryforge.analysis.runOnSave': true,
      }),
    );

    expect(config.getSettings().runOnSave).toBe(true);
  });
});
