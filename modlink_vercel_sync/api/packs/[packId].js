import {
  jsonResponse, readBodyJson, sanitizePackForPublic,
  loadPublicPack, loadPrivateMeta, verifyOwner, savePack
} from '../_lib/store.js';

export async function GET(request, context) {
  const packId = context.params.packId;
  const pack = await loadPublicPack(packId);
  if (!pack) return jsonResponse({ ok: false, error: 'pack not found' }, 404);
  return jsonResponse(pack);
}

export async function PUT(request, context) {
  const packId = context.params.packId;
  const auth = await verifyOwner(request, packId);
  if (!auth.ok) return jsonResponse({ ok: false, error: auth.error }, auth.status);

  const oldPack = await loadPublicPack(packId);
  const input = await readBodyJson(request);
  const clean = sanitizePackForPublic(input);
  const now = new Date().toISOString();

  const pack = {
    ...oldPack,
    ...clean,
    pack_id: packId,
    version: Number(input.version || oldPack.version || 0) + 1,
    updated_at: now,
    owner_key_hash: auth.meta.owner_key_hash,
  };

  await savePack(pack);
  return jsonResponse({ ok: true, pack_id: packId, version: pack.version, updated_at: now });
}

export async function OPTIONS() {
  return jsonResponse({ ok: true });
}
