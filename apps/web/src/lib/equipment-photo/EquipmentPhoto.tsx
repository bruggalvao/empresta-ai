import { useContext, useState } from 'react'
import { PhotoAreaContext } from './context'
import { photoPublicUrl } from './storage'

type EquipmentPhotoProps = {
  // Object path in the photo bucket (e.g. "TI-0001.jpg"), never a URL.
  path?: string | null
  // Equipment name: alt text of the photo and label of the placeholder.
  name: string
  className?: string
}

const FRAME = 'block aspect-[4/3] w-full overflow-hidden rounded-md'

export function EquipmentPhoto({ path, name, className = '' }: EquipmentPhotoProps) {
  const insideArea = useContext(PhotoAreaContext)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const url = photoPublicUrl(path)

  if (!insideArea) {
    if (import.meta.env.DEV) {
      console.error(`EquipmentPhoto "${name}" fora de EquipmentPhotoArea: sem área não há crédito, a foto não é exibida.`)
    }
    return null
  }

  if (!url || failedUrl === url) {
    return (
      <div
        role="img"
        aria-label={`Sem foto: ${name}`}
        className={`${FRAME} flex items-center justify-center border border-divider bg-surface text-sm text-status-off-fg ${className}`}
      >
        <span aria-hidden="true">Sem foto</span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={name}
      width={800}
      height={600}
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(url)}
      className={`${FRAME} object-cover ${className}`}
    />
  )
}
