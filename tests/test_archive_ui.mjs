// Exercise data loading, paging, filtering and failed/racing requests without upstream access.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {value:'', textContent:'', innerHTML:'', disabled:false,
    classList:{add(){},remove(){},toggle(){}},
    append(option){this.options ||= []; this.options.push(option); if(!this.value)this.value=option.value;},
    replaceChildren(){this.options=[];this.value='';}, scrollIntoView(){}});
  return elements.get(id);
}
const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
let script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m => m[1].includes('const COUNTRY_META'))[1];
script = script.slice(0, script.indexOf('//  JARVIS HOLOGRAPHIC MODAL SYSTEM'));
const oldPath = `data/snapshots/${'a'.repeat(64)}.json`;
const newPath = `data/snapshots/${'b'.repeat(64)}.json`;
const paper = i => ({id:String(i),title:i === 0 ? '<img src=x onerror=alert(1)>' : 'Paper '+i,
  summary:'Abstract', published:'2026-10-05', categories:i%2?['quant-ph']:['cs.AI'],
  link:'https://arxiv.org/abs/2610.00001', institution:'Unverified'});
const data = papers => ({dated:'2026-10-05',countries:{UNKNOWN:{institutions:{Unverified:{papers}}}}});
const manifest = {days:[{date:'2026-10-05',path:newPath,count:25,announcements:25,checked_at:'2026-10-05T06:30:00Z',feed_dates:[]},
  {date:'2026-10-04',path:oldPath,count:1,announcements:1,checked_at:'2026-10-04T06:30:00Z',feed_dates:[]}]};
let failing = false;
const requests=[];
const payloads = {'data/manifest.json':manifest,[newPath]:data(Array.from({length:25},(_,i)=>paper(i))),[oldPath]:data([paper(99)]),
  'data/seed.json':JSON.parse(fs.readFileSync(new URL('data/seed.json',root)))};
const context = vm.createContext({console, URL, Date, Math, setTimeout(){}, setInterval(){},
  navigator:{onLine:true}, IntersectionObserver:class {observe(){}},
  window:{scrollTo(){},addEventListener(){}}, event:{target:{classList:{add(){}}}},
  document:{addEventListener(){},getElementById:element,querySelector:element,querySelectorAll(){return[];},createElement(){return element(Symbol());}},
  fetch: async path => {requests.push(path);return {ok:!failing,status:failing?503:200,json:async()=>structuredClone(payloads[path])};}});
vm.runInContext(script,context);
await vm.runInContext('fetchLivePapers()',context);
assert.deepEqual(requests,['data/manifest.json',newPath]);
assert.equal(vm.runInContext('_paperRegistry.length',context),10);
assert.match(element('main-content').innerHTML,/&lt;img/);
assert.doesNotMatch(element('main-content').innerHTML,/<img src=x/);
vm.runInContext('changePage(1)',context);
assert.equal(vm.runInContext('_paperRegistry.length',context),10);
vm.runInContext('changePage(1)',context);
assert.equal(vm.runInContext('_paperRegistry.length',context),5);
vm.runInContext("filterCategory('quantum')",context);
assert.equal(vm.runInContext('_paperRegistry.length',context),10);
assert.match(element('page-status').textContent,/該当 12 件/);
await vm.runInContext("selectArchive('2026-10-04')",context);
assert.equal(vm.runInContext('getAllPapers()[0].id',context),'99');
assert.equal(requests.at(-1),oldPath);
failing = true;
await vm.runInContext("selectArchive('2026-10-05')",context);
assert.equal(vm.runInContext('getAllPapers()[0].id',context),'99');
assert.equal(element('archive-date').value,'2026-10-04');
assert.match(element('archive-status').textContent,/読み込み失敗/);
console.log('PASS: loads only chosen day, 10 cards/page, filters, escaping, history, failure preserves data');
