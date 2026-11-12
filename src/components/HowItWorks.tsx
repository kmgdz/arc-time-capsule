import { sectionHeadingClass } from './ui'

const STEPS: { lead: string; body: string }[] = [
  {
    lead: 'Connect your wallet.',
    body: 'Use an EVM wallet such as MetaMask on the Arc network. If your wallet is on another network, the app shows a "Switch to Arc" button.',
  },
  {
    lead: 'Write your message.',
    body: 'Up to 280 bytes (about 280 plain letters; emoji and non-Latin scripts use more bytes per character). The counter under the box shows how many bytes you have used out of 280.',
  },
  {
    lead: 'Choose when it opens.',
    body: 'Pick "Reveal now", or pick a date and time in your local timezone. The furthest date allowed is 10 years from now.',
  },
  {
    lead: 'Optionally lock USDC inside it.',
    body: 'Any amount you enter is held by the contract until the opening time. Leave it at 0 for a message only.',
  },
  {
    lead: 'Seal the capsule.',
    body: 'Review the amount and date, confirm in your wallet, and pay a small network fee in USDC. In our tests the fee was a few thousandths of a USDC per transaction; it can vary.',
  },
  {
    lead: 'Come back when it opens.',
    body: 'Locked USDC is withdrawn by the creator with the "Withdraw USDC" button on the capsule, after its opening time. Each capsule can be withdrawn once.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-6">
      <h2 id="how-it-works-title" className={sectionHeadingClass}>
        How it works
      </h2>
      <ol className="mt-6 grid list-none gap-3 p-0 md:grid-cols-2">
        {STEPS.map((step, i) => (
          <li key={step.lead} className="flex gap-4 rounded-card border border-tide bg-deep p-5">
            <span className="font-display text-2xl font-semibold tabular-nums leading-none text-resin">{i + 1}</span>
            <p className="text-pretty text-base leading-relaxed text-mist">
              <span className="font-semibold text-salt">{step.lead}</span> {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
