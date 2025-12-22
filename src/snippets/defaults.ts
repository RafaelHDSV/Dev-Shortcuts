export interface DevShortcutSnippet {
  id: string
  name: string
  prefix: string
  body: string[]
}

export const defaultSnippets: DevShortcutSnippet[] = [
  {
    id: 'component',
    name: 'React Component',
    prefix: '!component',
    body: [
      'interface I${1:Component}Props {}',
      '',
      'export default function ${1:Component}({}: I${1:Component}Props) {',
      '  return (',
      '    <>',
      '      $0',
      '    </>',
      '  )',
      '}'
    ]
  },
  {
    id: 'page',
    name: 'React Page',
    prefix: '!page',
    body: [
      'export default function ${1:Page}() {',
      '  return (',
      '    <main>',
      '      $0',
      '    </main>',
      '  )',
      '}'
    ]
  },
  {
    id: 'hook',
    name: 'React Hook',
    prefix: '!hook',
    body: [
      "import { useState } from 'react'",
      '',
      'export function use${1:Hook}() {',
      '  const [state, setState] = useState(null)',
      '',
      '  return {',
      '    state,',
      '    setState,',
      '  }',
      '}'
    ]
  }
]
