import { jsonResponse, loadPublicPack } from '../../_lib/store.js';

export async function GET(request, context) {
  const packId = context.params.packId;
  const pack = await loadPublicPack(packId);
  if (!pack) return jsonResponse({ ok: false, error: 'pack not found' }, 404);
  return jsonResponse({
    ok: true,
    pack_id: packId,
    version: pack.version || 1,
    updated_at: pack.updated_at || '',
    name: pack.name || packId,
  });
}

export async function OPTIONS() {
  return jsonResponse({ ok: true });
}
