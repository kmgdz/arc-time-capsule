import { CONTRACT_ADDRESS, addressUrl } from '@/config'
import { GITHUB_URL, verifiedSourceUrl } from '@/lib/links'

const footerLink =
  'inline-flex min-h-11 items-center text-sm text-mist underline-offset-4 transition-colors hover:text-salt hover:underline'

export function Footer() {
  const verified = verifiedSourceUrl(CONTRACT_ADDRESS)

  return (
    <footer className="mt-20 border-t border-tide pt-8">
      <p className="text-base font-semibold text-salt">Arc Time Capsule</p>
      <nav aria-label="Footer" className="mt-2 flex flex-wrap gap-x-6">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={footerLink}>
          Code on GitHub
        </a>
        {CONTRACT_ADDRESS && (
          <a href={addressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer" className={footerLink}>
            Contract on the explorer
          </a>
        )}
        {verified && (
          <a href={verified} target="_blank" rel="noopener noreferrer" className={footerLink}>
            Verified source
          </a>
        )}
      </nav>
      <p className="mt-2 text-sm text-mist">Unaudited. Messages are public. Use small amounts.</p>
    </footer>
  )
}
