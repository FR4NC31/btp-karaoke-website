import { INPUT_CLASSES, LABEL_CLASSES } from './helpers'

type ValueProps = {
  value: string
  onChange: (value: string) => void
}

/** Video-only numbers: the play counter. */
export function VideoFields({ value, onChange }: ValueProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="media-plays" className={LABEL_CLASSES}>
          Plays
        </label>
        <input
          id="media-plays"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={INPUT_CLASSES}
        />
      </div>
    </div>
  )
}

type MusicFieldsProps = {
  tempo: string
  onTempoChange: (value: string) => void
  songKey: string
  onSongKeyChange: (value: string) => void
}

/** Music-only metadata: tempo and key. */
export function MusicFields({ tempo, onTempoChange, songKey, onSongKeyChange }: MusicFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="media-tempo" className={LABEL_CLASSES}>
          Tempo
        </label>
        <input
          id="media-tempo"
          value={tempo}
          onChange={(e) => onTempoChange(e.target.value)}
          placeholder="118 BPM"
          className={INPUT_CLASSES}
        />
      </div>
      <div>
        <label htmlFor="media-songkey" className={LABEL_CLASSES}>
          Key
        </label>
        <input
          id="media-songkey"
          value={songKey}
          onChange={(e) => onSongKeyChange(e.target.value)}
          placeholder="Fmaj"
          className={INPUT_CLASSES}
        />
      </div>
    </div>
  )
}

/** Music-only lyrics box — line breaks kept, blank clears the column. */
export function LyricsField({ value, onChange }: ValueProps) {
  return (
    <div>
      <label htmlFor="media-lyrics" className={LABEL_CLASSES}>
        Lyrics
      </label>
      <textarea
        id="media-lyrics"
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste or type the track's lyrics — line breaks are kept."
        className={`${INPUT_CLASSES} min-h-40 resize-y leading-relaxed`}
      />
      <p className="mt-1.5 text-[11px] text-text-muted">
        Optional — saved with the track. Blank clears them.
      </p>
    </div>
  )
}

type RadioFieldsProps = {
  freq: string
  onFreqChange: (value: string) => void
  listeners: string
  onListenersChange: (value: string) => void
}

/** Radio-only numbers: dial frequency and listener count. */
export function RadioFields({ freq, onFreqChange, listeners, onListenersChange }: RadioFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="media-freq" className={LABEL_CLASSES}>
          Frequency
        </label>
        <input
          id="media-freq"
          value={freq}
          onChange={(e) => onFreqChange(e.target.value)}
          placeholder="FM 91.5"
          className={INPUT_CLASSES}
        />
      </div>
      <div>
        <label htmlFor="media-listeners" className={LABEL_CLASSES}>
          Listeners
        </label>
        <input
          id="media-listeners"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={listeners}
          onChange={(e) => onListenersChange(e.target.value)}
          placeholder="0"
          className={INPUT_CLASSES}
        />
      </div>
    </div>
  )
}
