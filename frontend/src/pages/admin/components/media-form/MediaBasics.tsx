import { MEDIA_SECTION_LABELS, type MediaSection } from '../../../../lib/media-api'
import { INPUT_CLASSES, LABEL_CLASSES, SECTION_COPY, SECTION_ORDER } from './helpers'

type MediaBasicsProps = {
  section: MediaSection
  onSectionChange: (next: MediaSection) => void
  tag: string
  onTagChange: (value: string) => void
  title: string
  onTitleChange: (value: string) => void
  subtitle: string
  onSubtitleChange: (value: string) => void
  artist: string
  onArtistChange: (value: string) => void
  album: string
  onAlbumChange: (value: string) => void
}

export default function MediaBasics({
  section,
  onSectionChange,
  tag,
  onTagChange,
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  artist,
  onArtistChange,
  album,
  onAlbumChange,
}: MediaBasicsProps) {
  const copy = SECTION_COPY[section]

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="media-section" className={LABEL_CLASSES}>
            Type
          </label>
          <select
            id="media-section"
            value={section}
            onChange={(e) => onSectionChange(e.target.value as MediaSection)}
            className={INPUT_CLASSES}
          >
            {SECTION_ORDER.map((value) => (
              <option key={value} value={value}>
                {MEDIA_SECTION_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="media-tag" className={LABEL_CLASSES}>
            Tag chip
          </label>
          <input
            id="media-tag"
            value={tag}
            onChange={(e) => onTagChange(e.target.value)}
            placeholder={copy.tagPlaceholder}
            className={INPUT_CLASSES}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="media-title" className={LABEL_CLASSES}>
            {copy.titleLabel}
          </label>
          <input
            id="media-title"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={copy.titlePlaceholder}
            className={INPUT_CLASSES}
          />
        </div>
        {section === 'radio' ? (
          <div>
            <label htmlFor="media-subtitle" className={LABEL_CLASSES}>
              {copy.subtitleLabel}
            </label>
            <input
              id="media-subtitle"
              value={subtitle}
              onChange={(e) => onSubtitleChange(e.target.value)}
              placeholder={copy.subtitlePlaceholder}
              className={INPUT_CLASSES}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="media-artist" className={LABEL_CLASSES}>
              Artist
            </label>
            <input
              id="media-artist"
              value={artist}
              onChange={(e) => onArtistChange(e.target.value)}
              placeholder="Who performs it"
              className={INPUT_CLASSES}
            />
          </div>
        )}
      </div>

      {(section === 'video' || section === 'music') && (
        <div className="grid gap-4 sm:grid-cols-2">
          {section === 'music' && (
            <div>
              <label htmlFor="media-subtitle" className={LABEL_CLASSES}>
                {copy.subtitleLabel}
              </label>
              <input
                id="media-subtitle"
                value={subtitle}
                onChange={(e) => onSubtitleChange(e.target.value)}
                placeholder={copy.subtitlePlaceholder}
                className={INPUT_CLASSES}
              />
            </div>
          )}
          <div>
            <label htmlFor="media-album" className={LABEL_CLASSES}>
              Album
            </label>
            <input
              id="media-album"
              value={album}
              onChange={(e) => onAlbumChange(e.target.value)}
              placeholder="From the file's tags, or type one"
              className={INPUT_CLASSES}
            />
          </div>
        </div>
      )}
    </>
  )
}
