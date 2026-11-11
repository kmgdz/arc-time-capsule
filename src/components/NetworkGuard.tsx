import { useAccount, useSwitchChain } from 'wagmi'
import { CHAIN } from '@/config'

/**
 * Shown only when a wallet is connected to a different chain than the selected network.
 * wagmi asks the wallet to switch and, if the wallet does not know the chain, adds it using
 * the chain data in `src/config.ts` (built from the onchain facts registry).
 */
export function NetworkGuard() {
  const { isConnected, chainId } = useAccount()
  const { switchChain, isPending, isError, error } = useSwitchChain()

  if (!isConnected || chainId === CHAIN.id) return null

  const rejected = isError && /user rejected|user denied/i.test(error.message)

  return (
    <div
      role="alert"
      className="mt-6 flex flex-col gap-3 rounded-card border border-resin/40 bg-deep p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="text-sm">
        <p className="font-medium text-salt">Your wallet is on a different network.</p>
        <p className="mt-1 text-mist">Switch to {CHAIN.name} to create capsules and withdraw.</p>
        {isError && !rejected && (
          <p className="mt-1 text-coral">
            The wallet did not switch. Open it, choose {CHAIN.name} (chain ID {CHAIN.id}) yourself, then reload this page.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => switchChain({ chainId: CHAIN.id })}
        disabled={isPending}
        className="min-h-11 shrink-0 rounded-ctl bg-resin px-4 text-sm font-semibold text-abyss transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-tide disabled:text-mist disabled:hover:brightness-100"
      >
        {isPending ? 'Check your wallet' : `Switch to ${CHAIN.name}`}
      </button>
    </div>
  )
}
