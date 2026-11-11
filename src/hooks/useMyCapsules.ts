import { useMemo } from 'react'
import { keepPreviousData } from '@tanstack/react-query'
import { useReadContracts } from 'wagmi'
import type { Address } from 'viem'
import { CHAIN, CONTRACT_ADDRESS } from '@/config'
import { timeCapsuleAbi } from '@/lib/timeCapsuleAbi'
import type { Capsule } from '@/lib/capsule'

// The contract has no per-creator index, so "My capsules" reads every page of getLatest (the contract's
// maximum page size) and keeps the capsules whose creator is the connected wallet, newest first.
const CHUNK = 50
const REFRESH_MS = 15_000

export function useMyCapsules(owner: Address | undefined, total: number | undefined, enabled: boolean) {
  const active = enabled && owner !== undefined && CONTRACT_ADDRESS !== undefined && total !== undefined && total > 0

  const contracts = useMemo(() => {
    if (!CONTRACT_ADDRESS || !total) return []
    return Array.from({ length: Math.ceil(total / CHUNK) }, (_, i) => ({
      address: CONTRACT_ADDRESS,
      abi: timeCapsuleAbi,
      functionName: 'getLatest' as const,
      args: [BigInt(i * CHUNK), BigInt(CHUNK)] as const,
      chainId: CHAIN.id,
    }))
  }, [total])

  const result = useReadContracts({
    contracts,
    allowFailure: false,
    query: { enabled: active, refetchInterval: REFRESH_MS, placeholderData: keepPreviousData },
  })

  const capsules = useMemo<Capsule[]>(() => {
    if (!owner) return []
    const me = owner.toLowerCase()
    // Each entry is one getLatest page (newest first), so flattening keeps the order.
    const pages = (result.data ?? []) as readonly (readonly Capsule[])[]
    return pages.flat().filter((c) => c.creator.toLowerCase() === me)
  }, [result.data, owner])

  const { refetch } = result
  return {
    capsules,
    // Still waiting on the count, or on the first batch of pages.
    isLoading: enabled && owner !== undefined && (total === undefined || (total > 0 && result.isLoading)),
    isError: result.isError,
    refetch,
  }
}
