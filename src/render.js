import { add, DIRECTIONS, doorEdge, between, edgeKey, hasFloor, isWall } from './engine.js';
const S = 72;
const line = (a, b, attrs = '') => `<line x1="${a[0] * S}" y1="${a[1] * S}" x2="${b[0] * S}" y2="${b[1] * S}" ${attrs}/>`;
const angle = v => Math.atan2(v[1], v[0]) * 180 / Math.PI;
export function renderBoard(level, state, { opened, previous, reduced = false } = {}) {
  const width = Math.max(...level.cells.map(c => c[0])) + 1, height = Math.max(...level.cells.map(c => c[1])) + 1;
  const walls = new Map(level.walls.map(e => [edgeKey(...e), e]));
  for (const p of level.cells) for (const d of Object.values(DIRECTIONS)) {
    const q = add(p, d); if (!hasFloor(level, q)) { const e = between(p, q); walls.set(edgeKey(...e), e); }
  }
  const floor = level.cells.map(([x,y]) => `<rect x="${x*S+2}" y="${y*S+2}" width="68" height="68" rx="3" fill="${(x+y)%2 ? '#d9d6c9' : '#e2ded1'}"/><path d="M${x*S+9} ${y*S+8}h54" stroke="#fff" opacity=".23"/>`).join('');
  const hints = level.doors.map((door, i) => {
    if (state.doors[i]) return '';
    const [hx,hy] = door.hinge.map(n=>n*S);
    return door.push.map(a => {
      const v = DIRECTIONS[a], end = add(door.hinge,v), blocked = isWall(level,[door.hinge,end]) || level.doors.some((d,j)=>j!==i && edgeKey(...doorEdge(d,state.doors[j]))===edgeKey(door.hinge,end));
      const from = add(door.hinge,door.leaf), cross = door.leaf[0]*v[1]-door.leaf[1]*v[0];
      return `<path d="M${from[0]*S} ${from[1]*S} A72 72 0 0 ${cross>0?1:0} ${end[0]*S} ${end[1]*S}" fill="none" stroke="${blocked?'#a06c63':'#b08048'}" stroke-width="1.5" stroke-dasharray="3 5" opacity=".55"/>${line(door.hinge,end,`stroke="${blocked?'#9b625a':'#b08048'}" stroke-width="3" stroke-dasharray="3 6" opacity=".45"`)}<path d="M-4 -4 L0 1 L4 -4" fill="none" stroke="#70532e" stroke-width="2" transform="translate(${hx+door.leaf[0]*S*.5-v[0]*13} ${hy+door.leaf[1]*S*.5-v[1]*13}) rotate(${angle(v)-90})"/>`;
    }).join('');
  }).join('');
  const leafs = level.doors.map((door,i) => {
    const open = state.doors[i], a = angle(open ? DIRECTIONS[open] : door.leaf), [hx,hy] = door.hinge.map(n=>n*S);
    let anim = '';
    if (opened === i && previous && !reduced) {
      const start = angle(door.leaf), diff = ((a-start+540)%360)-180;
      anim = `<animateTransform attributeName="transform" type="rotate" from="${start}" to="${start+diff}" dur="0.24s" fill="freeze"/>`;
    }
    return `<g class="door" data-door="${door.id}" data-open="${open||'closed'}" transform="translate(${hx} ${hy})"><g transform="rotate(${a})">${anim}<rect x="3" y="-4" width="65" height="10" rx="2" fill="#18242c" opacity=".26" transform="translate(1 3)"/><rect x="2" y="-4" width="67" height="8" rx="2" fill="${open?'#95653e':'url(#wood)'}" stroke="#76502f" stroke-width="1.3"/><path d="M8 -2H63" stroke="#f7d49d" opacity=".7"/><circle cx="57" cy="0" r="2.7" fill="#ffe0a0"/>${open?'<path d="M54 -2l3 3 5-4" fill="none" stroke="#fff0bd" stroke-width="1.5"/>':''}</g><circle r="6" fill="#dfb66c" stroke="#735432" stroke-width="2"/><circle r="2" fill="#fff0b9"/><text x="${door.leaf[0]*29-7}" y="${door.leaf[1]*29-10}" class="door-label">${door.id}</text></g>`;
  }).join('');
  const [gx,gy]=level.goal.map(n=>n*S+36), [px,py]=state.p.map(n=>n*S+36);
  const win = state.p[0]===level.goal[0] && state.p[1]===level.goal[1];
  const old = previous?.p.map(n=>n*S+36);
  const walk = old && !reduced ? `<animateTransform attributeName="transform" type="translate" values="${old.join(' ')};${old.join(' ')};${px} ${py}" keyTimes="0;${opened===undefined?'.01':'.7'};1" dur="${opened===undefined?'.1':'.35'}s" fill="freeze"/>` : '';
  return `<svg id="board" role="img" aria-label="ステージ ${level.id} の盤面。ドアの点線は開いたあとの位置です。" viewBox="-20 -20 ${width*S+40} ${height*S+40}" data-player="${state.p.join(',')}">
    <defs><linearGradient id="wood" x2="0" y2="1"><stop stop-color="#f1c789"/><stop offset="1" stop-color="#b97d44"/></linearGradient><radialGradient id="glow"><stop stop-color="#f5cc78" stop-opacity=".38"/><stop offset="1" stop-color="#f5cc78" stop-opacity="0"/></radialGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="3" flood-color="#071018" flood-opacity=".35"/></filter></defs>
    <g filter="url(#shadow)">${floor}</g>
    <circle cx="${gx}" cy="${gy}" r="55" fill="url(#glow)"/>
    <g transform="translate(${gx} ${gy})" class="exit"><path d="M-13 16V-16h26v32" fill="#648b78" stroke="#3f6958" stroke-width="2"/><path d="M-6 7l7-7-7-7M0 0h17" fill="none" stroke="#eaffd8" stroke-width="2.5"/><path d="M-18 20h36" stroke="#4c7863" stroke-width="2"/></g>
    ${hints}<g stroke-linecap="round">${[...walls.values()].map(e=>line(...e,'stroke="#172833" stroke-width="12"')).join('')}${[...walls.values()].map(e=>line(...e,'stroke="#3e5666" stroke-width="8"')).join('')}${[...walls.values()].map(e=>line(...e,'stroke="#6b8090" stroke-width="1.2" opacity=".55"')).join('')}</g>${leafs}
    <g class="player ${win?'arrived':''}" transform="translate(${px} ${py})" data-testid="player">${walk}<ellipse cy="7" rx="13" ry="10" fill="#17252e" opacity=".25"/><path d="M-12 11Q-15-7 0-9Q15-7 12 11Z" fill="#243e50" stroke="#102533" stroke-width="2"/><circle cy="-6" r="9" fill="#fff4d3" stroke="#ad8f65" stroke-width="1.5"/><path d="M-5 5l10 0" stroke="#e5bd74" stroke-width="3" stroke-linecap="round"/></g>
  </svg>`;
}
