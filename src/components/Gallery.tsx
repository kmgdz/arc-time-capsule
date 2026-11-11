import { useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import logo from '@/assets/logo.svg'
import { CONTRACT_ADDRESS, IS_TESTNET, NETWORK_LABEL, addressUrl } from '@/config'
import { useNow } from '@/hooks/useNow'
import type { Capsule } from '@/lib/capsule'
import { CapsuleCard } from './CapsuleCard'

export type GalleryView = 'all' | 'mine'

interface Props {
  capsules: readonly Capsule[]
  total: number | undefined
  page: number
  pageCount: number
  isLoading: boolean
  isError: boolean
  view: GalleryView
  canViewMine: boolean
  onView: (view: GalleryView) => void
  onPage: (page: number) => void
  onRefetch: () => void
}

const pagerButton =
  'inline-flex min-h-11 items-center gap-1 rounded-ctl border border-tide px-4 text-sm text-salt transition-colors hover:bg-deep disabled:opacity-40 disabled:hover:bg-transparent'

export function Gallery({
  capsules,
  total,
  page,
  pageCount,
  isLoading,
  isError,
  view,
  canViewMine,
  onView,
  onPage,
  onRefetch,
}: Props) {
  const now = useNow()
  const deployed = CONTRACT_ADDRESS !== undefined
  const hasItems = capsules.length > 0

  // The only animation in the app: one gentle fade when the gallery first fills.
  const [played, setPlayed] = useState(false)

  return (
    <section aria-labelledby="gallery-title" className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 id="gallery-title" className="text-xl font-semibold tracking-tight text-salt">
            Public gallery
          </h2>
          <p className="mt-1 text-sm text-mist">Newest first. Every capsule is readable by anyone.</p>
        </div>
        {total !== undefined && (
          <span className="shrink-0 text-sm tabular-nums text-mist">{view === 'mine' ? `${total} yours` : `${total} total`}</span>
        )}
      </div>

      <div
        className="grid w-full max-w-xs grid-cols-2 gap-1 rounded-ctl border border-tide bg-abyss p-1"
        role="radiogroup"
        aria-label="Which capsules to show"
      >
        <button
          type="button"
          role="radio"
          aria-checked={view === 'all'}
          onClick={() => onView('all')}
          className={`min-h-11 rounded-ctl px-2 text-sm font-medium transition-colors ${
            view === 'all' ? 'bg-tide text-salt' : 'text-mist hover:text-salt'
          }`}
        >
          All capsules
        </button>
        <span title={canViewMine ? undefined : 'Connect a wallet'} className="block">
          <button
            type="button"
            role="radio"
            aria-checked={view === 'mine'}
            disabled={!canViewMine}
            onClick={() => onView('mine')}
            className={`min-h-11 w-full rounded-ctl px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:text-mist/60 ${
              view === 'mine' ? 'bg-tide text-salt' : 'text-mist enabled:hover:text-salt'
            }`}
          >
            My capsules
          </button>
        </span>
      </div>

      {!deployed && (
        <div className="rounded-card border border-tide bg-deep p-5 text-sm text-mist">
          TimeCapsule is not deployed on {NETWORK_LABEL}, so there is nothing to show yet. Set{' '}
          <code className="text-salt">
            {IS_TESTNET ? 'VITE_TIMECAPSULE_ADDRESS_TESTNET' : 'VITE_TIMECAPSULE_ADDRESS_MAINNET'}
          </code>{' '}
          in your .env file and rebuild.
        </div>
      )}

      {deployed && isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading capsules">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 rounded-card border border-tide bg-deep" />
          ))}
        </div>
      )}

      {deployed && isError && !isLoading && (
        <div role="alert" className="rounded-card border border-coral/40 bg-deep p-5 text-sm">
          <p className="text-coral">Capsules did not load from {NETWORK_LABEL}.</p>
          <p className="mt-1 text-mist">Check your connection, then try again.</p>
          <button
            type="button"
            onClick={onRefetch}
            className="mt-3 min-h-11 rounded-ctl border border-tide px-4 font-medium text-salt transition-colors hover:bg-abyss"
          >
            Reload capsules
          </button>
        </div>
      )}

      {deployed && !isLoading && !isError && !hasItems && (
        <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-tide px-6 py-12 text-center">
          <img src={logo} alt="" width={48} height={48} className="h-12 w-12" />
          <p className="text-base font-medium text-salt">
            {view === 'mine' ? 'This wallet has no capsules yet. Write the first one.' : 'No capsules yet. Write the first one.'}
          </p>
        </div>
      )}

      {hasItems && (
        <div className={`space-y-3 ${played ? '' : 'animate-gallery-in'}`} onAnimationEnd={() => setPlayed(true)}>
          {capsules.map((capsule) => (
            <CapsuleCard key={capsule.id.toString()} capsule={capsule} now={now} onChanged={onRefetch} />
          ))}
        </div>
      )}

      {deployed && pageCount > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Gallery pages">
          <button type="button" onClick={() => onPage(page - 1)} disabled={page === 0} className={pagerButton}>
            <ChevronLeft className="h-4 w-4" aria-hidden /> Newer
          </button>
          <span className="text-sm tabular-nums text-mist">
            Page {page + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={page >= pageCount - 1}
            className={pagerButton}
          >
            Older <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      )}

      {CONTRACT_ADDRESS && (
        <a
          href={addressUrl(CONTRACT_ADDRESS)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-mist underline-offset-4 hover:text-salt hover:underline"
        >
          View the contract on the explorer <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      )}
    </section>
  )
}
