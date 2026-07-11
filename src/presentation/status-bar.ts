export type StatusBarState = 'idle' | 'success' | 'issues';

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
    tooltip: 'Analyze the current C# file with QueryForge',
    command: 'queryforge.analyzeCurrentFile',
    visible: isCSharpEditor,
  };

  switch (state) {
    case 'success':
      return {
        ...base,
        text: '$(check) QueryForge: 0',
      };
    case 'issues':
      return {
        ...base,
        text: `$(warning) QueryForge: ${issueCount}`,
      };
    case 'idle':
    default:
      return {
        ...base,
        text: '$(search) QueryForge',
      };
  }
}

export function resolveStatusBarState(issueCount: number): StatusBarState {
  if (issueCount > 0) {
    return 'issues';
  }

  return 'success';
}
