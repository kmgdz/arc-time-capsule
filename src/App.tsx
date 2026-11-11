import { useCallback, useState } from 'react'
import { Header } from '@/components/Header'
import { NetworkGuard } from '@/components/NetworkGuard'
import { CreateCapsuleForm } from '@/components/CreateCapsuleForm'
import { Gallery } from '@/components/Gallery'
import { useCapsules } from '@/hooks/useCapsules'

export default function App() {
  const [page, setPage] = useState(0)
  const { capsules, total, pageCount, isLoading, isError, refetch } = useCapsules(page)

  const handleCreated = useCallback(() => {
    setPage(0)
    refetch()
  }, [refetch])

  return (
    <div className="min-h-dvh bg-abyss font-sans text-salt">
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-5 sm:px-6 sm:pt-8">
        <Header />
        <NetworkGuard />

        <section className="mt-10 max-w-2xl sm:mt-14">
          <h1 className="font-display text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Seal a message in time.
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-mist sm:text-lg">
            Write it, pick the day it opens, and lock some USDC inside if you like.
          </p>
        </section>

        <div className="mt-8 grid gap-10 sm:mt-10 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div className="lg:sticky lg:top-6">
            <CreateCapsuleForm onCreated={handleCreated} />
          </div>
          <Gallery
            capsules={capsules}
            total={total}
            page={page}
            pageCount={pageCount}
            isLoading={isLoading}
            isError={isError}
            onPage={setPage}
            onRefetch={refetch}
          />
        </div>
      </main>
    </div>
  )
}
