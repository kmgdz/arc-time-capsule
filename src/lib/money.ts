import { Amount, formatGasAmount, gasTokenDecimalsFor, parseGasAmount } from '@/onchain-money'
import { CHAIN } from '@/config'

/** Raw native USDC (18 decimals, the msg.value view) to a short display string. */
export function formatNativeUsdc(raw: bigint): string {
  const amount = Amount.fromRaw(raw, gasTokenDecimalsFor(CHAIN.id))
  const exact = formatGasAmount(CHAIN.id, amount)
  const [, fraction = ''] = exact.split('.')
  if (fraction.length <= 6) return exact
  const rounded = amount.toFixed(6)
  return rounded.includes('.') ? rounded.replace(/0+$/, '').replace(/\.$/, '') : rounded
}

/** Parses a user-typed USDC amount into 18-decimal msg.value. Empty means zero; invalid returns null. */
export function parseNativeUsdc(input: string): bigint | null {
  const trimmed = input.trim()
  if (trimmed === '') return 0n
  try {
    const amount = parseGasAmount(CHAIN.id, trimmed)
    return amount.isNegative() ? null : amount.raw
  } catch {
    return null
  }
}

/** Exact amount for confirmation screens: never rounded, so what the person reads is what is sent. */
export function formatNativeUsdcExact(raw: bigint): string {
  return formatGasAmount(CHAIN.id, Amount.fromRaw(raw, gasTokenDecimalsFor(CHAIN.id)))
}
