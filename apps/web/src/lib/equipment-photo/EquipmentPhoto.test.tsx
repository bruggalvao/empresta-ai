import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EquipmentPhoto, EquipmentPhotoArea } from '.'

const NAME = 'Notebook 14 polegadas'

function renderInArea(path: string | null | undefined) {
  return render(
    <EquipmentPhotoArea>
      <EquipmentPhoto path={path} name={NAME} />
    </EquipmentPhotoArea>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EquipmentPhoto', () => {
  it('CA-1: carrega a foto da URL pública do bucket do Storage', () => {
    renderInArea('TI-0001.jpg')
    expect(screen.getByRole('img', { name: NAME })).toHaveAttribute(
      'src',
      'https://projeto-teste.supabase.co/storage/v1/object/public/equipamentos/TI-0001.jpg',
    )
  })

  it('CA-2: exibe em 4:3 na largura do contêiner, sem distorção, com 800x600 declarados', () => {
    renderInArea('TI-0001.jpg')
    const img = screen.getByRole('img', { name: NAME })
    expect(img).toHaveAttribute('width', '800')
    expect(img).toHaveAttribute('height', '600')
    expect(img).toHaveClass('aspect-[4/3]', 'w-full', 'object-cover')
  })

  it.each([['https://pixabay.com/get/abc.jpg'], ['fotos/TI-0001.jpg'], ['../TI-0001.jpg'], ['TI-0001.gif']])(
    'CA-3: caminho inválido %j não cria <img> e mostra o substituto',
    (path) => {
      const { container } = renderInArea(path)
      expect(container.querySelector('img')).toBeNull()
      expect(screen.getByRole('img', { name: `Sem foto: ${NAME}` })).toBeInTheDocument()
    },
  )

  it.each([[null], [undefined], ['']])('CA-4: sem caminho (%j) mostra o substituto em 4:3', (path) => {
    const { container } = renderInArea(path)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByRole('img', { name: `Sem foto: ${NAME}` })).toHaveClass('aspect-[4/3]', 'w-full')
  })

  it('CA-5: erro ao carregar troca a foto pelo substituto', () => {
    const { container } = renderInArea('TI-0001.jpg')
    fireEvent.error(screen.getByRole('img', { name: NAME }))
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByRole('img', { name: `Sem foto: ${NAME}` })).toBeInTheDocument()
  })

  it('CA-6: foto tem alt com o nome; substituto tem rótulo "Sem foto: <nome>"', () => {
    const { unmount } = renderInArea('TI-0001.jpg')
    expect(screen.getByRole('img', { name: NAME })).toHaveAttribute('alt', NAME)
    unmount()
    renderInArea(null)
    expect(screen.getByRole('img', { name: `Sem foto: ${NAME}` })).toHaveAttribute('aria-label', `Sem foto: ${NAME}`)
  })

  it('CA-8: fora de uma área de fotos não exibe foto nem substituto', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(
      <div>
        <EquipmentPhoto path="TI-0001.jpg" name={NAME} />
        <EquipmentPhoto path={null} name={NAME} />
      </div>,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
    expect(error).toHaveBeenCalled()
  })
})
