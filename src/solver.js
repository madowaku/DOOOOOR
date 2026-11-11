import { DIRECTIONS, initialState, stateKey, isWin, transition, pointKey, edgeKey } from './engine.js';

/** Exhaustively enumerates reachable states; no animation/UI or second physics implementation. */
export function analyze(level, from = initialState(level)) {
  level = { ...level, floorSet: new Set(level.cells.map(pointKey)), wallSet: new Set(level.walls.map(e=>edgeKey(...e))) };
  const nodes = [{ state: from, path: '', openings: [] }], seen = new Map([[stateKey(from), 0]]);
  const wins = [], links = [];
  for (let head = 0; head < nodes.length; head++) {
    const node = nodes[head]; links[head] = [];
    if (isWin(level, node.state)) { wins.push(head); continue; }
    for (const action of Object.keys(DIRECTIONS)) {
      const result = transition(level, node.state, action);
      if (!result.moved) continue;
      const key = stateKey(result.state);
      if (!seen.has(key)) {
        seen.set(key, nodes.length);
        nodes.push({ state: result.state, path: node.path + action, openings: result.opened === undefined ? node.openings : [...node.openings, `${level.doors[result.opened].id}:${action}`] });
      }
      links[head].push(seen.get(key));
    }
  }
  const reverse = nodes.map(() => []);
  links.forEach((next, i) => next.forEach(j => reverse[j].push(i)));
  const viable = new Set(wins), queue = [...wins];
  for (let i = 0; i < queue.length; i++) for (const prev of reverse[queue[i]]) if (!viable.has(prev)) { viable.add(prev); queue.push(prev); }
  const best = wins.length ? nodes[wins[0]] : null;
  const minimumOpens = wins.length ? Math.min(...wins.map(i => nodes[i].state.doors.filter(Boolean).length)) : null;
  return { nodes, seen, viable, wins, best, minimumOpens, solvable: !!best, states: nodes.length, links };
}

export function solve(level, from) { return analyze(level, from).best?.path ?? null; }
