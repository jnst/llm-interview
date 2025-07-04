# コア知識を生成する

## 前提知識

- @doc/adr-001.md
- @doc/ubiquitous-language.md

## Your Task

- @app/data/keypoints 配下の md ファイルに、コア知識を生成する
- すでにコア知識が書かれている場合は何もしない
- すでに書かれているfront matterは変更しない
- @doc/ubiquitous-language.md に書かれているプロンプトを使用
- front matterに書かれている contexts の数だけプロンプトを実行する
- @doc/adr-001.md に書かれている Context タグを使用し、Context タグ内部にプロンプトの出力結果を挿入する
  - Context タグの外側は見出し2のタイトル(=keyword)のみ存在する
  - Context タグの中身は見出し3(###)で始める
