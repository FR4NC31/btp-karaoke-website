/**
 * Safety rail for the two CI bootstrap scripts that create database objects.
 *
 * They are deliberately limited to a disposable database reached over
 * localhost, so a mistaken `.env` can never point them at the live Aiven
 * database. The workflow sets E2E_DB_SETUP=1; a local developer must opt in
 * explicitly as well.
 */
export function requireDisposableDatabase(): void {
  if (process.env.E2E_DB_SETUP !== '1') {
    throw new Error('Refusing to bootstrap E2E database state without E2E_DB_SETUP=1.')
  }

  let hostname = ''
  let hasHostOverride = false
  try {
    const url = new URL(process.env.DATABASE_URL ?? '')
    hostname = url.hostname
    // node-postgres lets ?host= / ?hostaddr= override the URL authority. A
    // URL that looks local must not be able to reach a remote server that way.
    hasHostOverride = url.searchParams.has('host') || url.searchParams.has('hostaddr')
  } catch {
    // The error below names the actual requirement.
  }

  if (
    hasHostOverride ||
    (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '[::1]')
  ) {
    throw new Error(
      'Refusing to bootstrap E2E database state against a non-local DATABASE_URL. ' +
        'Point it at localhost (or 127.0.0.1) without host/hostaddr overrides and try again.',
    )
  }
}
