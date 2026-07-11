import { describe, expect, it } from 'vitest';
import {
  createStatusBarViewModel,
  resolveStatusBarState,
} from '../../src/presentation/status-bar.js';

describe('status bar view model', () => {
  it('shows idle state', () => {
    const viewModel = createStatusBarViewModel('idle', 0, true);
    expect(viewModel.text).toBe('$(search) QueryForge');
    expect(viewModel.visible).toBe(true);
  });

  it('shows zero issues state', () => {
    const viewModel = createStatusBarViewModel('success', 0, true);
    expect(viewModel.text).toBe('$(check) QueryForge: 0');
  });

  it('shows issues state', () => {
    const viewModel = createStatusBarViewModel('issues', 3, true);
    expect(viewModel.text).toBe('$(warning) QueryForge: 3');
  });

  it('hides for non-csharp editors', () => {
    const viewModel = createStatusBarViewModel('idle', 0, false);
    expect(viewModel.visible).toBe(false);
  });

  it('resolves state from issue count', () => {
    expect(resolveStatusBarState(0)).toBe('success');
    expect(resolveStatusBarState(2)).toBe('issues');
  });
});
