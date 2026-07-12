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

  it('aborts by uri without affecting other documents', () => {
    const coordinator = new AnalysisCoordinator();
    const uriA = 'file:///a.cs';
    const uriB = 'file:///b.cs';
    const controllerA = coordinator.beginAnalysis(uriA, 1, 'document');
    const controllerB = coordinator.beginAnalysis(uriB, 1, 'document');

    coordinator.abortByUri(uriA);

    expect(controllerA.signal.aborted).toBe(true);
    expect(controllerB.signal.aborted).toBe(false);
    expect(coordinator.getContext(uriA)).toBeUndefined();
    expect(coordinator.getContext(uriB)).toBeDefined();
  });

  it('is idempotent when aborting an unknown uri', () => {
    const coordinator = new AnalysisCoordinator();
    expect(() => coordinator.abortByUri('file:///missing.cs')).not.toThrow();
  });

  it('reports active analysis by uri', () => {
    const coordinator = new AnalysisCoordinator();
    expect(coordinator.hasActiveAnalysis('file:///a.cs')).toBe(false);

    coordinator.beginAnalysis('file:///a.cs', 1, 'document');
    expect(coordinator.hasActiveAnalysis('file:///a.cs')).toBe(true);

    coordinator.abortByUri('file:///a.cs');
    expect(coordinator.hasActiveAnalysis('file:///a.cs')).toBe(false);
  });

  it('aborts all pending analyses', () => {
    const coordinator = new AnalysisCoordinator();
    const first = coordinator.beginAnalysis('file:///a.cs', 1, 'document');
    const second = coordinator.beginAnalysis('file:///b.cs', 1, 'selection');

    coordinator.abortAll();

    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(true);
    expect(coordinator.getContext('file:///a.cs')).toBeUndefined();
    expect(coordinator.getContext('file:///b.cs')).toBeUndefined();
  });
});
