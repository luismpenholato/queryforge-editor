import { describe, expect, it } from 'vitest';
import { AnalysisCoordinator } from '../../src/application/analysis-coordinator.js';

describe('AnalysisCoordinator', () => {
  it('aborts previous analysis for same uri', () => {
    const coordinator = new AnalysisCoordinator();
    const first = coordinator.beginAnalysis('file:///a.cs', 1, 'document');
    coordinator.beginAnalysis('file:///a.cs', 1, 'document');
    expect(first.signal.aborted).toBe(true);
  });

  it('tracks stale results by version and scope', () => {
    const coordinator = new AnalysisCoordinator();
    coordinator.beginAnalysis('file:///a.cs', 1, 'document');
    expect(coordinator.isStaleResult('file:///a.cs', 2, 'document')).toBe(true);
    expect(coordinator.isStaleResult('file:///a.cs', 1, 'selection')).toBe(true);
  });

  it('clears controller after finish', () => {
    const coordinator = new AnalysisCoordinator();
    const controller = coordinator.beginAnalysis('file:///a.cs', 1, 'document');
    coordinator.finishAnalysis('file:///a.cs', controller);
    expect(coordinator.getContext('file:///a.cs')).toBeUndefined();
  });
});
