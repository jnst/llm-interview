# コア知識を生成する

## 前提知識

- @doc/adr-001.md
- @doc/ubiquitous-language.md

## Your Task

- @app/data/keypoints 配下の md ファイルを一覧する
- 各ファイルに対してTaskを使って並列作業をする
  - ファイルを開く
    - if: すでにコア知識が書かれている場合は何もしない
    - else: コア知識を「概念理解を導くプロンプト」を使って生成する
      - front matterに書かれている contexts の数だけプロンプトを実行する
      - <Context>タグで囲む
        ```
        <Context name="db">
        {prompt_output}
        </Context>
        ```
      - ファイルを保存する
      - 文字化けしていないことを確認する


## 概念理解を導くプロンプト

```
{context}文脈・分野における{keyword}について以下の条件を最短経路で満たせる説明をして

- 応用が利く（新しい問題にも対応できる）
- 長期的に記憶に残りやすい
- 他の知識との関連付けができる
- 「なぜ？」という問いに答えられる

出力はMarkdown記法、見出し2は `## {keyword}`
```
