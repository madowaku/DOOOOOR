import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/levels.js';
import {analyze} from '../src/solver.js';
import {measureLevel} from '../scripts/level-metrics.js';
import {compileLevel,transition,replay,createSession} from '../src/engine.js';

for(const id of ['005','012','018','020'])test(`${id}: designed decisions are necessary across the full state graph`,()=>{
 const l=levels.find(l=>l.id===id),m=measureLevel(l),a=analyze(l);
 assert.ok(a.solvable);
 for(const operation of l.proof.requiredInEveryWin){
  const [id,direction]=operation.split(':'),d=l.doors.findIndex(d=>d.id===id);
  assert.ok(a.wins.every(i=>a.nodes[i].state.doors[d]===direction));
  const broken=structuredClone(l);broken.doors[d].push=broken.doors[d].push.filter(a=>a!==direction);
  assert.equal(analyze(broken).solvable,false,`disabling ${operation} must destroy every solution`);
 }
 for(const[field,collection]of [['delayed','delayed'],['choice','choices'],['closedTrap','traps']]){
  const expected=l.proof[field];if(!expected)continue;
  assert.ok(m[collection].some(t=>t.door===expected.door&&t.path===expected.path));
  if(field==='closedTrap')assert.ok(m.closed.includes(expected.door));
  const before=replay(l,expected.path.slice(0,-1)),after=replay(l,expected.path);
  assert.equal(analyze(l,before.state).solvable,true);
  assert.equal(analyze(l,after.state).solvable,false);
  const session=createSession(l);for(const action of expected.path)session.move(action);session.undo();
  assert.deepEqual(session.state,before.state);
 }
 if(id==='018')assert.deepEqual(m.sequence,['A:D','B:L','C:D','E:L']);
 if(id==='020')assert.ok(m.delayed.length&&m.choices.length&&m.traps.some(t=>m.closed.includes(t.door)));
});

test('every authored state and input agrees between indexed solver and raw runtime',()=>{
 for(const l of levels){const compiled=compileLevel(l);for(const {state}of analyze(l).nodes)for(const action of ['U','R','D','L'])assert.deepEqual(transition(l,state,action),transition(compiled,state,action),l.id);}
});
