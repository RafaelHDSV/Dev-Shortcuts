import * as vscode from 'vscode';
import { UsageTip } from '../types';

const DISMISSED_KEY = 'devShortcuts.dismissedTips';
const WELCOME_SEEN_KEY = 'devShortcuts.welcomeSeen';

export const USAGE_TIPS: UsageTip[] = [
  {
    id: 'trigger',
    title: 'Type ! in the editor',
    body:
      'Start any Dev Shortcuts prefix with "!". IntelliSense lists your snippets; keep typing to filter (e.g. !ef).'
  },
  {
    id: 'syntax',
    title: 'Snippet syntax',
    body:
      'Use $1, ${1:placeholder}, and $0 for tab stops — same as VS Code user snippets. See the live preview while editing.'
  },
  {
    id: 'imports',
    title: 'Optional imports',
    body:
      'Add import lines in the Imports field. They are inserted at the top of the file when you use the snippet, without duplicating existing imports.'
  },
  {
    id: 'suggestions',
    title: 'Browse suggestions',
    body:
      'React and generic templates live under Suggestions. Click "Add to library" — nothing is installed until you choose.'
  },
  {
    id: 'backup',
    title: 'Back up your library',
    body: 'Use Export snippets to save JSON. Import restores or merges with duplicate handling.'
  },
  {
    id: 'native-conflict',
    title: 'Native snippet conflicts',
    body:
      'If the same !prefix exists in a VS Code .code-snippets file, both may appear in completion. Remove the native duplicate to avoid ambiguity.'
  }
];

export function getActiveTips(context: vscode.ExtensionContext): UsageTip[] {
  const dismissed = getDismissedTipIds(context);
  return USAGE_TIPS.filter((t) => !dismissed.has(t.id));
}

export function getDismissedTipIds(
  context: vscode.ExtensionContext
): Set<string> {
  const raw = context.globalState.get<string[]>(DISMISSED_KEY, []);
  return new Set(raw);
}

export async function dismissTip(
  context: vscode.ExtensionContext,
  tipId: string
): Promise<void> {
  const dismissed = getDismissedTipIds(context);
  dismissed.add(tipId);
  await context.globalState.update(DISMISSED_KEY, [...dismissed]);
}

export function hasSeenWelcome(context: vscode.ExtensionContext): boolean {
  return context.globalState.get<boolean>(WELCOME_SEEN_KEY, false) === true;
}

export async function markWelcomeSeen(
  context: vscode.ExtensionContext
): Promise<void> {
  await context.globalState.update(WELCOME_SEEN_KEY, true);
}

/** Clears welcome + dismissed tips so onboarding shows again (dev testing). */
export async function resetOnboarding(
  context: vscode.ExtensionContext
): Promise<void> {
  await context.globalState.update(WELCOME_SEEN_KEY, false);
  await context.globalState.update(DISMISSED_KEY, []);
}
