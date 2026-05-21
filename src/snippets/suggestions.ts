import { SuggestedSnippet } from '../types';

/**
 * Opt-in suggestion catalog. Not registered in completion until the user
 * adds an item to their library via the manager or command palette.
 */
export const SUGGESTION_CATALOG: SuggestedSnippet[] = [
  {
    catalogId: 'react-rfc',
    category: 'react',
    name: 'Function component',
    prefix: '!rfc',
    description: 'Export function component with props interface',
    body: [
      'interface I${1:Component}Props {}',
      '',
      'export function ${1:Component}({}: I${1:Component}Props) {',
      '  return (',
      '    <>',
      '      $0',
      '    </>',
      '  );',
      '}'
    ]
  },
  {
    catalogId: 'react-rus',
    category: 'react',
    name: 'useState hook',
    prefix: '!rus',
    description: 'Custom hook with useState',
    imports: ["import { useState } from 'react'"],
    body: [
      'export function use${1:Hook}() {',
      '  const [${2:state}, setState] = useState(${3:null});',
      '',
      '  return {',
      '    ${2:state},',
      '    setState,',
      '  };',
      '}'
    ]
  },
  {
    catalogId: 'react-page',
    category: 'react',
    name: 'Page component',
    prefix: '!rpage',
    description: 'Simple page wrapper',
    body: [
      'export default function ${1:Page}() {',
      '  return (',
      '    <main>',
      '      $0',
      '    </main>',
      '  );',
      '}'
    ]
  },
  {
    catalogId: 'react-effect',
    category: 'react',
    name: 'useEffect hook',
    prefix: '!rue',
    description: 'useEffect with cleanup',
    imports: ["import { useEffect } from 'react'"],
    body: [
      'useEffect(() => {',
      '  $1',
      '  return () => {',
      '    $2',
      '  };',
      '}, [$3]);'
    ]
  },
  {
    catalogId: 'generic-fn',
    category: 'generic',
    name: 'Named function',
    prefix: '!fn',
    description: 'Named function declaration',
    body: [
      'function ${1:name}(${2:args}) {',
      '  $0',
      '}'
    ]
  },
  {
    catalogId: 'generic-class',
    category: 'generic',
    name: 'Class',
    prefix: '!cls',
    description: 'Class with constructor',
    body: [
      'class ${1:Name} {',
      '  constructor(${2:args}) {',
      '    $0',
      '  }',
      '}'
    ]
  },
  {
    catalogId: 'generic-tc',
    category: 'generic',
    name: 'Test case skeleton',
    prefix: '!tc',
    description: 'Describe / it test block',
    body: [
      "describe('${1:subject}', () => {",
      "  it('${2:should}', () => {",
      '    $0',
      '  });',
      '});'
    ]
  },
  {
    catalogId: 'generic-trycatch',
    category: 'generic',
    name: 'Try / catch',
    prefix: '!tcatch',
    description: 'Try catch with error variable',
    body: [
      'try {',
      '  $1',
      '} catch (${2:error}) {',
      '  $0',
      '}'
    ]
  },
  {
    catalogId: 'generic-interface',
    category: 'generic',
    name: 'Interface',
    prefix: '!iface',
    description: 'TypeScript interface',
    body: [
      'interface ${1:Name} {',
      '  $0',
      '}'
    ]
  }
];

export function getSuggestionByCatalogId(
  catalogId: string
): SuggestedSnippet | undefined {
  return SUGGESTION_CATALOG.find((s) => s.catalogId === catalogId);
}

export function getSuggestionsByCategory(
  category: SuggestedSnippet['category']
): SuggestedSnippet[] {
  return SUGGESTION_CATALOG.filter((s) => s.category === category);
}
