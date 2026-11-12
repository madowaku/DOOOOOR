import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, transition, doorEdge, edgeKey, validateLevel, createSession, replay, stateKey } from '../src/engine.js';
import { analyze } from '../src/solver.js';
const square = (push=['R','L']) => ({id:'test',cells:[[0,0],[1,0],[0,1],[1,1]],walls:[],start:[0,0],goal:[1,1],doors:[{id:'A',hinge:[1,1],leaf:[0,-1],push}]});
test('push rotates 90 degrees around the SAME hinge; source state is immutable',()=>{
  const l=square(), s=initialState(l), before=JSON.stringify(s), r=transition(l,s,'R');
  assert.equal(r.opened,0); assert.deepEqual(r.state.p,[1,0]);
  assert.deepEqual(doorEdge(l.doors[0],r.state.doors[0]),[[1,1],[2,1]]);
  assert.equal(JSON.stringify(s),before); assert.equal(transition(l,r.state,'D').reason,'fixed');
  assert.equal(transition(l,r.state,'L').moved,true);
});
test('one-way rejects pulling; bidirectional swing follows push direction',()=>{
  const s={p:[1,0],doors:[null]};
  assert.equal(transition(square(['R']),s,'L').reason,'wrong-side');
  const l=square(), r=transition(l,s,'L');
  assert.deepEqual(doorEdge(l.doors[0],r.state.doors[0]),[[1,1],[0,1]]);
});
test('four leaf orientations and both normal pushes yield perpendicular unit edges',()=>{
  const cells=Array.from({length:16},(_,i)=>[i%4,Math.floor(i/4)]);
  for(const leaf of [[1,0],[-1,0],[0,1],[0,-1]]) for(const [action,v] of Object.entries({U:[0,-1],R:[1,0],D:[0,1],L:[-1,0]})){
    if(leaf[0]*v[0]+leaf[1]*v[1])continue;
    const midpoint=[2+leaf[0]/2,2+leaf[1]/2];
    const p=[Math.floor(midpoint[0]-v[0]/2),Math.floor(midpoint[1]-v[1]/2)];
    const l={id:'rot',cells,walls:[],start:p,goal:[0,0],doors:[{id:'A',hinge:[2,2],leaf,push:[action]}]};
    const r=transition(l,initialState(l),action); assert.equal(r.opened,0);
    assert.deepEqual(doorEdge(l.doors[0],r.state.doors[0]),[[2,2],[2+v[0],2+v[1]]]);
  }
});
test('destination static wall, solid cell, closed leaf, and opened leaf all obstruct swing',()=>{
  let l=square();l.walls=[[[1,1],[2,1]]];assert.equal(transition(l,initialState(l),'R').reason,'swing-wall');
  l=square();l.cells=l.cells.filter(c=>c.join()!=[1,1].join());l.goal=[0,1];assert.equal(transition(l,initialState(l),'R').reason,'swing-wall');
  l=square();l.doors.push({id:'B',hinge:[1,1],leaf:[1,0],push:['D']});
  assert.equal(transition(l,initialState(l),'R').reason,'swing-door');
  l.doors[1].leaf=[0,1];assert.equal(transition(l,{p:[0,0],doors:[null,'R']},'R').reason,'swing-door');
});
test('shared hinge is allowed; clearing an obstruction permits a previously blocked swing',()=>{
  const l=square();l.goal=[0,1];l.doors.push({id:'B',hinge:[1,1],leaf:[1,0],push:['D']});
  assert.equal(transition(l,initialState(l),'R').reason,'swing-door');
  assert.equal(transition(l,{p:[0,0],doors:[null,'D']},'R').opened,0);
});
test('undo/reset exactly restore immutable door orientation and do not record rejected moves',()=>{
  const l=square(), game=createSession(l), before=JSON.stringify(game.state);
  game.move('U');assert.equal(game.steps,0);game.move('R');assert.equal(game.steps,1);
  game.undo();assert.equal(JSON.stringify(game.state),before);assert.equal(game.steps,0);
  game.move('R');game.reset();assert.equal(JSON.stringify(game.state),before);assert.equal(game.steps,0);
});
test('BFS shortest route and dead state classification agree with replay',()=>{
  const l=square();l.walls=[[[0,1],[1,1]]];
  const a=analyze(l);assert.equal(a.solvable,false);assert.equal(a.viable.size,0);
  l.walls=[];const b=analyze(l);assert.equal(b.best.path,'DR');assert.equal(b.minimumOpens,0);
  assert.equal(replay(l,b.best.path).won,true);
});
test('level schema rejects malformed, overlapping and permanently wall-blocked doors',()=>{
  const l=square();assert.deepEqual(validateLevel(l),[]);
  l.doors.push({...l.doors[0],id:'B'});assert.ok(validateLevel(l).some(e=>e.includes('overlapping')));
  l.doors=[{id:'C',hinge:[1,1],leaf:[1,1],push:['R']}];assert.ok(validateLevel(l).length);
});
test('exhaustive reachable states preserve unique leaf edges and floor occupancy',()=>{
  const l=square();for(const node of analyze(l).nodes){
    const s=node.state;assert.ok(l.cells.some(c=>c.join()===s.p.join()));
    const keys=l.doors.map((d,i)=>edgeKey(...doorEdge(d,s.doors[i])));assert.equal(new Set(keys).size,keys.length);
    assert.ok(stateKey(s));
  }
});
