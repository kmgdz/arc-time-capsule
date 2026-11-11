/*
 *  ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗
 *  ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
 *  ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
 *  ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
 *  ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
 *  ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝
 *
 *  Built with Arc Studio
 *  https://studio.arc.io
 */

import './tracing'
import './console-capture'

import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { Toaster } from 'sonner'
import { config } from './config'
import App from './App'
import { installShareSync } from './lib/share'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/manrope'
import './index.css'

const walletTheme = {
  '--ck-font-family': "'Manrope Variable', sans-serif",
  '--ck-border-radius': '16px',
  '--ck-body-background': '#14233A',
  '--ck-body-background-secondary': '#0C1626',
  '--ck-body-background-tertiary': '#26405E',
  '--ck-body-color': '#F2F6F8',
  '--ck-body-color-muted': '#9FB3C8',
  '--ck-body-color-muted-hover': '#F2F6F8',
  '--ck-body-divider': '#26405E',
  '--ck-overlay-background': 'rgba(12, 22, 38, 0.8)',
  '--ck-focus-color': '#4FE3C8',
  '--ck-primary-button-background': '#0C1626',
  '--ck-primary-button-hover-background': '#26405E',
  '--ck-secondary-button-background': '#0C1626',
  '--ck-secondary-button-hover-background': '#26405E',
}

const queryClient = new QueryClient()

// /dev-preview renders mock capsule cards for screenshots. It exists only in the dev server and in
// `bun run build:devpreview`; a normal production build compiles it out.
const SHOW_DEV_PREVIEW = import.meta.env.DEV || import.meta.env.MODE === 'devpreview'
const DevPreview = SHOW_DEV_PREVIEW ? lazy(() => import('./dev/DevPreview')) : null
const showDevPreview = DevPreview !== null && window.location.pathname === '/dev-preview'

// Studio logo SVG
const StudioLogo = () => (
  <svg width="14" height="16" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 21.5001C0.167192 16.2366 1.02308 11.3243 2.45378 7.50459C4.26573 2.66517 6.88869 0 9.83904 0C12.7894 0 15.412 2.66517 17.2243 7.50459C18.1669 10.0216 18.8605 13.0121 19.2713 16.2655C19.3081 16.556 19.3393 16.8513 19.3714 17.146C19.3819 17.1642 19.3881 17.1811 19.386 17.1949C19.386 17.1949 19.6275 18.7674 19.6788 21.5001H19.6515C19.2934 21.1937 15.0694 17.7329 8.06739 18.735C8.17304 17.4996 8.31833 16.2974 8.50603 15.1452C8.51562 15.0863 8.52671 15.0294 8.53649 14.9709C11.2828 14.8846 13.6866 15.2171 15.5299 15.6529C15.5231 15.6073 15.5173 15.5603 15.5103 15.5149C15.1314 13.0547 14.5724 10.8024 13.8517 8.87761C12.6732 5.73037 11.1354 3.77496 9.83904 3.77496C8.54269 3.77496 7.00493 5.73037 5.82649 8.87761C5.54123 9.63889 5.28154 10.4508 5.04866 11.3071C4.72126 12.507 4.44621 13.7934 4.22654 15.1451C3.90141 17.1412 3.69827 19.2821 3.62345 21.5001H0Z" fill="currentColor"/>
  </svg>
)

// Studio watermark component - links back to Studio
const StudioWatermark = () => (
  <a
    href="https://studio.arc.io/"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      fontSize: '12px',
      fontWeight: 600,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1B3158',
      textDecoration: 'none',
      cursor: 'pointer',
      background: 'rgba(172, 198, 233, 0.85)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(27, 49, 88, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    }}
  >
    <StudioLogo />
    Built with Arc Studio
  </a>
)

installShareSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider mode="dark" customTheme={walletTheme}>
          {showDevPreview && DevPreview ? (
            <Suspense fallback={null}>
              <DevPreview />
            </Suspense>
          ) : (
            <App />
          )}
          {import.meta.env.DEV && <StudioWatermark />}
          <Toaster
            position="top-center"
            theme="dark"
            toastOptions={{
              style: {
                background: '#14233A',
                border: '1px solid #26405E',
                color: '#F2F6F8',
                borderRadius: '8px',
                fontFamily: "'Manrope Variable', sans-serif",
              },
            }}
          />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)

