// Authored rooms; all-win proof conditions are checked by npm run validate.
export const levels = [
  {
    id: '001',
    name: 'OPEN',
    subtitle: 'はじめの一枚',
    chapter: 'I / OPEN A POSSIBILITY',
    hint: '目の前のドアを、そっと押してみよう。',
    instruction: '右へ一歩。金色の蝶番を中心に、ドアが開きます。',
    cells: [ [ 0, 0 ], [ 1, 0 ], [ 0, 1 ], [ 1, 1 ] ],
    walls: [ [ [ 0, 1 ], [ 1, 1 ] ] ],
    start: [ 0, 0 ],
    goal: [ 1, 0 ],
    doors: [ { id: 'A', hinge: [ 1, 1 ], leaf: [ 0, -1 ], push: [ 'R' ] } ],
    proof: { concept: 'push', required: [ 'A:R' ], explanation: '下への通路は壁。Aを右に押す1手が唯一の最短解。開いた葉は右下との境界に残る。' }
  },
  {
    id: '003',
    name: 'SWING',
    subtitle: '道をひらく、道をふさぐ',
    chapter: 'I / THE OTHER SIDE',
    hint: '開いたドアの向こうへ。少し、遠回り。',
    cells: [ [ 1, 0 ], [ 0, 1 ], [ 1, 1 ], [ 0, 2 ], [ 1, 2 ] ],
    walls: [],
    start: [ 1, 0 ],
    goal: [ 0, 1 ],
    doors: [ { id: 'A', hinge: [ 1, 1 ], leaf: [ 1, 0 ], push: [ 'D' ] } ],
    proof: {
      concept: 'barrier',
      required: [ 'A:D' ],
      explanation: 'Aを下へ押すと左への辺が閉じる。そのまま左には行けず、下段を回って出口へ。',
      blockedAfter: { path: 'D', action: 'L', reason: 'fixed' }
    }
  },
  {
    id: '005',
    name: 'NOT YET',
    subtitle: '先に、ほかの一枚を',
    chapter: 'II / OPEN IT LATER',
    hint: '正面Aは、まだ早い。長いドアが通る場所まで見てみよう。',
    cells: [
      [ 0, 0 ], [ 1, 0 ], [ 2, 0 ],
      [ 3, 0 ], [ 0, 1 ], [ 1, 1 ],
      [ 2, 1 ], [ 3, 1 ], [ 0, 2 ],
      [ 1, 2 ], [ 2, 2 ], [ 3, 2 ],
      [ 0, 3 ], [ 1, 3 ], [ 2, 3 ],
      [ 3, 3 ], [ 0, 4 ], [ 1, 4 ],
      [ 2, 4 ], [ 3, 4 ]
    ],
    walls: [ [ [ 2, 0 ], [ 2, 1 ] ], [ [ 0, 1 ], [ 1, 1 ] ], [ [ 2, 3 ], [ 3, 3 ] ], [ [ 3, 4 ], [ 3, 5 ] ] ],
    start: [ 2, 2 ],
    goal: [ 1, 0 ],
    doors: [
      { id: 'A', hinge: [ 3, 3 ], leaf: [ 0, -1 ], push: [ 'R' ] },
      { id: 'B', hinge: [ 1, 3 ], leaf: [ 1, 0 ], push: [ 'D' ], length: 1 },
      { id: 'C', hinge: [ 2, 3 ], leaf: [ 0, -1 ], push: [ 'L' ], length: 2 },
      { id: 'D', hinge: [ 3, 1 ], leaf: [ -1, 0 ], push: [ 'D' ], length: 2 }
    ],
    proof: {
      concept: 'early-trap',
      required: [ 'B:D', 'C:L', 'A:R', 'D:D' ],
      requiredInEveryWin: [ 'A:R', 'B:D', 'C:L', 'D:D' ],
      minimumSteps: 25,
      minimumBidirectionalOpens: 0,
      before: [ [ 'A', 'D' ], [ 'B', 'A' ], [ 'B', 'C' ], [ 'B', 'D' ], [ 'C', 'D' ] ],
      leaveClosed: [],
      trap: 'R',
      additionalTraps: [],
      explanation: '正面Aの右押しは今は罠だが、全解で後から同じA:Rが必須。Bを下へ開け、長いCを左へ動かして戻り、Aを右へ。最後に長いDを下へ開く。',
      delayed: { door: 'A', action: 'R', path: 'R', prior: [] }
    },
    instruction: '2マスのドアも90度。途中の障害物にも注意。'
  },
  {
    id: '009',
    name: 'COME BACK',
    subtitle: '近づくために、遠ざかる',
    chapter: 'II / TAKE THE LONG WAY',
    hint: '隣の出口へ行くために、いちばん遠い角をめぐろう。',
    cells: [
      [ 0, 0 ], [ 1, 0 ],
      [ 2, 0 ], [ 3, 0 ],
      [ 0, 1 ], [ 3, 1 ],
      [ 0, 2 ], [ 2, 2 ],
      [ 3, 2 ], [ 0, 3 ],
      [ 1, 3 ], [ 2, 3 ],
      [ 3, 3 ]
    ],
    walls: [],
    start: [ 0, 0 ],
    goal: [ 1, 0 ],
    doors: [
      { id: 'A', hinge: [ 1, 1 ], leaf: [ 0, -1 ], push: [ 'L' ] },
      { id: 'B', hinge: [ 2, 3 ], leaf: [ 0, 1 ], push: [ 'R' ] }
    ],
    proof: {
      concept: 'away',
      required: [ 'B:R' ],
      requiredInEveryWin: [ 'B:R' ],
      leaveClosed: [ 'A' ],
      minimumSteps: 11,
      explanation: '出口は右隣だがAは禁止側。左辺を3歩下り、下辺のBを右に開き、右辺を上って上辺から戻る11手の大回り。Bの葉は中央の抜け道を塞ぎ、対角の角まで歩く必要がある。',
      blockedAfter: { path: '', action: 'R', reason: 'wrong-side' }
    }
  },
  {
    id: '011',
    name: 'TWO WAYS',
    subtitle: '蝶番は、どちらにも',
    chapter: 'III / WHICH WAY?',
    hint: '一枚目は右へ。二枚目は、反対側から。',
    cells: [
      [ 0, 0 ], [ 1, 0 ],
      [ 2, 0 ], [ 0, 1 ],
      [ 1, 1 ], [ 2, 1 ],
      [ 1, 2 ], [ 2, 2 ]
    ],
    walls: [ [ [ 1, 1 ], [ 1, 2 ] ], [ [ 2, 2 ], [ 2, 3 ] ] ],
    start: [ 0, 0 ],
    goal: [ 1, 1 ],
    doors: [
      { id: 'A', hinge: [ 1, 1 ], leaf: [ 0, -1 ], push: [ 'R', 'L' ] },
      { id: 'B', hinge: [ 2, 2 ], leaf: [ 0, -1 ], push: [ 'R', 'L' ] }
    ],
    proof: {
      concept: 'bidirectional',
      required: [ 'A:R', 'B:L' ],
      requiredInEveryWin: [ 'A:R', 'B:L' ],
      minimumBidirectionalOpens: 2,
      before: [ [ 'A', 'B' ] ],
      minimumSteps: 4,
      explanation: 'Aを右に押すと真下の出口への辺を塞ぐ。右から回り、Bを左へ押して出口へ。全クリア状態でA:RとB:Lが必須。2枚とも両方向に物理的な回転余地があり、右押しと左押しを実際に体験する。開扉0の迂回解はない。'
    }
  },
  {
    id: '012',
    name: 'CHOOSE',
    subtitle: '残す壁を、選ぶ',
    chapter: 'III / WHICH WAY MATTERS',
    hint: 'Bは左へも、右へも。長いドアが回る場所を残そう。',
    cells: [
      [ 3, 1 ], [ 3, 2 ],
      [ 3, 3 ], [ 2, 0 ],
      [ 2, 1 ], [ 2, 2 ],
      [ 2, 3 ], [ 1, 0 ],
      [ 1, 1 ], [ 1, 2 ],
      [ 1, 3 ], [ 0, 0 ],
      [ 0, 1 ], [ 0, 2 ]
    ],
    walls: [ [ [ 4, 2 ], [ 3, 2 ] ] ],
    start: [ 1, 1 ],
    goal: [ 3, 1 ],
    doors: [
      { id: 'A', hinge: [ 1, 2 ], leaf: [ 1, 0 ], push: [ 'U' ], length: 2 },
      { id: 'B', hinge: [ 1, 1 ], leaf: [ 0, 1 ], push: [ 'R', 'L' ], length: 1 },
      { id: 'C', hinge: [ 3, 3 ], leaf: [ 0, -1 ], push: [ 'L' ], length: 2 }
    ],
    proof: {
      concept: 'choice',
      required: [ 'B:L', 'A:U', 'C:L' ],
      requiredInEveryWin: [ 'A:U', 'B:L', 'C:L' ],
      minimumSteps: 12,
      minimumBidirectionalOpens: 1,
      before: [ [ 'A', 'C' ], [ 'B', 'A' ], [ 'B', 'C' ] ],
      leaveClosed: [],
      trap: 'ULDR',
      additionalTraps: [],
      explanation: '両方向のBは左右とも実際に押せる。右へ押すと長いAの回転を妨げて詰み、左へ押すことが全解で必須。B→A→Cの順に三枚を動かす。',
      choice: { door: 'B', action: 'R', path: 'ULDR', prior: [], correct: 'L' }
    }
  },
  {
    id: '018',
    name: 'HINGE KNOT',
    subtitle: 'ひとつほどくと、次が動く',
    chapter: 'IV / A CHAIN OF HINGES',
    hint: '長いドアの先まで、順番はつながっている。最後の一枚も慎重に。',
    cells: [
      [ 1, 2 ], [ 2, 2 ], [ 3, 2 ],
      [ 0, 3 ], [ 1, 3 ], [ 2, 3 ],
      [ 3, 3 ], [ 0, 4 ], [ 1, 4 ],
      [ 2, 4 ], [ 3, 4 ], [ 0, 5 ],
      [ 1, 5 ], [ 2, 5 ], [ 0, 0 ],
      [ 1, 0 ], [ 0, 1 ], [ 1, 1 ]
    ],
    walls: [ [ [ 2, 2 ], [ 2, 3 ] ] ],
    start: [ 1, 4 ],
    goal: [ 0, 0 ],
    doors: [
      { id: 'A', hinge: [ 1, 5 ], leaf: [ 1, 0 ], push: [ 'D' ], length: 1 },
      { id: 'B', hinge: [ 2, 5 ], leaf: [ 0, -1 ], push: [ 'L' ], length: 2 },
      { id: 'C', hinge: [ 3, 3 ], leaf: [ -1, 0 ], push: [ 'D' ], length: 2 },
      { id: 'D', hinge: [ 1, 1 ], leaf: [ 0, 1 ], push: [ 'L' ] },
      { id: 'E', hinge: [ 1, 1 ], leaf: [ 0, -1 ], push: [ 'L' ] }
    ],
    proof: {
      concept: 'interference',
      required: [ 'A:D', 'B:L', 'C:D', 'E:L' ],
      requiredInEveryWin: [ 'A:D', 'B:L', 'C:D', 'E:L' ],
      minimumSteps: 15,
      minimumBidirectionalOpens: 0,
      before: [ [ 'A', 'B' ], [ 'A', 'C' ], [ 'A', 'E' ], [ 'B', 'C' ], [ 'B', 'E' ], [ 'C', 'E' ] ],
      leaveClosed: [ 'D' ],
      trap: 'DRUULRRULDLUUL',
      additionalTraps: [],
      explanation: 'Aを動かすと長いBの掃引領域が空き、Bを動かすと長いCを開けられる。A→B→C→Eの四段階が全解で必須。最後の共有蝶番ではDを閉じて残す。',
      closedTrap: { door: 'D', action: 'L', path: 'DRUULRRULDLUUL', prior: [ 'A:D', 'B:L', 'C:D' ] }
    }
  },
  {
    id: '020',
    name: 'DOOOOOR',
    subtitle: 'いつ、どちらへ、残す一枚',
    chapter: 'V / EVERY CHOICE MATTERS',
    hint: 'いつ開く。どちらへ開く。そして、何を閉じておく。',
    cells: [
      [ 0, 0 ], [ 1, 0 ], [ 2, 0 ],
      [ 3, 0 ], [ 0, 1 ], [ 1, 1 ],
      [ 2, 1 ], [ 3, 1 ], [ 0, 2 ],
      [ 1, 2 ], [ 2, 2 ], [ 3, 2 ],
      [ 0, 3 ], [ 1, 3 ], [ 2, 3 ],
      [ 3, 3 ], [ 1, 4 ], [ 2, 4 ],
      [ 3, 4 ]
    ],
    walls: [ [ [ 2, 0 ], [ 2, 1 ] ], [ [ 3, 3 ], [ 3, 4 ] ], [ [ 1, 1 ], [ 1, 0 ] ], [ [ 2, 4 ], [ 3, 4 ] ] ],
    start: [ 1, 2 ],
    goal: [ 1, 0 ],
    doors: [
      { id: 'A', hinge: [ 1, 3 ], leaf: [ 1, 0 ], push: [ 'U', 'D' ], length: 1 },
      { id: 'B', hinge: [ 2, 3 ], leaf: [ 0, -1 ], push: [ 'L' ], length: 2 },
      { id: 'C', hinge: [ 3, 3 ], leaf: [ 0, -1 ], push: [ 'R' ] },
      { id: 'D', hinge: [ 3, 1 ], leaf: [ -1, 0 ], push: [ 'D' ], length: 2 },
      { id: 'E', hinge: [ 2, 3 ], leaf: [ 0, 1 ], push: [ 'L' ], length: 1 }
    ],
    proof: {
      concept: 'finale',
      required: [ 'A:D', 'B:L', 'C:R', 'D:D' ],
      requiredInEveryWin: [ 'A:D', 'B:L', 'C:R', 'D:D' ],
      minimumSteps: 18,
      minimumBidirectionalOpens: 1,
      before: [ [ 'A', 'B' ], [ 'A', 'C' ], [ 'A', 'D' ], [ 'B', 'D' ], [ 'C', 'D' ] ],
      leaveClosed: [ 'E' ],
      trap: 'LDRU',
      additionalTraps: [ 'LDRDRRUUULDR', 'DDRRUUULDDL' ],
      explanation: 'Aは下へ押すことが必須で、上へ押すと詰む。Cは早く右へ開くと詰むが、Aを先に動かしてから同じ右押しを必ず使う。Eを開くと長いBと干渉するため、全解で閉じて残す。長いBとCを動かした後に、最後の長いDへ。',
      delayed: { door: 'C', action: 'R', path: 'LDRDRRUUULDR', prior: [] },
      choice: { door: 'A', action: 'U', path: 'LDRU', prior: [], correct: 'D' },
      closedTrap: { door: 'E', action: 'L', path: 'DDRRUUULDDL', prior: [ 'A:D' ] }
    }
  }
];
