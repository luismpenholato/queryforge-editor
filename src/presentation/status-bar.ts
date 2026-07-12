export type StatusBarState = 'idle' | 'running' | 'success' | 'issues';

export interface StatusBarViewModel {
  text: string;
  tooltip: string;
  command: string;
  visible: boolean;
}

export function createStatusBarViewModel(
  state: StatusBarState,
  issueCount = 0,
  isCSharpEditor = true,
): StatusBarViewModel {
  const base = {
    command: 'queryforge.analyzeCurrentFile',
    visible: isCSharpEditor,
  };

  switch (state) {
    case 'running':
      return {
        ...base,
        text: '$(sync~spin) QueryForge',
        tooltip: 'QueryForge is analyzing the current C# document',
      };
    case 'success':
      return {
        ...base,
        text: '$(check) QueryForge: 0',
        tooltip: 'Analyze the current C# file with QueryForge',
      };
    case 'issues':
      return {
        ...base,
        text: `$(warning) QueryForge: ${issueCount}`,
        tooltip: 'Analyze the current C# file with QueryForge',
      };
    case 'idle':
    default:
      return {
        ...base,
        text: '$(search) QueryForge',
        tooltip: 'Analyze the current C# file with QueryForge',
      };
  }
}

export function resolveStatusBarState(issueCount: number): Exclude<StatusBarState, 'running' | 'idle'> {
  if (issueCount > 0) {
    return 'issues';
  }

  return 'success';
}
