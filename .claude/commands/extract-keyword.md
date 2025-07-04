# Keywordを出力する

1. app/data/ja 配下のファイルを順に処理する
2. ファイルを開き、AI/LLM分野の専門用語(keyword)を抽出する
  - ファイル本文の例
  ```
  次文予測（NSP）は、二つの文が連続しているか無関係かを判断するようにモデルを訓練します。事前学習中、BERTのようなモデルは50%の正例（連続）と50%の負例（ランダム）の文ペアを分類することを学習し、NSPは文の関係を理解することで、対話システムや文書要約などのタスクにおける一貫性を向上させます。
  ```
  - 抽出すべき専門用語(keyword)
    - 次文予測
    - 事前学習
    - BERT
    - 正例
    - 負例
    - 文ペア
3. 専門用語(keyword)をファイル名としてMarkdownファイルを作成する(すでにファイルが存在する場合は後述するfront matterのcontextsを確認し、別文脈であるなら追記、同じ文脈であるなら何もせず次のキーワードへ進む)
  - 作成するファイル例
    - app/data/keypoint/次文予測.md
    - app/data/keypoint/事前学習.md
    - app/data/keypoint/BERT.md
    - app/data/keypoint/正例.md
    - app/data/keypoint/負例.md
    - app/data/keypoint/文ペア.md
  - ファイル内容としてfront matterを記述 @doc/ADR-001.md
    - 例1: AI/LLM文脈で意味が通じるものはcontexts配列にaiとして1つだけ追加(英語小文字)
      ```
      ---
      title: 次文予測
      contexts:
        - ai
      ---
      ```
    - 例2: 汎用キーワードなため、特定分野の文脈に絞る必要があるキーワードは文脈名を1つだけ追加(英語小文字)
      ```
      ---
      title: クエリ
      contexts:
        - transformer
      ---
      ```
4. ファイル保存をする
5. 保存したファイルがテキストとして開けることを確認する
