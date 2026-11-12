import { CHAIN, IS_TESTNET } from '@/config'
import { linkClass, sectionHeadingClass } from './ui'

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  )
}

export function BeforeYouStart() {
  const rpc = CHAIN.rpcUrls.default.http[0]
  const explorer = CHAIN.blockExplorers.default.url
  const details: { label: string; value: string }[] = [
    { label: 'Network name', value: CHAIN.name },
    { label: 'RPC', value: rpc },
    { label: 'Chain ID', value: String(CHAIN.id) },
    ...(IS_TESTNET ? [] : [{ label: 'Currency', value: CHAIN.nativeCurrency.symbol }]),
    { label: 'Explorer', value: explorer },
  ]

  return (
    <section aria-labelledby="before-title" className="scroll-mt-6">
      <h2 id="before-title" className={sectionHeadingClass}>
        Before you start
      </h2>
      <ul className="mt-6 grid list-none gap-3 p-0 md:grid-cols-2">
        <li className="rounded-card border border-tide bg-deep p-5 text-base leading-relaxed text-mist">
          <span className="font-semibold text-salt">A wallet.</span> Any wallet that works with websites on EVM
          networks, for example MetaMask. The app only talks to your wallet; it never sees your seed phrase.
        </li>

        <li className="rounded-card border border-tide bg-deep p-5 text-base leading-relaxed text-mist">
          <span className="font-semibold text-salt">The Arc network.</span> The app offers to add it and switch for
          you. Details if you prefer to add it yourself:
          <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
            {details.map((d) => (
              <div key={d.label} className="contents">
                <dt className="text-mist">{d.label}</dt>
                <dd className="break-all tabular-nums text-salt">{d.value}</dd>
              </div>
            ))}
          </dl>
        </li>

        <li className="rounded-card border border-tide bg-deep p-5 text-base leading-relaxed text-mist">
          <span className="font-semibold text-salt">USDC on Arc.</span> On Arc, USDC is the gas token, so you need a
          little USDC even if you lock nothing.{' '}
          {IS_TESTNET ? (
            <>
              Use the Circle faucet at{' '}
              <ExternalLink href="https://faucet.circle.com">https://faucet.circle.com</ExternalLink>; testnet USDC has
              no value.
            </>
          ) : (
            <>
              On mainnet you can bridge USDC you already hold on another chain at{' '}
              <ExternalLink href="https://bridge.usdc.com">https://bridge.usdc.com</ExternalLink>, or buy it from a
              provider that supports Arc.
            </>
          )}
        </li>

        <li className="rounded-card border border-tide bg-deep p-5 text-base leading-relaxed text-mist">
          <span className="font-semibold text-salt">Tip:</span> keep a little extra USDC for fees. The amount you lock
          is separate from the fee.
        </li>
      </ul>
    </section>
  )
}
