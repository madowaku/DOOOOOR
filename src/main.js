import './style.css';
import { levels } from './levels.js';
import { createSession, isWin, stateKey, DIRECTIONS, same } from './engine.js';
import { analyze, solve } from './solver.js';
import { renderBoard } from './render.js';
import { readSave, writeSave } from './storage.js';
import { sound } from './audio.js';

const app = document.querySelector('#app');
const save = readSave(levels.length), analyses = new Map();
let screen = 'title', index = 0, session, busyUntil = 0, message = '', pointer;
const unlocked = i => i === 0 || save.cleared.includes(i - 1) || save.cleared.includes(i);
const nextUncleared = () => { const i = levels.findIndex((_,i)=>!save.cleared.includes(i)); return i<0?0:i; };
const logo = `<span class="wordmark" aria-label="DOOOOOR">D<span class="letter-door">O</span><span class="letter-door">O</span><span class="letter-door">O</span><span class="letter-door">O</span><span class="letter-door">O</span>R</span>`;
function persist() { if (!writeSave(save)) message = 'このブラウザでは進行を保存できません。プレイは続けられます。'; }
function header() {
  return `<header class="masthead"><button class="brand" data-action="title" aria-label="タイトルへ">${logo}</button><div class="header-tools"><button class="icon-button" data-action="sound" aria-label="${save.muted?'音をオン':'音をオフ'}" aria-pressed="${!save.muted}">${save.muted?'♪ OFF':'♪ ON'}</button><button class="icon-button" data-action="help" aria-label="遊び方">?</button></div></header>`;
}
function render() {
  document.body.dataset.screen = screen;
  document.documentElement.classList.toggle('reduced', save.reduced);
  app.innerHTML = `${header()}<main id="main">${screen==='title'?title():screen==='select'?selection():game()}</main><footer class="footer"><span>ONE SWING. A NEW WAY.</span><span>ドアドアめぐり</span></footer>`;
}
function title() {
  return `<section class="title-screen"><div class="title-copy"><p class="eyebrow"><span class="small-line"></span> A PUZZLE ABOUT POSSIBILITIES</p><h1>${logo}</h1><p class="subtitle">ドアドアめぐり</p><p class="title-statement">ひらくたび、<br>道は変わる。</p><p class="intro">ドアが開くのは、一度だけ。<br>いつ、どちらへ。そして、開けないという選択。</p><div class="mobile-art"><img src="${import.meta.env.BASE_URL}art/door-atlas.webp" alt=""/></div><div class="title-actions"><button class="primary" data-action="start">${save.cleared.length?'つづきから':'はじめる'}<span>→</span></button><button class="text-button" data-action="select">ステージを選ぶ <span>↗</span></button></div><p class="edition">${String(levels.length).padStart(2,'0')} ROOMS <span>·</span> ${save.cleared.length ? `${save.cleared.length} / ${levels.length} CLEAR` : 'ひらめきと、蝶番の小さな迷路'}</p></div><div class="title-art"><img src="${import.meta.env.BASE_URL}art/door-atlas.webp" alt="青灰色の小さな迷路と、光の差す木のドア"/><div class="art-caption"><span>01 / THE ART OF OPENING</span><span>↳</span></div></div></section>`;
}
function selection() {
  return `<section class="selection"><p class="eyebrow">THE COLLECTION</p><h1>どのドアから？</h1><p class="muted">ひと部屋ずつ、その先へ。クリアした部屋は何度でも。</p><div class="level-grid">${levels.map((l,i)=>`<button class="level-card ${save.cleared.includes(i)?'complete':''}" data-stage="${i}" ${unlocked(i)?'':'disabled'}><span class="level-number">${l.id}</span><span class="level-name">${l.name}</span><span class="level-jp">${l.subtitle}</span><span class="level-status">${save.cleared.includes(i)?'✓ CLEAR':unlocked(i)?'→':'未解放'}</span></button>`).join('')}</div><button class="text-button" data-action="title">← タイトルへ</button></section>`;
}
function game() {
  const level = levels[index], won = isWin(level,session.state);
  const stuck = !analyses.get(index).viable.has(analyses.get(index).seen.get(stateKey(session.state)));
  return `<section class="game-screen"><div class="game-heading"><button class="text-button" data-action="select">← 部屋を選ぶ</button><span class="room-count">ROOM ${String(index+1).padStart(2,'0')} / ${String(levels.length).padStart(2,'0')}</span></div><div class="game-layout"><aside class="room-story"><p class="eyebrow">${level.chapter}</p><div class="room-id">${level.id}<span> /</span></div><h1>${level.name}</h1><p class="room-subtitle">${level.subtitle}</p><div class="story-rule"></div><p class="room-hint">${level.hint}</p><div class="desktop-notes"><p>一度だけ、90度。</p><p>開いたドアは、そのまま壁になる。</p><span>矢印 / WASD で移動<br>Z で戻す · R でやり直す</span></div></aside><div class="play-column"><div class="board-toolbar"><span><i class="live-dot"></i> ${won?'CLEAR':stuck?'UNDO AVAILABLE':'FIND YOUR WAY'}</span><span><b id="steps">${String(session.steps).padStart(2,'0')}</b> STEPS <span class="toolbar-divider">/</span> <b>${session.state.doors.filter(Boolean).length}</b> OPEN</span></div><div class="board-frame" id="board-frame">${renderBoard(level,session.state,{reduced:save.reduced})}</div><div class="board-legend"><span><i class="legend-hinge"></i> 蝶番</span><span><i class="legend-dash"></i> 開いた位置</span><span><i class="legend-exit"></i> 出口</span></div><div class="status ${won?'success':stuck?'trapped':''}" role="status" aria-live="polite">${won?`<span>✓</span> 道が、つながった。<small>${session.steps}手 · ${session.state.doors.filter(Boolean).length}枚を開いた</small>`:stuck?'この道は行き止まり。ひと手戻して、別の選択を。':message||level.instruction||'点線の先を見てから、ドアを押そう。'}</div><div class="game-actions"><button data-action="undo" ${session.steps?'':'disabled'}>↶ <span>ひと手戻す</span><kbd>Z</kbd></button><button data-action="restart">⟳ <span>やり直す</span><kbd>R</kbd></button><button data-action="hint">✧ <span>ヒント</span></button></div>${won?`<button class="primary next-button" data-action="next">${index===levels.length-1?'すべての部屋をめぐった':'次の部屋へ'}<span>→</span></button>`:`<div class="input-row"><p>スワイプ・隣のマスをタップ<br><span>または、方向ボタンで移動</span></p><div class="dpad" aria-label="移動ボタン"><button data-move="U" aria-label="上へ">↑</button><button data-move="L" aria-label="左へ">←</button><span aria-hidden="true">·</span><button data-move="R" aria-label="右へ">→</button><button data-move="D" aria-label="下へ">↓</button></div></div>`}</div></div></section>`;
}
function load(i) {
  if(!unlocked(i)) return;
  index=i; session=createSession(levels[i]); screen='game'; message=''; busyUntil=0;
  if(!analyses.has(i)) analyses.set(i,analyze(levels[i]));
  render(); window.scrollTo(0,0);
}
function move(action) {
  if(screen!=='game'||document.querySelector('dialog[open]')||performance.now()<busyUntil) return;
  const previous=session.state, result=session.move(action);
  if(!result.moved) {
    const messages = {'wall':'そこは壁。別の道を探そう。','fixed':'開いたドアは、もう動かせない。','wrong-side':'このドアは、反対側から押そう。','swing-wall':'回転する先に壁がある。','swing-door':'回転する先に、別のドアがある。'};
    message=messages[result.reason]||''; sound('blocked',save.muted); render(); return;
  }
  message='';
  if(isWin(levels[index],session.state)) { if(!save.cleared.includes(index)) { save.cleared.push(index); persist(); } sound('win',save.muted); }
  else sound(result.opened===undefined?'step':'open',save.muted);
  render();
  if(result.opened!==undefined) {
    busyUntil=performance.now()+(save.reduced?0:350);
  }
  document.querySelector('#board-frame').innerHTML=renderBoard(levels[index],session.state,{opened:result.opened,previous,reduced:save.reduced});
}
function help() {
  const dialog=document.createElement('dialog');
  dialog.innerHTML=`<form method="dialog"><div class="dialog-heading"><p class="eyebrow">A LITTLE GUIDE</p><button class="icon-button" aria-label="閉じる">×</button></div><h2>開くのは、一度だけ。</h2><p>人物を緑の出口へ。ドアに向かって進むと、蝶番を中心に90度回転します。</p><ol><li><b>点線を見る。</b> ドアは点線の位置に残り、新しい壁になります。</li><li><b>押す側を選ぶ。</b> 小さな矢印が押せる方向。両側にあれば、両方から押せます。</li><li><b>やり直しは何度でも。</b> 行き止まりでも「ひと手戻す」で、ドアごと元通り。</li></ol><p class="muted">スワイプ・隣のマスをタップ・方向ボタン・矢印 / WASD。Z：戻す、R：やり直す。</p><label class="setting"><input type="checkbox" id="reduced" ${save.reduced?'checked':''}> 動きを減らす</label><button class="primary">わかった <span>→</span></button></form>`;
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector('#reduced').onchange=e=>{save.reduced=e.target.checked;persist();document.documentElement.classList.toggle('reduced',save.reduced);};
  dialog.addEventListener('close',()=>{dialog.remove();render();},{once:true});
}
app.addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.stage!==undefined) return load(Number(b.dataset.stage));
  if(b.dataset.move) return move(b.dataset.move);
  switch(b.dataset.action) {
    case 'start':load(nextUncleared());break;
    case 'title':screen='title';busyUntil=0;render();break;
    case 'select':screen='select';busyUntil=0;render();break;
    case 'sound':save.muted=!save.muted;persist();render();if(!save.muted)sound('open',false);break;
    case 'help':help();break;
    case 'undo':if(session.undo()){message='ひと手、戻しました。';busyUntil=0;sound('undo',save.muted);render();}break;
    case 'restart':session.reset();message='はじめの位置から。';busyUntil=0;render();break;
    case 'next':if(index<levels.length-1)load(index+1);else{screen='select';render();}break;
    case 'hint':{
      const path=solve(levels[index],session.state);
      message=path===null?'いまの状態から出口には届きません。ひと手戻そう。':path.length?`${levels[index].hint} 次の一歩は${({U:'上',R:'右',D:'下',L:'左'})[path[0]]}。`:'この部屋はクリア！';render();break;
    }
  }
});
const keys={ArrowUp:'U',w:'U',ArrowRight:'R',d:'R',ArrowDown:'D',s:'D',ArrowLeft:'L',a:'L'};
addEventListener('keydown',e=>{
  if(screen!=='game'||document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey) return;
  const key=e.key.length===1?e.key.toLowerCase():e.key;
  if(keys[key]) {e.preventDefault();move(keys[key]);}
  if(key==='z')document.querySelector('[data-action="undo"]')?.click();
  if(key==='r')document.querySelector('[data-action="restart"]')?.click();
});
app.addEventListener('pointerdown',e=>{
  const board=e.target.closest('#board'); if(!board) return;
  pointer={x:e.clientX,y:e.clientY,id:e.pointerId,board};board.setPointerCapture(e.pointerId);
});
app.addEventListener('pointercancel',()=>pointer=null);
app.addEventListener('pointerup',e=>{
  if(!pointer||e.pointerId!==pointer.id) return;
  const {x,y,board}=pointer;pointer=null;
  const dx=e.clientX-x,dy=e.clientY-y;
  if(Math.max(Math.abs(dx),Math.abs(dy))>=18) return move(Math.abs(dx)>Math.abs(dy)?dx>0?'R':'L':dy>0?'D':'U');
  const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(board.getScreenCTM().inverse());
  const cell=[Math.floor(point.x/72),Math.floor(point.y/72)];
  const delta=[cell[0]-session.state.p[0],cell[1]-session.state.p[1]];
  const action=Object.keys(DIRECTIONS).find(k=>same(DIRECTIONS[k],delta)); if(action)move(action);
});
render();
