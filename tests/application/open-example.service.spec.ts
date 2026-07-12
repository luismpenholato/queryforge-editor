import { describe, expect, it, vi } from 'vitest';
import {
  ANALYZE_EXAMPLE_ACTION,
  DISMISS_EXAMPLE_ACTION,
  EXAMPLE_OPENED_MESSAGE,
  openQueryForgeExample,
} from '../../src/application/open-example.service.js';
import { PRODUCT_QUERY_SERVICE_EXAMPLE } from '../../src/example/product-query-service.example.js';

describe('open-example.service', () => {
  it('opens an unsaved csharp document with the example content', async () => {
    const openTextDocument = vi.fn().mockResolvedValue({ uri: { toString: () => 'untitled:1' } });
    const showTextDocument = vi.fn().mockResolvedValue(undefined);
    const showInformationMessage = vi.fn().mockResolvedValue(DISMISS_EXAMPLE_ACTION);

    await openQueryForgeExample({
      openTextDocument,
      showTextDocument,
      showInformationMessage,
      executeCommand: vi.fn(),
    });

    expect(openTextDocument).toHaveBeenCalledWith({
      language: 'csharp',
      content: PRODUCT_QUERY_SERVICE_EXAMPLE,
    });
    expect(showTextDocument).toHaveBeenCalled();
  });

  it('runs analyze current file when Analyze Example is chosen', async () => {
    const executeCommand = vi.fn().mockResolvedValue(undefined);

    await openQueryForgeExample({
      openTextDocument: vi.fn().mockResolvedValue({ uri: { toString: () => 'untitled:1' } }),
      showTextDocument: vi.fn().mockResolvedValue(undefined),
      showInformationMessage: vi.fn().mockResolvedValue(ANALYZE_EXAMPLE_ACTION),
      executeCommand,
    });

    expect(executeCommand).toHaveBeenCalledWith('queryforge.analyzeCurrentFile');
  });

  it('does not analyze when Dismiss is chosen', async () => {
    const executeCommand = vi.fn();

    await openQueryForgeExample({
      openTextDocument: vi.fn().mockResolvedValue({ uri: { toString: () => 'untitled:1' } }),
      showTextDocument: vi.fn().mockResolvedValue(undefined),
      showInformationMessage: vi.fn().mockResolvedValue(DISMISS_EXAMPLE_ACTION),
      executeCommand,
    });

    expect(executeCommand).not.toHaveBeenCalled();
  });

  it('shows the example opened message with actions', async () => {
    const showInformationMessage = vi.fn().mockResolvedValue(undefined);

    await openQueryForgeExample({
      openTextDocument: vi.fn().mockResolvedValue({ uri: { toString: () => 'untitled:1' } }),
      showTextDocument: vi.fn().mockResolvedValue(undefined),
      showInformationMessage,
      executeCommand: vi.fn(),
    });

    expect(showInformationMessage).toHaveBeenCalledWith(
      EXAMPLE_OPENED_MESSAGE,
      ANALYZE_EXAMPLE_ACTION,
      DISMISS_EXAMPLE_ACTION,
    );
  });
});
