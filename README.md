# relink-er-guide

グランブルーファンタジー リリンク エンドレスラグナロクの攻略情報をまとめるWebサイトです。

このサイトはCodexを使って作成・更新します。

## サイトについて

Xなどに投稿された攻略情報を、原文を開く前に概要が分かるよう独自の短い要約で整理する、スマートフォン優先の静的サイトです。投稿本文や画像・動画そのものは転載せず、元投稿へのリンクを掲載します。

## 攻略情報を追加する

通常の更新では `data/posts.json` だけを編集します。スマートフォンではGitHub上でファイルを開き、鉛筆アイコンから編集できます。

1. 配列末尾の `]` の前に、直前の項目との区切りとなるカンマと新しい項目を追加します。
2. `id` と `sourceUrl` は必ず一意にします。同じURLは画面側でも重複表示されません。
3. `summary` には転載ではなく、内容を確認して作成した2〜3文の短い要約を書きます。
4. 実在する元投稿だけを登録し、日時は `2026-01-15T12:00:00+09:00` のようなISO 8601形式で記述します。
5. 変更をコミットすると、公開処理が自動的に始まります。

```json
{
  "id": "固有のID",
  "title": "カードの見出し",
  "summary": "独自に作成した2〜3文の要約。投稿本文は転載しません。",
  "category": "サンダルフォン",
  "attributes": ["火力", "コンボ"],
  "sourceUrl": "実在する元投稿URL",
  "author": "投稿者名",
  "postedAt": "2026-01-15T12:00:00+09:00",
  "registeredAt": "2026-01-16T09:30:00+09:00",
  "usefulness": 80,
  "confidence": "中",
  "status": "未確認",
  "media": "video",
  "isSample": false
}
```

- `category`: 最新情報 / サンダルフォン / フェディエル / ランスロット / カリオストロ / その他キャラクター / ジーン、武器 / CPU、放置 / ボス攻略
- `attributes`: 火力 / 回避 / コンボ / 装備 / CPU / 放置 / 検証 / 動画（複数指定可）
- `media`: `video` / `image` / `none`
- `usefulness`: 0〜100の数値

初期データはUI確認用の**架空サンプル**です。実在の情報を登録するときはサンプル項目を削除してください。サンプルのURLは `example.com` であり、実在するX投稿を装ったものではありません。

## ローカルで確認する

ブラウザの制約によりHTMLファイルを直接開くのではなく、リポジトリ直下でローカルサーバーを起動します。

```bash
python3 -m http.server 8000
```

その後 `http://localhost:8000/` を開きます。データは相対パス `data/posts.json` から読み込むため、リポジトリ名を含むGitHub PagesのURLでも動作します。

## GitHub Pagesで公開する

1. リポジトリのデフォルトブランチを `main` にします。
2. GitHubの **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選びます。
3. `main` ブランチへ変更をコミット（またはマージ）します。
4. **Actions** タブの「Deploy static site to GitHub Pages」が完了したら、Pages画面に表示されるURLを開きます。

`.github/workflows/pages.yml` が、HTML・CSS・JavaScript・JSONを含むリポジトリを静的サイトとして自動公開します。APIキーや認証情報は不要です。
