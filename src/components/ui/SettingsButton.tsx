import { useState } from 'react'

import { Modal } from '@/components/ui/Modal'
import { useSettingsStore } from '@/game/store/settingsStore'
import { sfx } from '@/lib/audio'
import { cn } from '@/lib/cn'

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[#2e2a22] bg-black/30 px-4 py-3">
      <span>
        <span className="block text-[14px] font-medium text-[#ede6d8]">{label}</span>
        {hint && <span className="block text-[11px] text-[#7a7060]">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
          value ? 'border-[#8a7030] bg-[#c4a054]' : 'border-[#3f3a34] bg-[#1a1814]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-[#f2eae1] shadow transition-[left]',
            value ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </label>
  )
}

/** Dişli ikonu + ayarlar modali (ses, titreşim, hızlı mod). */
export function SettingsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const s = useSettingsStore()

  return (
    <>
      <button
        type="button"
        aria-label="Ayarlar"
        title="Ayarlar"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3f3a34]/80 bg-black/40 text-[16px] text-[#a89f92] transition hover:border-[#6a5f4f] hover:text-[#f2eae1]',
          className,
        )}
      >
        ⚙
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Ayarlar" className="max-w-md">
        <div className="flex flex-col gap-3">
          <Toggle
            label="Ses efektleri"
            value={s.sound}
            onChange={(v) => {
              s.update({ sound: v })
              if (v) sfx.click()
            }}
          />
          <label className={cn('rounded-lg border border-[#2e2a22] bg-black/30 px-4 py-3', !s.sound && 'opacity-50')}>
            <span className="flex justify-between text-[14px] font-medium text-[#ede6d8]">
              Ses düzeyi <span className="tabular-nums text-[#a89f92]">{Math.round(s.volume * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={s.volume}
              disabled={!s.sound}
              onChange={(e) => s.update({ volume: Number(e.target.value) })}
              onPointerUp={() => sfx.hit(10)}
              className="mt-2 w-full accent-[#c4a054]"
            />
          </label>
          <Toggle label="Titreşim" hint="Destekleyen mobil cihazlarda" value={s.haptics} onChange={(v) => s.update({ haptics: v })} />
          <Toggle label="Hızlı mod" hint="Düşman turu animasyonlarını hızlandırır" value={s.fastMode} onChange={(v) => s.update({ fastMode: v })} />
        </div>
      </Modal>
    </>
  )
}
