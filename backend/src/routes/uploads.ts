import { Hono } from 'hono'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { mediaContentType, mediaFilePath } from '../uploads.ts'

const uploadApi = new Hono()

// Uploaded catalog files (MP4/MP3 media and their cover images), public like
// the hub feed itself. Served with byte-range support — browsers request
// ranges while seeking, and an uploaded video should scrub in the console
// exactly like the bundled master. Names are the uuid filenames the uploader
// generated; anything else is 404.
uploadApi.get('/media/:name', async (c) => {
  const name = c.req.param('name')
  const filePath = mediaFilePath(name)
  if (!filePath) {
    return c.json({ error: 'Not found.' }, 404)
  }

  let size: number
  try {
    const info = await stat(filePath)
    if (!info.isFile()) {
      return c.json({ error: 'Not found.' }, 404)
    }
    size = info.size
  } catch {
    return c.json({ error: 'Not found.' }, 404)
  }

  const baseHeaders = {
    'content-type': mediaContentType(name),
    'accept-ranges': 'bytes',
    // uuid names are never reused, so the file behind one is immutable.
    'cache-control': 'public, max-age=31536000, immutable',
  }

  const range = c.req.header('range')?.trim()
  if (!range) {
    const body = Readable.toWeb(createReadStream(filePath)) as unknown as ReadableStream
    return new Response(body, {
      headers: { ...baseHeaders, 'content-length': String(size) },
    })
  }

  // Single-range requests only ("bytes=a-b", "bytes=a-", "bytes=-n") — which
  // is all a media element ever sends.
  const match = /^bytes=(\d*)-(\d*)$/.exec(range)
  if (match) {
    const [, rawStart = '', rawEnd = ''] = match
    let start = rawStart ? Number(rawStart) : 0
    let end = rawEnd ? Number(rawEnd) : size - 1
    if (!rawStart && rawEnd) {
      // Suffix range: the last N bytes.
      const suffix = Number(rawEnd)
      start = Math.max(size - suffix, 0)
      end = size - 1
    }
    if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < size) {
      end = Math.min(end, size - 1)
      const body = Readable.toWeb(createReadStream(filePath, { start, end })) as unknown as ReadableStream
      return new Response(body, {
        status: 206,
        headers: {
          ...baseHeaders,
          'content-range': `bytes ${start}-${end}/${size}`,
          'content-length': String(end - start + 1),
        },
      })
    }
  }

  // Unsatisfiable or unsupported range — answer 416 like a static server.
  return new Response(null, {
    status: 416,
    headers: { ...baseHeaders, 'content-range': `bytes */${size}` },
  })
})

export default uploadApi
