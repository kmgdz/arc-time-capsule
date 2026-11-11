import { ConnectKitButton } from 'connectkit'
import logo from '@/assets/logo.svg'
import { NETWORK_LABEL } from '@/config'
import { shortAddress } from '@/lib/capsule'

export function Header() {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <img src={logo} alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
        <span className="truncate text-base font-semibold tracking-tight text-salt sm:text-lg">Arc Time Capsule</span>
        <span className="hidden text-sm font-medium text-salt sm:inline">{NETWORK_LABEL}</span>
      </div>

      <ConnectKitButton.Custom>
        {({ isConnected, show, address }) => (
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
        )}
      </ConnectKitButton.Custom>
    </header>
  )
}
