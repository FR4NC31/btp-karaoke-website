import { useState } from 'react'
import CollectionCard from './CollectionCard'
import { collections, filterGenres } from '../data'

export default function CollectionsSection() {
  const [activeTab, setActiveTab] = useState('All Genres')

  const filteredCollections =
    activeTab === 'All Genres' ? collections : collections.filter((item) => item.genre === activeTab)

  return (
    <>
      {/* Filter by genre */}
      <section className="flex flex-wrap items-center gap-2">
        {filterGenres.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => setActiveTab(genre)}
            className={`rounded-md px-4 py-2 text-xs font-semibold tracking-wide uppercase transition ${
              activeTab === genre
                ? 'bg-primary text-text-primary'
                : 'border border-border bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            {genre}
          </button>
        ))}
        <span className="ml-auto hidden text-xs text-text-muted sm:block">Catalogue Sequence (STD-01)</span>
      </section>

      {/* Master vault collections */}
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-primary">◆</span>
          <h2 className="font-heading text-xl font-bold tracking-wide uppercase">Master Vault Collections</h2>
          <span className="text-[10px] tracking-widest text-text-muted uppercase">Active Stem Systems</span>
          <span className="ml-auto text-xs text-text-muted">
            Viewing {filteredCollections.length} of {collections.length} sets
          </span>
        </div>

        {filteredCollections.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-text-muted">
            No collections in this genre yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filteredCollections.map((item) => (
              <CollectionCard key={item.title} item={item} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
