import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { levels } from '../src/levels.js';
import { analyze } from '../src/solver.js';
import { validateLevel, replay, transition, initialState, stateKey, edgeKey, doorEdge, hasFloor, isWall } from '../src/engine.js';
const reports=[];
for(const level of levels){
  assert.deepEqual(validateLevel(level),[],`${level.id}: schema`);
  const a=analyze(level); assert.ok(a.solvable,`${level.id}: solvable`);
  const witness=replay(level,a.best.path);assert.ok(witness.won);
  for(const required of level.proof.required??[])assert.ok(witness.openings.includes(required),`${level.id}: canonical ${required}`);
  for(const id of level.proof.leaveClosed??[])assert.equal(witness.state.doors[level.doors.findIndex(d=>d.id===id)],null,`${level.id}: leave ${id} closed`);
  if(!level.proof.allowZeroOpens)assert.ok(a.minimumOpens>0,`${level.id}: door-free shortcut`);
  let trap=null;
  if(level.proof.trap){
    const actions=level.proof.trap,failed=replay(level,actions),before=replay(level,actions.slice(0,-1));
    assert.equal(analyze(level,failed.state).solvable,false,`${level.id}: trap`);
    assert.equal(analyze(level,before.state).solvable,true,`${level.id}: last choice causes trap`);
    trap={actions,openings:failed.openings,solvable:false,lastChoiceDecisive:true};
  }
  if(level.proof.blockedAfter){const b=level.proof.blockedAfter;assert.equal(transition(level,replay(level,b.path).state,b.action).reason,b.reason);}
  const additionalTraps=(level.proof.additionalTraps??[]).map(actions=>{
    const failed=replay(level,actions),before=replay(level,actions.slice(0,-1));
    assert.equal(analyze(level,failed.state).solvable,false,`${level.id}: ${actions} traps`);
    assert.equal(analyze(level,before.state).solvable,true,`${level.id}: ${actions} last choice`);
    return {actions,openings:failed.openings,solvable:false,lastChoiceDecisive:true};
  });
  if(level.proof.concept==='away'){
    const distance=p=>Math.abs(p[0]-level.goal[0])+Math.abs(p[1]-level.goal[1]);
    assert.ok(distance(transition(level,initialState(level),a.best.path[0]).state.p)>distance(level.start));
  }
  const operationOutcomes={};
  for(const node of a.nodes){
    assert.ok(hasFloor(level,node.state.p));
    const edges=level.doors.map((d,i)=>doorEdge(d,node.state.doors[i]));
    assert.equal(new Set(edges.map(e=>edgeKey(...e))).size,edges.length,`${level.id}: overlapping leaves`);
    assert.ok(edges.every(e=>!isWall(level,e)),`${level.id}: leaf in wall`);
    for(const action of ['U','R','D','L']){
      const r=transition(level,node.state,action);
      if(r.opened!==undefined){const key=`${level.doors[r.opened].id}:${action}`;operationOutcomes[key]??={winningContinuation:false,deadContinuation:false};operationOutcomes[key][a.viable.has(a.seen.get(stateKey(r.state)))?'winningContinuation':'deadContinuation']=true;}
    }
  }
  const winConfigurations=a.wins.map(i=>a.nodes[i].state.doors);
  if(level.id==='012')for(const action of ['R','L'])assert.ok(operationOutcomes[`B:${action}`]?.winningContinuation && operationOutcomes[`B:${action}`]?.deadContinuation,`012: both B:${action} outcomes must be real`);
  if(level.id==='011')for(const action of ['R','L'])assert.ok(operationOutcomes[`A:${action}`]?.winningContinuation,`011: both directions reachable before winning`);
  const alwaysClosed=level.doors.filter((_,i)=>winConfigurations.every(ds=>!ds[i])).map(d=>d.id);
  const alwaysOpened=level.doors.filter((_,i)=>winConfigurations.every(ds=>ds[i])).map(d=>d.id);
  const report={id:level.id,name:level.name,solvable:true,shortestSteps:a.best.path.length,minimumDoorOpens:a.minimumOpens,canonical:a.best.path,canonicalOpenings:witness.openings,reachableStates:a.states,deadStates:a.states-a.viable.size,alwaysClosed,alwaysOpened,operationOutcomes,trap,explanation:level.proof.explanation,restrictions:level.doors.map(d=>({id:d.id,allowedPushes:d.push}))};
  report.additionalTraps=additionalTraps;
  reports.push(report);console.log(`${level.id} ${level.name.padEnd(12)} ${String(report.shortestSteps).padStart(2)} steps / ${report.minimumDoorOpens} min opens / ${report.reachableStates} states / ${report.canonical}`);
}
mkdirSync('docs/validation',{recursive:true});
writeFileSync('docs/validation/levels.json',JSON.stringify(reports,null,2)+'\n');
writeFileSync('docs/validation/LEVELS.md',`# 全${reports.length}問の検証レポート\n\nnpm run validate で再生成。U=上、R=右、D=下、L=左。手数は移動と開扉を兼ねる1歩で数え、壁への入力は数えない。最小開扉数は最短手数とは別に全到達状態から求める。\n\n| 面 | 名前 | 最短手数 | 最小開扉数 | 標準解 | 到達状態 |\n|---|---|---:|---:|---|---:|\n${reports.map(r=>`| ${r.id} | ${r.name} | ${r.shortestSteps} | ${r.minimumDoorOpens} | ${r.canonical} | ${r.reachableStates} |`).join('\n')}\n\n${reports.map(r=>`## ${r.id} ${r.name}\n\n${r.explanation}\n\n- 標準解の開扉順: ${r.canonicalOpenings.join(' → ')}\n- 全クリア状態で必ず開く: ${r.alwaysOpened.join(', ')||'なし'}\n- 全クリア状態で必ず閉じる: ${r.alwaysClosed.join(', ')||'なし'}\n- 開扉制限: ${r.restrictions.map(d=>`${d.id}=${d.allowedPushes.join('/')}`).join(', ')}\n- 意図的な失敗例: ${r.trap?`${r.trap.actions}。最後の1手の前はクリア可能、直後は不可能。UNDOで復帰できる。`:'なし（導入面）'}\n- 近道監査: ${r.minimumDoorOpens===0?'011は自由な両方向ドアの練習。5手の開扉0解を意図的に許可し、最短3手のA:Lと比較できる。':'開扉なしでは到達不可。全状態の最短路を採用し、標準解より短い解は存在しない。'}\n`).join('\n')}\n## スコープ\n\n優先8問のみ収録。002 / 004 / 006–008 / 010 / 013–017 / 019は未収録。005は「後で同じドアを開ける」課題ではなく、早い開扉が罠になる「最後まで閉じる」課題。012は単独ドアの二択ではなく、先に開けたドアと左右の回転方向の組み合わせ。人間による難易度・楽しさの評価は自動検証とは別。\n`);
