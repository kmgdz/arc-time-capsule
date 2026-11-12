const STEPS = ['Write it', 'Choose when it opens', 'Seal it on Arc']

export function StepsStrip() {
  return (
    <ol className="mt-8 grid max-w-3xl list-none gap-3 p-0 sm:grid-cols-3">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className="flex min-h-11 items-center gap-3 rounded-ctl border border-tide bg-deep px-4 py-3 text-sm text-salt"
        >
          <span className="font-semibold tabular-nums text-resin">{i + 1}</span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  )
}
