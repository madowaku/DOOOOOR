/** Unit-length grid edges. Coordinates are grid vertices, cells use their top-left corner. */
export const DIRECTIONS = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0] };
export const pointKey = ([x, y]) => `${x},${y}`;
export const same = (a, b) => a[0] === b[0] && a[1] === b[1];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const edgeKey = (a, b) => [pointKey(a), pointKey(b)].sort().join('|');
export const edgeCells = ([a, b]) => a[0] === b[0]
  ? [[a[0] - 1, Math.min(a[1], b[1])], [a[0], Math.min(a[1], b[1])]]
  : [[Math.min(a[0], b[0]), a[1] - 1], [Math.min(a[0], b[0]), a[1]]];
export const between = (a, b) => a[0] !== b[0]
  ? [[Math.max(a[0], b[0]), a[1]], [Math.max(a[0], b[0]), a[1] + 1]]
  : [[a[0], Math.max(a[1], b[1])], [a[0] + 1, Math.max(a[1], b[1])]];
export const initialState = level => ({ p: [...level.start], doors: level.doors.map(() => null) });
export const stateKey = state => `${pointKey(state.p)}:${state.doors.map(d => d ?? '-').join('')}`;
export const isWin = (level, state) => same(level.goal, state.p);
export const hasFloor = (level, p) => level.floorSet ? level.floorSet.has(pointKey(p)) : level.cells.some(c => same(c, p));
export const scale = (p,n) => p.map(v=>v*n);
export const doorEdge = (door, open) => [door.hinge, add(door.hinge, scale(open ? DIRECTIONS[open] : door.leaf,door.length??1))];
export const doorEdges = (door, open) => {
  const v=open?DIRECTIONS[open]:door.leaf;
  return Array.from({length:door.length??1},(_,i)=>[add(door.hinge,scale(v,i)),add(door.hinge,scale(v,i+1))]);
};
export function leavesCross(a,b){
  const [p,q]=doorEdge(a,null),[r,s]=doorEdge(b,null);
  if(p[0]===q[0]&&r[1]===s[1])return p[0]>Math.min(r[0],s[0])&&p[0]<Math.max(r[0],s[0])&&r[1]>Math.min(p[1],q[1])&&r[1]<Math.max(p[1],q[1]);
  if(p[1]===q[1]&&r[0]===s[0])return leavesCross(b,a);
  return false;
}
export const isWall = (level, edge) => edgeCells(edge).some(p => !hasFloor(level, p))
  || (level.wallSet ? level.wallSet.has(edgeKey(...edge)) : level.walls.some(e => edgeKey(...e) === edgeKey(...edge)));

/** Exact quarter-disk sweep on integer unit edges. Tip-only contact is allowed. */
export function sweepEdges(door, action) {
  const n=door.length??1,u=door.leaf,v=DIRECTIONS[action],at=(a,b)=>add(door.hinge,add(scale(u,a),scale(v,b))),edges=[];
  for(let a=0;a<=n;a++)for(let b=0;b<n;b++){
    if(a*a+b*b<n*n)edges.push([at(a,b),at(a,b+1)]);
    if(a*a+b*b<n*n)edges.push([at(b,a),at(b+1,a)]);
  }
  return edges;
}

export function swingCollision(level,state,index,action) {
  if(level.geometry){
    const swing=level.geometry[index].swings[action];
    if(swing.wall)return 'swing-wall';
    if(level.geometry.some((g,i)=>i!==index&&g.edges[state.doors[i]??'-'].some(k=>swing.keys.has(k))))return 'swing-door';
    return null;
  }
  const door=level.doors[index],sweep=sweepEdges(door,action);
  if(sweep.some(e=>isWall(level,e)))return 'swing-wall';
  const swept=new Set(sweep.map(e=>edgeKey(...e)));
  if(level.doors.some((d,i)=>i!==index&&doorEdges(d,state.doors[i]).some(e=>swept.has(edgeKey(...e)))))return 'swing-door';
  return null;
}

/** Immutable per-analysis geometry index; the reducer and collision rules remain shared. */
export function compileLevel(level){
  const compiled={...level,floorSet:new Set(level.cells.map(pointKey)),wallSet:new Set(level.walls.map(e=>edgeKey(...e)))};
  compiled.geometry=level.doors.map(door=>({
    edges:Object.fromEntries(['-',...Object.keys(DIRECTIONS)].map(a=>[a,doorEdges(door,a==='-'?null:a).map(e=>edgeKey(...e))])),
    swings:Object.fromEntries(door.push.map(a=>{const sweep=sweepEdges(door,a);return[a,{wall:sweep.some(e=>isWall(compiled,e)),keys:new Set(sweep.map(e=>edgeKey(...e)))}];}))
  }));
  return compiled;
}

/** A push waits outside the swept quarter-disk, then crosses the vacated unit edge. */
export function transition(level, state, action) {
  const delta = DIRECTIONS[action];
  const reject = reason => ({ state, moved: false, reason });
  if (!delta || isWin(level, state)) return reject('finished');
  const target = add(state.p, delta);
  const crossing = between(state.p, target);
  if (!hasFloor(level, target) || isWall(level, crossing)) return reject('wall');
  const crossingKey=edgeKey(...crossing);
  const index = level.geometry?level.geometry.findIndex((g,i)=>g.edges[state.doors[i]??'-'].includes(crossingKey))
    :level.doors.findIndex((door, i) => doorEdges(door, state.doors[i]).some(e=>edgeKey(...e) === crossingKey));
  if (index < 0) return { state: { p: target, doors: [...state.doors] }, moved: true };
  const door = level.doors[index];
  if (state.doors[index]) return reject('fixed');
  if (!door.push.includes(action)) return reject('wrong-side');
  const collision=swingCollision(level,state,index,action);
  if(collision)return reject(collision);
  const doors = [...state.doors];
  doors[index] = action;
  return { state: { p: target, doors }, moved: true, opened: index };
}

export function replay(level, actions, from = initialState(level)) {
  let state = from;
  const openings = [];
  for (const action of actions) {
    const result = transition(level, state, action);
    if (!result.moved) throw new Error(`${level.id}: invalid ${action} (${result.reason})`);
    if (result.opened !== undefined) openings.push(`${level.doors[result.opened].id}:${action}`);
    state = result.state;
  }
  return { state, openings, won: isWin(level, state) };
}

export function validateLevel(level) {
  const errors = [];
  if (!level.cells.length || new Set(level.cells.map(pointKey)).size !== level.cells.length) errors.push('duplicate/empty cells');
  if (level.cells.some(p => p.length !== 2 || p.some(n => !Number.isInteger(n) || n < 0))) errors.push('invalid cells');
  if (!hasFloor(level, level.start) || !hasFloor(level, level.goal) || same(level.start, level.goal)) errors.push('invalid endpoints');
  const occupied = new Set();
  if (new Set(level.doors.map(d => d.id)).size !== level.doors.length) errors.push('duplicate door IDs');
  for (const wall of level.walls) {
    if (wall.length !== 2 || wall.flat().some(n => !Number.isInteger(n)) || Math.abs(wall[0][0] - wall[1][0]) + Math.abs(wall[0][1] - wall[1][1]) !== 1) errors.push('invalid wall');
  }
  for (const door of level.doors) {
    if (!Object.values(DIRECTIONS).some(d => same(d, door.leaf)) || door.hinge.some(n => !Number.isInteger(n))) { errors.push(`${door.id}: invalid geometry`); continue; }
    if(![1,2].includes(door.length??1)){errors.push(`${door.id}: invalid length`);continue;}
    for(const edge of doorEdges(door,null)){
      const key=edgeKey(...edge);
      if(isWall(level,edge)||occupied.has(key))errors.push(`${door.id}: overlapping closed leaf`);
      occupied.add(key);
    }
    if (![1, 2].includes(door.push.length) || new Set(door.push).size !== door.push.length || door.push.some(a => !DIRECTIONS[a] || DIRECTIONS[a][0] * door.leaf[0] + DIRECTIONS[a][1] * door.leaf[1] !== 0)) errors.push(`${door.id}: invalid push side`);
    if(door.push.every(a=>!DIRECTIONS[a]||sweepEdges(door,a).some(e=>isWall(level,e)))) errors.push(`${door.id}: no physically possible swing`);
  }
  for(let i=0;i<level.doors.length;i++)for(let j=i+1;j<level.doors.length;j++)if(leavesCross(level.doors[i],level.doors[j]))errors.push('crossing closed leaves');
  return errors;
}

/** History stores immutable states; rejected moves never create a turn. */
export function createSession(level) {
  let state = initialState(level), history = [];
  return {
    get state() { return state; }, get steps() { return history.length; },
    move(action) { const result = transition(level, state, action); if (result.moved) { history.push(state); state = result.state; } return result; },
    undo() { if (!history.length) return false; state = history.pop(); return true; },
    reset() { state = initialState(level); history = []; }
  };
}
