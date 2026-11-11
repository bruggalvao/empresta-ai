import type { ReactNode } from 'react'
import { PhotoAreaContext } from './context'

export const PIXABAY_URL = 'https://pixabay.com/'

type EquipmentPhotoAreaProps = {
  children: ReactNode
  className?: string
}

// Wraps any part of a screen that shows equipment photos. The Pixabay
// credit is part of the area, so no screen can show photos without it.
export function EquipmentPhotoArea({ children, className }: EquipmentPhotoAreaProps) {
  return (
    <PhotoAreaContext.Provider value={true}>
      <div className={className}>
        {children}
        <p className="mt-3 text-xs text-status-off-fg">
          Fotos:{' '}
          <a
            href={PIXABAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            Pixabay
          </a>
        </p>
      </div>
    </PhotoAreaContext.Provider>
  )
}
