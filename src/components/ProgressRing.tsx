interface Props {
  /** 0 to 1: how much of the lock period has passed. */
  fraction: number
  size?: number
}

export function ProgressRing({ fraction, size = 28 }: Props) {
  const clamped = Math.min(1, Math.max(0, fraction))
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const percent = Math.round(clamped * 100)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${percent}% of the lock time has passed`}
      className="shrink-0 -rotate-90"
    >
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#26405E" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#F2A93B"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
      />
    </svg>
  )
}
