import { createContext } from 'react'

// True only inside an EquipmentPhotoArea, which always renders the credit.
export const PhotoAreaContext = createContext(false)
