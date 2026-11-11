import { useCallback } from 'react'
import { useReadContract } from 'wagmi'
import { CHAIN, CONTRACT_ADDRESS } from '@/config'
import { timeCapsuleAbi } from '@/lib/timeCapsuleAbi'

export const PAGE_SIZE = 8
const REFRESH_MS = 15_000

/** One gallery page, newest first, plus the total capsule count. */
export function useCapsules(page: number) {
  const enabled = CONTRACT_ADDRESS !== undefined

  const total = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: timeCapsuleAbi,
    functionName: 'getTotalCapsules',
    chainId: CHAIN.id,
    query: { enabled, refetchInterval: REFRESH_MS },
  })

  const list = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: timeCapsuleAbi,
    functionName: 'getLatest',
    args: [BigInt(page * PAGE_SIZE), BigInt(PAGE_SIZE)],
    chainId: CHAIN.id,
    query: { enabled, refetchInterval: REFRESH_MS },
  })

  const { refetch: refetchTotal } = total
  const { refetch: refetchList } = list
  const refetch = useCallback(() => {
    void refetchTotal()
    void refetchList()
  }, [refetchTotal, refetchList])

  const totalCount = total.data === undefined ? undefined : Number(total.data)
  return {
    capsules: list.data ?? [],
    total: totalCount,
    pageCount: totalCount === undefined ? 1 : Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    isLoading: enabled && (total.isLoading || list.isLoading),
    isError: total.isError || list.isError,
    refetch,
  }
}
