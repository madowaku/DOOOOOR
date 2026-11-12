import { analyze } from '../src/solver.js';
import { validateLevel, DIRECTIONS } from '../src/engine.js';

/** Design evidence is computed over all goal states / viable prefixes, not one witness. */
export function measureLevel(level) {
  if(validateLevel(level).length)return null;
  const a=analyze(level);if(!a.best)return null;
  const required=level.doors.map((d,i)=>({id:d.id,i,bi:d.push.length===2,values:[...new Set(a.wins.map(j=>a.nodes[j].state.doors[i]))]})).filter(d=>!d.values.includes(null));
  const traps=[];
  a.links.forEach((links,i)=>{
    if(!a.viable.has(i))return;
    for(const j of links){
      if(a.viable.has(j))continue;
      const from=a.nodes[i],to=a.nodes[j],di=to.state.doors.findIndex((d,k)=>d!==from.state.doors[k]);
      if(di>=0)traps.push({door:level.doors[di].id,action:to.state.doors[di],path:from.path+to.state.doors[di],prior:from.openings});
    }
  });
  const choices=required.filter(d=>d.bi&&d.values.length===1).flatMap(d=>traps.filter(t=>t.door===d.id&&t.action!==d.values[0]).map(t=>({...t,correct:d.values[0]})));
  const delayed=required.flatMap(d=>traps.filter(t=>t.door===d.id&&d.values.includes(t.action)&&t.prior.length===0));
  const closed=level.doors.filter((_,i)=>a.wins.every(j=>a.nodes[j].state.doors[i]===null)).map(d=>d.id);
  const order=[];
  for(const first of required)for(const second of required)if(first.i!==second.i&&[...a.viable].every(j=>!a.nodes[j].state.doors[second.i]||a.nodes[j].state.doors[first.i]))order.push([first.id,second.id]);
  let p=[...level.start];const visited=new Set([p.join()]);
  for(const action of a.best.path){p=p.map((n,i)=>n+DIRECTIONS[action][i]);visited.add(p.join());}
  return {steps:a.best.path.length,minimumOpens:a.minimumOpens,path:a.best.path,sequence:a.best.openings,required,choices,delayed,closed,order,repeats:a.best.path.length+1-visited.size,states:a.states,traps};
}
