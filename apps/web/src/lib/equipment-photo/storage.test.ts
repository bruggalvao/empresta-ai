import { describe, expect, it } from 'vitest'
import { isValidPhotoPath, photoPublicUrl } from './storage'

describe('storage', () => {
  it('CA-1: monta a URL pública do bucket equipamentos a partir do caminho', () => {
    expect(photoPublicUrl('TI-0001.jpg')).toBe(
      'https://projeto-teste.supabase.co/storage/v1/object/public/equipamentos/TI-0001.jpg',
    )
    expect(photoPublicUrl('TI-0001.jpg', 'https://outro.supabase.co/')).toBe(
      'https://outro.supabase.co/storage/v1/object/public/equipamentos/TI-0001.jpg',
    )
  })

  it.each([
    ['https://pixabay.com/get/abc.jpg'],
    ['http://exemplo.com/TI-0001.jpg'],
    ['//cdn.exemplo.com/TI-0001.jpg'],
    ['fotos/TI-0001.jpg'],
    ['fotos\\TI-0001.jpg'],
    ['../TI-0001.jpg'],
    ['TI-0001..jpg'],
    ['TI-0001.gif'],
    ['TI-0001'],
    [''],
  ])('CA-3: caminho inválido %j não gera URL', (path) => {
    expect(isValidPhotoPath(path)).toBe(false)
    expect(photoPublicUrl(path)).toBeNull()
  })

  it('CA-3: aceita só as extensões jpg, jpeg, png e webp', () => {
    for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'JPG']) {
      expect(isValidPhotoPath(`TI-0001.${ext}`)).toBe(true)
    }
  })
})
