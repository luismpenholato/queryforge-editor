import {
  analyzeDocument,
  type AnalyzeDocumentDependencies,
  type AnalyzeDocumentOptions,
  type PublishableDocument,
} from './analyze-document.service.js';

export const NO_OPEN_CSHARP_DOCUMENTS_MESSAGE =
  'Open one or more C# files before running QueryForge on open documents.';

export interface OpenDocumentsWorkspace {
  textDocuments: ReadonlyArray<PublishableDocument>;
}

export interface AnalyzeOpenDocumentsDependencies extends AnalyzeDocumentDependencies {
  getOpenDocuments(): ReadonlyArray<PublishableDocument>;
}

export async function analyzeOpenDocuments(
  deps: AnalyzeOpenDocumentsDependencies,
  options: AnalyzeDocumentOptions = {},
): Promise<void> {
  const csharpDocuments = deps
    .getOpenDocuments()
    .filter((document) => document.languageId === 'csharp');

  if (csharpDocuments.length === 0) {
    if (!options.suppressInvalidEditorMessages) {
      deps.showInformationMessage(NO_OPEN_CSHARP_DOCUMENTS_MESSAGE);
    }
    return;
  }

  deps.output.log(`Analyzing ${csharpDocuments.length} open C# document(s)...`);

  let analyzed = 0;
  for (const document of csharpDocuments) {
    await analyzeDocument(deps, document, {
      ...options,
      suppressInvalidEditorMessages: true,
    });
    analyzed += 1;
  }

  deps.output.log(`Finished analyzing ${analyzed} open C# document(s).`);
  deps.showInformationMessage(
    `QueryForge analyzed ${analyzed} open C# document${analyzed === 1 ? '' : 's'}.`,
  );
}
