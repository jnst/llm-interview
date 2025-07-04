# Generate LLM Interview Data

このプロジェクトは、LLMに関する知識をドリルダウンして学べるように、質問・回答・前提知識の形式にデータ化するものである。
元データ{org_data}となる `LLM Interview Questions.pdf` から、指定形式のデータを生成する。

## Phase1: データ化未実施のファイルを探す

1. `app/data` ディレクトリを確認し、`llm-interview-{\d{2}}.yaml` ファイルを確認
  - `find app/data -name "test-[0-9][0-9].yaml`
2. "01"から"50"の全50問のうち、データ化が未実施の質問を探す
3. 未実施の質問がなければ Phase2 以降は不要。ここで直ちに終了する
4. 未実施の質問があれば、2桁の質問番号から

## Phase2: 原文を和訳する

`LLM Interview Questions.pdf` を読み込み、データ化対象の質問と回答を確認

## Phase2: コア知識を習得する

## Phase3: 



5. 質問と回答を和訳する。和訳結果は{org_question}と{org_answer}とする
6. 質問文からもっとも重要なキーワード{main_keyword}を抜き出す
6. 以下のプロンプトを実行

```
{main_keyword}について以下の条件を最短経路で満たせる説明をして

- 応用が利く（新しい問題にも対応できる）
- 長期的に記憶に残りやすい
- 他の知識との関連付けができる
- 「なぜ？」という問いに答えられる
```

7. {core_knowledge}と、和訳結果{org_question}を入力にし、以下のプロンプトを実行

```
{core_knowledge}
---
上記を前提知識として、下記質問に簡潔かつ明快な回答を一段落で出力してください
---
{org_question}
```

8. 結果を回答{answer}とする
9. 質問{org_question}および
