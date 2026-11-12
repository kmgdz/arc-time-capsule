import { ChevronDown } from 'lucide-react'
import { sectionHeadingClass } from './ui'

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Can other people read my message?',
    a: 'Yes. Everything is stored publicly on the blockchain. Anyone can read a capsule, before and after its opening time, in this app or on the explorer. Do not put secrets, passwords or private information in a capsule.',
  },
  {
    q: 'So what does "locked" mean?',
    a: 'It means the USDC inside is locked until the opening time, and the opening date is announced. It does not hide the message.',
  },
  {
    q: 'Who can withdraw the USDC?',
    a: 'Only the wallet that created the capsule, and only after the opening time. Nobody else can, including the people who built this app.',
  },
  {
    q: 'Can I edit or delete a capsule?',
    a: 'No. Capsules are permanent. Check the message, the date and the amount before you confirm.',
  },
  {
    q: 'What if I lose access to my wallet?',
    a: 'The USDC stays locked in the contract and only that wallet can withdraw it. Keep your wallet backup safe.',
  },
  {
    q: 'Is there a fee for using the app?',
    a: 'The app and the contract charge no fee. You only pay the normal network fee in USDC to Arc when you send a transaction.',
  },
  {
    q: 'What does the number on a capsule mean?',
    a: 'Capsules are numbered in the order they were created, starting at #1.',
  },
  {
    q: 'What is the "My capsules" toggle above the gallery?',
    a: 'It shows only the capsules created by the wallet you are connected with. The data is still public; this is just a filter for convenience.',
  },
  {
    q: 'Which times do you show?',
    a: 'Your local time. The contract itself uses a universal timestamp.',
  },
  {
    q: 'Why did my transaction fail?',
    a: 'Common reasons: your wallet is on the wrong network, you do not have enough USDC for the amount plus the fee, the opening date is in the past, or the message is empty or too long. The app shows a message explaining what to fix.',
  },
  {
    q: 'Is this safe to use?',
    a: 'The contract is small, has automated tests and a public verified source, but it has not been independently audited. It has no owner and cannot be paused, changed or upgraded, so a mistake cannot be undone. Use small amounts.',
  },
]

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-6">
      <h2 id="faq-title" className={sectionHeadingClass}>
        FAQ
      </h2>
      <div className="mt-6 max-w-3xl divide-y divide-tide rounded-card border border-tide bg-deep">
        {FAQ.map((item) => (
          <details key={item.q} className="group px-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-medium text-salt [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-mist group-open:rotate-180" aria-hidden />
            </summary>
            <p className="pb-4 text-pretty text-base leading-relaxed text-mist">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
