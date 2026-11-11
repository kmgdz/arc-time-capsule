import { useState } from 'react'
import { CapsuleCard } from '@/components/CapsuleCard'
import { useNow } from '@/hooks/useNow'
import type { Capsule } from '@/lib/capsule'

const DAY = 86_400
const USDC = 10n ** 18n

// Synthetic creator for mock cards only. Nothing here is read from or sent to a chain.
const MOCK_CREATOR = '0x000000000000000000000000000000000000dEaD'

/** Mock data for screenshots. Only reachable at /dev-preview, never in production builds. */
export default function DevPreview() {
  const now = useNow()
  const [base] = useState(() => Math.floor(Date.now() / 1000))

  const mock = (partial: Partial<Capsule> & Pick<Capsule, 'id' | 'message' | 'createdAt' | 'unlockAt'>): Capsule => ({
    creator: MOCK_CREATOR,
    withdrawn: false,
    amount: 0n,
    ...partial,
  })

  const locked = mock({
    id: 9003n,
    message: 'If you are reading this, the rain finally stopped and the coffee was good.',
    createdAt: BigInt(base - 3 * DAY),
    unlockAt: BigInt(base + 4 * DAY + 3 * 3600 + 27 * 60),
    amount: 25n * USDC,
  })
  const unlocked = mock({
    id: 9002n,
    message: 'Check the second drawer. Everything you need is in there.',
    createdAt: BigInt(base - 10 * DAY),
    unlockAt: BigInt(base - 2 * DAY),
    amount: (3n * USDC) / 4n,
  })
  const withdrawn = mock({
    id: 9001n,
    message: 'We made it to the coast. Remember how loud the gulls were.',
    createdAt: BigInt(base - 40 * DAY),
    unlockAt: BigInt(base - 12 * DAY),
    withdrawn: true,
    amount: (25n * USDC) / 2n,
  })

  const noop = () => undefined

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-[-0.03em]">Capsule states</h1>
      <p className="mt-2 text-sm text-mist">
        Mock data for screenshots. Nothing on this page is onchain. The countdown and ring run live.
      </p>
      <div className="mt-8 space-y-3">
        <CapsuleCard capsule={locked} now={now} onChanged={noop} />
        <CapsuleCard capsule={unlocked} now={now} onChanged={noop} />
        <CapsuleCard capsule={withdrawn} now={now} onChanged={noop} />
      </div>
    </main>
  )
}
