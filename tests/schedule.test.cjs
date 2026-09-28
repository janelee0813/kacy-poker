const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source = html.slice(html.indexOf('  let SCHEDULE_YEAR'),html.indexOf('  // ===== 관리자 ====='));
function harness(){
  const els={};
  const get=id=>els[id]??=({value:'',innerHTML:'',textContent:'',disabled:false,classList:{toggle(){},add(){},remove(){}},setAttribute(){},removeAttribute(){},scrollIntoView(){},reset(){},reportValidity(){return true;}});
  const context={console,AbortController,setTimeout,clearTimeout,Date,confirm:()=>true,
    document:{getElementById:get,querySelectorAll:()=>[]},SUPABASE_URL:'https://example.test',sbHeaders:()=>({}),
    escapeHtml:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'),getTmapUrl:()=>null};
  context.window=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../venue-locations.js'),'utf8'),context);
  context.getTmapUrl=()=>null;
  vm.runInContext("let adminPassword='test-password';"+source,context);
  vm.runInContext('loadRsvps=async()=>({});',context);
  return {ctx:context,get,run:s=>vm.runInContext(s,context)};
}
const record=(overrides={})=>({id:'12345678-0000-0000-0000-000000000001',version:1,event_date:'2026-10-01',end_date:'2026-10-01',kind:'visit',venue:'구리 러너펍',title:'',calendar_text:'',emoji:'',start_time:null,...overrides});
test('month/year boundary, range events and leap day remain navigable',()=>{
  const h=harness();h.ctx.rows=[record({kind:'banner',venue:null,event_date:'2026-12-30',end_date:'2027-01-02',title:'대회'}),record({event_date:'2028-02-29',end_date:'2028-02-29'})];
  h.run("scheduleEvents=rows; rebuildScheduleMonths('2027-01-01');");
  assert.equal(h.run('SCHEDULE_YEAR'),2027);
  assert.equal(h.run('flattenSchedule(SCHEDULE_DATA[0])[0].day'),1);
  assert.equal(h.run('flattenSchedule(SCHEDULE_DATA[0])[0].endDay'),2);
  h.run("rebuildScheduleMonths('2028-02-01');");
  assert.equal((h.run('renderScheduleCalendar(flattenSchedule(SCHEDULE_DATA[1]),1,null)').match(/class="schedule-day"/g)||[]).length,29);
});
test('public render escapes venue/title HTML and shows optional time',()=>{
  const h=harness();h.ctx.rows=[record({venue:'<img src=x onerror="alert(1)">',start_time:'14:00:00'})];h.run("scheduleEvents=rows;rebuildScheduleMonths('2026-10-01');");
  const result=h.run('renderScheduleEntries(flattenSchedule(SCHEDULE_DATA[9]),9,null,{},false)');
  assert(!result.includes('<img'));assert(result.includes('&lt;img'));assert(result.includes('14:00'));assert(!result.includes('+ 참여'));
});
test('successful registration persists through RPC, updates both views and retains reusable venue',async()=>{
  const h=harness();h.run('scheduleDataReady=true;');
  const saved=record({venue:'새 매장',event_date:'2027-01-05',end_date:'2027-01-05',start_time:'11:00:00'});
  let payload;
  h.ctx.fetch=async(url,opts)=>{assert(url.endsWith('/rpc/admin_save_schedule'));payload=JSON.parse(opts.body);return {ok:true,json:async()=>saved};};
  for(const [key,value] of Object.entries({kind:'visit',date:'2027-01-05',venue:'새 매장',time:'11:00'}))h.get('admin-schedule-'+key).value=value;
  await h.ctx.adminSaveSchedule({preventDefault(){}});
  assert.equal(payload.p_end_date,'2027-01-05');assert.equal(payload.p_start_time,'11:00');assert.equal(h.run('scheduleEvents.length'),1);
  assert.equal(h.run('scheduleVenues[0].name'),'새 매장');assert(h.get('schedule-list').innerHTML.includes('새 매장'));
  assert(h.get('schedule-calendar').innerHTML.includes('11:00'));assert(h.get('schedule-calendar').innerHTML.includes('title="새 매장"'));assert(h.get('admin-schedule-message').textContent.includes('저장 완료'));
});
test('failed save keeps form and does not report success or add a venue',async()=>{
  const h=harness();h.run('scheduleDataReady=true;');h.get('admin-schedule-kind').value='visit';h.get('admin-schedule-date').value='2026-11-02';h.get('admin-schedule-venue').value='입력 보존';
  h.ctx.fetch=async()=>({ok:false,json:async()=>({message:'duplicate key value violates unique constraint'})});
  await h.ctx.adminSaveSchedule({preventDefault(){}});
  assert.equal(h.run('scheduleEvents.length'),0);assert.equal(h.run('scheduleVenues.length'),0);
  assert.equal(h.get('admin-schedule-venue').value,'입력 보존');assert(h.get('admin-schedule-message').textContent.includes('이미 등록'));
  assert.equal(h.get('admin-schedule-fields').disabled,false);
});
test('delete is version checked and keeps the venue for reuse',async()=>{
  const h=harness();h.ctx.rows=[record()];h.run("scheduleEvents=rows;scheduleVenues=[{name:'구리 러너펍'}];scheduleDataReady=true;rebuildScheduleMonths('2026-10-01');");
  let payload;h.ctx.fetch=async(url,opts)=>{assert(url.endsWith('/rpc/admin_delete_schedule'));payload=JSON.parse(opts.body);return{ok:true,json:async()=>true};};
  await h.ctx.adminDeleteSchedule(h.ctx.rows[0].id);
  assert.equal(payload.p_version,1);assert.equal(h.run('scheduleEvents.length'),0);assert.equal(h.run('scheduleVenues.length'),1);
});
test('slow older fetch cannot replace newer schedules',async()=>{
  const h=harness();const pending=[];h.ctx.enqueue=()=>new Promise(resolve=>pending.push(resolve));h.run('fetchScheduleRows=()=>enqueue();');
  const first=h.ctx.scheduleReload(),second=h.ctx.scheduleReload();
  pending[2]([record({venue:'최신'})]);pending[3]([{name:'최신'}]);await second;
  pending[0]([record({venue:'오래된 내용'})]);pending[1]([{name:'오래된 내용'}]);await first;
  assert.equal(h.run('scheduleEvents[0].venue'),'최신');
});
test('pagination does not truncate stored schedules',async()=>{
  const h=harness();let calls=0;
  h.ctx.fetch=async()=>({ok:true,json:async()=>++calls===1?Array.from({length:500},(_,id)=>({id})):[{id:500}]});
  assert.equal((await h.run("fetchScheduleRows('schedule_events','id.asc')")).length,501);
  assert.equal(calls,2);
});
test('a successful save invalidates an older in-flight refresh',async()=>{
  const h=harness();h.run('scheduleDataReady=true;');const pending=[];
  h.ctx.enqueue=()=>new Promise(resolve=>pending.push(resolve));h.run('fetchScheduleRows=()=>enqueue();');
  const refresh=h.ctx.scheduleReload();
  h.ctx.fetch=async()=>({ok:true,json:async()=>record({venue:'방금 저장'})});
  h.get('admin-schedule-kind').value='visit';h.get('admin-schedule-date').value='2026-10-01';h.get('admin-schedule-venue').value='방금 저장';
  await h.ctx.adminSaveSchedule({preventDefault(){}});
  pending[0]([]);pending[1]([]);await refresh;
  assert.equal(h.run('scheduleEvents[0].venue'),'방금 저장');
});

test('calendar official names split brand and branch, unverified names retain all words',()=>{
  const h=harness();
  const runner=h.ctx.getCalendarVenue('논현 러너펍');
  assert.equal(runner.name,'러너펍 논현점');assert.deepEqual(Array.from(runner.lines),['러너펍','논현점']);
  const unknown=h.ctx.getCalendarVenue('수원 인계 치즈펍');
  assert.equal(unknown.verified,false);assert.equal(unknown.lines.join(' '),'수원 인계 치즈펍');assert.equal(unknown.lines.length,2);
  const direct=h.ctx.getCalendarVenue('러너펍 논현점');assert.equal(direct.name,runner.name);
  h.ctx.rows=[record({venue:'논현 러너펍'})];h.run("scheduleEvents=rows;rebuildScheduleMonths('2026-10-01');");
  const result=h.run('renderScheduleCalendar(flattenSchedule(SCHEDULE_DATA[9]),9,null)');
  assert(result.includes('러너펍 논현점'));assert.equal((result.match(/class="schedule-venue-line"/g)||[]).length,2);
});
