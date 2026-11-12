import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useAccount,
  useBalance,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { useModal } from 'connectkit'
import { toast } from 'sonner'
import { ExternalLink, Info } from 'lucide-react'
import { CHAIN, CONTRACT_ADDRESS, IS_TESTNET, txUrl } from '@/config'
import { timeCapsuleAbi } from '@/lib/timeCapsuleAbi'
import {
  MAX_MESSAGE_BYTES,
  byteLength,
  formatDateTime,
  maxUnlockSeconds,
  parseTxError,
  toLocalInputValue,
} from '@/lib/capsule'
import { formatNativeUsdc, formatNativeUsdcExact, parseNativeUsdc } from '@/lib/money'
import { estimateArcFees } from '@/lib/fees'
import { useNow } from '@/hooks/useNow'

type Mode = 'now' | 'lock'

const PRESETS: { label: string; seconds: number }[] = [
  { label: '1 day', seconds: 86_400 },
  { label: '1 week', seconds: 7 * 86_400 },
  { label: '30 days', seconds: 30 * 86_400 },
  { label: '1 year', seconds: 365 * 86_400 },
]

// On mainnet, locking more than this needs an explicit extra confirmation.
const LARGE_AMOUNT = parseNativeUsdc('5') ?? 0n

const inputClass =
  'w-full min-h-12 rounded-ctl border border-tide bg-abyss px-3.5 py-3 text-base text-salt placeholder:text-mist/70 focus:border-lagoon'

export function CreateCapsuleForm({ onCreated }: { onCreated: () => void }) {
  const now = useNow()
  const { address, isConnected, chainId } = useAccount()
  const { setOpen } = useModal()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { writeContract, data: hash, isPending, reset: resetWrite } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash, chainId: CHAIN.id })
  const publicClient = usePublicClient({ chainId: CHAIN.id })
  const balance = useBalance({ address, chainId: CHAIN.id, query: { enabled: isConnected } })

  const [message, setMessage] = useState('')
  const [messageTouched, setMessageTouched] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [confirmedFor, setConfirmedFor] = useState<bigint | null>(null)
  const [mode, setMode] = useState<Mode>('lock')
  const [dateValue, setDateValue] = useState('')
  const [amountText, setAmountText] = useState('')
  const [lastHash, setLastHash] = useState<`0x${string}` | undefined>()
  const handled = useRef<string | undefined>(undefined)

  const bytes = byteLength(message)
  const overLimit = bytes > MAX_MESSAGE_BYTES
  const amount = parseNativeUsdc(amountText)
  const unlockAt = useMemo(() => {
    if (mode === 'now') return 0
    const ms = new Date(dateValue).getTime()
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : null
  }, [mode, dateValue])

  const problem = useMemo(() => {
    if (message.trim() === '') return 'Write a message before sealing the capsule.'
    if (overLimit) return `The message is ${bytes - MAX_MESSAGE_BYTES} bytes over the limit. Shorten it to 280 bytes or fewer.`
    if (mode === 'lock') {
      if (unlockAt === null || unlockAt === 0) return 'Pick an unlock date and time, or choose Reveal now.'
      if (unlockAt <= now + 30) return 'The unlock time has already passed. Pick a later date.'
      if (unlockAt > maxUnlockSeconds(now)) return 'The longest lock is 3650 days. Pick an earlier date.'
    }
    if (amount === null) return 'The USDC amount is not valid. Use a number with up to 18 decimals.'
    if (amount > 0n && balance.data && amount > balance.data.value) {
      return IS_TESTNET
        ? 'The amount is more than your balance. Lower it or add test USDC.'
        : 'The amount is more than your balance. Lower it or add more USDC.'
    }
    return null
  }, [message, overLimit, bytes, mode, unlockAt, now, amount, balance.data])

  const wrongChain = isConnected && chainId !== CHAIN.id
  const busy = isPending || receipt.isLoading || preparing
  const needsConfirm = !IS_TESTNET && amount !== null && amount > LARGE_AMOUNT
  const confirmed = amount !== null && confirmedFor === amount

  useEffect(() => {
    if (!hash || !receipt.isSuccess || handled.current === hash) return
    handled.current = hash
    setLastHash(hash)
    setMessage('')
    setMessageTouched(false)
    setAttempted(false)
    setConfirmedFor(null)
    setAmountText('')
    setDateValue('')
    resetWrite()
    toast.success('Capsule sealed')
    onCreated()
  }, [hash, receipt.isSuccess, resetWrite, onCreated])

  useEffect(() => {
    if (receipt.isError) {
      toast.error('The transaction failed onchain. Check the explorer, then try again.')
      resetWrite()
    }
  }, [receipt.isError, resetWrite])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!CONTRACT_ADDRESS) return
    // Connecting and switching networks come first: they must work even while the form is still empty.
    if (!isConnected) {
      setOpen(true)
      return
    }
    if (wrongChain) {
      switchChain({ chainId: CHAIN.id })
      return
    }
    setAttempted(true)
    if (problem || amount === null) return
    if (needsConfirm && !confirmed) return
    setLastHash(undefined)
    const contractAddress = CONTRACT_ADDRESS
    setPreparing(true)
    // Arc drops transactions with maxFeePerGas under 20 Gwei, so fees are set explicitly (see lib/fees.ts).
    void estimateArcFees(publicClient)
      .then((fees) => {
        writeContract(
          {
            address: contractAddress,
            abi: timeCapsuleAbi,
            functionName: 'createCapsule',
            args: [message, BigInt(unlockAt ?? 0)],
            value: amount,
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

  let cta = 'Seal capsule'
  if (!isConnected) cta = 'Connect wallet'
  else if (wrongChain) cta = `Switch to ${CHAIN.name}`
  else if (isPending) cta = 'Confirm in your wallet'
  else if (receipt.isLoading) cta = 'Confirming onchain'

  const disabled =
    !CONTRACT_ADDRESS ||
    busy ||
    isSwitching ||
    (isConnected && !wrongChain && (problem !== null || (needsConfirm && !confirmed)))
  // An empty, untouched message is not an error yet: wait until the person has typed in it or tried to submit.
  const messageEmpty = message.trim() === ''
  const showProblem =
    isConnected &&
    !wrongChain &&
    problem !== null &&
    (messageEmpty ? messageTouched || attempted : true)

  return (
    <form onSubmit={submit} className="space-y-6 rounded-card border border-tide bg-deep p-5 sm:p-6">
      {!IS_TESTNET && (
        <div className="flex gap-3 rounded-ctl border border-tide bg-abyss p-3 text-sm text-mist">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-resin" aria-hidden />
          <p>
            This contract is unaudited. It can't be changed or paused. Locked USDC can only be withdrawn by the creator
            after the unlock time. Use small amounts.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="message" className="flex items-baseline justify-between gap-3 text-sm font-medium text-salt">
          Message
          <span className={`text-sm tabular-nums ${overLimit ? 'text-coral' : 'text-mist'}`}>
            {bytes} / {MAX_MESSAGE_BYTES} bytes
          </span>
        </label>
        <textarea
          id="message"
          rows={4}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            setMessageTouched(true)
          }}
          placeholder="Dear future me..."
          aria-invalid={overLimit}
          aria-describedby="public-note"
          className={`${inputClass} mt-2 resize-none font-display text-lg leading-snug ${overLimit ? 'border-coral' : ''}`}
        />
        <p id="public-note" className="mt-2 text-sm text-mist">
          Messages are public onchain. Anyone can read yours, even before it unlocks.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-salt">When it opens</legend>
        <div className="grid grid-cols-2 gap-1 rounded-ctl border border-tide bg-abyss p-1" role="radiogroup">
          {(['lock', 'now'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-11 rounded-ctl px-2 text-sm font-medium transition-colors ${
                mode === m ? 'bg-tide text-salt' : 'text-mist hover:text-salt'
              }`}
            >
              {m === 'lock' ? 'Unlock on a date' : 'Reveal now'}
            </button>
          ))}
        </div>
        {mode === 'lock' && (
          <div className="mt-3 space-y-3">
            <input
              type="datetime-local"
              aria-label="Unlock date and time"
              value={dateValue}
              min={toLocalInputValue(now + 60)}
              max={toLocalInputValue(maxUnlockSeconds(now))}
              onChange={(e) => setDateValue(e.target.value)}
              className={`${inputClass} tabular-nums [color-scheme:dark]`}
            />
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDateValue(toLocalInputValue(now + p.seconds))}
                  className="min-h-11 rounded-ctl border border-tide px-4 text-sm text-salt transition-colors hover:bg-abyss"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor="amount" className="flex items-baseline justify-between gap-3 text-sm font-medium text-salt">
          <span>
            USDC to lock <span className="font-normal text-mist">(optional)</span>
          </span>
          {balance.data && (
            <span className="text-sm font-normal tabular-nums text-mist">
              Balance {formatNativeUsdc(balance.data.value)}
            </span>
          )}
        </label>
        <div className="relative mt-2">
          <input
            id="amount"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value.replace(',', '.'))}
            placeholder="0.00"
            className={`${inputClass} pr-16 tabular-nums`}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-mist">USDC</span>
        </div>
        <p className="mt-2 text-sm text-mist">
          Only you can withdraw it, after the unlock time. USDC also pays gas, so keep a little spare.
        </p>
      </div>

      {!IS_TESTNET && amount !== null && amount > 0n && (
        <div className="rounded-ctl border border-tide bg-abyss p-3 text-sm" aria-live="polite">
          <p className="text-salt">
            You are about to lock{' '}
            <span className="font-semibold tabular-nums">{formatNativeUsdcExact(amount)} USDC</span> of real funds on Arc
            mainnet
            {mode === 'lock' && unlockAt ? ` until ${formatDateTime(unlockAt)}.` : ', withdrawable right after it is sealed.'}
          </p>
          <p className="mt-1 text-mist">Only your wallet can withdraw it, and only after the unlock time.</p>
          {needsConfirm && (
            <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 text-salt">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmedFor(e.target.checked ? amount : null)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-resin"
              />
              <span>
                I understand I am locking {formatNativeUsdcExact(amount)} USDC. It is more than 5 USDC, and I have
                checked the amount and the unlock time.
              </span>
            </label>
          )}
        </div>
      )}

      {showProblem && (
        <p role="alert" className="text-sm text-coral">
          {problem}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="min-h-12 w-full rounded-ctl bg-resin px-5 text-base font-semibold text-abyss transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-tide disabled:text-mist disabled:hover:brightness-100"
      >
        {cta}
      </button>

      {lastHash && (
        <a
          href={txUrl(lastHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center gap-1.5 text-sm text-lagoon underline-offset-4 hover:underline"
        >
          Capsule sealed. View the transaction <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      )}
    </form>
  )
}
