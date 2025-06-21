# TODO

- [x] 次の問題に進んだとき、ヒントを表示しても問題1のヒントが表示されてしまう問題を修正する
- [x] 「どのくらい理解できました？」の評価ボタンを押すとエラーが発生する
```
Failed to read from localStorage: ReferenceError: localStorage is not defined
    at Function.getItem (/Users/jnst/go/github.com/jnst/llm-interview/app/utils/localStorage.ts:62:21)
    at Function.getSessions (/Users/jnst/go/github.com/jnst/llm-interview/app/utils/localStorage.ts:114:32)
    at Function.getSession (/Users/jnst/go/github.com/jnst/llm-interview/app/utils/localStorage.ts:133:42)
    at StudyManager.addReviewToSession (/Users/jnst/go/github.com/jnst/llm-interview/app/utils/study.ts:103:63)
```

