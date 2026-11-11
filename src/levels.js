const rectangle = (w,h) => Array.from({length:w*h},(_,i)=>[i%w,Math.floor(i/w)]);
const door = (id,hinge,leaf,push) => ({id,hinge,leaf,push});
export const levels = [
  {
    id:'001',name:'OPEN',subtitle:'はじめの一枚',chapter:'I / OPEN A POSSIBILITY',
    hint:'目の前のドアを、そっと押してみよう。',instruction:'右へ一歩。金色の蝶番を中心に、ドアが開きます。',
    cells:rectangle(2,2),walls:[[[0,1],[1,1]]],start:[0,0],goal:[1,0],
    doors:[door('A',[1,1],[0,-1],['R'])],
    proof:{concept:'push',required:['A:R'],explanation:'下への通路は壁。Aを右に押す1手が唯一の最短解。開いた葉は右下との境界に残る。'}
  },
  {
    id:'003',name:'SWING',subtitle:'道をひらく、道をふさぐ',chapter:'I / THE OTHER SIDE',
    hint:'開いたドアの向こうへ。少し、遠回り。',
    cells:[[1,0],[0,1],[1,1],[0,2],[1,2]],walls:[],start:[1,0],goal:[0,1],
    doors:[door('A',[1,1],[1,0],['D'])],
    proof:{concept:'barrier',required:['A:D'],explanation:'Aを下へ押すと左への辺が閉じる。そのまま左には行けず、下段を回って出口へ。',blockedAfter:{path:'D',action:'L',reason:'fixed'}}
  },
  {
    id:'005',name:'NOT YET',subtitle:'開けないという選択',chapter:'II / LEAVE IT CLOSED',
    hint:'すぐに開くドアが、正解とは限らない。',
    cells:rectangle(2,2),walls:[],start:[0,0],goal:[1,1],
    doors:[door('A',[1,1],[0,-1],['R']),door('B',[1,1],[0,1],['R'])],
    proof:{concept:'early-trap',required:['B:R'],leaveClosed:['A'],trap:'R',explanation:'正面Aを開けるとBの回転先を占有し、出口への道が永久に閉じる。下へ回りBを押す。Aは最後まで開けない。'}
  },
  {
    id:'009',name:'COME BACK',subtitle:'近づくために、遠ざかる',chapter:'II / TAKE THE LONG WAY',
    hint:'出口はすぐ隣。でも、この側からは押せない。',
    cells:[[0,0],[1,0],[0,1],[1,1],[1,2]],walls:[],start:[0,0],goal:[1,0],
    doors:[door('A',[1,1],[0,-1],['L']),door('B',[1,2],[0,-1],['R'])],
    proof:{concept:'away',required:['B:R'],leaveClosed:['A'],explanation:'隣の出口へ直進するとAの禁止側。まず出口から遠ざかり、下のBを押して上へ戻る。',blockedAfter:{path:'',action:'R',reason:'wrong-side'}}
  },
  {
    id:'011',name:'TWO WAYS',subtitle:'蝶番は、どちらにも',chapter:'III / WHICH WAY?',
    hint:'両側の矢印は、両側から押せるしるし。',
    cells:rectangle(4,2),walls:[],start:[3,0],goal:[0,0],
    doors:[door('A',[2,1],[0,-1],['R','L'])],
    proof:{concept:'bidirectional',required:['A:L'],explanation:'最短は左へ3手。Aを左に押すと左下への辺が閉じる。下を回る5手・開扉0枚も意図した自由な練習解。回り込めば右からも左からも実際に開けられ、どちらもクリア可能。ここでは開扉を強制しない。',allowZeroOpens:true}
  },
  {
    id:'012',name:'CHOOSE',subtitle:'残す壁を、選ぶ',chapter:'III / A CHOICE HAS A SHAPE',
    hint:'Bは、右へも左へも。先に開けたドアとの組み合わせを考えよう。',
    cells:rectangle(4,4),walls:[[[3,1],[4,1]],[[1,3],[1,4]],[[2,3],[2,4]]],start:[0,2],goal:[3,2],
    doors:[door('A',[2,2],[-1,0],['U']),door('B',[1,1],[0,1],['R','L']),door('C',[3,3],[-1,0],['D']),door('D',[1,1],[0,-1],['R','L']),door('E',[2,2],[0,1],['L'])],
    proof:{concept:'choice',required:['B:R'],trap:'UURLDDRUL',explanation:'最短は上からBを右に押し、右の出口へ。Dを右、Aを上に開いた局面では、Bを左に押すと最後の周回路を断つ。この9手の失敗例は最後のBまで復帰可能で、そこで初めて詰む。Bの左開きすべてが失敗するわけではなく、先行するドアとの組み合わせが問題。'}
  },
  {
    id:'018',name:'HINGE KNOT',subtitle:'蝶番の結び目',chapter:'IV / DOORS MEET DOORS',
    hint:'ひとつ開くと、もうひとつは開かない。二つの結び目をほどこう。',
    cells:[[0,0],[1,0],[0,1],[1,1],[1,2],[2,2],[3,2],[2,3],[3,3]],walls:[],start:[0,0],goal:[3,3],
    doors:[door('A',[1,1],[0,-1],['R']),door('B',[1,1],[0,1],['R']),door('C',[3,3],[0,-1],['R']),door('D',[3,3],[0,1],['R'])],
    proof:{concept:'interference',required:['B:R','D:R'],leaveClosed:['A','C'],trap:'R',additionalTraps:['DRDRR'],explanation:'AとB、CとDがそれぞれ同じ回転先を共有。AまたはCを先に開くと必須の相方が開かなくなる。B、Dの順で二つの結び目を通る。'}
  },
  {
    id:'020',name:'DOOOOOR',subtitle:'すべての選択が、道になる',chapter:'V / ONE LAST OPENING',
    hint:'目の前の一枚より、その先の道を。開けないドアも、解答です。',
    cells:[[0,0],[1,0],[0,1],[1,1],[1,2],[2,2],[3,2],[2,3],[3,3],[3,4],[2,4],[1,4],[0,4],[0,5],[1,5]],
    walls:[[[2,4],[3,4]]],start:[0,0],goal:[0,5],
    doors:[door('A',[1,1],[0,-1],['R','L']),door('B',[1,1],[0,1],['R']),door('C',[3,3],[0,-1],['R','L']),door('D',[3,3],[0,1],['R']),door('E',[1,5],[0,-1],['L']),door('F',[1,5],[0,1],['L'])],
    proof:{concept:'finale',required:['B:R','D:R','F:L'],leaveClosed:['A','C','E'],trap:'R',additionalTraps:['DRDRR','DRDRDRDLLL'],explanation:'二つの結び目をB→Dで抜け、下段を左へ戻る。最後はEを開くとFの左回転を塞ぐため、下へ回ってFを左に押す。逆向きの最後の結び目まで、三枚を閉じたまま残す。'}
  }
];
