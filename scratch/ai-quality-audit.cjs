// Diagnostic harness: runs existing service source without changing application code.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const results = { timestamp: new Date().toISOString(), sourceHashes: {}, deterministic: [], live: [] };
const redact = value => String(value).replace(/gsk_[\w-]+|AIza[\w-]+/g, '[KEY REDACTED]').replace(/\b(?:1900\s?\d{4}|115)\b/g, '[RESOURCE REDACTED]');
function loadServices(fetcher, env = {}) {
  const cache = new Map();
  const storage = new Map();
  const localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,String(v)), removeItem:k=>storage.delete(k) };
  function load(name) {
    if (cache.has(name)) return cache.get(name);
    if (name === 'supabaseService') return { saveMemoryToCloud: async () => { throw Error('Cloud writes disabled in audit'); } };
    const rawSource = fs.readFileSync(path.join(root, 'src/services', name + '.ts'), 'utf8');
    results.sourceHashes[name] = createHash('sha256').update(rawSource).digest('hex');
    const source = rawSource.replace(/import\.meta/g, '__importMeta');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} };
    cache.set(name, module.exports);
    vm.runInNewContext(code, {
      module, exports: module.exports,
      require: p => load(path.basename(p)),
      __importMeta: { env }, localStorage,
      console: { log() {}, warn() {}, error() {} },
      fetch: fetcher, AbortController, setTimeout, clearTimeout,
    }, { filename: name + '.ts' });
    return module.exports;
  }
  return { ai: load('geminiService'), decision: load('decisionService') };
}
const offline = async () => new Response('{}', { status: 503 });
function record(id, requirement, actual, pass) {
  const row = { id, requirement, pass: Boolean(pass), actual };
  results.deterministic.push(row);
  console.log(`${row.pass ? 'PASS' : 'FAIL'} ${id}: ${requirement}`);
}
async function deterministic() {
  const { ai, decision } = loadServices(offline);
  for (const [id, text, expected] of [
    ['STOP01','dừng lại',true], ['STOP02','dừng lại.',true],
    ['STOP03','Mình muốn dừng cuộc trò chuyện ở đây nhé',true],
    ['STOP04','Chỉ cần bạn thôi, đừng rời bỏ tôi',false],
  ]) {
    const r = await ai.callGeminiCompanionAPI('',text,[]);
    record(id, `Stop intent: ${text}`, { stop: Boolean(r.isUserStop), source:r.source }, Boolean(r.isUserStop) === expected);
  }
  for (const [id,text,expected] of [
    ['SAFE01','Tôi đang muốn tự tử',true],
    ['SAFE02','Tôi không muốn tự tử, tôi chỉ lo deadline',false],
    ['SAFE03','toi muon tu tu',true],
    ['SAFE04','Tôi đang viết bài nghiên cứu về phòng chống tự tử',false],
  ]) record(id, `Contextual safety: ${text}`, { crisis:ai.isCrisisIntent(text) }, ai.isCrisisIntent(text) === expected);
  const energy = ai.generateDynamicSanctuaryReply('Năng lượng của tôi hôm nay là 10/10');
  record('FALL01','Không biến năng lượng 10/10 thành 2/10', { text:energy }, !energy.includes('2/10'));
  const noTask = ai.generateDynamicSanctuaryReply('Đừng giao bài tập, tôi chỉ muốn được lắng nghe');
  record('FALL02','Không giao bài tập khi người dùng từ chối', { text:noTask }, !noTask.includes('Một bước vi mô') && !noTask.includes('đặt điện thoại'));
  const first = ai.generateDynamicSanctuaryReply('Tôi đang cân nhắc chuyển nhà');
  const second = ai.generateDynamicSanctuaryReply('Không phải chuyển nhà, tôi muốn đổi nhóm làm việc',[{sender:'user',text:'Tôi đang cân nhắc chuyển nhà'}]);
  record('FALL03','Fallback phản hồi theo nội dung/đính chính thay vì trả cùng một mẫu', { first,second }, first !== second);
  const card = await decision.extractDecisionCardFromConversation([{sender:'user',text:'Tôi đang chọn học piano hay học vẽ vào cuối tuần. Công việc hiện tại ổn, tôi không muốn đổi việc.'}]);
  record('CARD01','Fallback không tự đề xuất đổi việc cho lựa chọn sở thích', { options:card.options,criteria:card.criteria }, !JSON.stringify(card.options).includes('cơ hội mới'));
  const empty = await decision.extractDecisionCardFromConversation([]);
  record('CARD02','Không có chia sẻ thì không tự điền tiêu chí và bước thử cá nhân', { criteria:empty.criteria,experiment:empty.experiment }, empty.criteria.length === 0 && !empty.experiment);
  const previous = {...decision.getActiveDecisionCard(),status:'CONFIRMED',decisionQuestion:'Tôi muốn học piano hay học vẽ?',criteria:['Niềm vui cá nhân']};
  const optimistic = decision.extractLiveCardOptimistic('Tôi muốn mở lòng với trải nghiệm nghệ thuật',previous);
  record('CARD03','Từ mở lòng không được suy thành khởi sự kinh doanh', { question:optimistic.decisionQuestion }, !optimistic.decisionQuestion.includes('kinh doanh'));
  let malformedCalls=0;
  const malformedFetch = async () => {malformedCalls++;return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({title:'Test',decisionQuestion:'Test?',criteria:'INVALID_STRING',options:'INVALID_STRING',experiment:{durationDays:-7}})}}]}),{status:200});};
  const malformed = await loadServices(malformedFetch,{VITE_GROQ_API_KEY:'gsk_mock_audit_not_real'}).decision.extractDecisionCardFromConversation([{sender:'user',text:'Tôi muốn chọn giữa hai lớp học'}]);
  record('CARD04','Từ chối JSON đúng cú pháp nhưng sai schema', { mockCalls:malformedCalls,criteria:malformed.criteria,options:malformed.options,experiment:malformed.experiment }, malformedCalls>0 && Array.isArray(malformed.criteria) && Array.isArray(malformed.options) && (!malformed.experiment || malformed.experiment.durationDays > 0));
  let captured;
  const mock = loadServices(async (_url,options) => { captured=JSON.parse(options.body);return new Response(JSON.stringify({choices:[{message:{content:'Bạn đang muốn làm rõ điều gì nhất?'}}]}),{status:200}); });
  const r = await mock.ai.callGeminiCompanionAPI('gsk_test','Tôi muốn so sánh hai việc',[]);
  record('OBS01','Nhãn model phản ánh model thực sự được gọi', { requested:captured.model,reported:r.modelUsed }, r.modelUsed?.includes(captured.model));
  const history = [{sender:'user',text:'RÀNG_BUỘC_GỐC: Tôi phải giữ thu nhập tối thiểu 20 triệu.'}, ...Array.from({length:7},(_,i)=>({sender:i%2?'ai':'user',text:'Lượt tiếp theo '+i}))];
  await mock.ai.callGeminiCompanionAPI('gsk_test','Giờ tôi nên làm gì?',history);
  record('CTX01','Giữ ràng buộc quan trọng từ đầu hội thoại dài', { originalConstraintInPayload:JSON.stringify(captured).includes('RÀNG_BUỘC_GỐC'),sentMessages:captured.messages.length }, JSON.stringify(captured).includes('RÀNG_BUỘC_GỐC'));
  const summary = await ai.summarizeSessionInsight([{sender:'user',text:'Tôi không bị áp lực tiền bạc, đồng nghiệp tốt, lịch làm việc ổn. Điều quan trọng nhất với tôi là học thêm kỹ năng mới.'}]);
  record('SUM01','Tóm tắt fallback không cắt mất ý quan trọng cuối tin', { text:summary }, summary.includes('học thêm'));
}
async function live() {
  const {loadEnv} = await import('vite');
  const env = loadEnv('development',root,'VITE_');
  let requests = [];
  const fetcher = async (url,options={}) => {
    const started = Date.now();
    let body={};try{body=JSON.parse(options.body||'{}');}catch{}
    const entry={host:new URL(url).host,model:body.model||null};
    requests.push(entry);
    try {
      const signal=options.signal ? AbortSignal.any([options.signal,AbortSignal.timeout(22000)]) : AbortSignal.timeout(22000);
      const response = await fetch(url,{...options,signal});
      entry.status=response.status;
      if (!response.ok) {
        const data=await response.clone().json().catch(()=>({}));
        entry.errorCode=data.error?.code || data.error?.type || null;
      }
      entry.ms=Date.now()-started;
      return response;
    } catch(e) { entry.error=e.name;entry.ms=Date.now()-started;throw Error('Network request failed'); }
  };
  const {ai,decision}=loadServices(fetcher,env);
  const key=ai.getStoredGeminiKey();
  results.keySource=key ? (env.VITE_GROQ_API_KEY||env.VITE_GEMINI_API_KEY?'vite-development-env':'service-fallback-key') : 'missing';
  const histories=[];
  for (const [id,text] of [
    ['LIVE01','Tôi đang phân vân ở lại công ty hay chuyển việc. Tôi cần giữ thu nhập tối thiểu 20 triệu và không muốn nghỉ ngay.'],
    ['LIVE02','Không phải lương thấp. Tôi đang nhận 25 triệu, vấn đề là tôi không còn học được gì. Tôi chưa muốn nhận lời khuyên, chỉ muốn bạn nghe.'],
    ['LIVE03','Tôi chỉ cần được lắng nghe, chưa muốn giải pháp hoặc bài tập. Tôi đang lo mình chọn sai.'],
    ['LIVE04','Giờ hãy so sánh giúp tôi hai phương án. Chưa có offer khác và tôi cần giữ thu nhập ít nhất 20 triệu.'],
  ]) {
    requests=[];
    const start=Date.now();
    const response=await ai.callGeminiCompanionAPI(key,text,histories);
    const row={id,input:text,historyTurns:histories.length,result:response,requests:[...requests],ms:Date.now()-start};
    results.live.push(row);
    console.log(JSON.stringify({id,ms:row.ms,source:response.source,requests:row.requests,text:redact(response.text)}));
    histories.push({sender:'user',text},{sender:'ai',text:response.text});
    if (response.isFallback) {results.liveBlocked='No live provider response; stopped further chat sampling to avoid repeating failures.';break;}
  }
  requests=[];
  const started=Date.now();
  const card=await decision.extractDecisionCardFromConversation([
    {sender:'user',text:'Tôi chọn ở lại công ty hay chuyển việc. Thu nhập hiện tại 25 triệu, tối thiểu phải giữ 20 triệu. Chưa có offer khác. Tôi chỉ muốn thu thập thông tin, chưa muốn nghỉ.'},
  ]);
  results.live.push({id:'LIVE_CARD',card,requests:[...requests],ms:Date.now()-started});
  console.log(JSON.stringify({id:'LIVE_CARD',requests,card}));
}
(async()=>{
  await deterministic();
  if(process.argv.includes('--live')) await live();
  results.summary={passed:results.deterministic.filter(r=>r.pass).length,failed:results.deterministic.filter(r=>!r.pass).length,total:results.deterministic.length};
  fs.writeFileSync(path.join(__dirname,'ai-quality-audit-results.json'),redact(JSON.stringify(results,null,2))+'\n');
  console.log('SUMMARY '+JSON.stringify(results.summary));
})().catch(e=>{console.error(redact(e.message));process.exitCode=1;});
