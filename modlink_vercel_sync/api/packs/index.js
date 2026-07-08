import {
  jsonResponse, readBodyJson, randomId, randomKey, sha256,
  normalizeBaseUrl, encodeShareCode, sanitizePackForPublic,
  savePack, loadIndex
} from '../_lib/store.js';

export async function GET() {
  const index = await loadIndex();
  return jsonResponse(index);
}

export async function POST(request) {
  const input = await readBodyJson(request);
  const ownerKey = input.owner_key || randomKey();
  const packId = input.pack_id || randomId('pack-');
  const now = new Date().toISOString();

  const clean = sanitizePackForPublic(input);
  const pack = {
    format: 'modlink-pack-v1',
    ...clean,
    pack_id: packId,
    version: Number(input.version || 1),
    updated_at: now,
    owner_key_hash: sha256(ownerKey),
    sync: {
      enabled: true,
      delete_removed_mods: false,
      sync_config: Boolean(input?.sync?.sync_config),
      sync_servers: input?.sync?.sync_servers !== false,
      ...(input.sync || {}),
    },
  };

  await savePack(pack);

  const baseUrl = normalizeBaseUrl(request);
  const shareCode = encodeShareCode({
    type: 'vercel',
    base_url: baseUrl,
    pack_id: packId,
  });

  return jsonResponse({
    ok: true,
    pack_id: packId,
    owner_key: ownerKey,
    share_code: shareCode,
    url: `${baseUrl}/api/packs/${packId}`,
  }, 201);
}

export async function OPTIONS() {
  return jsonResponse({ ok: true });
}
