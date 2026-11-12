import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { CONTRACT_ADDRESS, IS_TESTNET, NETWORK_LABEL, addressUrl } from '@/config'
import { GITHUB_URL, verifiedSourceUrl } from '@/lib/links'
import { linkClass, sectionHeadingClass } from './ui'

const FACTS = [
  'No owner, no admin, no upgrade path.',
  "Funds can only be withdrawn by the capsule's creator, after the opening time, once.",
  'Messages are limited to 280 bytes; locks to 10 years.',
  'Unaudited. Use at your own risk.',
]

export function ContractSafety() {
  const [copied, setCopied] = useState(false)
  const verified = verifiedSourceUrl(CONTRACT_ADDRESS)

  const copy = () => {
    if (!CONTRACT_ADDRESS) return
    void navigator.clipboard
      .writeText(CONTRACT_ADDRESS)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => setCopied(false))
  }

  return (
    <section id="safety" aria-labelledby="safety-title" className="scroll-mt-6">
      <h2 id="safety-title" className={sectionHeadingClass}>
        Contract and safety
      </h2>

      <div className="mt-6 max-w-3xl space-y-5 rounded-card border border-tide bg-deep p-5 sm:p-6">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-mist">Network</dt>
            <dd className="mt-1 text-base text-salt">{NETWORK_LABEL}</dd>
          </div>
          <div>
            <dt className="text-mist">Contract address</dt>
            {CONTRACT_ADDRESS ? (
              <dd className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="break-all text-base tabular-nums text-salt">{CONTRACT_ADDRESS}</span>
                <span className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={copy}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-ctl border border-tide px-3 text-sm text-salt transition-colors hover:bg-abyss"
                  >
                    {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    <span aria-live="polite">{copied ? 'Copied' : 'Copy address'}</span>
                  </button>
                  <a
                    href={addressUrl(CONTRACT_ADDRESS)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-11 items-center gap-1 ${linkClass}`}
                  >
                    Contract on the explorer <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </span>
              </dd>
            ) : (
              <dd className="mt-1 text-base text-salt">Not deployed on {NETWORK_LABEL}.</dd>
            )}
          </div>
          {!IS_TESTNET && verified && (
            <div>
              <dt className="text-mist">Verified source</dt>
              <dd className="mt-1">
                <a
                  href={verified}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-11 items-center gap-1 text-base ${linkClass}`}
                >
                  Verified source <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
                <p className="text-base text-mist">The source code on the explorer matches the deployed contract exactly.</p>
              </dd>
            </div>
          )}
        </dl>

        <ul className="list-disc space-y-2 pl-5 text-base text-mist marker:text-tide">
          {FACTS.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex min-h-11 items-center gap-1 text-base ${linkClass}`}
        >
          Read the code on GitHub <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </section>
  )
}
