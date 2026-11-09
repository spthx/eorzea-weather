const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const listeners = new Map();
let ids = [], timer, refreshes = 0, typhoons = 0, locations = 0;
const stations = Array.from({length:5},(_,i)=>({id:String(44132+i),stationName:'地点'+i,temperature:i+10}));
const context = vm.createContext({
  appState:{stations,current:stations[0],busy:false,rankingKind:'temperature'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}},
  document:{hidden:false,documentElement:{dataset:{motion:'full'}},getElementById:()=>({textContent:''}),querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners.set(name,fn),dispatchEvent:event=>listeners.get(event.type)?.(event)},
  motionPreference:{matches:false},motionEnabled:true,applyMotionPreference:()=>{},
  readFavorites:()=>[...ids],writeFavorites:next=>{ids=next;return true;},renderFavorites:()=>{},
  stationById:id=>stations.find(s=>s.id===id),selectWeatherStation:()=>{},
  renderRanking:()=>{},loadWeather:async()=>{refreshes++;},loadTyphoons:async()=>{typhoons++;},locateAndRender:async()=>{locations++;},
  setInterval:fn=>{timer=fn;},console
});
vm.runInContext(fs.readFileSync(path.join(root,'js/astryx-bridge.js'),'utf8'),context);
const request=(type,payload)=>new Promise(resolve=>listeners.get('eorzea:action')({detail:{type,payload,respond:resolve}}));
(async()=>{
  for(const s of stations.slice(0,4)) assert.equal((await request('favorite-add',{id:s.id})).ok,true);
  assert.equal((await request('favorite-add',{id:stations[4].id})).ok,false);
  const removed=await request('favorite-remove',{id:stations[0].id});
  assert.equal(ids.length,3);
  await request('favorite-restore',{ids:removed.previous});
  assert.equal(ids.length,4);
  assert.equal((await request('select',{id:'unknown'})).ok,false);
  await request('preferences',{largeText:true,autoRefresh:true});
  assert.equal(context.document.documentElement.dataset.textSize,'large');
  context.document.hidden=true; timer(); assert.equal(refreshes,0);
  context.document.hidden=false; timer(); assert.equal(refreshes,1);assert.equal(typhoons,1);assert.equal(locations,0);
  context.appState.busy=true;timer();assert.equal(refreshes,1);
  context.localStorage.setItem=()=>{throw Error('disabled');};
  assert.equal((await request('preferences',{largeText:false,autoRefresh:false})).ok,false);
  assert.equal(context.document.documentElement.dataset.textSize,'large');
  const {searchStations}=await import('../src/station-search.mjs');
  const items=[{id:'a',label:'北海道・山口',auxiliaryData:{stationName:'山口',municipality:'札幌市'}},{id:'b',label:'北海道・札幌',auxiliaryData:{stationName:'札幌',municipality:'札幌市'}}];
  assert.equal(searchStations(items,'札幌')[0].id,'b');
  assert.equal(searchStations(items,'北海道　札幌').length,2);
  assert.equal(searchStations(items,'存在しない地名').length,0);
  console.log('PASS: Astryx bridge, favorites undo, preference failure, auto-refresh visibility, Japanese search order');
})().catch(error=>{console.error(error);process.exitCode=1;});
