import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition,doorEdges,validateLevel,compileLevel,createSession} from '../src/engine.js';
import {analyze} from '../src/solver.js';
const fixture=()=>({id:'long',cells:Array.from({length:25},(_,i)=>[i%5,Math.floor(i/5)]),walls:[],start:[1,0],goal:[4,4],doors:[{id:'A',hinge:[2,2],leaf:[0,-1],length:2,push:['R','L']}]});
test('either half pushes the same rigid two-edge leaf; both final edges block walking',()=>{
 const l=fixture();
 for(const y of [0,1]){const r=transition(l,{p:[1,y],doors:[null]},'R');assert.equal(r.opened,0);assert.deepEqual(r.state.p,[2,y]);assert.deepEqual(doorEdges(l.doors[0],r.state.doors[0]),[[[2,2],[3,2]],[[3,2],[4,2]]]);}
 for(const x of [2,3])assert.equal(transition(l,{p:[x,1],doors:['R']},'D').reason,'fixed');
 const left=transition(l,{p:[2,0],doors:[null]},'L');assert.equal(left.opened,0);assert.deepEqual(doorEdges(l.doors[0],'L'),[[[2,2],[1,2]],[[1,2],[0,2]]]);
});
test('sweep catches interior walls and solid cells, not only destination edges',()=>{
 const l=fixture();l.walls=[[[3,0],[3,1]]];assert.equal(transition(l,initialState(l),'R').reason,'swing-wall');
 l.walls=[[[3,2],[4,2]]];assert.equal(transition(l,initialState(l),'R').reason,'swing-wall');
 l.walls=[];l.cells=l.cells.filter(c=>c.join()!=='3,0');assert.equal(transition(l,initialState(l),'R').reason,'swing-wall');
});
test('sweep catches closed and opened leaves inside the quarter-disk',()=>{
 const l=fixture();l.doors.push({id:'B',hinge:[3,1],leaf:[0,1],push:['R']});
 assert.equal(transition(l,initialState(l),'R').reason,'swing-door');
 l.doors[1].leaf=[1,0];assert.equal(transition(l,{p:l.start,doors:[null,'D']},'R').reason,'swing-door');
});
test('walls beyond the circular sweep and pure tip contact do not over-block',()=>{
 const l=fixture();l.walls=[[[4,0],[4,1]],[[4,1],[4,2]]];assert.equal(transition(l,initialState(l),'R').opened,0);
});
test('schema rejects crossing interiors, overlaps on the far half, and invalid lengths',()=>{
 const l=fixture();l.doors.push({id:'B',hinge:[1,1],leaf:[1,0],length:2,push:['D']});assert.ok(validateLevel(l).includes('crossing closed leaves'));
 l.doors[1]={id:'B',hinge:[2,0],leaf:[0,1],push:['R']};assert.ok(validateLevel(l).some(s=>s.includes('overlapping')));
 l.doors.pop();l.doors[0].length=3;assert.ok(validateLevel(l).some(s=>s.includes('invalid length')));
});
test('indexed BFS and raw UI reducer agree for all reachable long-door states',()=>{
 const l=fixture(),compiled=compileLevel(l);
 for(const {state}of analyze(l).nodes)for(const action of ['U','R','D','L'])assert.deepEqual(transition(compiled,state,action),transition(l,state,action));
 const s=createSession(l),start=structuredClone(s.state);s.move('R');s.undo();assert.deepEqual(s.state,start);s.move('R');s.reset();assert.deepEqual(s.state,start);
});
