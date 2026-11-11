import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve(LIB_DIR, '../..')

// Source files outside the library that might build an image URL.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return full === LIB_DIR ? [] : sourceFiles(full)
    return /\.(?:ts|tsx|js|jsx|css|html)$/.test(entry.name) ? [full] : []
  })
}

// The bucket name as a code literal (UI text like "equipamentos disponíveis"
// is fine) and any hand-built Storage URL.
const FORBIDDEN = [/["'`]equipamentos["'`]/, /storage\/v1\/object/]

describe('caminho único', () => {
  it('CA-9: nenhum arquivo de src fora de lib/equipment-photo referencia o bucket ou monta URL do Storage', () => {
    const files = sourceFiles(SRC_DIR)
    expect(files.length).toBeGreaterThan(0)
    const offenders = files.filter((file) => {
      const text = readFileSync(file, 'utf8')
      return FORBIDDEN.some((re) => re.test(text))
    })
    expect(offenders.map((f) => path.relative(SRC_DIR, f))).toEqual([])
  })

  it('CA-9: o teste enxerga uma violação plantada (sanidade do padrão)', () => {
    expect(FORBIDDEN.some((re) => re.test("supabase.storage.from('equipamentos')"))).toBe(true)
    expect(FORBIDDEN.some((re) => re.test('`${url}/storage/v1/object/public/x.jpg`'))).toBe(true)
    expect(FORBIDDEN.some((re) => re.test('Catálogo de equipamentos disponíveis'))).toBe(false)
  })
})
