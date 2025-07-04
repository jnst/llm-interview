# LLM Interview Question.txtを和訳する

1. @app/data/LLM-Interview-Questions.txt を読み込む
2. 1件毎に和訳し、1つの質問と回答が1つのYamlファイルとなるように出力する
  - file name
    - app/data/ja/Q01.yaml
    - app/data/ja/Q02.yaml
  - file format
    ```yaml
    id: "Q01"
    question: "トークン化はなぜ重要か"
    answer: "LLMが生のテキストではなくトークンの数値表現を処理するためです。トークン化により、モデルは多様な言語を扱い、稀な単語や未知の単語を管理し、語彙サイズを最適化することができ、計算効率とモデル性能を向上させます。"
    ```
  - key point
    - 一段落の文章で表現すること
    - 箇条書きで書かれたものは一つに繋げて自然な文章に変換すること
    - 数式は無視すること
3. Q01からQ50まで、4つづつ並列化して翻訳していくこと
