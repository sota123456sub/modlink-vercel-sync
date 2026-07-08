#!/usr/bin/env python3
import argparse, json
from pathlib import Path
from modlink_vercel_client import create_pack, update_pack

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", required=True, help="例: https://your-project.vercel.app")
    ap.add_argument("--pack-json", required=True)
    ap.add_argument("--pack-id", default="")
    ap.add_argument("--owner-key", default="")
    args = ap.parse_args()

    pack = json.loads(Path(args.pack_json).read_text(encoding="utf-8"))
    if args.pack_id and args.owner_key:
        res = update_pack(args.base_url, args.pack_id, args.owner_key, pack)
    else:
        res = create_pack(args.base_url, pack)
    print(json.dumps(res, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
