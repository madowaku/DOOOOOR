import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/levels.js';
import { analyze } from '../src/solver.js';
import { DIRECTIONS } from '../src/engine.js';

test('009 requires a genuine perimeter detour despite adjacent start and exit',()=>{
  const level=levels.find(l=>l.id==='009'),a=analyze(level);
  assert.equal(Math.abs(level.start[0]-level.goal[0])+Math.abs(level.start[1]-level.goal[1]),1);
  assert.ok(a.best.path.length>=11);
  let p=[...level.start],furthest=0;
  for(const action of a.best.path){p=p.map((n,i)=>n+DIRECTIONS[action][i]);furthest=Math.max(furthest,Math.abs(p[0]-level.goal[0])+Math.abs(p[1]-level.goal[1]));}
  assert.ok(furthest>=5);
});

test('011 cannot skip either bidirectional door or the opposite push direction',()=>{
  const level=levels.find(l=>l.id==='011'),a=analyze(level);
  assert.ok(a.solvable);
  for(const i of a.wins)assert.deepEqual(a.nodes[i].state.doors,['R','L']);
  // Negative controls: disabling either essential operation destroys solvability.
  for(const id of ['A','B']){
    const broken=structuredClone(level),d=broken.doors.find(d=>d.id===id);
    d.push=d.push.filter(a=>a!==(id==='A'?'R':'L'));
    assert.equal(analyze(broken).solvable,false);
  }
});
