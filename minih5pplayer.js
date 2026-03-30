/* MiniH5PPlayer v17++ (auto-size tokens; newline-safe; QS + robust detection with mainLibrary guard) */
const MiniH5PPlayer = (() => {
  const htmlDecode = (s) => { const ta = document.createElement('textarea'); ta.innerHTML = s ?? ''; return ta.value; };
  const stripBOM = (s) => (s && s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s);
  const asStr = (v) => (typeof v === 'string' || typeof v === 'number') ? String(v) : '';
  const isArr = Array.isArray;
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const LINE_SPLIT_RE = new RegExp('(?:' + CR + LF + '|' + CR + '|' + LF + ')');
  const toPlainText = (html) => { const dec = htmlDecode(asStr(html)); 
	return dec.replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim(); 
  };

  let __styled = false;
  function ensureStyles(){ if(__styled) return; __styled = true; const css = `
    .card{border:1px solid #333;border-radius:8px;padding:14px;margin:10px 0;background:#000;color:#fff; position: relative}
    .card input, .card textarea, .card button{color:#000}
	.card textarea { width: 100%; }
    .q-title{font-weight:700;margin-bottom:10px;color:#fff}
    .badge{background:#333;border:1px solid #555;border-radius:10px;padding:2px 8px;margin-right:6px;font-size:.85em;color:#ddd}
    .inline-text{line-height:2}
    .dropzone{display:inline-block;min-width:20ch;padding:2px 6px;margin:0 2px;border:2px dashed #888;background:rgba(255,255,255,.04);border-radius:6px;vertical-align:baseline;color:#fff}
    .dropzone.filled{border-color:#aaa;background:rgba(255,255,255,.08)}
    .dropzone.hover{outline:2px solid #66aaff;background:rgba(102,170,255,.15)}
    .blank-ok{color:green !important;border-color:#3cd65c !important; background:rgba(60,214,92,.18) !important} // fill in the blanks - correct
    .blank-bad{border-color:#ff6b6b !important; background:rgba(255,107,107,.18) !important}
    .token-pool{margin-top:12px; display:flex; flex-wrap:wrap; gap:8px}
    .token{display:inline-block;background:#fff;border:1px solid #666;border-radius:18px;padding:6px 14px;margin:0;cursor:grab;user-select:none;color:#000; line-height:1; white-space:normal; word-break:break-word; max-width:100%}
    .token.selected{outline:2px solid #66aaff}
    .token.assigned{opacity:.45; cursor:not-allowed}
    .controls{margin-top:12px}
    .controls button{margin-right:8px}
    .msg{margin-top:10px}
    .msg.ok{color:#7ee787}
    .msg.warn{color:#ffb86b}
    .divider{height:1px;background:#222;margin:12px 0}
    .scoreline{font-style:italic;margin-top:8px;color:#ccc}
    .nav button{margin-right:8px}
    .mhp-canvas{position:relative; width:100%; max-width: 1024px; margin: 6px 0; background:#0b0b0b; background:#444; border:1px solid #222; border-radius:6px; overflow:hidden}
    .mhp-bg{position:absolute; inset:0; object-fit:cover; opacity:.9}
    .mhp-item{position:absolute; display:flex; align-items:center; justify-content:center; padding:0}
    .mhp-item > button.mhp-token{width:100%; height:100%; background:#fff; color:#000; border:1px solid #666; border-radius:18px; cursor:grab; user-select:none; padding:10px; line-height:1.25; white-space:normal; word-break:break-word}
    .mhp-item.assigned > button.mhp-token{opacity:.45; cursor:not-allowed}
    .mhp-zone{position:absolute; border:2px dashed #888; background:rgba(255,255,255,.04); color:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; text-align:center; padding:12px; min-width:100px; min-height:60px}
    .mhp-zone.filled{border-color:#aaa; background:rgba(255,255,255,.08)}
    .mhp-zone.blank-ok{border-color:#3cd65c !important; background:rgba(60,214,92,.18) !important}
    .mhp-zone.blank-bad{border-color:#ff6b6b !important; background:rgba(255,107,107,.18) !important}
    .mhp-zone-content{display:flex; gap:2px; flex-wrap:wrap; align-items:center; justify-content:center; width:100%; height:100%} // dropzone
    .mhp-chip{background:#fff; color:#000; border:1px solid #666; border-radius:10px; padding:5px 7px; cursor:pointer; line-height:1; white-space:normal; word-break:break-word; max-width:100%} // draggable
    .mhp-chip:hover{border-color:#333}

/* Static labels (AdvancedText with no dropZones) */
.mhp-label{
  color:#fff;
  background:transparent;
  border:0;
  padding:0;
  margin:0;
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
  line-height:1;
  white-space:normal;           /* allows wrapped words if needed */
  word-break:break-word;
  pointer-events:none;          /* non-interactive decoration */
}

/* Strip default spacing from common block tags inside labels */
.mhp-label p,
.mhp-label pre,
.mhp-label div {
  margin:0;
  padding:0;
  background:transparent;
  color:inherit;
}

/* Keep box-drawing/ASCII art aligned */
.mhp-label pre{
  white-space:pre;              /* respect ASCII art spacing */
  font-family: inherit;         /* use page/body font unless authors override */
  line-height:1;                /* tighter for box-drawing characters */
}

/* Make inline spans behave nicely (e.g., big emojis, box glyphs) */
.mhp-label span{
  line-height:1;
}

    /* QuestionSet UI */
    .qs-root .qs-intro{padding:12px; background:#0d0d0d;border:1px dashed #333;border-radius:6px;margin-bottom:10px}
    .qs-root .qs-intro .intro-text{color:#eee}
    .qs-root .qs-progress{display:flex; gap:6px; align-items:center; margin:8px 0; flex-wrap:wrap}
    .qs-root .qs-progress .dots{display:flex; gap:6px; align-items:center; flex-wrap:wrap}
    .qs-root .qs-progress .dot{width:12px;height:12px;border-radius:50%; background:#333; border:1px solid #555; cursor:pointer}
    .qs-root .qs-progress .dot.current{outline:2px solid #66aaff; background:#66aaff}
    .qs-root .qs-progress .dot.answered{background:#3cd65c; border-color:#2aa64a}
    .qs-root .qs-progress .label{font-size:.9em; color:#ccc}
    .qs-root .qs-controls{display:flex; gap:8px; align-items:center; margin:10px 0}
    .qs-root .qs-result{padding:12px; background:#0d0d0d;border:1px dashed #333;border-radius:6px}
    .qs-root .qs-result .headline{font-weight:700; margin-bottom:6px}
    .qs-root .qs-hide-check .card .controls button.primary{display:none !important}
	
	
	/* Celebration */
 .mhp-celebrate {
   position: fixed;
   inset: 0;
   pointer-events: none;
   z-index: 9999;
 }
 .mhp-pop {
   position: absolute;
   width: 8px; height: 8px;
   border-radius: 50%;
   will-change: transform, opacity;
 }
  `; const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);} 


// Convenience: run celebration when score is perfect
function celebrateIfPerfect(root, correct, total){
  //if (Number(total) > 0 && Number(correct) === Number(total)) celebrate(root);
}

  function levenshtein(a,b){
	  a=asStr(a);b=asStr(b);const m=a.length,n=b.length;if(!m) return n;if(!n) return m;const d=Array.from({length:m+1},()=>Array(n+1));for(let i=0;i<=m;i++)d[i][0]=i;for(let j=0;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){const c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);}}return d[m][n];}
  //const norm=(s,cs)=> (cs?asStr(s).trim():asStr(s).trim().toLowerCase());
  const norm=function (s,cs) { return (cs?asStr(s).trim():asStr(s).trim().toLowerCase()); }
  function appendTextWithBreaks(parent, s){ const parts = asStr(s).split(LINE_SPLIT_RE); for(let i=0;i<parts.length;i++){ if(i) parent.appendChild(document.createElement('br')); parent.appendChild(document.createTextNode(parts[i])); } }

  function parseAsteriskBlanks(raw,{caseSensitive=false}={}){
    const decoded = htmlDecode(stripBOM(asStr(raw)));
    const candidate = (typeof raw === 'object' && raw) ? (raw.text || raw.value || '') : decoded;
    //const text = asStr(candidate).replace(/<[^>]+>/g,'');
	const text = asStr(candidate).replace(/\x3C[^\x3E]+\x3E/g, '');
    const segs=[],blanks=[]; let i=0,idx=0; const re=/\*([^*]+)\*/g; let m;
    while((m=re.exec(text))!==null){ const start=m.index,end=re.lastIndex; if(start>i) segs.push({type:'text',text:text.slice(i,start)}); const alts=asStr(m[1]).split('/').map(s=>s.trim()).filter(Boolean); const id='blank_'+Date.now()+'_'+(idx++); segs.push({type:'blank',id,solutions:alts}); blanks.push({id,solutions:alts}); i=end; }
    if(i<text.length) segs.push({type:'text',text:text.slice(i)});
    const pool = blanks.map(b => asStr((b.solutions && b.solutions[0]) || ''));
    return {segments:segs,blanks,pool,plain:text};
  }
  function isMatch(candidate,solutions,{caseSensitive=false,acceptSpellingErrors=false}={}){
    const cand=norm(candidate,caseSensitive); for(const sol of (solutions||[])){ const s=norm(sol,caseSensitive); if(cand===s) return true; if(acceptSpellingErrors && Math.max(cand.length,s.length)>=4 && levenshtein(cand,s)<=1) return true; } return false;
  }
  const el=(tag,opts={},children=[])=>{const n=document.createElement(tag); if(opts.class) n.className=opts.class; if(opts.text!=null) n.textContent=asStr(opts.text); if(opts.html!=null) n.innerHTML=asStr(opts.html); if(opts.attrs) for(const [k,v] of Object.entries(opts.attrs)) n.setAttribute(k, asStr(v)); if(!isArr(children)) children=[children]; children.filter(Boolean).forEach(c=>n.appendChild(c)); return n; };

  // Helper: parse "*token*" list into tokens (first alt per star group)
  function parseAsteriskTokens(raw) {
    const decoded = htmlDecode(stripBOM(asStr(raw)));
    const text = asStr(decoded).replace(/<[^>]+>/g, '');
    const out = [];
    const re = /\*([^*]+)\*/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const tok = asStr(m[1]).split('/').map(s => s.trim()).filter(Boolean)[0];
      if (tok) out.push(tok);
    }
    return out;
  }

function renderDragText({mount,model,idx,onScore}){
  ensureStyles();
  const params = model.params ?? model;
  const behaviour = params.behaviour ?? {};
  const caseSensitive = !!behaviour.caseSensitive;

  const titleHtml = asStr(params.taskDescription) || asStr(params.title) || asStr(params.prompt) || 'Drag the words to the blanks';
  const title = htmlDecode(titleHtml).replace(/<[^>]*>/g,'') || 'Drag the words to the blanks';

  // Accept string or array for textField; otherwise fallbacks
  let rawText = '';
  if (typeof params.textField === 'string' && params.textField.length) rawText=params.textField;
  else if (Array.isArray(params.textField)) rawText = params.textField.join('\n');
  else if (Array.isArray(params.texts) && params.texts.length) rawText=asStr(params.texts[0]);
  else if (Array.isArray(params.questions) && params.questions.length && typeof params.questions[0] === 'string') rawText=asStr(params.questions[0]);
  else rawText=asStr(params.text);

  const {segments,blanks,pool: initialPool}=parseAsteriskBlanks(rawText,{caseSensitive});
  const distractors = parseAsteriskTokens(params.distractors || '');

  // Build pool: first solutions + distractors, de-dup + shuffle
  const uniq = new Map();
  const addToUniq = (arr)=> arr.forEach(t => { const key = toPlainText(t); if (!uniq.has(key)) uniq.set(key,key); });
  addToUniq(initialPool); addToUniq(distractors);
  const pool = Array.from(uniq.values());
  for (let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }

  const card=el('div',{class:'card'});
  const qNum=(idx!=null)?el('span',{class:'badge',text:'Q'+(idx+1)}):null;
  card.appendChild(el('div',{class:'q-title'},[qNum,qNum?el('span',{text:' '}):null,el('span',{text:title})]));

  const line=el('div',{class:'inline-text'});
  const dropState=new Map();

  // Helpers for clearing/assigning blanks
  function clearCorrectness(dz){ dz.classList.remove('blank-ok','blank-bad'); }

  function freePoolToken(label){
    const node=[...poolWrap.children].find(x=>asStr(x.textContent)===asStr(label));
    if(node) node.classList.remove('assigned');
  }

  function clearAssignment(dz){
    const id=dz.getAttribute('data-id');
    const prev=dropState.get(id);
    if(prev){ freePoolToken(prev); }
    dz.innerHTML=''; dz.textContent='⟨drop⟩';
    dz.className='dropzone';
    dropState.set(id, null);
  }

  function makeDzChip(dz, text){
    const chip = document.createElement('span');
    chip.className = 'token dz-chip';
    chip.textContent = text;
    chip.setAttribute('draggable','true');

    // Dragging the chip out frees the blank and makes the pool token available again
    chip.addEventListener('dragstart', (e)=>{
      const id=dz.getAttribute('data-id');
      const placed=dropState.get(id);
      // free this assignment immediately so "drag out" works anywhere
      clearAssignment(dz);
      e.dataTransfer.setData('text/plain', placed || text);
    });

    // Optional: click to clear
    chip.addEventListener('click', ()=> clearAssignment(dz));

    return chip;
  }

  function assignToken(dz,text){
    const t=toPlainText(text);
    const id=dz.getAttribute('data-id');
    const prev=dropState.get(id);
    if(prev){ freePoolToken(prev); }

    dz.innerHTML=''; // replace placeholder with a chip
    const chip = makeDzChip(dz, t);
    dz.appendChild(chip);

    dz.classList.add('filled');
    clearCorrectness(dz);
    dropState.set(id, t);

    // mark the pool token as assigned
    const inPool=[...poolWrap.children].find(x=>asStr(x.textContent)===t && !x.classList.contains('assigned'));
    inPool && inPool.classList.add('assigned');
  }

  // Build text with dropzones
  segments.forEach(seg=>{
    if(seg.type==='text'){
      appendTextWithBreaks(line, seg.text);
    } else {
      const dz=el('span',{class:'dropzone',attrs:{tabindex:'0','data-id':seg.id}});
      dz.textContent='⟨drop⟩';
      dz.addEventListener('dragover',e=>{e.preventDefault(); dz.classList.add('hover');});
      dz.addEventListener('dragleave',()=>dz.classList.remove('hover'));
      dz.addEventListener('drop',e=>{ e.preventDefault(); dz.classList.remove('hover'); const tokenText=asStr(e.dataTransfer?.getData('text/plain')); if(!tokenText) return; assignToken(dz, tokenText); });
      dz.addEventListener('click',()=>{ if(selectedToken) assignToken(dz, asStr(selectedToken.textContent)); });
      dropState.set(seg.id,null);
      line.appendChild(dz);
    }
  });

  // Token pool
  const poolWrap=el('div',{class:'token-pool'});
  let selectedToken=null;
  (pool.length?pool:[]).forEach(text=>{
    const label=toPlainText(text);
    const token=el('span',{class:'token',text:label,attrs:{draggable:'true'}});
    token.addEventListener('dragstart',e=>{
      if(token.classList.contains('assigned')){e.preventDefault();return;}
      e.dataTransfer.setData('text/plain', label);
    });
    token.addEventListener('click',()=>{
      if(token.classList.contains('assigned')) return;
      if(selectedToken) selectedToken.classList.remove('selected');
      selectedToken=token;
      token.classList.add('selected');
    });
    poolWrap.appendChild(token);
  });

  // Optional: allow dropping onto the pool area; it becomes a no-op because we clear on dragstart,
  // but this keeps UX consistent if someone "drops back to pool".
  poolWrap.addEventListener('dragover', e=>e.preventDefault());
  poolWrap.addEventListener('drop', e=>{ e.preventDefault(); /* no-op: chip already freed on dragstart */ });

  // Controls and scoring (unchanged)
  const msg=el('div',{class:'msg'});
  const controls=el('div',{class:'controls'});

  const checkBtn=el('button',{class:'primary',text:(asStr(params.checkAnswer) || asStr(model.scoreShow) || 'Check')});
  const retryBtn=el('button',{text:(asStr(params.tryAgain) || asStr(model.tryAgain) || 'Retry')});
  if(behaviour.enableCheckButton===false) checkBtn.style.display='none';
  if(behaviour.enableRetry===false) retryBtn.style.display='none';

  const doCheck=()=>{
    let correct=0,total=blanks.length;
    blanks.forEach(b=>{
      const placed=asStr(dropState.get(b.id)??'');
      const ok=isMatch(placed,b.solutions,{caseSensitive,acceptSpellingErrors:false});
      const dz=line.querySelector('.dropzone[data-id="'+b.id+'"]');
      dz.classList.remove('blank-ok','blank-bad');
      dz.classList.add(ok?'blank-ok':'blank-bad');
      if(ok) correct++;
    });
    msg.className='msg '+(correct===total?'ok':'warn');
    msg.textContent='Score: '+correct+'/'+total;
	celebrateIfPerfect(card, correct, total);
    onScore&&onScore({correct,total});
    return {correct,total};
  };

  checkBtn.addEventListener('click',()=>doCheck());
  retryBtn.addEventListener('click',()=>{
    dropState.forEach((_,id)=>{
      const dz=line.querySelector('.dropzone[data-id="'+id+'"]');
      clearAssignment(dz);
    });
    [...poolWrap.children].forEach(t=>t.classList.remove('assigned','selected'));
    selectedToken=null; msg.className='msg'; msg.textContent='';
    onScore&&onScore({correct:0,total:blanks.length});
  });

  controls.append(checkBtn,retryBtn);
  card.append(line,poolWrap,controls,msg);
  mount.appendChild(card);

  return {
    destroy(){ mount.removeChild(card); },
    check:doCheck,
    reset:()=>retryBtn.click()
  };
}
 

  /* ---------- Blanks ---------- */
  function renderBlanks({mount,model,idx,onScore}){
    ensureStyles();
    const params=model.params??model; const behaviour=params.behaviour??{};
    const caseSensitive=!!behaviour.caseSensitive; const acceptSpellingErrors=!!behaviour.acceptSpellingErrors;
    const title = asStr(params.title) || asStr(params.metadata?.title) || 'Fill in the blanks';
    const textItem = (isArr(params.questions)&&params.questions.length && typeof params.questions[0]==='string') ? asStr(params.questions[0]) : asStr(params.text);
    const {segments,blanks}=parseAsteriskBlanks(textItem,{caseSensitive});
    const card=el('div',{class:'card'}); const qNum=(idx!=null)?el('span',{class:'badge',text:'Q'+(idx+1)}):null; card.appendChild(el('div',{class:'q-title'},[qNum,qNum?el('span',{text:' '}):null,el('span',{text:title})]));
    const line=el('div',{class:'inline-text'}); const inputsById=new Map();
    segments.forEach(seg=>{ if(seg.type==='text'){ appendTextWithBreaks(line, seg.text); } else { const input=el('input',{class:'blank-input',attrs:{'data-id':seg.id,'aria-label':(asStr(params.inputLabel)||'Blank input')}}); inputsById.set(seg.id,{node:input,solutions:seg.solutions}); line.appendChild(input);} });
    const msg=el('div',{class:'msg'}); const controls=el('div',{class:'controls'}); const checkBtn=el('button',{class:'primary',text:(asStr(params.checkAnswer)||asStr(model.scoreShow)||'Check')}); const retryBtn=el('button',{text:(asStr(params.tryAgain)||asStr(model.tryAgain)||'Retry')}); if(behaviour.enableCheckButton===false) checkBtn.style.display='none'; if(behaviour.enableRetry===false) retryBtn.style.display='none';
    const evaluate=()=>{ let correct=0,total=blanks.length; inputsById.forEach(({node,solutions})=>{ const val=asStr(node.value??''); const ok=isMatch(val,solutions,{caseSensitive,acceptSpellingErrors}); node.classList.remove('blank-ok','blank-bad'); node.classList.add(ok?'blank-ok':'blank-bad'); if(ok) correct++; }); msg.className='msg '+(correct===total?'ok':'warn'); msg.textContent='Score: '+correct+'/'+total; onScore&&onScore({correct,total}); return {correct,total}; };
    checkBtn.addEventListener('click',()=>{ const requireAllFilled=!!params.showSolutionsRequiresInput; if(requireAllFilled){ const missing=[...inputsById.values()].some(({node})=>!node.value); if(missing){ msg.className='msg warn'; msg.textContent=asStr(params.notFilledOut)||'Please enter an answer.'; return; } } evaluate(); });
    retryBtn.addEventListener('click',()=>{ inputsById.forEach(({node})=>{ node.value=''; node.classList.remove('blank-ok','blank-bad'); }); msg.className='msg'; msg.textContent=''; 
	celebrateIfPerfect(card, correct, total);
	onScore&&onScore({correct:0,total:blanks.length}); });
    controls.append(checkBtn,retryBtn); card.append(line,controls,msg); mount.appendChild(card);
    return { destroy(){ mount.removeChild(card); }, check:evaluate, reset:()=>retryBtn.click() };
  }

  /* ---------- True/False ---------- */
  function renderTrueFalse({mount,model,idx,onScore}){ 
    ensureStyles(); const card=el('div',{class:'card'}); const qNum=(idx!=null)?el('span',{class:'badge',text:'Q'+(idx+1)}):null; const title = asStr(model.question) || 'True or False?'; 
    card.appendChild(el('div',{class:'q-title'},[qNum,qNum?el('span',{text:' '}):null,el('span',{text:title})])); 
    let answers=isArr(model.answers)?model.answers:null; 
    if(!answers){ const t=asStr(model?.l10n?.trueText)||'True'; const f=asStr(model?.l10n?.falseText)||'False'; const correct=!!model.correctAnswer; answers=[{text:t,correct},{text:f,correct:!correct}]; } 
    const name='tf_'+Math.random().toString(36).slice(2); const answersDiv=el('div',{class:'answers'}); 
    answers.forEach((a)=>{ const input=el('input',{attrs:{type:'radio',name}}); const label=el('label',{},[ input, el('span',{text:asStr(a.text??a)}) ]); answersDiv.appendChild(label); }); 
    card.appendChild(answersDiv); const msg=el('div',{class:'msg'}); const controls=el('div',{class:'controls'}); 
    const checkBtn=el('button',{class:'primary',text:(asStr(model.checkAnswer)||asStr(model.scoreShow)||'Check')}); const resetBtn=el('button',{text:(asStr(model.tryAgain)||'Reset')}); 
    controls.append(checkBtn,resetBtn); card.append(controls,msg);
    const doCheck=()=>{ const inputs=answersDiv.querySelectorAll('input[type=radio]'); const sel=Array.from(inputs).find(i=>i.checked); if(!sel){ msg.className='msg warn'; msg.textContent='Select an answer first.'; onScore&&onScore({correct:0,total:1}); return {correct:0,total:1}; } const idx=Array.from(inputs).indexOf(sel); const ok=!!answers[idx].correct; msg.className='msg '+(ok?'ok':'warn'); msg.textContent= ok?'Correct!':'Incorrect.'; 
	
	const resOk = ok ? 1 : 0;
celebrateIfPerfect(card, resOk, 1);
	
	onScore&&onScore({correct:ok?1:0,total:1}); return {correct:ok?1:0,total:1}; };
    checkBtn.addEventListener('click',()=>doCheck()); 
    resetBtn.addEventListener('click',()=>{ answersDiv.querySelectorAll('input').forEach(i=>i.checked=false); msg.className='msg'; msg.textContent=''; }); 
    mount.appendChild(card); 
    return { destroy(){ mount.removeChild(card); }, check:doCheck, reset:()=>resetBtn.click() };
  }

  /* ---------- MultiChoice ---------- */
  function renderMultiChoice({mount,model,idx,onScore}){ 
    ensureStyles(); const single=!!(model?.behaviour?.singleAnswer||model?.behaviour?.single===true); 
    const card=el('div',{class:'card'}); const qNum=idx!=null?el('span',{class:'badge',text:'Q'+(idx+1)}):null; 
    const title=asStr(model.question)||(single?'Choose one':'Choose all that apply'); 
    card.appendChild(el('div',{class:'q-title'},[qNum,qNum?el('span',{text:' '}):null,el('span',{text:title})])); 
    const answers=(model.answers??[]).map(a=>({text:asStr(a.text??a),correct:!!a.correct})); 
    const name='mc_'+Math.random().toString(36).slice(2); const answersDiv=el('div',{class:'answers'}); 
    answers.forEach((a)=>{ const input=el('input',{attrs:{type:single?'radio':'checkbox',name}}); const label=el('label',{},[ input, el('span',{text:a.text}) ]); answersDiv.appendChild(label); }); 
    card.appendChild(answersDiv); const msg=el('div',{class:'msg'}); const controls=el('div',{class:'controls'}); 
    const checkBtn=el('button',{class:'primary',text:(asStr(model.checkAnswer)||asStr(model.scoreShow)||'Check')}); const resetBtn=el('button',{text:(asStr(model.tryAgain)||'Reset')}); 
    controls.append(checkBtn,resetBtn); card.append(controls,msg);
    const doCheck=()=>{ const inputs=answersDiv.querySelectorAll('input'); const state=Array.from(inputs).map((i,idx)=>({checked:i.checked,correct:answers[idx].correct})); 
      if(single){ const chosen=state.find(x=>x.checked); if(!chosen){ msg.className='msg warn'; msg.textContent='Select an answer first.'; onScore&&onScore({correct:0,total:1}); return {correct:0,total:1}; } 
        const ok=!!chosen.correct; msg.className='msg '+(ok?'ok':'warn'); msg.textContent= ok?'Correct!':'Incorrect.'; onScore&&onScore({correct:ok?1:0,total:1}); return {correct:ok?1:0,total:1}; 
      } else { const totalCorrect=state.filter(x=>x.correct).length; const pickedCorrect=state.filter(x=>x.correct&&x.checked).length; const pickedIncorrect=state.filter(x=>!x.correct&&x.checked).length; const ok=pickedCorrect===totalCorrect && pickedIncorrect===0; msg.className='msg '+(ok?'ok':'warn'); msg.textContent= ok?('Correct! ('+pickedCorrect+'/'+totalCorrect+')'):('Not quite. You selected '+pickedIncorrect+' incorrect.');
const resOk = ok ? 1 : 0;
celebrateIfPerfect(card, resOk, 1);
	  onScore&&onScore({correct:ok?1:0,total:1}); return {correct:ok?1:0,total:1}; } };
    checkBtn.addEventListener('click',()=>doCheck()); 
    resetBtn.addEventListener('click',()=>{ answersDiv.querySelectorAll('input').forEach(i=>i.checked=false); msg.className='msg'; msg.textContent=''; }); 
    mount.appendChild(card); 
    return { destroy(){ mount.removeChild(card); }, check:doCheck, reset:()=>resetBtn.click() };
  }

  /* ---------- SingleChoiceSet ---------- */
  function renderSingleChoiceSet({mount,model,onScore}){ 
    ensureStyles(); const items=(model.questions??[]).map(q=>({ question:asStr(q.question)||'Question', answers:(q.answers??[]).map(a=>({ text:asStr(a.text??a), correct:!!a.correct })) })); 
    let current=0; let correct=0; const total=items.length; 
    const card=el('div',{class:'card'}); const header=el('div',{class:'q-title'}); const answersDiv=el('div',{class:'answers'}); const msg=el('div',{class:'msg'}); 
    const nav=el('div',{class:'nav'}); const prevBtn=el('button',{text:'Prev'}); const nextBtn=el('button',{text:'Next'}); const submitBtn=el('button',{class:'primary',text:'Submit set'}); 
    nav.append(prevBtn,nextBtn,submitBtn); const scoreLine=el('div',{class:'scoreline'}); 
    const renderItem=()=>{ const q=items[current]; header.textContent='Q'+(current+1)+'/'+total+': '+q.question; answersDiv.innerHTML=''; msg.className='msg'; msg.textContent=''; const name='scs_'+Math.random().toString(36).slice(2); q.answers.forEach((a)=>{ const input=el('input',{attrs:{type:'radio',name}}); const label=el('label',{},[ input, el('span',{text:a.text}) ]); answersDiv.appendChild(label); }); prevBtn.disabled=(current===0); nextBtn.disabled=(current===total-1); }; 
    const checkAndTally=()=>{ const q=items[current]; const inputs=answersDiv.querySelectorAll('input[type=radio]'); const chosen=Array.from(inputs).find(i=>i.checked); if(!chosen){ msg.className='msg warn'; msg.textContent='Select an answer first.'; return false;} const idx=Array.from(inputs).indexOf(chosen); const ok=!!q.answers[idx].correct; msg.className='msg '+(ok?'ok':'warn'); msg.textContent= ok?'Correct.':'Incorrect.'; if(ok) correct++; return true; }; 
    prevBtn.addEventListener('click',()=>{ if(current>0){ current--; renderItem(); }}); 
    nextBtn.addEventListener('click',()=>{ checkAndTally(); if(current<total-1){ current++; renderItem(); } scoreLine.textContent='Progress: '+correct+'/'+total; }); 
    submitBtn.addEventListener('click',()=>{ checkAndTally(); const pct= total? Math.round((correct/total)*100):0; scoreLine.textContent='Score: '+correct+'/'+total+' ('+pct+'%)'; onScore&&onScore({correct,total}); }); 
    card.append(header,answersDiv,el('div',{class:'controls'},nav),msg,el('div',{class:'divider'}),scoreLine); mount.appendChild(card); renderItem(); 
    return { destroy(){ mount.removeChild(card); }, check:()=>({correct:0,total:0}), reset:()=>{ current=0; correct=0; renderItem(); scoreLine.textContent=''; msg.textContent=''; } };
  }

  
 function renderImage({mount,model,idx}){
	 ensureStyles(); const params=model.params||model; const file=(params.file||params.image||{}); const srcp=asStr(file.path||params.src||''); const alt=asStr(params.alt||params.title||''); const title=asStr(params.title)||'Image'; const card=el('div',{class:'card'}); const qNum=(idx!=null)?el('span',{class:'badge',text:'Q'+(idx+1)}):null; card.appendChild(el('div',{class:'q-title'},[qNum,qNum?el('span',{text:' '}):null,el('span',{text:title})])); const img=el('img',{class:'mhp-standalone-img',attrs:{src:srcp,alt:alt}}); card.appendChild(img); mount.appendChild(card); return { destroy(){ mount.removeChild(card); }, check:()=>({correct:0,total:0}), reset:()=>{} }; }
/* ---------- Essay ---------- */
  function renderEssay({mount,model,idx,onScore}){
  ensureStyles(); const params=model.params||model; const title=asStr(params.taskDescription)||'Essay question'; const caseSensitive=!!params.caseSensitive; const trim=params.trim!==false; const fullMatch=!!params.fullMatch; 
  const minMatches=Math.max(0, params.minMatches||1); const patterns=isArr(params.patterns)?params.patterns:[]; const weights=patterns.map(p=>p?.weight==null?1:Number(p?.weight)||0); const totalWeightBase=weights.reduce((a,b)=>a+b,0)||patterns.length||1; 
  const card=el('div',{class:'card'}); const qNum=(idx!=null)?el('span',{class:'badge',text:'Q'+(idx+1)}):null;
    
  card.appendChild(el('div',{class:'q-title'},[qNum,qNum?el('span',{text:' '}):null,el('span',{html:title})])); 
  const ta=el('textarea',{attrs:{rows: params.rows||5, 'aria-label':'Essay answer'}}); const controls=el('div',{class:'controls'}); 
  
  
  const checkBtn=el('button',{class:'primary',text: asStr(params.checkAnswer)||asStr(model.scoreShow)||'Check'}); const resetBtn=el('button',{text: asStr(params.tryAgain)||asStr(model.tryAgain)||'Reset'}); 
  controls.append(checkBtn,resetBtn); const msg=el('div',{class:'msg'}); card.append(ta,controls,msg); mount.appendChild(card); 

  const normalize=(s)=>{ s=asStr(s); if(trim) s=s.trim(); return caseSensitive? s : s.toLowerCase(); }; 
  const compile=(pat)=>{ try{ const source=asStr(pat?.regex||''); const flags=asStr(pat?.flags|| (caseSensitive?'':'i')); const re = fullMatch? new RegExp('^(?:'+source+')$', flags) : new RegExp(source, flags); return re; } catch(e){ return null; } }; 
  const regexes=patterns.map(compile); 
  

  // Keyword support (params.keywords: [{keyword, options:{points,occurrences,caseSensitive,forgiveMistakes,...}}])
  const keywords = isArr(params.keywords) ? params.keywords : [];
  
  // Pre-calc total keyword weight cap for pct; each keyword contributes up to its points*occurrences
  const totalKeywordCap = keywords.reduce((sum,k)=>{
    const pts = Number(k?.options?.points)||0; const occ = Math.max(1, Number(k?.options?.occurrences)||1);
    return sum + (pts*occ);
  },0);
  const totalWeight = totalWeightBase + totalKeywordCap;

  function countKeywordHits(answer, k){
  const word = asStr(k?.keyword||'');
  
  if(!word) return {hits:0,score:0};
  const opt = k.options||{};
  const pts = Number(opt.points)||0;
  const maxOcc = Math.max(1, Number(opt.occurrences)||1);
  const kwCase = !!opt.caseSensitive;
  const forgive = !!opt.forgiveMistakes;

  // Prepare haystack and needle according to case preference
  const hay = kwCase ? asStr(answer) : asStr(answer).toLowerCase();
  	
  const needle = kwCase ? word : word.toLowerCase();

  // Escape keyword for literal regex match; match anywhere (no word boundaries), global
  let hits = 0;
  try{
    //const esc = needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
	const esc = needle.replace(/\//g,''); // stip / from front and back  - lazy
	console.log("Esc");
	//console.log(needle);
	console.log(esc);
    const re = new RegExp(esc, kwCase?'g':'gi');
	//const re = new RegExp(needle, kwCase?'g':'gi');
    const m = hay.match(re);
    if(m) hits = Math.min(m.length, maxOcc);
  }catch(_){ /* ignore malformed regex cases */ }

  // If forgiving and under quota, try approximate matches
  if(forgive && hits < maxOcc){
    const remaining = maxOcc - hits;
    let add = 0;

    // Tokenize (Unicode letters/digits/apostrophes kept together)
    const tokens = hay.split(/[^\p{L}\p{N}']+/u).filter(Boolean);

    // Helper: count near-matches in tokens (distance ≤ 1, length ≥ 4)
    const nearMatchToken = (t, needle)=>{
      if(Math.max(t.length, needle.length) < 4) return false;
      return levenshtein(t, needle) <= 1;
    };

    // 1) Direct per-token near matches
    for(let i=0;i<tokens.length && add<remaining;i++){
      if(nearMatchToken(tokens[i], needle)) add++;
    }

    // 2) If still short, slide a window over tokens to catch embedded/camelCase-like forms
    if(add < remaining){
      const want = remaining - add;
      for(let i=0;i<tokens.length && add<want;i++){
        const t = tokens[i];
        if(t.length < needle.length) continue;
        // Slide window of same length as needle
        for(let j=0;j<=t.length-needle.length && add<want;j++){
          const sub = t.slice(j, j+needle.length);
          if(nearMatchToken(sub, needle)) add++;
        }
      }
    }

    hits += add;
  }

  const score = hits * pts;
  return {hits,score};
}
  

  const doCheck=()=>{ 
    
	const raw = asStr(ta.value); const ans=normalize(raw); 
	
    if(!ans){ 
		msg.className='msg warn'; msg.textContent= asStr(params.missingText)||'Please enter an answer.'; onScore&&onScore({correct:0,total:1}); return {correct:0,total:1}; 
	} 

    // Regex scoring (existing)
    let matchCount=0, scoreWeight=0;
    regexes.forEach((re,i)=>{ if(!re) return; if(re.test(ans)){ matchCount++; scoreWeight+=weights[i]; } });
		
    // Keyword scoring (new)
    let keywordHits = 0; let keywordScore = 0;
    if(keywords.length){
      keywords.forEach(k=>{
        const r = countKeywordHits(raw, k); // use raw for caseSensitive branch; function normalizes internally
		console.log("countKeywordHits");
		console.log(k);
		console.log(r);
        keywordHits += r.hits;
        keywordScore += r.score;
      });
    }

    const totalMatches = matchCount + keywordHits;
    scoreWeight += keywordScore;

    const ok = totalMatches>=minMatches;
    const pct = Math.round((scoreWeight/((totalWeight||1)))*100);

    msg.className='msg '+(ok?'ok':'warn'); 
    msg.textContent= ok? 'Good.' : 'Not enough key points.'; 
    onScore&&onScore({correct: ok?1:0, total:1, detail:{matchCount,totalMatches,pct,keywordHits,keywordScore}}); 
    return {correct: ok?1:0, total:1}; 
  };

  checkBtn.addEventListener('click',()=>doCheck()); 
  resetBtn.addEventListener('click',()=>{ ta.value=''; msg.className='msg'; msg.textContent=''; onScore&&onScore({correct:0,total:1}); }); 
  return { destroy(){ mount.removeChild(card); }, check:doCheck, reset:()=>resetBtn.click() }; 
}



function renderDragNDrop({mount, model, idx, onScore}){
  ensureStyles();

  // Accept either flat params or nested under .question
  const root = model && model.params ? model.params : model;
  const q    = root && root.question ? root.question : root;

  const settings   = q && q.settings ? q.settings : {};
  const task       = q && q.task ? q.task : {};
  const elements   = Array.isArray(task.elements) ? task.elements : [];
  const dropZones  = Array.isArray(task.dropZones) ? task.dropZones : [];

  // Behaviour/labels can live at the root params (outside q)
  const behaviour  = (model && model.behaviour) || (root && root.behaviour) || {};
  const checkLabel = asStr(root && root.scoreShow) || asStr(root && root.checkAnswer) || 'Check';
  const retryLabel = asStr(root && root.tryAgain)  || 'Retry';

  // NEW: normalize odd quotes used by authoring tools (〃, “ ”, « », etc.)
  const normalizeAuthorQuotes = (s)=>{
    // Replace known “fancy”/corner quotes with straight quotes
    // U+301D, U+301E, U+301F are corner quotes; 〃 is U+3003
    return asStr(s)
      .replace(/[\u301D\u301E\u301F\u3003“”„«»]/g, '"')
      .replace(/&quot;/g, '"'); // in case content already HTML-escaped
  };

  const zoneScale = Number((behaviour && behaviour.zoneScale) ?? (settings && settings.zoneScale) ?? 1) || 1;
  const tokenScale = Number((behaviour && behaviour.tokenScale) ?? (settings && settings.tokenScale) ?? 1) || 1;
  const autoSize = (behaviour && behaviour.autoSizeTokens) !== false;
  const maxPct = Number((behaviour && behaviour.maxTokenWidthPct) ?? 40) || 40;
  const minPct = Number((behaviour && behaviour.minTokenWidthPct) ?? 8) || 8;

  const card = el('div',{class:'card'});
  const qNum=(idx!=null)?el('span',{class:'badge',text:'Q'+(idx+1)}):null;
  card.appendChild(el('div',{class:'q-title'},[
    qNum, qNum?el('span',{text:' '}):null, el('span',{text: asStr(model.title)||'Drag & Drop'})
  ]));
  const canvas = el('div',{class:'mhp-canvas',attrs:{'aria-label':'Drag and Drop canvas'}});
  const aspect = (settings.size && settings.size.height && settings.size.width) ? (settings.size.height/settings.size.width) : (310/620);
  canvas.style.width='100%';
  canvas.style.paddingTop=(aspect*100)+'%';
  const abs=el('div',{attrs:{style:'position:absolute; inset:0;'}});
  canvas.appendChild(abs);

  if (settings.background && settings.background.path)
    abs.appendChild(el('img',{class:'mhp-bg',attrs:{src:settings.background.path,alt:''}}));

  const zoneState=new Map();
  dropZones.forEach((dz,zi)=>{
    const div=el('div',{class:'mhp-zone'});
    positionBox(div,dz,true,zoneScale,1);
    const content=el('div',{class:'mhp-zone-content'});
    if(dz.showLabel){
      // Normalize quotes in zone labels too, then decode
      content.innerHTML = htmlDecode(normalizeAuthorQuotes(asStr(dz.label||'')));
    }
    div.appendChild(content);
    div.setAttribute('data-zone',String(zi));
    div.addEventListener('dragover',e=>{e.preventDefault(); div.classList.add('hover');});
    div.addEventListener('dragleave',()=>div.classList.remove('hover'));
    div.addEventListener('drop',e=>{ e.preventDefault(); div.classList.remove('hover'); const eid=e.dataTransfer?.getData('text/plain'); if(!eid) return; handlePlace(div,eid); });
    abs.appendChild(div);
    zoneState.set(String(zi), dz.single? null : new Set());
  });

  const itemNodes=new Map();
  const itemText=new Map();

  elements.forEach((elItem,ei)=>{

    const id=String(ei);
    const lib=nameOf(elItem?.type?.library||elItem?.type);
    const isAdvText=(lib==='H5P.AdvancedText');
    const isImage=(lib==='H5P.Image');
    const hasTargets=Array.isArray(elItem?.dropZones) && elItem.dropZones.length>0;

    const plain=toPlainText(elItem?.type?.params?.text||'');
    itemText.set(id, plain);

    const host=el('div',{class:'mhp-item',attrs:{'data-eid':id}});
    positionBox(host,elItem,false,1,tokenScale);

    // Static AdvancedText (no drop zones): render as label, prefer params.html
    if(isAdvText && !hasTargets){
      const raw = (elItem?.type?.params?.html != null && elItem.type.params.html !== '')
        ? asStr(elItem.type.params.html)
        : asStr(elItem?.type?.params?.text || '');

      // Normalize author quotes BEFORE decoding, so style attributes aren't broken
      const html = htmlDecode(normalizeAuthorQuotes(raw));

      const label = el('div', { class: 'mhp-label', html });
      host.appendChild(label);
      abs.appendChild(host);
      itemNodes.set(id, host);
      return;
    }

    // Images unchanged...
    if(isImage){
      const file=(elItem?.type?.params?.file||{});
      const srcp=asStr(file.path||'');
      const alt=asStr(elItem?.type?.params?.alt||'');
      if(!hasTargets){
        const img=el('img',{class:'mhp-img',attrs:{src:srcp,alt:alt}});
        host.appendChild(img);
        abs.appendChild(host);
        itemNodes.set(id, host);
        return;
      } else {
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='mhp-token';
        btn.draggable=true;
        const img=document.createElement('img');
        img.className='mhp-token-img';
        img.src=srcp;
        img.alt=alt;
        btn.appendChild(img);
        btn.addEventListener('dragstart',e=>{
          if(host.classList.contains('assigned')){ e.preventDefault(); return; }
          e.dataTransfer.setData('text/plain', id);
        });
        host.appendChild(btn);
        abs.appendChild(host);
        itemNodes.set(id, host);
        return;
      }
    }

    // Default: text token
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='mhp-token';
    btn.draggable=true;
    btn.textContent=plain;
    btn.addEventListener('dragstart',e=>{
      if(host.classList.contains('assigned')){ e.preventDefault(); return; }
      e.dataTransfer.setData('text/plain', id);
    });
    host.appendChild(btn);
    abs.appendChild(host);
    itemNodes.set(id, host);
  });

  function positionBox(node, spec, isZone, zoneScaleX, tokenScaleX){
    const x=Number(spec.x)||0, y=Number(spec.y)||0;
    let w=Number(spec.width)||10, h=Number(spec.height)||4;
    if(isZone && zoneScaleX && zoneScaleX!==1){ w*=zoneScaleX; h*=zoneScaleX; }
    if(!isZone && tokenScaleX && tokenScaleX!==1){ w*=tokenScaleX; h*=tokenScaleX; }
    node.style.position='absolute';
    node.style.left=x+'%'; node.style.top=y+'%';
    node.style.width=w+'%'; node.style.height=h+'%';
  }

  function autosizeTokens(){
    if(!autoSize) return;
    const canvasW = abs.getBoundingClientRect().width || 0;
    if(!canvasW) return;
    elements.forEach((elItem, ei)=>{
      const id=String(ei);
      const host=itemNodes.get(id);
      if(!host) return;
      const btn=host.querySelector('.mhp-token');
      if(!btn) return;
      btn.style.width='auto';
      btn.style.height='auto';
      btn.style.whiteSpace='normal';
      btn.style.wordBreak='break-word';
      const needW = Math.min(Math.max(btn.scrollWidth+20, (minPct/100)*canvasW), (maxPct/100)*canvasW);
      const needH = Math.max(btn.scrollHeight+20, 36);
      const wPct = (needW / canvasW)*100;
      const hPct = (needH / canvasW)*100 * (canvasW / (abs.getBoundingClientRect().height||canvasW));
      const spec = elements[ei];
      positionBox(host, { x: spec.x, y: spec.y, width: wPct, height: Math.max((spec.height||4), hPct) }, false, 1, 1);
    });
  }

  // Resize handling with fallback
  let ro = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(()=>autosizeTokens());
    ro.observe(abs);
  } else {
    window.addEventListener('resize', autosizeTokens);
  }
  setTimeout(()=>autosizeTokens(), 0);

  function removeChip(chip){
    const eid=chip.getAttribute('data-eid');
    const zone=chip.closest('.mhp-zone');
    const key=zone.getAttribute('data-zone');
    const dz=dropZones[Number(key)];
    chip.remove();
    zone.classList.remove('blank-ok','blank-bad');
    if(dz.single){ zoneState.set(key,null);}
    else { const set=zoneState.get(key); if(set) set.delete(eid); }
    const host=itemNodes.get(eid);
    host&&host.classList.remove('assigned');
    if(!zone.querySelector('.mhp-chip')) zone.classList.remove('filled');
  }

  function unassignFromZones(eid){
    abs.querySelectorAll('.mhp-chip[data-eid="'+eid+'"]').forEach(ch=>removeChip(ch));
  }

  function handlePlace(zoneNode,eid){
    const key=zoneNode.getAttribute('data-zone');
    const dz=dropZones[Number(key)];
    unassignFromZones(eid);
    if(dz.single){
      const existing=zoneNode.querySelector('.mhp-chip');
      if(existing) removeChip(existing);
      zoneState.set(key,eid);
    } else {
      const set=zoneState.get(key)||new Set();
      set.add(eid);
      zoneState.set(key,set);
    }
    const chip=document.createElement('button');
    chip.type='button';
    chip.className='mhp-chip';
    chip.setAttribute('data-eid',eid);
    chip.textContent=asStr(itemText.get(eid));
    chip.addEventListener('click',()=>removeChip(chip));
    const content=zoneNode.querySelector('.mhp-zone-content')||zoneNode;
    content.appendChild(chip);
    zoneNode.classList.add('filled');
    zoneNode.classList.remove('blank-ok','blank-bad');
    const host=itemNodes.get(eid);
    host&&host.classList.add('assigned');
  }

  const msg=el('div',{class:'msg'});
  const controls=el('div',{class:'controls'});
  const checkBtn=el('button',{class:'primary',text:checkLabel});
  const retryBtn=el('button',{text:retryLabel});
  controls.append(checkBtn,retryBtn);
  const scoreLine=el('div',{class:'scoreline'});

  const doCheck=()=>{
    let correct=0,incorrect=0;
	dropZones.forEach((dz, zi) => {
	  const key = String(zi);
	  const zoneNode = abs.querySelector('.mhp-zone[data-zone="'+key+'"]');

	  // Expected ids for this zone
	  const expected = new Set((dz.correctElements || []).map(asStr));

	  // What’s placed in the zone now
	  const chips = zoneNode.querySelectorAll('.mhp-chip');
	  const placed = new Set(Array.from(chips, ch => asStr(ch.getAttribute('data-eid'))));

	  // Tally scoring per your spec: +1 correct placement, -1 incorrect (penalty applied later)
	  // Count corrects for chips that are expected; count incorrect for extras
	  chips.forEach(ch => {
		const id = asStr(ch.getAttribute('data-eid'));
		if (expected.has(id)) correct++; else incorrect++;
	  });

	  // Visual state: zone is OK only if ALL expected are present and there are NO extras
	  // i.e., placed == expected (set equality)
	  const hasAllExpected = Array.from(expected).every(id => placed.has(id));
	  const noExtras = Array.from(placed).every(id => expected.has(id));
	  const zoneOk = hasAllExpected && noExtras && chips.length > 0;

	  zoneNode.classList.remove('blank-ok','blank-bad');
	  if (zoneOk) {
		zoneNode.classList.add('blank-ok');
	  } else if (chips.length > 0 || expected.size > 0) {
		// Mark bad if there are any chips placed or there was an expectation not met
		zoneNode.classList.add('blank-bad');
	  }
	});
	
    let score=correct-((behaviour.applyPenalties)?incorrect:0);
    if(score<0) score=0;
    const total=dropZones.reduce((acc,dz)=>acc+(dz.single?1:(dz.correctElements||[]).length),0);
    msg.className='msg '+(incorrect===0 && score===total ? 'ok':'warn');
    msg.textContent='Score: '+score+'/'+total;
    if(model.scoreExplanation && behaviour.enableScoreExplanation){
      scoreLine.textContent=asStr(model.scoreExplanation);
    } else { scoreLine.textContent=''; }
	celebrateIfPerfect(card,score,total);
    onScore&&onScore({correct:score,total});
    return {correct:score,total};
  };

  checkBtn.addEventListener('click',()=>doCheck());

  const doReset=()=>{
    abs.querySelectorAll('.mhp-chip').forEach(ch=>ch.remove());
    dropZones.forEach((dz,zi)=>{
      const key=String(zi);
      zoneState.set(key, dz.single? null : new Set());
      const zoneNode=abs.querySelector('.mhp-zone[data-zone="'+key+'"]');
      if(zoneNode) zoneNode.className='mhp-zone';
    });
    itemNodes.forEach(host=>host.classList.remove('assigned'));
    msg.className='msg';
    msg.textContent='';
    scoreLine.textContent='';
    autosizeTokens();
    onScore&&onScore({correct:0,total:dropZones.length});
  };
  retryBtn.addEventListener('click',()=>doReset());

  card.append(canvas,controls,msg,scoreLine);
  mount.appendChild(card);
  return {
    destroy(){ if (ro) ro.disconnect(); else window.removeEventListener('resize', autosizeTokens); mount.removeChild(card); },
    check:doCheck,
    reset:doReset
  };
}

  /* ---------- DragNDrop (with ResizeObserver fallback) ---------- */
  function pld_renderDragNDrop({mount, model, idx, onScore}){
    ensureStyles(); 
	
  // Accept either flat params or nested under .question
  const root = model && model.params ? model.params : model;
  const q    = root && root.question ? root.question : root;

  const settings   = q && q.settings ? q.settings : {};
  const task       = q && q.task ? q.task : {};
  const elements   = Array.isArray(task.elements) ? task.elements : [];
  const dropZones  = Array.isArray(task.dropZones) ? task.dropZones : [];

  // Behaviour/labels can live at the root params (outside q)
  const behaviour  = (model && model.behaviour) || (root && root.behaviour) || {};
  const checkLabel = asStr(root && root.scoreShow) || asStr(root && root.checkAnswer) || 'Check';
  const retryLabel = asStr(root && root.tryAgain)  || 'Retry';
 
	
	
    const zoneScale = Number((behaviour && behaviour.zoneScale) ?? (settings && settings.zoneScale) ?? 1) || 1;
    const tokenScale = Number((behaviour && behaviour.tokenScale) ?? (settings && settings.tokenScale) ?? 1) || 1;
    const autoSize = (behaviour && behaviour.autoSizeTokens) !== false; const maxPct = Number((behaviour && behaviour.maxTokenWidthPct) ?? 40) || 40; const minPct = Number((behaviour && behaviour.minTokenWidthPct) ?? 8) || 8;
    
    const card = el('div',{class:'card'}); const qNum=(idx!=null)?el('span',{class:'badge',text:'Q'+(idx+1)}):null; card.appendChild(el('div',{class:'q-title'},[qNum,qNum?el('span',{text:' '}):null,el('span',{text: asStr(model.title)||'Drag & Drop'})]));
    const canvas = el('div',{class:'mhp-canvas',attrs:{'aria-label':'Drag and Drop canvas'}}); const aspect = (settings.size && settings.size.height && settings.size.width) ? (settings.size.height/settings.size.width) : (310/620); canvas.style.width='100%'; canvas.style.paddingTop=(aspect*100)+'%'; const abs=el('div',{attrs:{style:'position:absolute; inset:0;'}}); canvas.appendChild(abs);
    if (settings.background && settings.background.path) abs.appendChild(el('img',{class:'mhp-bg',attrs:{src:settings.background.path,alt:''}}));

    const zoneState=new Map(); dropZones.forEach((dz,zi)=>{ const div=el('div',{class:'mhp-zone'}); positionBox(div,dz,true,zoneScale,1); const content=el('div',{class:'mhp-zone-content'}); if(dz.showLabel){ content.innerHTML=htmlDecode(asStr(dz.label||'')); } div.appendChild(content); div.setAttribute('data-zone',String(zi)); div.addEventListener('dragover',e=>{e.preventDefault(); div.classList.add('hover');}); div.addEventListener('dragleave',()=>div.classList.remove('hover')); div.addEventListener('drop',e=>{ e.preventDefault(); div.classList.remove('hover'); const eid=e.dataTransfer?.getData('text/plain'); if(!eid) return; handlePlace(div,eid); }); abs.appendChild(div); zoneState.set(String(zi), dz.single? null : new Set()); });

    const itemNodes=new Map(); const itemText=new Map();
    elements.forEach((elItem,ei)=>{

		


		const id=String(ei); 
		const lib=nameOf(elItem?.type?.library||elItem?.type); 
		const isAdvText=(lib==='H5P.AdvancedText'); 
		const isImage=(lib==='H5P.Image'); 
		
		const hasTargets=Array.isArray(elItem?.dropZones)&&elItem.dropZones.length>0; 
		
		
		const plain=toPlainText(elItem?.type?.params?.text||''); itemText.set(id, plain); 
		const host=el('div',{class:'mhp-item',attrs:{'data-eid':id}}); positionBox(host,elItem,false,1,tokenScale); 
		if(isAdvText && !hasTargets){ 
		
			const raw = (elItem?.type?.params?.html != null && elItem.type.params.html !== '')
				? asStr(elItem.type.params.html)
				: asStr(elItem?.type?.params?.text || '');

			  // If you ever add params.rawHtml === true, you can skip htmlDecode here
			  const html = htmlDecode(raw);

			  const label = el('div', { class: 'mhp-label', html });
			  host.appendChild(label);
			  abs.appendChild(host);
			  itemNodes.set(id, host);
			  return;
			
		} 
		if(isImage){ const file=(elItem?.type?.params?.file||{}); const srcp=asStr(file.path||''); const alt=asStr(elItem?.type?.params?.alt||''); if(!hasTargets){ const img=el('img',{class:'mhp-img',attrs:{src:srcp,alt:alt}}); host.appendChild(img); abs.appendChild(host); itemNodes.set(id, host); return; } else { const btn=document.createElement('button'); btn.type='button'; btn.className='mhp-token'; btn.draggable=true; const img=document.createElement('img'); img.className='mhp-token-img'; img.src=srcp; img.alt=alt; btn.appendChild(img); btn.addEventListener('dragstart',e=>{ if(host.classList.contains('assigned')){ e.preventDefault(); return; } e.dataTransfer.setData('text/plain', id); }); host.appendChild(btn); abs.appendChild(host); itemNodes.set(id, host); return; } } const btn=document.createElement('button'); btn.type='button'; btn.className='mhp-token'; btn.draggable=true; btn.textContent=plain; btn.addEventListener('dragstart',e=>{ if(host.classList.contains('assigned')){ e.preventDefault(); return; } e.dataTransfer.setData('text/plain', id); }); host.appendChild(btn); abs.appendChild(host); itemNodes.set(id, host); });

    function positionBox(node, spec, isZone, zoneScaleX, tokenScaleX){ const x=Number(spec.x)||0, y=Number(spec.y)||0; let w=Number(spec.width)||10, h=Number(spec.height)||4; if(isZone && zoneScaleX && zoneScaleX!==1){ w*=zoneScaleX; h*=zoneScaleX; } if(!isZone && tokenScaleX && tokenScaleX!==1){ w*=tokenScaleX; h*=tokenScaleX; } node.style.position='absolute'; node.style.left=x+'%'; node.style.top=y+'%'; node.style.width=w+'%'; node.style.height=h+'%'; }

    function autosizeTokens(){ if(!autoSize) return; const canvasW = abs.getBoundingClientRect().width || 0; if(!canvasW) return; elements.forEach((elItem, ei)=>{ const id=String(ei); const host=itemNodes.get(id); if(!host) return; const btn=host.querySelector('.mhp-token'); if(!btn) return; btn.style.width='auto'; btn.style.height='auto'; btn.style.whiteSpace='normal'; btn.style.wordBreak='break-word'; const needW = Math.min(Math.max(btn.scrollWidth+20, (minPct/100)*canvasW), (maxPct/100)*canvasW); const needH = Math.max(btn.scrollHeight+20, 36); const wPct = (needW / canvasW)*100; const hPct = (needH / canvasW)*100 * (canvasW / (abs.getBoundingClientRect().height||canvasW)); const spec = elements[ei]; positionBox(host, { x: spec.x, y: spec.y, width: wPct, height: Math.max((spec.height||4), hPct) }, false, 1, 1); }); }

    // Resize handling with fallback
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(()=>autosizeTokens());
      ro.observe(abs);
    } else {
      window.addEventListener('resize', autosizeTokens);
    }
    setTimeout(()=>autosizeTokens(), 0);


    function removeChip(chip){ const eid=chip.getAttribute('data-eid'); const zone=chip.closest('.mhp-zone'); const key=zone.getAttribute('data-zone'); const dz=dropZones[Number(key)]; chip.remove(); zone.classList.remove('blank-ok','blank-bad'); if(dz.single){ zoneState.set(key,null);} else { const set=zoneState.get(key); if(set) set.delete(eid);} const host=itemNodes.get(eid); host&&host.classList.remove('assigned'); if(!zone.querySelector('.mhp-chip')) zone.classList.remove('filled'); }
	
    function unassignFromZones(eid){ abs.querySelectorAll('.mhp-chip[data-eid="'+eid+'"]').forEach(ch=>removeChip(ch)); }
    function handlePlace(zoneNode,eid){ const key=zoneNode.getAttribute('data-zone'); const dz=dropZones[Number(key)]; unassignFromZones(eid); if(dz.single){ const existing=zoneNode.querySelector('.mhp-chip'); if(existing) removeChip(existing); zoneState.set(key,eid);} else { const set=zoneState.get(key)||new Set(); set.add(eid); zoneState.set(key,set);} const chip=document.createElement('button'); chip.type='button'; chip.className='mhp-chip'; chip.setAttribute('data-eid',eid); chip.textContent=asStr(itemText.get(eid)); chip.addEventListener('click',()=>removeChip(chip)); const content=zoneNode.querySelector('.mhp-zone-content')||zoneNode; content.appendChild(chip); zoneNode.classList.add('filled'); zoneNode.classList.remove('blank-ok','blank-bad'); const host=itemNodes.get(eid); host&&host.classList.add('assigned'); }

    const msg=el('div',{class:'msg'}); const controls=el('div',{class:'controls'}); const checkBtn=el('button',{class:'primary',text:checkLabel}); const retryBtn=el('button',{text:retryLabel}); controls.append(checkBtn,retryBtn); const scoreLine=el('div',{class:'scoreline'});
    const doCheck=()=>{ let correct=0,incorrect=0; 
		dropZones.forEach((dz,zi)=>{ 
			const key=String(zi); const zoneNode=abs.querySelector('.mhp-zone[data-zone="'+key+'"]'); const expected=new Set((dz.correctElements||[]).map(asStr)); const chips=zoneNode.querySelectorAll('.mhp-chip'); 
			let bad=false; 
			chips.forEach(ch=>{ 
				const ceid=asStr(ch.getAttribute('data-eid')); 
				const ok=expected.has(ceid); 
				ok?correct++:(incorrect++,bad=true);
			}); 
			zoneNode.classList.remove('blank-ok','blank-bad'); 
			if (bad) { 
				zoneNode.classList.add('blank-bad'); 
			} else if (correct>0) {
				zoneNode.classList.add('blank-ok'); 
			}
			//zoneNode.classList.add(bad?'blank-bad':'blank-ok'); // incorrectly marks empty ones correct
		}); 
		
		let score=correct-((behaviour.applyPenalties)?incorrect:0); 
		if(score<0) score=0; const total=dropZones.reduce((acc,dz)=>acc+(dz.single?1:(dz.correctElements||[]).length),0); msg.className='msg '+(incorrect===0 && score===total ? 'ok':'warn'); msg.textContent='Score: '+score+'/'+total; if(model.scoreExplanation && behaviour.enableScoreExplanation){ scoreLine.textContent=asStr(model.scoreExplanation);} else { scoreLine.textContent=''; } onScore&&onScore({correct:score,total}); return {correct:score,total}; 
	};
    checkBtn.addEventListener('click',()=>doCheck());
    const doReset=()=>{ abs.querySelectorAll('.mhp-chip').forEach(ch=>ch.remove()); dropZones.forEach((dz,zi)=>{ const key=String(zi); zoneState.set(key, dz.single? null : new Set()); const zoneNode=abs.querySelector('.mhp-zone[data-zone="'+key+'"]'); if(zoneNode) zoneNode.className='mhp-zone'; }); itemNodes.forEach(host=>host.classList.remove('assigned')); msg.className='msg'; msg.textContent=''; scoreLine.textContent=''; autosizeTokens(); onScore&&onScore({correct:0,total:dropZones.length}); };
    retryBtn.addEventListener('click',()=>doReset());

    card.append(canvas,controls,msg,scoreLine); mount.appendChild(card); 
    return { destroy(){ if (ro) ro.disconnect(); else window.removeEventListener('resize', autosizeTokens); mount.removeChild(card); }, check:doCheck, reset:doReset };
  }

// ---------- AdvancedText (accepts HTML) ----------
function renderAdvancedText({mount,model}){
  ensureStyles();
  const params = model.params || model;

  // Prefer params.html if present; fallback to params.text
  // If authors store already-encoded HTML (e.g., via H5P), htmlDecode keeps it safe/consistent
  const hasHtml = params.html != null && params.html !== '';
  const raw = hasHtml ? asStr(params.html) : asStr(params.text || '');

  // Optional: allow authors to signal their string is already safe HTML and skip decoding
  const useRaw = !!params.rawHtml; // default false
  const html = useRaw ? raw : htmlDecode(raw);

  const card = el('div',{class:'card'});
  // Title: prefer explicit title if provided; otherwise omit (AdvancedText is often decorative)
  const title = asStr(params.title || params.metadata?.title || '');
  if (title) {
    card.appendChild(el('div',{class:'q-title'},[
      el('span',{html:title})
    ]));
  }

  // Render as-is (innerHTML)
  const container = el('div');
  container.innerHTML = html;
  card.appendChild(container);

  mount.appendChild(card);
  return {
    destroy(){ mount.removeChild(card); },
    check: ()=>({correct:0,total:0}),
    reset: ()=>{}
  };
}

  /* ---------- QuestionSet ---------- */
  function renderQuestionSet({mount,model,onScore}){
    ensureStyles();
    const title = asStr(model.title) || 'Question Set';
    const texts = model.texts || {};
    const getTxt = (k, def) => asStr(texts[k] ?? def);
    const progressType = asStr(model.progressType || 'text').toLowerCase();
    const passPct = Number(model.passPercentage ?? 0) || 0;
    const disableBack = !!model.disableBackwardsNavigation;
    const randomQuestions = !!model.randomQuestions;
    const override = model.override || {};
    const introCfg = model.introPage || {};
    const endCfg = model.endGame || {};
    const showResultPage = endCfg.showResultPage !== false;

    const normalizeItem = (item)=>{
      if(item.library && item.params){ const type=String(item.library).split(/\s|-/)[0]; return {type, data:item.params}; }
      if(item.type) return {type:String(item.type).split(/\s|-/)[0], data:item};
      return {type:'H5P.AdvancedText', data:item};
    };
    let items=(model.questions??[]).map(normalizeItem);
    const poolSize=(typeof model.poolSize==='number'&&model.poolSize>0)? Math.min(model.poolSize,items.length) : null;
    if(randomQuestions) items = items.slice().sort(()=>Math.random()-0.5);
    if(poolSize && poolSize<items.length) items = items.slice(0,poolSize);

    const container = el('div',{class:'card qs-root'});
    const head = el('div',{class:'q-title',text:title});
    const progress = el('div',{class:'qs-progress'});
    const dotsWrap = el('div',{class:'dots'});
    const host = el('div',{class:'qs-host'});
    const controls = el('div',{class:'qs-controls'});
    const prevBtn = el('button',{text:getTxt('prevButton','Previous question')});
    const nextBtn = el('button',{text:getTxt('nextButton','Next question')});
    const finishBtn = el('button',{class:'primary',text:getTxt('finishButton','Finish')});
    //if (override.checkButton === false) host.classList.add('qs-hide-check');

    const doStart = ()=>{ container.replaceChildren(head, progress, host, controls); renderCurrent(); updateProgressUI(); };
    if (introCfg.showIntroPage) {
      const intro = el('div',{class:'qs-intro'},[
        el('div',{class:'intro-text', html: htmlDecode(asStr(introCfg.introduction||''))}),
        el('div',{class:'qs-controls'}, el('button',{class:'primary',text:asStr(introCfg.startButtonText)||'Start Quiz'}))
      ]);
      intro.querySelector('button').addEventListener('click', doStart);
      container.append(head,intro);
      mount.appendChild(container);
    } else {
      container.append(head, progress, host, controls);
      mount.appendChild(container);
    }

    controls.replaceChildren(prevBtn,nextBtn,finishBtn);
    prevBtn.disabled = disableBack;
    prevBtn.addEventListener('click',()=>{ if(disableBack) return; if(current>0){ goto(current-1); } });
    nextBtn.addEventListener('click',()=>{ if(current<items.length-1){ goto(current+1); } });
    finishBtn.addEventListener('click',()=>{ showResults(); });

    let current = 0;
    let furthest = 0;
    let childApi = null;
    const tally = items.map(()=>({correct:0,total:0,answered:false}));

    function mountChild(i){
      host.innerHTML='';
      const item=items[i];
      childApi = renderByType({
        mount:host,
        type:item.type,
        model:item.data,
        idx:i,
        onScore:(s)=>{
          tally[i].correct = s.correct;
          tally[i].total = s.total;
          tally[i].answered = true;
          updateProgressUI();
          emitScore();
        }
      });
    }

    function goto(i){
      current=i;
      if(current>furthest) furthest=current;
      mountChild(current);
      updateButtons();
      updateProgressUI();
    }
    function updateButtons(){
      prevBtn.disabled = disableBack || current===0;
      nextBtn.disabled = current>=items.length-1;
      finishBtn.style.display = (current===items.length-1) ? '' : 'none';
    }

    function updateProgressUI(){
      progress.innerHTML = '';
      if(progressType === 'none') return;
      if(progressType === 'dots'){
        dotsWrap.innerHTML = '';
        for(let i=0;i<items.length;i++){
          const d = el('button',{class:'dot',attrs:{'aria-label':`Question ${i+1} of ${items.length}`}});
          if(i===current) d.classList.add('current');
          if(tally[i].answered) d.classList.add('answered');
          if(disableBack && i<current) d.disabled=true;
          d.addEventListener('click',()=>{ if(disableBack && i<current) return; goto(i); });
          dotsWrap.appendChild(d);
        }
        progress.append(dotsWrap);
      } else {
        const text = getTxt('textualProgress','Question: @current of @total questions')
          .replace('@current', String(current+1))
          .replace('@total', String(items.length));
        progress.append(el('span',{class:'label',text:text}));
      }
    }
    function renderCurrent(){ mountChild(current); updateButtons(); }
    function sumCorrect(){ return tally.reduce((a,b)=>a+(Number(b.correct)||0),0); }
    function sumTotal(){ return tally.reduce((a,b)=>a+(Number(b.total)||0),0); }
    function emitScore(){ onScore && onScore({correct:sumCorrect(), total:sumTotal()}); }

    function showResults(){
      const savedIdx = current;
      for(let i=0;i<items.length;i++){
        if(!tally[i].answered){
          goto(i);
          try{ const res = childApi?.check?.(); if(res){ tally[i].correct = res.correct; tally[i].total = res.total; tally[i].answered = true; } } catch(_){}
        }
      }
      goto(savedIdx);

      const correct = sumCorrect();
      const total = sumTotal();
      const pct = total ? Math.round((correct/total)*100) : 0;
	  celebrateIfPerfect(container, correct, total);
      const passed = pct >= passPct;

      if(!showResultPage){ emitScore(); return; }

      const msg = asStr(endCfg.message || 'Your result:');
      const noRes = asStr(endCfg.noResultMessage || 'Finished');
      const scoreBarTmpl = asStr(endCfg.scoreBarLabel || 'You got @finals out of @totals points');
      const solvedText = scoreBarTmpl.replace('@finals', String(correct)).replace('@totals', String(total));

      const solBtnText = asStr(endCfg.solutionButtonText || 'Show solution');
      const retryText = asStr(endCfg.retryButtonText || 'Retry');
      const finishText = asStr(endCfg.finishButtonText || getTxt('finishButton','Finish'));

      const res = el('div',{class:'qs-result'},[
        el('div',{class:'headline',text: total? msg : noRes }),
        el('div',{class:'scoreline',text: total? `${solvedText} (${pct}%)` : '' }),
        el('div',{class:'scoreline',text: total? (passed ? 'Status: Pass' : 'Status: Not passed') : '' }),
        el('div',{class:'qs-controls'},[
          endCfg.showSolutionButton ? el('button',{text:solBtnText}) : null,
          endCfg.showRetryButton ? el('button',{text:retryText}) : null,
          el('button',{class:'primary',text:finishText})
        ].filter(Boolean))
      ]);
      const [solBtn, retryBtn, closeBtn] = res.querySelectorAll('button');
      if (endCfg.showSolutionButton && solBtn){
        solBtn.addEventListener('click',()=>{
          const prev = current;
          for(let i=0;i<items.length;i++){ goto(i); try{ childApi?.check?.(); } catch(_){ } }
          goto(prev);
        });
      }
      if (endCfg.showRetryButton && (endCfg.showSolutionButton ? retryBtn : solBtn)){
        const rb = (endCfg.showSolutionButton ? retryBtn : solBtn);
        rb.addEventListener('click',()=>{ resetSet(); });
      }
      (closeBtn||res.querySelector('.primary')).addEventListener('click',()=>{ /* keep result shown */ });

      host.innerHTML=''; host.appendChild(res);
      progress.innerHTML=''; controls.style.display='none';
      emitScore();
    }

    function resetSet(){
      for(let i=0;i<tally.length;i++) tally[i]={correct:0,total:0,answered:false};
      const prev = current;
      for(let i=0;i<items.length;i++){ goto(i); try{ childApi?.reset?.(); } catch(_){} }
      goto(0);
      controls.style.display='';
      updateProgressUI();
      emitScore();
    }

    if(!introCfg.showIntroPage){ renderCurrent(); updateProgressUI(); }
    return { destroy(){ mount.removeChild(container); } };
  }

  /* ---------- Type detection, validation & dispatch ---------- */
  const nameOf = (v) => String(v).split(/\s|-/)[0];

  function looksDragNDrop(content){
    return !!(content?.question?.task?.elements && content?.question?.task?.dropZones) ||
           !!(content?.params?.task?.elements   && content?.params?.task?.dropZones);
  }
  function looksQuestionSet(content){
    if (!Array.isArray(content?.questions) || !content.questions.length) return false;
    const first = content.questions[0];
    return !!(first && (first.library || first.type)); // sub-objects, not strings
  }
  function looksBlanks(content){
    if (Array.isArray(content?.questions) && typeof content.questions[0] === 'string'){
      return /\*[^*]+\*/.test(String(content.questions[0]));
    }
    if (typeof content?.text === 'string'){
      return /\*[^*]+\*/.test(content.text);
    }
    return false;
  }
  function looksDragText(content){
    const tx = (typeof content?.textField === 'string' && content.textField)
            || (Array.isArray(content?.textField) ? content.textField.join('\n') : '')
            || (Array.isArray(content?.texts) && content.texts[0])
            || (Array.isArray(content?.questions) && typeof content.questions[0]==='string' && content.questions[0])
            || content?.text;
    return typeof tx === 'string' && /\*[^*]+\*/.test(tx);
  }

  function detectType(h5pJson, content){
    // Prefer explicit library/type on the content itself
    if (content?.library) return nameOf(content.library);
    if (content?.type)     return nameOf(content.type);

    // Structural recognition
    if (looksDragNDrop(content)) return 'H5P.DragNDrop';
    if (looksQuestionSet(content)) return 'H5P.QuestionSet';
    if (looksBlanks(content)) return 'H5P.Blanks';
    if (looksDragText(content)) return 'H5P.DragText';

    // T/F or MC
    if (content?.answers && typeof content?.question === 'string'){
      const correctCount=(content.answers||[]).filter(a=>a.correct).length;
      return (correctCount<=1? 'H5P.TrueFalse':'H5P.MultiChoice');
    }

	// Plain text or HTML for AdvancedText
	if (content?.params?.html || content?.html || content?.params?.text || content?.text) {
	  return 'H5P.AdvancedText';
	}
	
    // Plain text
    if (content?.params?.text || content?.text) return 'H5P.AdvancedText';
	

    // Fallback
    return 'H5P.DragText';
  }

  // Validate whether a declared mainLibrary matches the content shape
  function mainLibraryMatches(lib, content){
    const t = nameOf(lib);
    switch (t){
      case 'H5P.QuestionSet': return looksQuestionSet(content);
      case 'H5P.DragNDrop':   return looksDragNDrop(content);
      case 'H5P.Blanks':      return looksBlanks(content);
      case 'H5P.DragText':    return looksDragText(content);
      case 'H5P.TrueFalse':   return !!(content?.answers) && typeof content?.question === 'string';
      case 'H5P.MultiChoice': return !!(content?.answers) && typeof content?.question === 'string';
      case 'H5P.AdvancedText':
			return !!(content?.params?.html || content?.html || content?.params?.text || content?.text);
	  //case 'H5P.AdvancedText':return !!(content?.params?.text || content?.text);
      default: return false;
    }
  }

  function renderByType({mount,type,model,idx,onScore}){ 
    switch(String(type)){ 
      case 'H5P.DragText':       return renderDragText({mount,model,idx,onScore}); 
      case 'H5P.Blanks':         return renderBlanks({mount,model,idx,onScore}); 
      case 'H5P.TrueFalse':      return renderTrueFalse({mount,model,idx,onScore}); 
      case 'H5P.MultiChoice':    return renderMultiChoice({mount,model,idx,onScore}); 
      case 'H5P.SingleChoiceSet':return renderSingleChoiceSet({mount,model,onScore}); 
      case 'H5P.Essay': 
      case 'Mini.Essay':         return renderEssay({mount,model,idx,onScore}); 
      case 'H5P.DragQuestion':
	  case 'H5P.DragNDrop':      return renderDragNDrop({mount,model,idx,onScore}); 
      case 'H5P.AdvancedText':   return renderAdvancedText({mount,model}); 
      case 'H5P.QuestionSet':    return renderQuestionSet({mount,model,onScore}); 
      default:                   return renderDragText({mount,model,idx,onScore}); 
    } 
  }
  
  function render({mount,h5pJson,contentJson,onScore}){ 
    ensureStyles();
    // Selection rule:
    // 1) Use contentJson.library/type if present
    // 2) Else detect from content
    // 3) If h5pJson.mainLibrary is present AND it matches content shape, prefer it; otherwise ignore it
    const explicit = contentJson?.library || contentJson?.type;
    const detected = detectType(h5pJson, contentJson);
    const preferred = explicit ? nameOf(explicit) : detected;

    let type = preferred;
    if (!explicit && h5pJson?.mainLibrary){
      const ml = nameOf(h5pJson.mainLibrary);
      if (mainLibraryMatches(ml, contentJson)) type = ml; // only trust if consistent
    }
    return renderByType({mount,type,model:contentJson,idx:0,onScore}); 
  }
  return { render };
})();

function renderAsHtml(h5pJsonText, contentJsonText, mount){ 
  const h5pJson=h5pJsonText?.trim()?JSON.parse(h5pJsonText):null; 
  const contentJson=JSON.parse(contentJsonText); 
  mount.innerHTML=''; 
  return MiniH5PPlayer.render({ mount, h5pJson, contentJson, onScore: (s)=>console.log('[MiniH5PPlayer] onScore', s) }); 
}

/**
 * setupNewH5P:
 * - If you pass a single item (e.g., DragText), you can set mainLibrary to null or omit it.
 * - If you pass a QuestionSet container, pass {"mainLibrary":"H5P.QuestionSet"}.
 */
function setupNewH5P(id, contentJsonText, mainLibrary /* optional */){ 
  const mount=document.getElementById(id);
  const h5p = (mainLibrary ? { title:"Demo", mainLibrary } : { title:"Demo" });
  renderAsHtml(JSON.stringify(h5p), contentJsonText, mount); 
}