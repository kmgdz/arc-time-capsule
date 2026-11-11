/**
 * Single app config: network selection, chain definition, contract address, wagmi config.
 * Built with Arc Studio — https://studio.arc.io
 *
 * Chain IDs, RPC URLs and explorer URLs come from `@/onchain-facts`, which mirrors the
 * official Arc docs (https://docs.arc.io/arc/references/rpc-endpoints). Select the network
 * with VITE_NETWORK=testnet|mainnet (default: testnet).
 */

import { http, createConfig } from 'wagmi'
import { defineChain, isAddress, type Address } from 'viem'
import { injected } from 'wagmi/connectors'
import { ONCHAIN_CHAINS, buildAddressExplorerUrl, buildTxExplorerUrl } from '@/onchain-facts'
import { registerChain } from './tracing'

export type NetworkName = 'testnet' | 'mainnet'

const rawNetwork: unknown = import.meta.env.VITE_NETWORK
export const NETWORK: NetworkName = rawNetwork === 'mainnet' ? 'mainnet' : 'testnet'

const chainFact = ONCHAIN_CHAINS.find((c) => c.family === 'arc' && c.isTestnet === (NETWORK === 'testnet'))
if (!chainFact) {
  throw new Error(`Arc ${NETWORK} is missing from the onchain facts registry`)
}

export const CHAIN = defineChain({
  id: chainFact.chainId,
  name: chainFact.name,
  nativeCurrency: {
    name: chainFact.nativeCurrency.symbol,
    symbol: chainFact.nativeCurrency.symbol,
    decimals: chainFact.nativeCurrency.decimals,
  },
  rpcUrls: { default: { http: [...chainFact.rpcUrls] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: chainFact.explorerBase } },
  testnet: chainFact.isTestnet,
})

export const IS_TESTNET = NETWORK === 'testnet'
export const NETWORK_LABEL = IS_TESTNET ? 'Arc Testnet' : 'Arc'

const rawAddress: unknown =
  NETWORK === 'testnet'
    ? import.meta.env.VITE_TIMECAPSULE_ADDRESS_TESTNET
    : import.meta.env.VITE_TIMECAPSULE_ADDRESS_MAINNET

/** Undefined until a TimeCapsule is deployed on the selected network. */
export const CONTRACT_ADDRESS: Address | undefined =
  typeof rawAddress === 'string' && isAddress(rawAddress) ? rawAddress : undefined

export const addressUrl = (address: string) => buildAddressExplorerUrl(CHAIN.id, address)
export const txUrl = (hash: string) => buildTxExplorerUrl(CHAIN.id, hash)

const rpcUrl = CHAIN.rpcUrls.default.http[0]
registerChain(CHAIN.id, rpcUrl)

export const config = createConfig({
  chains: [CHAIN],
  connectors: [injected()],
  transports: { [CHAIN.id]: http(rpcUrl) },
})
