import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { levels } from '../../src/levels.js';
import { analyze } from '../../src/solver.js';
import { initialState, transition } from '../../src/engine.js';
const keys={U:'ArrowUp',R:'ArrowRight',D:'ArrowDown',L:'ArrowLeft'};
async function play(page,level,path,mobile,project){
  let state=initialState(level);
  for(const action of path){
    const result=transition(level,state,action);expect(result.moved).toBe(true);state=result.state;
    if(mobile)await page.locator(`[data-move="${action}"]`).click();else await page.keyboard.press(keys[action]);
    await expect(page.locator('#board')).toHaveAttribute('data-player',state.p.join(','));
    for(let i=0;i<level.doors.length;i++)await expect(page.locator(`[data-door="${level.doors[i].id}"]`)).toHaveAttribute('data-open',state.doors[i]||'closed');
    if(result.opened!==undefined){
      await page.waitForTimeout(370);
      if(project&&level.id==='020'&&level.doors[result.opened].id==='B')await page.screenshot({path:`docs/screenshots/${project}-020-open.png`,fullPage:true});
    }
  }
}
test('title → all eight rooms, undo, traps, persistence and actual screenshots',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const mobile=info.project.name!=='desktop';
  mkdirSync('docs/screenshots',{recursive:true});
  await page.goto('/');await expect(page).toHaveTitle(/DOOOOOR/);
  await expect(page.locator('h1')).toHaveText('DOOOOOR');
  await page.locator('.title-art img').evaluate(img=>img.decode());
  await page.screenshot({path:`docs/screenshots/${info.project.name}-title.png`,fullPage:true});
  await page.getByRole('button',{name:'ステージを選ぶ'}).click();
  await expect(page.locator('[data-stage="1"]')).toBeDisabled();
  await page.locator('[data-stage="0"]').click();
  await page.keyboard.press('ArrowRight');
  // Immediate undo during the opening: removes both animation and committed turn.
  await page.locator('[data-action="undo"]').click();
  await expect(page.locator('#board')).toHaveAttribute('data-player','0,0');
  await expect(page.locator('[data-door="A"]')).toHaveAttribute('data-open','closed');
  await page.waitForTimeout(400);
  await expect(page.locator('#board')).toHaveAttribute('data-player','0,0');
  for(let i=0;i<levels.length;i++){
    const level=levels[i];await expect(page.locator('.room-id')).toContainText(level.id);
    if(['005','009','011','012','018','020'].includes(level.id))await page.screenshot({path:`docs/screenshots/${info.project.name}-${level.id}.png`,fullPage:true});
    await play(page,level,analyze(level).best.path,mobile,info.project.name);
    await expect(page.getByRole('status')).toContainText('道が、つながった');
    await expect(page.locator('#steps')).toHaveText(String(analyze(level).best.path.length).padStart(2,'0'));
    await page.locator('[data-action="next"]').click();
  }
  await expect(page.locator('.level-card.complete')).toHaveCount(8);
  await page.reload();await page.getByRole('button',{name:'ステージを選ぶ'}).click();
  await expect(page.locator('.level-card.complete')).toHaveCount(8);
  for(const i of [2,5,6,7]){
    await page.locator(`[data-stage="${i}"]`).click();
    for(const trap of [levels[i].proof.trap,...(levels[i].proof.additionalTraps??[])]){
      await play(page,levels[i],trap,mobile);
      await expect(page.getByRole('status')).toContainText('行き止まり');
      await page.locator('[data-action="undo"]').click();
      await expect(page.getByRole('status')).not.toContainText('行き止まり');
      await page.locator('[data-action="restart"]').click();
      await expect(page.locator('#board')).toHaveAttribute('data-player',levels[i].start.join(','));
    }
    await page.locator('[data-action="select"]').click();
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('tap, swipe cancellation, settings, reduced motion, keyboard modal boundary',async({page},info)=>{
  await page.goto('/');await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="help"]').click();
  await page.locator('#reduced').check();await page.keyboard.press('ArrowRight');
  await expect(page.locator('#board')).toHaveAttribute('data-player','0,0');
  await page.getByRole('button',{name:'わかった'}).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  const point=await page.locator('#board').evaluate(svg=>{const p=new DOMPoint(108,36).matrixTransform(svg.getScreenCTM());return{x:p.x,y:p.y};});
  if(info.project.name==='desktop')await page.mouse.click(point.x,point.y);else await page.touchscreen.tap(point.x,point.y);
  await expect(page.getByRole('status')).toContainText('道が、つながった');
  await expect(page.locator('animateTransform')).toHaveCount(0);
  await page.locator('[data-action="next"]').click();
  const box=await page.locator('#board').boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+box.height/2+50);await page.mouse.up();
  await expect(page.locator('#board')).toHaveAttribute('data-player','1,1');
  await page.locator('#board').dispatchEvent('pointercancel');
  await page.locator('[data-action="sound"]').click();await expect(page.locator('[data-action="sound"]')).toHaveText('♪ OFF');
  await page.reload();await expect(page.locator('[data-action="sound"]')).toHaveText('♪ OFF');
  await expect(page.locator('html')).toHaveClass('reduced');
});
test('corrupt storage and small landscape stay usable',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('dooooor.v1','{broken'));
  await page.setViewportSize({width:667,height:375});await page.goto('/');
  await page.locator('[data-action="start"]').click();
  await expect(page.locator('#board')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.keyboard.press('ArrowRight');await expect(page.getByRole('status')).toContainText('道が、つながった');
});
