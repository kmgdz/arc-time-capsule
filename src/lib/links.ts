import { IS_TESTNET } from '@/config'

export const GITHUB_URL = 'https://github.com/kmgdz/arc-time-capsule'

/** Verified-source page for the contract. Mainnet only, so it is undefined on testnet. */
export function verifiedSourceUrl(contractAddress: string | undefined): string | undefined {
  if (IS_TESTNET || !contractAddress) return undefined
  return `https://arc.etherscan.io/address/${contractAddress.toLowerCase()}#code`
}
