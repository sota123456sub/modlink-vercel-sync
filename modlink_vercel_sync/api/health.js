import { jsonResponse } from './_lib/store.js';

export async function GET() {
  return jsonResponse({
    ok: true,
    name: 'ModLink Vercel Sync',
    version: '1.0.0',
    time: new Date().toISOString(),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}

export async function OPTIONS() {
  return jsonResponse({ ok: true });
}
