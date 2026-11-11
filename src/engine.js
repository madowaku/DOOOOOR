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
export const doorEdge = (door, open) => [door.hinge, add(door.hinge, open ? DIRECTIONS[open] : door.leaf)];
export const isWall = (level, edge) => edgeCells(edge).some(p => !hasFloor(level, p))
  || (level.wallSet ? level.wallSet.has(edgeKey(...edge)) : level.walls.some(e => edgeKey(...e) === edgeKey(...edge)));

/** A push waits outside the swept quarter-cell, then follows the leaf through the vacated edge. */
export function transition(level, state, action) {
  const delta = DIRECTIONS[action];
  const reject = reason => ({ state, moved: false, reason });
  if (!delta || isWin(level, state)) return reject('finished');
  const target = add(state.p, delta);
  const crossing = between(state.p, target);
  if (!hasFloor(level, target) || isWall(level, crossing)) return reject('wall');
  const index = level.doors.findIndex((door, i) => edgeKey(...doorEdge(door, state.doors[i])) === edgeKey(...crossing));
  if (index < 0) return { state: { p: target, doors: [...state.doors] }, moved: true };
  const door = level.doors[index];
  if (state.doors[index]) return reject('fixed');
  if (!door.push.includes(action)) return reject('wrong-side');
  const destination = [door.hinge, add(door.hinge, delta)];
  // All leaves/walls lie on unit grid edges. A swept quarter-disk is inside the
  // destination cell: only its initial/final edges can intersect another edge.
  if (isWall(level, destination)) return reject('swing-wall');
  if (level.doors.some((other, i) => i !== index && edgeKey(...doorEdge(other, state.doors[i])) === edgeKey(...destination))) return reject('swing-door');
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
    const edge = doorEdge(door, null), key = edgeKey(...edge);
    if (isWall(level, edge) || occupied.has(key)) errors.push(`${door.id}: overlapping closed leaf`);
    occupied.add(key);
    if (![1, 2].includes(door.push.length) || new Set(door.push).size !== door.push.length || door.push.some(a => !DIRECTIONS[a] || DIRECTIONS[a][0] * door.leaf[0] + DIRECTIONS[a][1] * door.leaf[1] !== 0)) errors.push(`${door.id}: invalid push side`);
    if (door.push.every(a => isWall(level, [door.hinge, add(door.hinge, DIRECTIONS[a])])) ) errors.push(`${door.id}: no physically possible swing`);
  }
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
