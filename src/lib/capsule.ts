import type { Address } from 'viem'
import { IS_TESTNET } from '@/config'

export interface Capsule {
  id: bigint
  creator: Address
  createdAt: bigint
  unlockAt: bigint
  withdrawn: boolean
  amount: bigint
  message: string
}

export const MAX_MESSAGE_BYTES = 280
export const MAX_LOCK_DAYS = 3650
const DAY = 86_400

/** People see capsule numbers from 1. The contract id stays zero-based: displayed number = id + 1. */
export const capsuleNumber = (id: bigint): string => (id + 1n).toString()

/** UTF-8 byte length, the same measure the contract enforces. */
export const byteLength = (text: string): number => new TextEncoder().encode(text).length

export const shortAddress = (addr: string): string => `${addr.slice(0, 6)}...${addr.slice(-4)}`

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(s / DAY)
  const hours = Math.floor((s % DAY) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`
  return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`
}

export function formatDateTime(unixSeconds: bigint | number): string {
  return new Date(Number(unixSeconds) * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/** Value for a datetime-local input (local time, minute precision). */
export function toLocalInputValue(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const maxUnlockSeconds = (nowSeconds: number): number => nowSeconds + MAX_LOCK_DAYS * DAY - 3600

const CONTRACT_ERRORS: Record<string, string> = {
  EmptyMessage: 'The message is empty. Write something, then try again.',
  MessageTooLong: 'The message is over 280 bytes. Shorten it, then try again.',
  UnlockTimeInPast: 'The unlock time has passed. Pick a later date.',
  LockTooLong: 'The longest lock is 3650 days. Pick an earlier date.',
  NotCreator: 'Only the creator can withdraw. Connect the wallet that made this capsule.',
  StillLocked: 'The chain clock has not reached the unlock time yet. Wait a few seconds and try again.',
  AlreadyWithdrawn: 'These funds were already withdrawn. Reload the gallery to see the latest state.',
  NothingToWithdraw: 'This capsule holds no USDC, so there is nothing to withdraw.',
  TransferFailed: 'The transfer to your wallet failed. Check that it can receive USDC, then try again.',
  CapsuleNotFound: 'That capsule does not exist. Reload the gallery.',
}

/** Returns null when the user simply cancelled in their wallet. */
export function parseTxError(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()
  if (lower.includes('user rejected') || lower.includes('user denied')) return null
  for (const [name, text] of Object.entries(CONTRACT_ERRORS)) {
    if (message.includes(name)) return text
  }
  if (lower.includes('insufficient funds') || lower.includes('exceeds balance')) {
    return IS_TESTNET
      ? 'Your USDC balance is too low for this amount plus gas. Lower the amount or add test USDC.'
      : 'Your USDC balance is too low for this amount plus gas. Lower the amount or add more USDC.'
  }
  if (lower.includes('network') || lower.includes('timeout')) return 'The network did not respond. Check your connection, then try again.'
  return 'The transaction failed. Check your wallet and the amount, then try again.'
}
