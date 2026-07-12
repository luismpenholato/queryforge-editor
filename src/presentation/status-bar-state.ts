import { type StatusBarState, resolveStatusBarState } from './status-bar.js';

export class PerDocumentIssueCounts {
  private readonly counts = new Map<string, number>();

  setIssueCount(uri: string, count: number): void {
    this.counts.set(uri, count);
  }

  clearIssueCount(uri: string): void {
    this.counts.delete(uri);
  }

  getIssueCount(uri: string): number | undefined {
    return this.counts.get(uri);
  }

  hasIssueCount(uri: string): boolean {
    return this.counts.has(uri);
  }

  reset(): void {
    this.counts.clear();
  }

  resolveActiveView(
    activeUri: string | undefined,
    languageId: string | undefined,
  ): { state: StatusBarState; issueCount: number; visible: boolean } {
    if (languageId !== 'csharp') {
      return { state: 'idle', issueCount: 0, visible: false };
    }

    if (!activeUri || !this.counts.has(activeUri)) {
      return { state: 'idle', issueCount: 0, visible: true };
    }

    const issueCount = this.counts.get(activeUri) ?? 0;
    return {
      state: resolveStatusBarState(issueCount),
      issueCount,
      visible: true,
    };
  }
}
