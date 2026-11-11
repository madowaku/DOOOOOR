import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser', fullyParallel:false, workers:1, timeout:90000,
  use:{baseURL:'http://127.0.0.1:5183',trace:'retain-on-failure'},
  webServer:{command:'npm run dev -- --port 5183 --strictPort',url:'http://127.0.0.1:5183',reuseExistingServer:!process.env.CI},
  projects:[
    {name:'desktop',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},
    {name:'mobile',use:{browserName:'chromium',viewport:{width:360,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:2}},
    {name:'webkit-mobile',use:{browserName:'webkit',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}}
  ]
});
