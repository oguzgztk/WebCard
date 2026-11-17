import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { ALL_CHARACTERS } from '@/data/characters'
import type { BattleChoice } from '@/game/battleChoice'
import { getEnemyArtSrc } from '@/game/visuals'

type Props = Readonly<{
  onStartBattle: (choice: BattleChoice) => void
  onStartRun: (characterId: string) => void
  onContinueRun: () => void
  hasSavedRun: boolean
}>

type Preset = BattleChoice & { description: string }

const PRESETS: readonly Preset[] = [
  { seed: 4242,  enemyDefId: 'jaw_worm',   label: 'Çene Kurdu',     description: 'Derin toprak altından gelen, sürekli büyüyen bir tehdit.' },
  { seed: 991,   enemyDefId: 'cultist',    label: 'Tarikat Üyesi',  description: 'Her turda güç toplayan, şiddetlenen bir fanatik.' },
  { seed: 1337,  enemyDefId: 'louse',      label: 'Asalak',         description: 'Hızlı, iğneleyici, zayıflatıcı — düşük canı yanıltıcıdır.' },
  { seed: 7777,  enemyDefId: 'fungibeast', label: 'Mantar Canavarı', description: 'Yavaş ama amansız — blok biriktirir, sonra ezer.' },
]

export function LobbyScreen({ onStartBattle, onStartRun, onContinueRun, hasSavedRun }: Props) {
  const [view, setView] = useState<'main' | 'character'>('main')

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      {/* Atmosfer */}
      <div aria-hidden className="pointer-events-none absolute inset-x-[-30%] top-[-20%] h-[55vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(90_68_44/0.28),_transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute bottom-[-10%] left-[-10%] h-[40vh] w-[60vw] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(60_42_28/0.18),_transparent_70%)]" />

      <div className="relative w-full max-w-xl">
        {/* Başlık */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 h-px w-24 bg-gradient-to-r from-transparent via-[#c4a054]/60 to-transparent" />
          <p className="font-display text-[0.8rem] font-semibold uppercase tracking-[0.28em] text-[#9e8f68]">Kart Savaşı</p>
          <h1 className="font-display mt-3 text-[3rem] font-semibold tracking-[-0.02em] text-[#f2ebe3] drop-shadow-[0_2px_24px_rgb(0_0_0/0.55)] sm:text-[3.75rem]">
            Web Card
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {view === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {/* Continue Run */}
              {hasSavedRun && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onContinueRun}
                  className="group relative w-full overflow-hidden rounded-2xl border border-[#3a6a3a]/70 bg-gradient-to-b from-[#0e1a0e]/90 to-black/90 px-6 py-4 text-left shadow-[0_8px_32px_-10px_rgb(0_0_0/0.75)] transition-all hover:border-[#5a8a5a]/80"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#5a9a5a]">Kayıtlı Koşu</p>
                      <h2 className="font-display mt-0.5 text-[1.4rem] font-semibold tracking-tight text-[#f2ebe3]">
                        Devam Et
                      </h2>
                    </div>
                    <span className="shrink-0 text-2xl text-[#6ab06a]/70 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </motion.button>
              )}

              {/* Yeni Koşu */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: hasSavedRun ? 0.06 : 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('character')}
                className="group relative w-full overflow-hidden rounded-2xl border border-[#6a5230]/70 bg-gradient-to-b from-[#1f1608]/90 to-black/90 px-6 py-5 text-left shadow-[0_8px_32px_-10px_rgb(0_0_0/0.75),inset_0_1px_0_rgb(255_255_255/0.08)] transition-all hover:border-[#8a6c42]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#9e8f68]">Yeni</p>
                    <h2 className="font-display mt-1 text-[1.65rem] font-semibold tracking-tight text-[#f2ebe3]">Koşu Başlat</h2>
                    <p className="mt-1 text-[12px] leading-snug text-[#6a6258]">
                      Karakter seç → zindan yoluna çık
                    </p>
                  </div>
                  <span className="shrink-0 text-2xl text-[#c4a054]/70 transition-transform group-hover:translate-x-1 group-hover:text-[#dbb96a]/90">→</span>
                </div>
              </motion.button>

              {/* Ayırıcı */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#3a342b]/70 to-transparent" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3a342b]">ya da hızlı savaş</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#3a342b]/70 to-transparent" />
              </div>

              {/* Hızlı savaş kartları */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {PRESETS.map((preset, i) => {
                  const art = getEnemyArtSrc(preset.enemyDefId)
                  return (
                    <motion.button
                      key={preset.enemyDefId}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onStartBattle(preset)}
                      className="group relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#3a342b]/80 bg-gradient-to-b from-[#181410]/90 to-black/90 shadow-[0_8px_32px_-10px_rgb(0_0_0/0.75)] transition-shadow hover:border-[#5a4c36]/70"
                    >
                      <div className="relative flex h-44 w-full items-end justify-center overflow-hidden bg-gradient-to-b from-[#151210] to-[#070605]">
                        {art ? (
                          <img src={art} alt={preset.label} className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]" draggable={false} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-[#3a342b]">görsel yok</div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0807] to-transparent" />
                      </div>
                      <div className="px-4 pb-4 pt-2 text-left">
                        <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#7a6e57]">Rakip</p>
                        <h2 className="font-display mt-0.5 text-[1.1rem] font-semibold text-[#ede6d8]">{preset.label}</h2>
                        <p className="mt-1 text-[11px] leading-snug text-[#5a5248]">{preset.description}</p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            /* Karakter Seçimi */
            <motion.div
              key="character"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex flex-col gap-4"
            >
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#7a6e57]">Karakterini seç</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {ALL_CHARACTERS.map((char, i) => (
                  <motion.button
                    key={char.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4, transition: { duration: 0.18 } }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onStartRun(char.id)}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border text-left shadow-[0_8px_32px_-10px_rgb(0_0_0/0.8)] transition-all"
                    style={{ borderColor: `${char.accentColor}45` }}
                  >
                    {/* Karakter görseli */}
                    <div className="relative h-64 w-full overflow-hidden bg-black/60">
                      <img
                        src={char.portraitSrc}
                        alt={char.name}
                        className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        draggable={false}
                      />
                      {/* Alt vinyete */}
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black to-transparent" />
                      {/* Üst vinyete */}
                      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent" />

                      {/* İsim overlay */}
                      <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: char.accentColor }}>
                              {char.subtitle}
                            </p>
                            <h2 className="font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-white">
                              {char.name}
                            </h2>
                          </div>
                          <span className="text-2xl">{char.icon}</span>
                        </div>
                      </div>
                    </div>

                    {/* Alt bilgi */}
                    <div
                      className="px-4 pb-4 pt-3"
                      style={{ background: `linear-gradient(to bottom, color-mix(in srgb, ${char.accentColor} 6%, black), black)` }}
                    >
                      <p className="text-[11px] leading-snug text-[#7a7268]">{char.description}</p>
                      <div className="mt-2.5 flex gap-3 text-[10px]" style={{ color: `${char.accentColor}cc` }}>
                        <span>❤ {char.maxHp} can</span>
                        <span>🃏 {char.starterDeckIds.length} kart</span>
                      </div>
                      <div
                        className="mt-3 flex items-center justify-end text-[11px] font-semibold uppercase tracking-wider transition-transform group-hover:translate-x-1"
                        style={{ color: char.accentColor }}
                      >
                        Seç →
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setView('main')}
                className="text-[11px] text-[#4a4438] underline underline-offset-4 transition-colors hover:text-[#7a6e57]"
              >
                ← Geri
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
