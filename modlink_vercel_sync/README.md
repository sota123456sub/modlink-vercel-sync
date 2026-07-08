# ModLink Vercel Sync Server

ModLink用の同期サーバーです。  
GitHub Pages版と違って、Vercel Functions + Vercel Blob を使うので、ModLink本体からPack作成/更新できます。

## 必要なもの

- Vercelアカウント
- Vercel Blob Store
- 環境変数 `BLOB_READ_WRITE_TOKEN`
- 任意: 環境変数 `MODLINK_ADMIN_TOKEN`

Vercel Functionsはサーバー側コードを実行できます。Vercel Blobは実行時にファイルを保存できるストレージです。  
GitHub Pagesと違い、POST/PUTでPack manifestを保存できます。

## デプロイ

```bash
npm install
npx vercel
```

本番反映:

```bash
npx vercel --prod
```

## Vercel Blob設定

Vercel Dashboardで:

```text
Storage
↓
Create Database
↓
Blob
↓
Connect Project
```

接続すると `BLOB_READ_WRITE_TOKEN` が環境変数に入ります。

## API

### Health

```http
GET /api/health
```

### Pack一覧

```http
GET /api/packs
```

### Pack作成

```http
POST /api/packs
Content-Type: application/json

{
  "name": "My Pack",
  "game_version": "1.20.1",
  "loader": "fabric",
  "mods": [],
  "servers": []
}
```

戻り値:

```json
{
  "pack_id": "...",
  "owner_key": "...",
  "share_code": "MLVC-..."
}
```

`owner_key` はPack更新に必要です。なくすと更新できません。

### Pack取得

```http
GET /api/packs/{pack_id}
```

### Pack更新

```http
PUT /api/packs/{pack_id}
X-Owner-Key: 作成時のowner_key
Content-Type: application/json

{
  "name": "My Pack",
  "mods": []
}
```

### 更新確認

```http
GET /api/packs/{pack_id}/version
```

### 共有コードからPack取得

```http
GET /api/code/{share_code}
```

## ローカルツール

共有コード作成:

```bash
python tools/build_share_code.py --base-url https://YOUR-PROJECT.vercel.app --pack-id PACK_ID
```

Pack取得テスト:

```bash
python tools/modlink_vercel_client.py MLVC-...
```

## ModLink v28に組み込む予定

- MLVCコード貼り付け
- VercelからPack取得
- Pack更新確認
- Pack主の更新アップロード
- owner_key保存
