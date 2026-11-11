import { useEffect, useRef, useState } from 'react'
import { useAccount, usePublicClient, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { toast } from 'sonner'
import { ExternalLink, Lock, LockOpen } from 'lucide-react'
import { CHAIN, CONTRACT_ADDRESS, addressUrl, txUrl } from '@/config'
import { timeCapsuleAbi } from '@/lib/timeCapsuleAbi'
import {
  capsuleNumber,
  formatCountdown,
  formatDateTime,
  parseTxError,
  shortAddress,
  type Capsule,
} from '@/lib/capsule'
import { formatNativeUsdc } from '@/lib/money'
import { estimateArcFees } from '@/lib/fees'
import { ProgressRing } from './ProgressRing'

interface Props {
  capsule: Capsule
  now: number
  onChanged: () => void
}

export function CapsuleCard({ capsule, now, onChanged }: Props) {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { writeContract, data: hash, isPending, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash, chainId: CHAIN.id })
  const publicClient = usePublicClient({ chainId: CHAIN.id })
  const [preparing, setPreparing] = useState(false)
  const handled = useRef<string | undefined>(undefined)

  const unlocked = BigInt(now) >= capsule.unlockAt
  const hasFunds = capsule.amount > 0n
  const isCreator = address !== undefined && address.toLowerCase() === capsule.creator.toLowerCase()
  const canWithdraw = isCreator && unlocked && hasFunds && !capsule.withdrawn
  const busy = isPending || receipt.isLoading || preparing
  const secondsLeft = Number(capsule.unlockAt) - now
  const span = Number(capsule.unlockAt - capsule.createdAt)
  const fraction = span > 0 ? (now - Number(capsule.createdAt)) / span : 1

  useEffect(() => {
    if (!hash || !receipt.isSuccess || handled.current === hash) return
    handled.current = hash
    toast.success('USDC withdrawn to your wallet')
    reset()
    onChanged()
  }, [hash, receipt.isSuccess, reset, onChanged])

  const withdraw = () => {
    if (!CONTRACT_ADDRESS) return
    if (chainId !== CHAIN.id) {
      switchChain({ chainId: CHAIN.id })
      return
    }
    const contractAddress = CONTRACT_ADDRESS
    setPreparing(true)
    // Arc drops transactions with maxFeePerGas under 20 Gwei, so fees are set explicitly (see lib/fees.ts).
    void estimateArcFees(publicClient)
      .then((fees) => {
        writeContract(
          {
            address: contractAddress,
            abi: timeCapsuleAbi,
            functionName: 'withdraw',
            args: [capsule.id],
            chainId: CHAIN.id,
            ...fees,
          },
          {
            onError: (err) => {
              const text = parseTxError(err)
              if (text) toast.error(text)
            },
          },
        )
      })
      .finally(() => setPreparing(false))
  }

  return (
    <article
      className={`rounded-card border bg-deep p-5 sm:p-6 ${unlocked ? 'border-lagoon/30' : 'border-resin/30'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-sm">
          {unlocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-ctl border border-lagoon/40 px-2 py-0.5 font-medium text-lagoon">
              <LockOpen className="h-3.5 w-3.5" aria-hidden /> Unlocked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-ctl border border-resin/40 px-2 py-0.5 font-medium text-resin">
              <Lock className="h-3.5 w-3.5" aria-hidden /> Locked
            </span>
          )}
          {capsule.withdrawn && (
            <span className="inline-flex items-center rounded-ctl border border-tide px-2 py-0.5 font-medium text-mist">
              Withdrawn
            </span>
          )}
          <span className="tabular-nums text-mist">#{capsuleNumber(capsule.id)}</span>
        </div>
        {!unlocked && (
          <div className="flex items-center gap-2">
            <ProgressRing fraction={fraction} />
            <span className="text-sm font-medium tabular-nums text-salt">{formatCountdown(secondsLeft)}</span>
          </div>
        )}
      </div>

      <p className="mt-4 whitespace-pre-wrap break-words text-pretty font-display text-2xl leading-snug text-salt sm:text-[1.65rem]">
        {capsule.message}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 text-sm text-mist">
        <a
          href={addressUrl(capsule.creator)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 tabular-nums underline-offset-4 hover:text-salt hover:underline"
        >
          {isCreator ? 'By you' : `By ${shortAddress(capsule.creator)}`} <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        <span className="tabular-nums">
          {unlocked ? 'Opened' : 'Opens'} {formatDateTime(capsule.unlockAt)}
        </span>
        {hasFunds && (
          <span className="tabular-nums">
            {formatNativeUsdc(capsule.amount)} USDC {capsule.withdrawn ? 'withdrawn' : 'locked'}
          </span>
        )}
      </div>

      {canWithdraw && (
        <button
          type="button"
          onClick={withdraw}
          disabled={busy}
          className="mt-3 min-h-11 w-full rounded-ctl bg-resin px-4 text-sm font-semibold text-abyss transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-tide disabled:text-mist disabled:hover:brightness-100"
        >
          {isPending ? 'Confirm in your wallet' : receipt.isLoading ? 'Confirming onchain' : 'Withdraw USDC'}
        </button>
      )}
      {isCreator && hasFunds && !unlocked && !capsule.withdrawn && (
        <p className="mt-2 text-sm text-mist">Your USDC can be withdrawn when the countdown ends.</p>
      )}
      {hash && !receipt.isSuccess && (
        <a
          href={txUrl(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm text-mist underline-offset-4 hover:text-salt hover:underline"
        >
          View transaction <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      )}
    </article>
  )
}
