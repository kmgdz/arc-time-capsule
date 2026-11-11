import { useCallback, useState } from 'react'
import { useAccount } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkGuard } from '@/components/NetworkGuard'
import { CreateCapsuleForm } from '@/components/CreateCapsuleForm'
import { Gallery, type GalleryView } from '@/components/Gallery'
import { PAGE_SIZE, useCapsules } from '@/hooks/useCapsules'
import { useMyCapsules } from '@/hooks/useMyCapsules'

export default function App() {
  const { address } = useAccount()
  const [wanted, setWanted] = useState<GalleryView>('all')
  const [page, setPage] = useState(0)

  // "My capsules" needs a connected wallet; without one the gallery shows everything.
  const view: GalleryView = wanted === 'mine' && address !== undefined ? 'mine' : 'all'

  const all = useCapsules(view === 'all' ? page : 0)
  const mine = useMyCapsules(address, all.total, view === 'mine')

  const refetchAll = all.refetch
  const refetchMine = mine.refetch
  const refetch = useCallback(() => {
    refetchAll()
    void refetchMine()
  }, [refetchAll, refetchMine])

  const handleCreated = useCallback(() => {
    setPage(0)
    refetch()
  }, [refetch])

  const handleView = useCallback((next: GalleryView) => {
    setWanted(next)
    setPage(0)
  }, [])

  const mineCount = mine.capsules.length
  const shown =
    view === 'mine'
      ? {
          capsules: mine.capsules.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
          total: mine.isLoading ? undefined : mineCount,
          pageCount: Math.max(1, Math.ceil(mineCount / PAGE_SIZE)),
          isLoading: mine.isLoading,
          isError: mine.isError || all.isError,
        }
      : {
          capsules: all.capsules,
          total: all.total,
          pageCount: all.pageCount,
          isLoading: all.isLoading,
          isError: all.isError,
        }

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
            capsules={shown.capsules}
            total={shown.total}
            page={page}
            pageCount={shown.pageCount}
            isLoading={shown.isLoading}
            isError={shown.isError}
            view={view}
            canViewMine={address !== undefined}
            onView={handleView}
            onPage={setPage}
            onRefetch={refetch}
          />
        </div>
      </main>
    </div>
  )
}
