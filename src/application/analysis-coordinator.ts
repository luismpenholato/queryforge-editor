export type AnalysisScope = 'document' | 'selection';

export interface AnalysisRunContext {
  documentUri: string;
  documentVersion: number;
  scope: AnalysisScope;
  controller: AbortController;
}

export class AnalysisCoordinator {
  private readonly controllers = new Map<string, AbortController>();
  private readonly contexts = new Map<string, AnalysisRunContext>();

  beginAnalysis(
    documentUri: string,
    documentVersion: number,
    scope: AnalysisScope,
  ): AbortController {
    const existing = this.controllers.get(documentUri);
    if (existing) {
      existing.abort();
    }

    const controller = new AbortController();
    this.controllers.set(documentUri, controller);
    this.contexts.set(documentUri, {
      documentUri,
      documentVersion,
      scope,
      controller,
    });

    return controller;
  }

  getContext(documentUri: string): AnalysisRunContext | undefined {
    return this.contexts.get(documentUri);
  }

  isStaleResult(documentUri: string, documentVersion: number, scope: AnalysisScope): boolean {
    const context = this.contexts.get(documentUri);
    if (!context) {
      return true;
    }

    return context.documentVersion !== documentVersion || context.scope !== scope;
  }

  finishAnalysis(documentUri: string, controller: AbortController): void {
    const current = this.controllers.get(documentUri);
    if (current === controller) {
      this.controllers.delete(documentUri);
      this.contexts.delete(documentUri);
    }
  }

  abortAll(): void {
    for (const controller of this.controllers.values()) {
      controller.abort();
    }

    this.controllers.clear();
    this.contexts.clear();
  }

  abortByUri(documentUri: string): void {
    const controller = this.controllers.get(documentUri);
    if (!controller) {
      return;
    }

    controller.abort();
    this.controllers.delete(documentUri);
    this.contexts.delete(documentUri);
  }
}
