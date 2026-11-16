import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Playlist01Icon } from '@hugeicons/core-free-icons'
import { usePlaylistLibrary } from '../../../../lib/playlist-library'
import { TONE_TILES } from '../playlists/mock-playlists'

/**
 * Preview of the real library (Liked Songs + the signed-in user's own sets).
 * Rendered as links, not headings, so it never competes with the playlists page.
 */
export default function PlaylistStrip() {
  const { likedSongs, userPlaylists } = usePlaylistLibrary()
  const preview = [likedSongs, ...userPlaylists].slice(0, 2)

  return (
    <section
      aria-labelledby="playlist-preview-heading"
      className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2"
    >
      <div className="flex items-start gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <HugeiconsIcon icon={Playlist01Icon} size={18} />
        </span>
        <div className="min-w-0">
          <h2
            id="playlist-preview-heading"
            className="text-xl leading-tight font-bold font-sans"
          >
            Curated Studio Playlists
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Ready-to-queue sets for vocal warmups and sessions
          </p>
        </div>
        <Link
          to="/studio/playlists"
          className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover"
        >
          All Playlists
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {preview.map((playlist) => (
          <Link
            key={playlist.id}
            to={`/studio/playlists/${playlist.id}`}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface-elevated/50 p-2.5 transition hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="grid size-12 shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-lg">
              {TONE_TILES[playlist.tone].map((tile, index) => (
                <span key={index} className="bg-cover bg-center" style={{ backgroundImage: tile }} />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-text-primary transition group-hover:text-primary">
                {playlist.name}
              </span>
              {playlist.description ? (
                <span className="mt-0.5 block truncate text-[11px] text-text-muted">
                  {playlist.description}
                </span>
              ) : null}
              <span className="mt-0.5 block text-[10px] text-text-muted">
                {playlist.tracks.length} studio {playlist.tracks.length === 1 ? 'track' : 'tracks'}
              </span>
            </span>
          </Link>
        ))}
        {preview.length === 0 && (
          <p className="flex items-center gap-2 text-xs text-text-muted">
            <HugeiconsIcon icon={Playlist01Icon} size={16} />
            No playlists yet — heart a track or create one to fill this row.
          </p>
        )}
      </div>
    </section>
  )
}
