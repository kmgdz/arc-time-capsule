import { ConnectKitButton } from 'connectkit'
import { LogOut } from 'lucide-react'
import { useDisconnect } from 'wagmi'
import logo from '@/assets/logo.svg'
import { NETWORK_LABEL } from '@/config'
import { shortAddress } from '@/lib/capsule'

const NAV: { href: string; label: string }[] = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
  { href: '#safety', label: 'Safety' },
]

export function Header() {
  const { disconnect } = useDisconnect()

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <div className="flex min-w-0 items-center gap-2.5">
        <img src={logo} alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
        <span className="truncate text-base font-semibold tracking-tight text-salt sm:text-lg">Arc Time Capsule</span>
        <span className="hidden text-sm font-medium text-salt sm:inline">{NETWORK_LABEL}</span>
      </div>

      <nav
        aria-label="Page sections"
        className="order-last flex w-full items-center gap-5 sm:order-none sm:ml-auto sm:w-auto"
      >
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="inline-flex min-h-11 items-center text-sm text-mist underline-offset-4 transition-colors hover:text-salt hover:underline"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <ConnectKitButton.Custom>
        {({ isConnected, show, address }) => (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={show}
              className="inline-flex min-h-11 shrink-0 items-center rounded-ctl border border-tide px-3.5 text-sm font-medium text-salt transition-colors hover:bg-deep sm:px-4"
            >
              {isConnected && address ? (
                <span className="tabular-nums">{shortAddress(address)}</span>
              ) : (
                <span>
                  Connect<span className="hidden sm:inline"> wallet</span>
                </span>
              )}
            </button>
            {isConnected && (
              <button
                type="button"
                onClick={() => disconnect()}
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-ctl border border-tide px-3 text-sm font-medium text-mist transition-colors hover:bg-deep hover:text-salt"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            )}
          </div>
        )}
      </ConnectKitButton.Custom>
    </header>
  )
}
