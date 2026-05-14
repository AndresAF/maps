import { useState } from 'react'
import { loadLandmarks } from '../utils/storage'

export function useLandmarks() {
  const [landmarks] = useState(() => loadLandmarks())
  return { landmarks }
}
