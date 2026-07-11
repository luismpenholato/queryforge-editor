import type { QuerySmell } from '@luispenholato/queryforge-mcp';
import type { AnalysisKind } from './diagnostic-range-mapper.js';
import { buildDiagnosticKey } from './diagnostic-mapper.js';

export interface DiagnosticMetadata {
  smell: QuerySmell;
  analysisKind: AnalysisKind;
  baseOffset: number;
  analyzedCodeLength: number;
  documentVersion: number;
  key: string;
}

export class DiagnosticMetadataStore {
  private readonly entries = new Map<string, DiagnosticMetadata>();

  replaceForUri(
    documentUri: string,
    items: DiagnosticMetadata[],
  ): void {
    this.clearByUri(documentUri);

    for (const item of items) {
      this.entries.set(item.key, item);
    }
  }

  get(key: string): DiagnosticMetadata | undefined {
    return this.entries.get(key);
  }

  findBySmell(
    documentUri: string,
    smell: QuerySmell,
    startOffset: number,
    endOffset: number,
  ): DiagnosticMetadata | undefined {
    const key = buildDiagnosticKey(
      documentUri,
      startOffset,
      endOffset,
      smell.code,
      smell.fingerprint,
    );

    return this.entries.get(key);
  }

  getAllForUri(documentUri: string): DiagnosticMetadata[] {
    const prefix = `${documentUri}|`;
    const results: DiagnosticMetadata[] = [];

    for (const [key, metadata] of this.entries) {
      if (key.startsWith(prefix)) {
        results.push(metadata);
      }
    }

    return results;
  }

  clearByUri(documentUri: string): void {
    const prefix = `${documentUri}|`;

    for (const key of [...this.entries.keys()]) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }
  }

  clearAll(): void {
    this.entries.clear();
  }

  size(): number {
    return this.entries.size;
  }
}
