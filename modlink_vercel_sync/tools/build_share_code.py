#!/usr/bin/env python3
import argparse, base64, json

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", required=True, help="例: https://your-project.vercel.app")
    ap.add_argument("--pack-id", required=True)
    args = ap.parse_args()

    payload = {
        "type": "vercel",
        "base_url": args.base_url.rstrip("/"),
        "pack_id": args.pack_id
    }
    print("MLVC-" + b64url(json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")))

if __name__ == "__main__":
    main()
