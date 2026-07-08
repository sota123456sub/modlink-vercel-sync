import { jsonResponse, decodeShareCode, loadPublicPack } from '../_lib/store.js';

export async function GET(request, context) {
  try {
    const meta = decodeShareCode(context.params.shareCode);
    if (meta.type !== 'vercel') {
      return jsonResponse({ ok: false, error: 'not vercel share code' }, 400);
    }
    const pack = await loadPublicPack(meta.pack_id);
    if (!pack) return jsonResponse({ ok: false, error: 'pack not found' }, 404);
    return jsonResponse({ ok: true, meta, pack });
  } catch (e) {
    return jsonResponse({ ok: false, error: String(e) }, 400);
  }
}

export async function OPTIONS() {
  return jsonResponse({ ok: true });
}
