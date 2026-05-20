import { SnippetManagerViewProvider } from '../views/snippetManagerView';

export function createOpenManagerCommand(view: SnippetManagerViewProvider) {
  return async function openManager(): Promise<void> {
    view.reveal();
  };
}
