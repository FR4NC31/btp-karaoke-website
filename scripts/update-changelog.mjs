import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const timeZone = 'Asia/Manila'
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const categories = ['Added', 'Fixed', 'Changed']
const days = new Map()
const history = execFileSync('git', ['log', '--format=%s%x1f%cI%x1e'], { encoding: 'utf8' })
const commits = history.split('\x1e').map((record) => record.trim().split('\x1f'))
commits.sort((a, b) => new Date(b[1]) - new Date(a[1]))

for (const [subject, timestamp] of commits) {
  if (!subject || !timestamp || subject === 'chore: update changelog') continue

  const match = /^([a-z]+)(?:\(([^)]+)\))?!?: (.+)$/.exec(subject)
  const [, type, scope, description] = match ?? [null, 'chore', null, subject]
  const category = type === 'feat' ? 'Added' : type === 'fix' ? 'Fixed' : 'Changed'
  const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, value]))
  const date = `${parts.year}-${parts.month}-${parts.day}`
  const time = `${parts.hour}:${parts.minute}`
  const entry = `- ${time} — ${scope ? `**${scope}:** ` : ''}${description}`

  if (!days.has(date)) days.set(date, new Map())
  const groups = days.get(date)
  if (!groups.has(category)) groups.set(category, [])
  groups.get(category).push(entry)
}

const lines = ['# Changelogs', '']
for (const [date, groups] of days) {
  lines.push(`## ${date} (Asia/Manila)`, '')
  for (const category of categories) {
    if (!groups.has(category)) continue
    lines.push(`### ${category}`, '', ...groups.get(category), '')
  }
}

writeFileSync('Changelogs.md', `${lines.join('\n').trimEnd()}\n`)
