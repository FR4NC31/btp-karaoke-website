import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const timeZone = 'Asia/Manila'
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone,
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const categories = ['Features', 'Bug Fixes', 'Chores', 'Other Changes']
const groups = new Map(categories.map((category) => [category, []]))
const history = execFileSync('git', ['log', '--format=%h%x1f%s%x1f%cI%x1f%ae%x1e'], { encoding: 'utf8' })
const commits = history.split('\x1e').map((record) => record.trim().split('\x1f'))
commits.sort((a, b) => new Date(b[2]) - new Date(a[2]))

function formatTimestamp(timestamp) {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, value]))
  return `${parts.month} ${parts.day}, ${parts.year} at ${parts.hour}:${parts.minute}`
}

let latestTimestamp
for (const [hash, subject, timestamp, authorEmail] of commits) {
  if (!hash || !subject || !timestamp ||
    (authorEmail === '41898282+github-actions[bot]@users.noreply.github.com' && subject === 'chore: update changelog')) continue

  const type = /^([a-z]+)(?:\([^)]+\))?!?: /.exec(subject)?.[1]
  const category = type === 'feat' ? 'Features' : type === 'fix' ? 'Bug Fixes' : type === 'chore' ? 'Chores' : 'Other Changes'
  latestTimestamp ??= timestamp
  groups.get(category).push(`- ${subject} (${hash})`)
}

const lines = ['# Development Changelog', '', '## Unreleased', '']
if (latestTimestamp) lines.push(`Last updated: ${formatTimestamp(latestTimestamp)} (${timeZone})`, '')
for (const category of categories) {
  const entries = groups.get(category)
  if (entries.length) lines.push(`### ${category}`, '', ...entries, '')
}

writeFileSync('Changelogs.md', `${lines.join('\n').trimEnd()}\n`)
