import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EquipmentPhoto, EquipmentPhotoArea } from '.'

describe('EquipmentPhotoArea', () => {
  it('CA-7: sempre exibe "Fotos: Pixabay" com link para o Pixabay em nova aba', () => {
    render(
      <EquipmentPhotoArea>
        <EquipmentPhoto path="TI-0001.jpg" name="Webcam Full HD" />
      </EquipmentPhotoArea>,
    )
    expect(screen.getByText(/Fotos:/)).toHaveTextContent('Fotos: Pixabay')
    const link = screen.getByRole('link', { name: 'Pixabay' })
    expect(link).toHaveAttribute('href', 'https://pixabay.com/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('CA-7: o crédito não depende da tela — aparece em qualquer área, sem configuração', () => {
    render(
      <EquipmentPhotoArea>
        <p>conteúdo qualquer</p>
      </EquipmentPhotoArea>,
    )
    expect(screen.getByRole('link', { name: 'Pixabay' })).toBeInTheDocument()
  })
})
