import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
);

function getCommandIds() {
  return packageJson.contributes.commands.map((command) => command.command);
}

describe('package manifest', () => {
  it('registers open example and open settings commands', () => {
    const commands = getCommandIds();

    expect(commands).toContain('queryforge.openExample');
    expect(commands).toContain('queryforge.openSettings');
  });

  it('defines the getting started walkthrough', () => {
    const walkthrough = packageJson.contributes.walkthroughs?.find(
      (item) => item.id === 'queryforge.getStarted',
    );

    expect(walkthrough).toBeDefined();
    expect(walkthrough.title).toBe('Get started with QueryForge');
    expect(walkthrough.steps).toHaveLength(5);
  });

  it('references registered commands in walkthrough steps', () => {
    const commands = new Set(getCommandIds());
    const walkthrough = packageJson.contributes.walkthroughs.find(
      (item) => item.id === 'queryforge.getStarted',
    );

    const referencedCommands = [
      'queryforge.openExample',
      'queryforge.analyzeCurrentFile',
      'queryforge.openSettings',
    ];

    for (const commandId of referencedCommands) {
      expect(commands.has(commandId)).toBe(true);
    }

    const completionEvents = walkthrough.steps.flatMap(
      (step) => step.completionEvents ?? [],
    );

    expect(completionEvents).toContain('onCommand:queryforge.openExample');
    expect(completionEvents).toContain('onCommand:queryforge.analyzeCurrentFile');
    expect(completionEvents).toContain('onCommand:queryforge.openSettings');
  });

  it('defines runOnSave disabled by default', () => {
    const runOnSave = packageJson.contributes.configuration.properties['queryforge.analysis.runOnSave'];

    expect(runOnSave).toBeDefined();
    expect(runOnSave.type).toBe('boolean');
    expect(runOnSave.default).toBe(false);
  });

  it('uses the permanent queryforge publisher', () => {
    expect(packageJson.publisher).toBe('queryforge');
    expect(packageJson.name).toBe('queryforge-editor');
    expect(`${packageJson.publisher}.${packageJson.name}`).toBe('queryforge.queryforge-editor');
  });

  it('does not declare a preview marketplace label', () => {
    expect(packageJson.preview).toBeUndefined();
  });
});
