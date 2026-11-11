# DOOOOOR / ドアドアめぐり

不可逆なドアで迷路そのものを書き換える、トップダウン経路パズルのプロトタイプ。

> Every door opens only once.

## Playable vertical slice

現在は 8 ステージを収録しています。

- 001 OPEN
- 003 SWING
- 005 NOT YET
- 009 COME BACK
- 011 TWO WAYS
- 012 CHOOSE
- 018 HINGE KNOT
- 020 DOOOOOR

操作:
- PC: 矢印 / WASD
- Mobile: スワイプ
- Z / UNDO: 1手戻す
- R / RESTART: リスタート

## Core rule

- ドアは押して開ける
- 一度開いたドアは二度と動かない
- 開いた扉は別の場所をふさぐ
- 両方向ドアは、どちら側から押すかで残る位置が変わる
- 開けないことも解法になる

## Prototype note

v0.1 は「面白さの核」を最短で触るための cell-based prototype。
起動時に BFS solver が全8面の solvability を検査し、結果を console に出します。

次の段階では、ドアをマスではなく壁境界＋蝶番として扱う edge/hinge model へ寄せ、
005 / 012 / 018 を中心に意図解・別解・最小開扉数を詰めます。

## Design pillars

- **WHEN** — いつ開けるか
- **WHICH WAY** — どちらへ開けるか
- **LEAVE CLOSED** — 開けないか
