import { create } from 'zustand'

import { loadSettings, saveSettings, type Settings } from '@/game/store/persistence'

type SettingsStore = Settings & {
  update: (patch: Partial<Settings>) => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...loadSettings(),
  update(patch) {
    set(patch)
    const { sound, music, volume, haptics, fastMode } = get()
    saveSettings({ sound, music, volume, haptics, fastMode })
  },
}))

/** React dışı erişim (ses, titreşim, animasyon zamanlaması). */
export const getSettings = () => useSettingsStore.getState()
