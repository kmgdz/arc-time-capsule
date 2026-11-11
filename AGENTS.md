# Arc Time Capsule

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Public time capsules on Arc: a message (max 280 bytes) with an unlock time and optional locked native USDC (18 decimals via msg.value). Only the creator withdraws, after unlock. Messages are public onchain; never call them private or encrypted.

## Deployment

- TimeCapsule on Arc Testnet: 0x8103990a160b6ff854c77cc327cc4df17ac21b68 (env `VITE_TIMECAPSULE_ADDRESS_TESTNET`). Mainnet (chain 5042, deployed by the owner outside Arc Studio): 0x9Fe4144f4d8896cAC7d976afe54EC186852d6Ad3 (env `VITE_TIMECAPSULE_ADDRESS_MAINNET`). Code default stays `VITE_NETWORK=testnet`.
- Network switch: `VITE_NETWORK=testnet|mainnet`; all chain config is in `src/config.ts`.
- Mainnet-only UI (unaudited notice, exact amount review, >5 USDC checkbox) is gated on `VITE_NETWORK=mainnet`. Transactions use explicit fees with a 20 Gwei maxFeePerGas floor (`src/lib/fees.ts`).

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## Share links

- Starter apps already ship `getShareBase`, `buildShareLink` and `installShareSync` in `src/lib/share.ts`; import them instead of rewriting them.
- Keep shareable state in the URL path or query, not in the `#fragment`.
- Never put a secret (private key, claim secret, seed phrase, session token, API key) in the URL path or query, encoded or not: every in-app path and query is mirrored to the visitor's studio.arc.io address bar and browser history and reaches servers. A bearer claim secret goes only in the `#fragment` appended to the share link (`` `${await buildShareLink('/claim')}#${secret}` ``) and is read from `location.hash` on load. A link to the app's own share URL shown inside the app must be copy-only or open in a new tab with `target="_blank" rel="noopener noreferrer"`.
- Build every link a user copies or sends with `buildShareLink()` from `src/lib/share.ts`.
- Keep the `installShareSync()` call in `src/main.tsx` when editing it; it keeps the Studio address bar in step with in-app navigation.
- Navigate inside the app with relative links.

## To Run

```bash
bun install
bun run dev
```
