import { CustomSnippet } from '../types'

export const defaultSnippets: CustomSnippet[] = [
  {
    id: 'component',
    name: 'React Component',
    prefix: '!component',
    description: 'Cria um componente React com interface de props',
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
    description: 'Cria uma página React básica',
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
    description: 'Cria um hook React com useState',
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
