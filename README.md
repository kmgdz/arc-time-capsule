# Arc Time Capsule

Write a short public message with an unlock date, optionally lock native USDC inside it, and browse a public gallery of every capsule. After the unlock time, only the creator can withdraw the USDC.

Built with [Arc Studio](https://studio.arc.io)

## Please read

- **Messages are public.** Everything you write is stored onchain and readable by anyone, before and after the unlock time. Do not put secrets in a capsule.
- **The contract is unaudited. Use it at your own risk.** It has automated tests and a tooling-based review only, no independent audit. It has no owner, cannot be paused and cannot be upgraded, so a mistake cannot be undone. On mainnet it holds real USDC: use small amounts.

## Deployments

### Arc mainnet (chain ID 5042)

| | |
|---|---|
| TimeCapsule | `0x9Fe4144f4d8896cAC7d976afe54EC186852d6Ad3` |
| Deployer | `0x7B9d319D68Db6c2Fc1fDf88d89d2c1C3EC78cd99` |
| Deployment tx | `0x1eef800a570654a58f09b5b380db2933046a93233dfbccd9e60e2e4ee7c55a63` |
| Explorer | https://explorer.arc.io/address/0x9Fe4144f4d8896cAC7d976afe54EC186852d6Ad3 |
| Also on | https://arc.etherscan.io/address/0x9fe4144f4d8896cac7d976afe54ec186852d6ad3 |
| Compiler | solc 0.8.28, optimizer on (200 runs), EVM `cancun`, compiled in Remix |

### Arc Testnet (chain ID 5042002)

| | |
|---|---|
| TimeCapsule | `0x8103990a160b6ff854c77cc327cc4df17ac21b68` |
| Explorer | https://explorer.testnet.arc.io/address/0x8103990a160b6ff854c77cc327cc4df17ac21b68 |
| Compiler | solc 0.8.28, optimizer on (200 runs), EVM `cancun`, verified on the explorer |

## Tech stack

- Vite, React 18, TypeScript, Tailwind CSS
- wagmi, viem, ConnectKit (injected wallets)
- Solidity with Foundry, no external contract dependencies
- Arc, where native USDC (18 decimals) is the gas token

## What's in the app

- **Create form and gallery:** write a message, choose when it opens, optionally lock USDC, and browse every capsule, with an "All capsules" / "My capsules" filter.
- **How it works:** six steps from connecting a wallet to withdrawing after the opening time.
- **Before you start:** the wallet, the Arc network details and how to get USDC (mainnet and testnet variants).
- **FAQ:** answers on privacy, who can withdraw, fees, capsule numbers, times and failed transactions.
- **Contract and safety:** network, contract address with copy and explorer links, the verified-source link (mainnet only), and the contract's limits.
- **Header links and footer:** anchors to the sections above, plus links to the code on GitHub and the contract on the explorer.

## Run it locally

Prerequisites: [Bun](https://bun.sh). [Foundry](https://getfoundry.sh) is only needed for the contract commands.

```bash
bun install
cp .env.example .env   # then adjust if needed
bun run dev            # http://localhost:5173
```

Other commands:

```bash
bun run build          # production build into dist/
bun run preview        # serve the production build
bun run check          # lint and typecheck
bun run contracts:build
bun run contracts:test
```

Contract tests also need `forge-std` in `lib/` (`forge install foundry-rs/forge-std`), because `lib/` is not committed.

## Environment variables

See `.env.example`. Vite reads `.env` at startup and bakes values in at build time, so restart or rebuild after changing them. Every value here is public: never put a private key or token in a `VITE_` variable.

- `VITE_NETWORK`: `testnet` or `mainnet`. Defaults to `testnet`.
- `VITE_TIMECAPSULE_ADDRESS_TESTNET`: TimeCapsule address on Arc Testnet.
- `VITE_TIMECAPSULE_ADDRESS_MAINNET`: TimeCapsule address on Arc mainnet.

With `VITE_NETWORK=mainnet` the app shows an unaudited-contract notice, the exact USDC amount before sealing, and an extra confirmation checkbox for amounts above 5 USDC. If the selected network has no address, the app shows "not deployed" and sends nothing.

The helper scripts in `scripts/` (self-deploy, fetch-abi) read `DEPLOYER_PRIVATE_KEY` and optional `RPC_PROXY_*` values from your own environment. The app never reads them.

Chain IDs, RPC URLs and explorer URLs live in one file: `src/config.ts`.

## Deploy to Vercel

Build command `bun run build` (or `npm run build`), output directory `dist`. Add a rewrite of all paths to `/index.html` if you want deep links.

Mainnet build, in Vercel project settings under Environment Variables:

```
VITE_NETWORK=mainnet
VITE_TIMECAPSULE_ADDRESS_MAINNET=0x9Fe4144f4d8896cAC7d976afe54EC186852d6Ad3
```

Testnet build:

```
VITE_NETWORK=testnet
VITE_TIMECAPSULE_ADDRESS_TESTNET=0x8103990a160b6ff854c77cc327cc4df17ac21b68
```

Redeploy after changing these, because the values are baked in at build time.

## Transactions and gas

Arc drops transactions with a `maxFeePerGas` below 20 Gwei. The app estimates fees from the RPC and never sends less than that floor, for both sealing a capsule and withdrawing.

## Contract

`contracts/TimeCapsule.sol` has no owner, no admin and no upgrade path. Messages are limited to 280 bytes and locks to 3650 days.

Capsule numbers in the app start at 1; the contract's internal id is the displayed number minus 1.
