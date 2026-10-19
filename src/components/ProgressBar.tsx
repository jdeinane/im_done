interface Props {
  ratio: number
  label: string
  color?: string
  done?: boolean
}

export function ProgressBar({ ratio, label, color, done }: Props) {
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
  return (
    <div
      className={`bar${done ? ' bar--done' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      style={color ? ({ '--bar-color': color } as React.CSSProperties) : undefined}
    >
      <div className="bar__fill" style={{ width: `${percent}%` }} />
    </div>
  )
}
