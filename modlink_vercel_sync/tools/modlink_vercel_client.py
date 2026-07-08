import base64
import json
import urllib.request
from urllib.parse import urljoin

def _b64url_decode(s: str) -> bytes:
    s = s.strip()
    if s.startswith("MLVC-"):
        s = s[5:]
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)

def decode_vercel_code(code: str) -> dict:
    return json.loads(_b64url_decode(code).decode("utf-8"))

def request_json(url: str, method="GET", data=None, headers=None):
    body = None
    h = {"User-Agent": "ModLinkLauncher/VercelSync"}
    if headers:
        h.update(headers)
    if data is not None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def fetch_pack_from_code(code: str) -> dict:
    meta = decode_vercel_code(code)
    if meta.get("type") != "vercel":
        raise ValueError("Vercel共有コードではありません")
    base = meta["base_url"].rstrip("/") + "/"
    pack_id = meta["pack_id"]
    return request_json(urljoin(base, f"api/packs/{pack_id}"))

def create_pack(base_url: str, pack: dict):
    return request_json(base_url.rstrip("/") + "/api/packs", method="POST", data=pack)

def update_pack(base_url: str, pack_id: str, owner_key: str, pack: dict):
    return request_json(
        base_url.rstrip("/") + f"/api/packs/{pack_id}",
        method="PUT",
        data=pack,
        headers={"X-Owner-Key": owner_key},
    )

def check_remote_update(local_pack: dict, remote_pack: dict) -> dict:
    local_version = int(local_pack.get("version", 0))
    remote_version = int(remote_pack.get("version", 0))
    result = {
        "has_update": remote_version > local_version,
        "local_version": local_version,
        "remote_version": remote_version,
        "added_mods": [],
        "removed_mods": [],
        "changed_mods": [],
        "servers": remote_pack.get("servers", []),
    }
    local_mods = {(m.get("source"), str(m.get("project_id") or m.get("file_id") or m.get("filename"))): m for m in local_pack.get("mods", [])}
    remote_mods = {(m.get("source"), str(m.get("project_id") or m.get("file_id") or m.get("filename"))): m for m in remote_pack.get("mods", [])}
    for k, m in remote_mods.items():
        if k not in local_mods:
            result["added_mods"].append(m)
        else:
            lv = local_mods[k].get("version_id") or local_mods[k].get("file_id")
            rv = m.get("version_id") or m.get("file_id")
            if rv and lv and str(rv) != str(lv):
                result["changed_mods"].append({"local": local_mods[k], "remote": m})
    for k, m in local_mods.items():
        if k not in remote_mods:
            result["removed_mods"].append(m)
    return result

if __name__ == "__main__":
    import sys
    print(json.dumps(fetch_pack_from_code(sys.argv[1]), ensure_ascii=False, indent=2))
