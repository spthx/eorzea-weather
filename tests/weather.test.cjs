const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console, Date, Promise, setTimeout, clearTimeout });
for (const file of ['config.js', 'eorzea-lore.js', 'eorzea-climate.js', 'seasonal.js', 'rankings.js', 'typhoon.js', 'utils.js', 'geolocation.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
}
function scene(t) { return vm.runInContext('describeWeather({temperature:' + t + '})', context); }
for (let t = -50; t <= 55; t += .1) {
  const result = scene(Number(t.toFixed(1)));
  assert.ok(result.title && result.range && result.sourceUrl, 'all temperatures have a scene: ' + t);
  assert.ok(fs.existsSync(path.join(root, result.wallpaper)));
}
assert.match(scene(-20).title, /シヴァ/);
assert.match(scene(-15).title, /パゴス/);
assert.match(scene(0).title, /イシュガルド/);
assert.match(scene(15).title, /黒衣森/);
assert.match(scene(20).title, /ラノシア/);
assert.match(scene(30.9).title, /サベネア/);
assert.match(scene(31).title, /ブッシュファイア/);
assert.match(scene(40).title, /ヘファイストス/);
assert.match(scene(40.5).title, /バハムート/);
assert.match(scene(41).title, /ゲロルト/);
assert.equal(scene(40).label, '酷暑日級');
assert.equal(vm.runInContext('describeWeather({temperature:null}).label', context), '欠測');
assert.equal(vm.runInContext('observedConditions({precipitation1h:0,snowDepth:10,windSpeed:0})', context), '直近1時間の降水なし ／ 積雪10cm ／ 風は静穏');
const stations = [{id:'near', temperature:5, humidity:null, coordinates:{lat:35,lon:139}}, {id:'far',temperature:5,humidity:60,coordinates:{lat:36,lon:140}}];
context.testStations = stations;
assert.equal(vm.runInContext('nearestStation({coords:{latitude:35,longitude:139}},testStations).id', context), 'near');
context.rankStations = [{id:'a',temperature:10,precipitation1h:null,windSpeed:2},{id:'b',temperature:-5,precipitation1h:20,windSpeed:0},{id:'c',temperature:30,precipitation1h:0,windSpeed:8}];
assert.equal(vm.runInContext('createRankings(rankStations).cold[0].id',context),'b');
assert.equal(vm.runInContext('createRankings(rankStations).rain[0].id',context),'b');
assert.equal(vm.runInContext('createRankings(rankStations).wind[0].id',context),'c');
assert.equal(vm.runInContext('createRankings(rankStations).rain.length',context),2);
const entry = { tropicalCyclone:'TC2634', typhoonNumber:'2629', issue:'2026-10-11T01:05:00+09:00' };
const details = [{part:'title',name:{jp:'テスト台風'},typhoonNumber:'2629',issue:{JST:entry.issue}}, {advancedHours:0,validtime:{JST:'2026-10-11T00:00:00+09:00'},pressure:'950'}, {advancedHours:24,validtime:{JST:'2026-10-12T00:00:00+09:00'}}];
context.entry = entry; context.details = details;
assert.equal(vm.runInContext('normalizeTyphoon(entry,details).title', context), '台風第29号（テスト台風）');
assert.throws(() => vm.runInContext('normalizeTyphoon(entry,[])', context));
async function verifyFetch() {
  context.fetchWithTimeout = async () => ({json:async()=>[]});
  assert.equal((await vm.runInContext('fetchTyphoons()', context)).items.length, 0);
  context.fetchWithTimeout = async () => { throw new Error('offline'); };
  await assert.rejects(vm.runInContext('fetchTyphoons()', context));
  context.fetchWithTimeout = async url => {
    if (url.endsWith('targetTc.json')) return {json:async()=>[entry]};
    throw new Error('detail unavailable');
  };
  const partial = await vm.runInContext('fetchTyphoons()', context);
  assert.equal(partial.items.length,1);
  assert.equal(partial.items[0].available,false);
  context.fetchWithTimeout = async () => ({json:async()=>({invalid:true})});
  await assert.rejects(vm.runInContext('fetchTyphoons()', context));
  console.log('PASS: all-season boundaries, missing values, nearest station, typhoon parsing and failure states');
}
verifyFetch().catch(error => { console.error(error); process.exitCode = 1; });
