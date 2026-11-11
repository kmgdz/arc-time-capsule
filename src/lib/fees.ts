import type { PublicClient } from 'viem'

/**
 * Arc's mempool silently drops any transaction whose maxFeePerGas is below 20 Gwei.
 * https://docs.arc.io/arc/references/evm-differences.md (Fee market and block behavior)
 */
export const ARC_MIN_MAX_FEE_PER_GAS = 20_000_000_000n

/** Used only when the RPC cannot estimate fees: the floor plus 20% headroom for base fee movement. */
const FALLBACK_MAX_FEE_PER_GAS = (ARC_MIN_MAX_FEE_PER_GAS * 12n) / 10n

export interface ArcFees {
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}

/**
 * EIP-1559 fees for an Arc transaction: the RPC's own estimate (base fee with headroom plus tip),
 * never allowed below the 20 Gwei maxFeePerGas floor.
 */
export async function estimateArcFees(client: Pick<PublicClient, 'estimateFeesPerGas'> | undefined): Promise<ArcFees> {
  let maxFeePerGas = FALLBACK_MAX_FEE_PER_GAS
  let maxPriorityFeePerGas = 0n

  try {
    if (client) {
      const estimate = await client.estimateFeesPerGas()
      maxFeePerGas = estimate.maxFeePerGas
      maxPriorityFeePerGas = estimate.maxPriorityFeePerGas
    }
  } catch {
    // Keep the fallback values above.
  }

  if (maxFeePerGas < ARC_MIN_MAX_FEE_PER_GAS) maxFeePerGas = ARC_MIN_MAX_FEE_PER_GAS
  if (maxPriorityFeePerGas > maxFeePerGas) maxPriorityFeePerGas = maxFeePerGas

  return { maxFeePerGas, maxPriorityFeePerGas }
}
