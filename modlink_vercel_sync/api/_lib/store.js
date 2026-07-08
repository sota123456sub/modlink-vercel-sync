import { put, head } from '@vercel/blob';
import crypto from 'node:crypto';

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
      'access-control-allow-headers': 'Content-Type, Authorization, X-Owner-Key',
    },
  });
}

export async function readBodyJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function randomId(prefix = '') {
  return prefix + crypto.randomBytes(5).toString('hex');
}

export function randomKey() {
  return crypto.randomBytes(24).toString('base64url');
}

export function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

export function normalizeBaseUrl(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export function encodeShareCode(payload) {
  const raw = Buffer.from(JSON.stringify(payload), 'utf8');
  return 'MLVC-' + raw.toString('base64url');
}

export function decodeShareCode(code) {
  let s = String(code || '').trim();
  if (s.startsWith('MLVC-')) s = s.slice(5);
  const raw = Buffer.from(s, 'base64url').toString('utf8');
  return JSON.parse(raw);
}

export async function putJson(path, data) {
  const body = JSON.stringify(data, null, 2);
  const blob = await put(path, body, {
    access: 'public',
    contentType: 'application/json; charset=utf-8',
    allowOverwrite: true,
  });
  return blob;
}

export async function getJson(path, fallback = null) {
  try {
    const h = await head(path);
    const res = await fetch(h.url, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

export async function loadIndex() {
  return await getJson('data/index.json', {
    format: 'modlink-vercel-index-v1',
    updated_at: new Date().toISOString(),
    packs: [],
  });
}

export async function saveIndex(index) {
  index.updated_at = new Date().toISOString();
  return await putJson('data/index.json', index);
}

export function publicPack(pack) {
  const copy = structuredClone(pack);
  delete copy.owner_key_hash;
  delete copy.owner_key;
  return copy;
}

export function sanitizePackForPublic(input) {
  const pack = structuredClone(input || {});
  // shared=falseのサーバーは公開しない
  pack.servers = (pack.servers || [])
    .filter(s => s && s.shared)
    .map(s => ({
      name: s.name || s.address,
      address: s.address,
      shared: true,
    }));
  return pack;
}

export async function savePack(pack) {
  const path = `data/packs/${pack.pack_id}.json`;
  await putJson(path, publicPack(pack));

  // owner_key_hash入りの管理用も保存。public blobだがhashだけなのでowner_keyは出ない
  await putJson(`data/private/${pack.pack_id}.json`, {
    pack_id: pack.pack_id,
    owner_key_hash: pack.owner_key_hash,
    version: pack.version,
    updated_at: pack.updated_at,
  });

  const index = await loadIndex();
  index.packs = (index.packs || []).filter(p => p.pack_id !== pack.pack_id);
  index.packs.push({
    pack_id: pack.pack_id,
    name: pack.name || pack.pack_id,
    summary: pack.summary || '',
    game_version: pack.game_version || pack.minecraft || '',
    minecraft: pack.minecraft || pack.game_version || '',
    loader: pack.loader || '',
    version: pack.version || 1,
    updated_at: pack.updated_at,
    manifest: `/api/packs/${pack.pack_id}`,
  });
  await saveIndex(index);
}

export async function loadPublicPack(packId) {
  return await getJson(`data/packs/${packId}.json`, null);
}

export async function loadPrivateMeta(packId) {
  return await getJson(`data/private/${packId}.json`, null);
}

export function ownerKeyFromRequest(request) {
  return request.headers.get('x-owner-key') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
}

export async function verifyOwner(request, packId) {
  const meta = await loadPrivateMeta(packId);
  if (!meta) return { ok: false, status: 404, error: 'pack not found' };
  const key = ownerKeyFromRequest(request);
  if (!key) return { ok: false, status: 401, error: 'owner key required' };
  if (sha256(key) !== meta.owner_key_hash) return { ok: false, status: 403, error: 'owner key invalid' };
  return { ok: true, meta };
}
