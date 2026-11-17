import { MotionConfig } from 'framer-motion'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { useSettingsStore } from '@/game/store/settingsStore'
import { startMusic, stopMusic, updateMusicVolume } from '@/lib/audio'
import '@/styles/globals.css'

// Müzik: tarayıcı kuralı gereği ilk kullanıcı etkileşiminde başlar; ayar değişince güncellenir.
const syncMusic = () => {
  if (useSettingsStore.getState().music) {
    startMusic()
    updateMusicVolume()
  } else {
    stopMusic()
  }
}
window.addEventListener('pointerdown', syncMusic, { once: true })
window.addEventListener('keydown', syncMusic, { once: true })
useSettingsStore.subscribe((s, prev) => {
  if (s.music !== prev.music || s.volume !== prev.volume) syncMusic()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* İşletim sisteminde "hareketi azalt" açıksa animasyonlar sadeleşir. */}
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
