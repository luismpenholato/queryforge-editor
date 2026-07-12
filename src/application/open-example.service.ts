import { PRODUCT_QUERY_SERVICE_EXAMPLE } from '../example/product-query-service.example.js';

export const EXAMPLE_OPENED_MESSAGE = 'QueryForge example opened.';
export const ANALYZE_EXAMPLE_ACTION = 'Analyze Example';
export const DISMISS_EXAMPLE_ACTION = 'Dismiss';

export interface OpenExampleDependencies {
  openTextDocument(options: { language: string; content: string }): PromiseLike<{ uri: { toString(): string } }>;
  showTextDocument(document: unknown): PromiseLike<unknown>;
  showInformationMessage(
    message: string,
    ...actions: string[]
  ): PromiseLike<string | undefined>;
  executeCommand(command: string): PromiseLike<unknown>;
}

export async function openQueryForgeExample(deps: OpenExampleDependencies): Promise<void> {
  const document = await deps.openTextDocument({
    language: 'csharp',
    content: PRODUCT_QUERY_SERVICE_EXAMPLE,
  });

  await deps.showTextDocument(document);

  const choice = await deps.showInformationMessage(
    EXAMPLE_OPENED_MESSAGE,
    ANALYZE_EXAMPLE_ACTION,
    DISMISS_EXAMPLE_ACTION,
  );

  if (choice === ANALYZE_EXAMPLE_ACTION) {
    await deps.executeCommand('queryforge.analyzeCurrentFile');
  }
}
