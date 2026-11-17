import { UIButton } from '@/components/ui/UIButton'

type Props = Readonly<{
  disabled?: boolean
  onPush: () => void
  size?: 'compact' | 'normal'
}>

export function EndTurnButton({ disabled, onPush, size = 'normal' }: Props) {
  return (
    <UIButton tone="primary" size={size} disabled={disabled} onClick={onPush}>
      Turu Bitir
    </UIButton>
  )
}
