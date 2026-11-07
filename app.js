'use strict';
const KEY='cq-data';
const ACT=[['Sédentaire',1.2],['Activité légère',1.375],['Activité modérée',1.55],['Activité élevée',1.725],['Activité très élevée',1.9]];
const RATES=[0.1,0.25,0.5,0.75,1];
const MEALS=['Petit-déjeuner','Déjeuner','Collation','Dîner'];
const MCOL=['#ffb86b','#7bdff2','#f4a6d7','#b69cff'];
const WCOL=['#ff9f43','#ff6b81','#feca57','#a29bfe','#55efc4','#fd79a8'];
const REF=[[7.5,'Escalade, varappe, grande difficulté'],[5.8,'Escalade, varappe, difficulté faible à modérée'],[8,'Entraînement en circuit, avec haltères, mouvements d\'aérobic, repos minimal, effort vigoureux'],[6.8,'Cours d\'exercices (aérobic, aquagym)'],[8,'Gymnastique suédoise (pompes, abdominaux, tractions, sauts en écart), effort vigoureux'],[3.8,'Gymnastique suédoise (pompes, redressements assis, fentes), effort modéré'],[2.8,'Gymnastique suédoise (redressements assis, abdominaux), effort léger']];
const defSports=()=>[['Escalade en bloc',5.8,7.5],['Musculation au poids du corps',3.8,8],['HIIT',8,8],['Cours d\'exercices (aérobic, aquagym)',6.8,6.8],['Randonnée',5.3,7]].map(a=>({name:a[0],m:a[1],h:a[2]}));
const defFoods=()=>[['Œufs','2 œufs (120 g)',156,13,1,11,1,.3,0,3.3],['Banane','1 moyenne (120 g)',105,1,27,0,14,0,3,.1],['Flocons d\'avoine','40 g',150,5,27,3,1,0,4,.5],['Poulet','120 g cuit',198,37,0,4,0,.2,0,1.2],['Riz','150 g cuit',195,4,43,.5,.1,0,.6,.1],['Skyr','150 g',98,17,6,.5,5,.1,0,.2]]
 .map((a,i)=>({id:'f'+i,name:a[0],qty:a[1],kcal:a[2],p:a[3],c:a[4],f:a[5],s:a[6],na:a[7],fi:a[8],sat:a[9],fav:true}));
let D={profile:{weight:75,height:175,age:30,sex:'m',activity:1.375},goal:{type:'maintain',rate:0.25},meals:[],foods:defFoods(),sports:defSports(),metV:2,workouts:[],weights:[]};
let P=false,Q={open:false,id:'',qty:null,type:null},tab='home',S={mode:0,int:1,type:'',h:1,m:0},H={view:'week',chart:'both',month:'',sel:''};
function merge(o){if(!o||typeof o!=='object')return false;
 Object.assign(D.profile,o.profile||{});Object.assign(D.goal,o.goal||{});
 for(const k of['meals','workouts','weights','sports'])if(Array.isArray(o[k]))D[k]=o[k];
 if(Array.isArray(o.sports))D.metV=o.metV||0;
 if(Array.isArray(o.foods))D.foods=o.foods;else if(Array.isArray(o.favs))D.foods=o.favs.map(x=>({...x,fav:true}));
 fixMet();return true}
function fixMet(){if((D.metV||0)>=2)return;const set=(n,m,h)=>{const x=D.sports.find(y=>y.name===n);if(x){x.m=m;x.h=h}};set('Escalade en bloc',5.8,7.5);set('Musculation au poids du corps',3.8,8);set('HIIT',8,8);if(!D.sports.some(x=>x.name.startsWith('Cours d')))D.sports.push({name:'Cours d\'exercices (aérobic, aquagym)',m:6.8,h:6.8});D.metV=2}
try{merge(JSON.parse(localStorage.getItem(KEY)))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){alert('Sauvegarde impossible : stockage plein ou bloqué.')}};
const $=s=>document.querySelector(s),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const nowT=()=>{const d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes())};
const dAdd=(d,n)=>new Date(new Date(d).getTime()+n*864e5).toISOString().slice(0,10);
const fdate=d=>new Date(d).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r0=Math.round,fx=(n,d=1)=>(Math.round(n*10**d)/10**d).toString().replace('.',','),num=v=>parseFloat(String(v).replace(',','.'))||0;
const sgn=n=>(n>0?'+':'')+fx(n)+' kg';
const sum=(a,k)=>a.reduce((s,x)=>s+(+x[k]||0),0);
const sortedW=()=>[...D.weights].sort((a,b)=>a.date<b.date?-1:1);
const latestW=()=>{const w=sortedW();return w.length?w[w.length-1].kg:D.profile.weight};
const dayMeals=d=>D.meals.filter(m=>m.date===d),dayWork=d=>D.workouts.filter(x=>x.date===d);
const hourType=()=>{const h=nowT();return h<'10:30'?0:h<'15:00'?1:h<'18:00'?2:3};
const sportKcal=(name,min,int,kg)=>{const s=D.sports.find(x=>x.name===name)||{m:4,h:6};return r0(((int?s.h:s.m)-1)*3.5*kg/200*min)};
function calc(){const p=D.profile,g=D.goal,w=latestW();
 const bmr=10*w+6.25*p.height-5*p.age+(p.sex==='m'?5:-161),tdee=bmr*p.activity;
 const adj=g.type==='maintain'?0:g.rate*7700/7,delta=g.type==='lose'?-adj:adj;
 const target=r0(tdee+delta),sport=sum(dayWork(today()),'kcal');
 const P=w*(g.type==='gain'?1.8:1.6),F=target*.27/9,C=Math.max(0,(target-P*4-F*9)/4);
 return{w,bmr:r0(bmr),tdee:r0(tdee),delta:r0(delta),target,sport,budget:target+sport,P,F,C}}
const bar=(v,max,over)=>`<div class="bar"><i class="${v>max&&over?'over':''}" style="width:${Math.min(100,max>0?v/max*100:0)}%"></i></div>`;
const macro=(n,v,t)=>`<div style="margin-top:8px"><div class="row"><span>${n}</span><span class="mu">${r0(v)} / ${r0(t)} g</span></div>${bar(v,t,false)}</div>`;
const NUT=[['Sucre','s'],['Sel','na'],['Fibres','fi'],['AG saturés','sat']];

/* ---------- blocs communs ---------- */
function mealList(ms){if(!ms.length)return'<span class="mu">Aucun repas.</span>';
 return MEALS.map((t,i)=>{const a=ms.filter(m=>m.type===t).sort((x,y)=>x.time<y.time?-1:1);if(!a.length)return'';
 return`<div class="mb" style="border-color:${MCOL[i]}"><div class="row"><b style="color:${MCOL[i]}">${t}</b><span class="mu">${r0(sum(a,'kcal'))} kcal</span></div>${a.map(m=>{const x=NUT.filter(n=>m[n[1]]).map(n=>n[0]+' '+fx(m[n[1]])).join(' · ');
 return`<div class="item"><div><b>${esc(m.name)}</b> <span class="mu">${esc(m.qty||'')}</span><div class="mu">${m.time} · P${fx(m.p,0)} G${fx(m.c,0)} L${fx(m.f,0)}${x?'<br>'+x:''}</div></div><div class="row"><b>${r0(m.kcal)}</b><button class="x" aria-label="Supprimer" onclick="del('meals','${m.id}')">×</button></div></div>`}).join('')}</div>`}).join('')}
const workList=ws=>ws.length?ws.map((x,i)=>`<div class="item"><div><span class="dot" style="background:${WCOL[i%6]}"></span><b>${esc(x.type)}</b><div class="mu" style="margin-left:18px">${x.time} · ${x.min?x.min+' min':'durée —'}${x.manual?' · saisi':x.int?' · élevée':' · modérée'}</div></div><div class="row"><b>${x.kcal}</b><button class="x" aria-label="Supprimer" onclick="del('workouts','${x.id}')">×</button></div></div>`).join(''):'<span class="mu">Aucune séance.</span>';
function foodChips(d){const f=D.foods.filter(x=>x.fav),o=D.foods.filter(x=>!x.fav),c=x=>`<button class="chip" onclick="addFood('${x.id}','${d}')">${esc(x.name)}<span class="mu"> ${x.kcal}</span></button>`;
 return`<h2>Favoris</h2>${f.map(c).join('')||'<p class="mu">Aucun favori (étoile dans « Gérer mes aliments »).</p>'}<details ${P?'open':''} ontoggle="P=this.open"><summary>Mes plats (${o.length})</summary><div style="margin-top:10px">${o.map(c).join('')||'<p class="mu">Aucun plat mémorisé.</p>'}</div></details>`}
function mealForm(d){const t=d===today()?hourType():1,inp=(l,n,r)=>`<div><label>${l}</label><input name="${n}" inputmode="decimal" ${r?'required':''}></div>`;
 return`<form onsubmit="addMeal(event,'${d}')"><label>Nom</label><input name="name" required><label>Quantité de référence (ex. 100 g : les valeurs ci-dessous correspondent à cette quantité)</label><input name="qty" placeholder="100 g">
<div class="grid">${inp('Calories (kcal)','kcal',1)}${inp('Protéines (g)','p')}${inp('Glucides (g)','c')}${inp('Lipides (g)','f')}${inp('Sucre (g)','s')}${inp('Sel (g)','na')}${inp('Fibres (g)','fi')}${inp('AG saturés (g)','sat')}</div>
<div class="grid"><div><label>Repas</label><select name="type">${MEALS.map((m,i)=>`<option ${i===t?'selected':''}>${m}</option>`).join('')}</select></div><div><label>Heure</label><input type="time" name="time" value="${d===today()?nowT():'12:00'}"></div></div>
<label><input type="checkbox" name="mem" style="width:auto;min-height:0;margin-right:8px">Mémoriser dans « Mes plats »</label><label><input type="checkbox" name="fav" style="width:auto;min-height:0;margin-right:8px">Ajouter aux favoris</label><div style="height:10px"></div><button class="btn">Ajouter</button></form>`}
const sel=(opts,cur,fn)=>`<select onchange="${fn}">${opts.map(o=>`<option value="${o[0]}" ${o[0]==cur?'selected':''}>${o[1]}</option>`).join('')}</select>`;
function sportForm(d){if(!D.sports.find(x=>x.name===S.type))S.type=(D.sports[0]||{}).name||'';
 return`<form onsubmit="addSport(event,'${d}')"><div class="seg"><button type="button" class="${S.mode?'':'on'}" onclick="S.mode=0;render()">Estimation</button><button type="button" class="${S.mode?'on':''}" onclick="S.mode=1;render()">kcal saisies</button></div>
${S.mode?'<label>Nom de l\'activité</label><input name="name" required>':`<label>Activité</label>${sel(D.sports.map(s=>[esc(s.name),esc(s.name)]),esc(S.type),'S.type=this.value;prev()')}<div style="height:10px"></div>`}
<label>Durée</label><div class="grid">${sel([...Array(9).keys()].map(i=>[i,i+' h']),S.h,'S.h=+this.value;prev()')}${sel([...Array(12).keys()].map(i=>[i*5,pad(i*5)+' min']),S.m,'S.m=+this.value;prev()')}</div><div style="height:10px"></div>
<label>Heure</label><input type="time" name="time" value="${d===today()?nowT():'12:00'}">
${S.mode?'<label>Calories dépensées (kcal)</label><input name="kcal" inputmode="decimal" required>':`<div class="seg"><button type="button" class="${S.int?'':'on'}" onclick="S.int=0;render()">Modérée</button><button type="button" class="${S.int?'on':''}" onclick="S.int=1;render()">Élevée</button></div><p class="mu">Estimation : <b id="est" class="ac">${sportKcal(S.type,S.h*60+S.m,S.int,latestW())}</b> kcal nettes (indicatif).</p>`}
<button class="btn">Enregistrer</button></form>`}
const prev=()=>{const e=$('#est');if(e)e.textContent=sportKcal(S.type,S.h*60+S.m,S.int,latestW())};

const signK=n=>(n>0?'+':n<0?'−':'')+Math.abs(Math.round(n));
function mealRing(ms,goal){const bt=MEALS.map((n,i)=>({n,i,k:sum(ms.filter(m=>m.type===n),'kcal')})),eat=sum(ms,'kcal'),den=Math.max(eat,goal,1),R=46,C=2*Math.PI*R;let cum=0;
 const arcs=bt.filter(b=>b.k>0).map(b=>{const f=b.k/den,len=Math.max(.01,f*C-15),o=-(cum*C+7.5);cum+=f;return`<circle r="${R}" cx="60" cy="60" fill="none" stroke="${MCOL[b.i]}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${len} ${C}" stroke-dashoffset="${o}" transform="rotate(-90 60 60)"/>`}).join('');
 return`<div style="display:flex;align-items:center;gap:16px"><svg viewBox="0 0 120 120" style="width:132px;flex:none" role="img" aria-label="Calories par repas"><circle r="${R}" cx="60" cy="60" fill="none" stroke="#1f2e27" stroke-width="12"/>${arcs}<text x="60" y="62" text-anchor="middle" fill="${eat>goal?'#f0a58f':'#e8f1ec'}" font-size="22" font-weight="700">${r0(eat)}</text><text x="60" y="78" text-anchor="middle" fill="#8aa196" font-size="9">/ ${r0(goal)} kcal</text></svg>
<div style="flex:1;min-width:0">${bt.map(b=>`<div class="row" style="padding:6px 0"><span><span class="dot" style="background:${MCOL[b.i]}"></span>${b.n}</span><b>${r0(b.k)}</b></div>`).join('')}</div></div>`}
/* ---------- Accueil ---------- */
function home(){const c=calc(),t=today(),ms=dayMeals(t),eat=sum(ms,'kcal'),rest=c.budget-eat,ws=dayWork(t);
 const ww=sortedW(),d=ww.length>1?ww[ww.length-1].kg-ww[ww.length-2].kg:null,bt=MEALS.map((n,i)=>({n,i,k:sum(ms.filter(m=>m.type===n),'kcal')}));
 return`<h1>Aujourd'hui</h1>
<div class="card"><h2>Calories restantes</h2><div class="big ${rest<0?'wa':'ac'}">${r0(rest)} <small>kcal</small></div><div class="fbar"><i class="${eat>c.budget?'over':''}" style="width:${Math.min(100,c.budget>0?eat/c.budget*100:0)}%"></i></div>
<div class="row mu"><span>${r0(eat)} consommées</span><span>Objectif ${c.target}${c.sport?' + '+c.sport+' sport':''}</span></div></div>
<div class="card"><h2>Repas</h2>${mealRing(ms,c.budget)}</div>
<div class="card"><h2>Énergie</h2><div class="grid">
<div class="stat"><span class="mu">Métabolisme de base</span><b>${c.bmr}</b></div><div class="stat"><span class="mu">Dépense quotidienne</span><b>${c.tdee}</b></div>
<div class="stat"><span class="mu">Sport du jour</span><b>${c.sport}</b></div><div class="stat"><span class="mu">Dépense totale</span><b>${c.tdee+c.sport}</b></div></div></div>
<div class="card"><h2>Macronutriments</h2>${macro('Protéines',sum(ms,'p'),c.P)}${macro('Glucides',sum(ms,'c'),c.C)}${macro('Lipides',sum(ms,'f'),c.F)}
<div class="grid" style="margin-top:14px">${NUT.map(n=>`<div class="stat"><span class="mu">${n[0]}</span><b>${fx(sum(ms,n[1]))} g</b></div>`).join('')}</div></div>
<div class="card"><h2>Poids</h2><div class="row"><div class="big" style="font-size:34px">${fx(c.w)} <small>kg</small></div><span class="${d>0?'wa':'ac'}">${d===null?'—':sgn(d)}</span></div></div>
<div class="card"><h2>Sport</h2>${workList(ws)}</div>`}

/* ---------- Quantité (produit en croix) ---------- */
const fref=f=>{const m=String(f.qty||'').match(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i);return m&&num(m[1])>0?{n:num(m[1]),u:m[2].toLowerCase()}:{n:1,u:'portion'}};
const QK=['kcal','p','c','f','s','na','fi','sat'],rd=n=>Math.round(n*10)/10;
const scaled=(f,q)=>{const k=q/(fref(f).n||1),o={};QK.forEach(x=>o[x]=(+f[x]||0)*k);return o};
const curFood=()=>D.foods.find(x=>x.id===Q.id)||D.foods[0];
const curQty=()=>Q.qty===null?fref(curFood()).n:Q.qty;
function qpHtml(){const f=curFood(),r=fref(f),q=curQty(),v=scaled(f,q),L=[['Calories','kcal','kcal'],['Protéines','p','g'],['Glucides','c','g'],['Lipides','f','g'],['Sucre','s','g'],['Sel','na','g'],['Fibres','fi','g'],['AG saturés','sat','g']];
 return`<p class="mu">Valeurs saisies pour ${fx(r.n,2)} ${r.u==='portion'?'portion':r.u} → calculées pour ${fx(q,2)} ${r.u==='portion'?'portion(s)':r.u}</p><div class="grid">${L.map(l=>`<div class="stat"><span class="mu">${l[0]}</span><b>${l[1]==='kcal'?r0(v.kcal):fx(v[l[1]])} ${l[2]}</b></div>`).join('')}</div>`}
const qp=()=>{const e=$('#qp');if(e)e.innerHTML=qpHtml()};
function qFood(id){Q.id=id;Q.qty=null;render()}
function qtyCard(){if(!D.foods.length)return`<div class="card"><details><summary>Quantité</summary><p class="mu">Ajoutez d'abord des aliments pour pouvoir ajuster leur quantité.</p></details></div>`;
 const f=curFood(),r=fref(f);Q.id=f.id;
 return`<div class="card"><details ${Q.open?'open':''} ontoggle="Q.open=this.open"><summary>Quantité</summary><div style="margin-top:10px">
<label>Aliment</label><select onchange="qFood(this.value)">${D.foods.map(x=>`<option value="${x.id}" ${x.id===f.id?'selected':''}>${esc(x.name)} (${esc(x.qty||'')})</option>`).join('')}</select>
<label>Quantité consommée (${r.u==='portion'?'portions':r.u})</label><input inputmode="decimal" value="${fx(curQty(),2).replace('.',',')}" oninput="Q.qty=num(this.value);qp()">
<label>Repas</label><select onchange="Q.type=+this.value">${MEALS.map((m,i)=>`<option value="${i}" ${i===(Q.type===null?hourType():Q.type)?'selected':''}>${m}</option>`).join('')}</select>
<div id="qp">${qpHtml()}</div><div style="height:12px"></div><button class="btn" onclick="addQty()">Ajouter au journal</button></div></details></div>`}
function addQty(){const f=curFood();if(!f)return;const r=fref(f),q=curQty();if(!(q>0))return alert('Indiquez une quantité.');const v=scaled(f,q);
 D.meals.push({id:uid(),name:f.name,qty:fx(q,2)+(r.u==='portion'?(q>1?' portions':' portion'):' '+r.u),kcal:r0(v.kcal),p:rd(v.p),c:rd(v.c),f:rd(v.f),s:rd(v.s),na:rd(v.na),fi:rd(v.fi),sat:rd(v.sat),type:MEALS[Q.type===null?hourType():Q.type],time:nowT(),date:today()});Q.qty=null;commit()}
/* ---------- Repas ---------- */
function mealsView(){const ms=dayMeals(today());
 return`<h1>Repas</h1><div class="card">${foodChips(today())}</div>${qtyCard()}
<div class="card"><h2>Aujourd'hui · ${r0(sum(ms,'kcal'))} kcal</h2>${mealList(ms)}</div>
<div class="card"><details><summary>Ajouter un aliment</summary><div style="margin-top:10px">${mealForm(today())}</div></details></div>
<div class="card"><details><summary>Gérer mes aliments</summary><p class="mu">★ = favori (affiché en haut). Retirer un favori garde l'aliment dans « Mes plats ». × le supprime de la mémoire.</p>${D.foods.map(f=>`<div class="item"><span>${esc(f.name)} <span class="mu">${esc(f.qty||'')} · ${f.kcal} kcal</span></span><div class="row"><button class="x" aria-label="Favori" onclick="toggleFav('${f.id}')" style="color:${f.fav?'var(--ac)':'var(--mu)'}">${f.fav?'★':'☆'}</button><button class="x" aria-label="Supprimer" onclick="del('foods','${f.id}')">×</button></div></div>`).join('')||'<span class="mu">Vide.</span>'}</details></div>`}

/* ---------- Sport ---------- */
function ring(){const c=calc(),ws=dayWork(today());
 const segs=[{n:'Métabolisme de base',k:c.bmr,c:'#5b9cf5'},{n:'Activité quotidienne prévue',k:c.tdee-c.bmr,c:'#4fd1c5'},...ws.map((x,i)=>({n:x.type,k:x.kcal,c:WCOL[i%6]}))].filter(s=>s.k>0);
 const T=sum(segs,'k'),R=70,C=2*Math.PI*R;let cum=0;
 const arcs=segs.map(s=>{const f=s.k/T,len=Math.max(.01,f*C-20),o=-(cum*C+10);cum+=f;return`<circle r="${R}" cx="100" cy="100" fill="none" stroke="${s.c}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${len} ${C}" stroke-dashoffset="${o}" transform="rotate(-90 100 100)"/>`}).join('');
 return`<div class="card"><h2>Dépenses du jour</h2><svg viewBox="0 0 200 200" style="max-width:260px;margin:0 auto" role="img" aria-label="Répartition des dépenses"><circle r="${R}" cx="100" cy="100" fill="none" stroke="#1f2e27" stroke-width="16"/>${arcs}<text x="100" y="104" text-anchor="middle" fill="#e8f1ec" font-size="30" font-weight="700">${T}</text><text x="100" y="124" text-anchor="middle" fill="#8aa196" font-size="12">kcal</text></svg>
${segs.map(s=>`<div class="item"><span><span class="dot" style="background:${s.c}"></span>${esc(s.n)}</span><b>${s.k} kcal</b></div>`).join('')}</div>`}
function sportView(){const t=today();
 return`<h1>Sport</h1>${ring()}
<div class="card"><div class="row"><h2 style="margin:0">Nouvelle séance</h2><button class="chip" style="margin:0" onclick="openRules()">Règles des activités</button></div><div style="height:10px"></div>${sportForm(t)}</div>
<div class="card"><h2>Séances du jour</h2>${workList(dayWork(t))}</div>
<div class="card"><details><summary>Historique</summary>${[...D.workouts].filter(x=>x.date!==t).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,30).map(x=>`<div class="item"><div>${esc(x.type)} <span class="mu">${x.date} · ${x.min||0} min</span></div><div class="row"><b>${x.kcal}</b><button class="x" onclick="del('workouts','${x.id}')">×</button></div></div>`).join('')||'<span class="mu">Vide.</span>'}</details></div>`}
function openRules(){$('#sheet').hidden=false;rules()}
function closeRules(){$('#sheet').hidden=true;render()}
function rules(){const w=latestW(),h=(s,i)=>sportKcal(s.name,60,i,w);
 $('#sheet').innerHTML=`<div class="sh"><div class="row"><h1 style="margin:0">Règles des activités</h1><button class="x" aria-label="Fermer" onclick="closeRules()">×</button></div><div style="height:12px"></div>
<div class="card"><h2>Formule</h2><p style="margin:0 0 8px"><b>kcal nettes = (MET − 1) × 3,5 × poids (kg) ÷ 200 × minutes</b></p><p class="mu">Poids utilisé : ${fx(w)} kg. Le MET dépend de l'activité et de l'intensité. Les séances à kcal saisies n'utilisent pas ces règles. Modérée et élevée correspondent aux deux valeurs MET de chaque activité (voir la table de référence).</p></div>
<div class="card"><h2>Activités</h2>${D.sports.map((s,i)=>`<div style="border-top:1px solid var(--card2);padding-top:10px;margin-top:10px"><label>Nom</label><input value="${esc(s.name)}" onchange="upSport(${i},'name',this.value)"><div class="grid"><div><label>MET modérée</label><input inputmode="decimal" value="${fx(s.m)}" onchange="upSport(${i},'m',this.value)"></div><div><label>MET élevée</label><input inputmode="decimal" value="${fx(s.h)}" onchange="upSport(${i},'h',this.value)"></div></div><div class="row"><span class="mu">≈ ${h(s,0)} / ${h(s,1)} kcal par heure</span><button class="x" aria-label="Supprimer" onclick="delSport(${i})">×</button></div></div>`).join('')}</div>
<div class="card"><h2>Ajouter une activité</h2><form onsubmit="addRule(event)"><label>Nom</label><input name="n" required><div class="grid"><div><label>MET modérée</label><input name="m" inputmode="decimal" required></div><div><label>MET élevée</label><input name="h" inputmode="decimal" required></div></div><button class="btn">Ajouter</button></form></div>
<div class="card"><h2>Table de référence (MET)</h2>${REF.map(r=>`<div class="item"><span>${r[1]}</span><b>${fx(r[0])}</b></div>`).join('')}</div></div>`}
function upSport(i,k,v){const s=D.sports[i];if(k==='name'){if(v.trim())s.name=v.trim()}else s[k]=num(v)||s[k];save();rules()}
function delSport(i){if(confirm('Supprimer cette activité ? Les séances passées sont conservées.')){D.sports.splice(i,1);save();rules()}}
function addRule(e){e.preventDefault();const f=e.target;D.sports.push({name:f.n.value.trim(),m:num(f.m.value),h:num(f.h.value)});save();rules()}

/* ---------- Poids ---------- */
function chart(){const e=today(),sd=dAdd(e,-30),end=dAdd(e,13),w=sortedW().filter(x=>x.date>=sd);
 if(!w.length)return'<p class="mu">Aucune mesure sur les 30 derniers jours.</p>';
 const sl=calc().delta/7700,b=w[0],T=d=>new Date(d).getTime(),X=d=>20+(T(d)-T(sd))/(T(end)-T(sd))*280,pf=k=>b.kg+sl*(T(k)-T(b.date))/864e5,pe=pf(end);
 const v=[...w.map(x=>x.kg),pe],lo=Math.min(...v)-.3,hi=Math.max(...v)+.3,Y=k=>115-(k-lo)/(hi-lo)*95;
 return`<svg viewBox="0 0 320 140" role="img" aria-label="Poids sur 30 jours et prévision"><line x1="${X(e)}" y1="18" x2="${X(e)}" y2="120" stroke="#2c4038" stroke-dasharray="3 4"/><text x="${X(e)}" y="12" fill="#8aa196" font-size="10" text-anchor="middle">Aujourd'hui</text><line x1="${X(b.date)}" y1="${Y(b.kg)}" x2="${X(end)}" y2="${Y(pe)}" stroke="#e8f1ec" stroke-width="2" stroke-dasharray="5 5" opacity=".6"/><polyline fill="none" stroke="#8ff0a4" stroke-width="2.5" stroke-linejoin="round" points="${w.map(x=>X(x.date)+','+Y(x.kg)).join(' ')}"/>${w.map(x=>`<circle cx="${X(x.date)}" cy="${Y(x.kg)}" r="3.5" fill="#8ff0a4"/>`).join('')}<text x="20" y="136" fill="#8aa196" font-size="11">${sd.slice(5)}</text><text x="300" y="136" fill="#8aa196" font-size="11" text-anchor="end">${end.slice(5)}</text><text x="20" y="${Y(hi-.3)-4}" fill="#8aa196" font-size="11">${fx(hi-.3)} kg</text><text x="20" y="${Y(lo+.3)+14}" fill="#8aa196" font-size="11">${fx(lo+.3)} kg</text></svg>
<div class="lg"><span><span class="dot" style="background:#8ff0a4"></span>Mesuré</span><span><span class="dot" style="background:#e8f1ec;opacity:.6"></span>Prévu selon l'objectif (${fx(sl*7,2)} kg/sem) : ${fx(pe)} kg le ${end}</span></div>`}
function weightView(){const w=sortedW(),l=w[w.length-1],pv=w[w.length-2],f=w[0];
 return`<h1>Poids</h1><div class="card"><h2>Nouvelle mesure</h2><form onsubmit="addW(event)"><div class="grid"><div><label>Poids (kg)</label><input name="kg" inputmode="decimal" required value="${l?fx(l.kg).replace('.',','):''}"></div><div><label>Date</label><input type="date" name="date" value="${today()}" required></div></div><button class="btn">Enregistrer</button></form></div>
${l?`<div class="card"><div class="row"><div class="big" style="font-size:40px">${fx(l.kg)} <small>kg</small></div><div style="text-align:right"><div class="mu">Depuis la précédente</div><b>${pv?sgn(l.kg-pv.kg):'—'}</b><div class="mu" style="margin-top:6px">Depuis la première</div><b>${w.length>1?sgn(l.kg-f.kg):'—'}</b></div></div></div>
<div class="card"><h2>30 derniers jours + prévision</h2>${chart()}<p class="mu">La prévision part de la première mesure de la période et applique le déficit/surplus de l'objectif (7 700 kcal ≈ 1 kg). C'est une approximation.</p></div>
<div class="card"><h2>Historique</h2>${[...w].reverse().map(x=>`<div class="item"><span>${x.date}</span><div class="row"><b>${fx(x.kg)} kg</b><button class="x" aria-label="Supprimer" onclick="delW('${x.date}')">×</button></div></div>`).join('')}</div>`:''}`}

/* ---------- Historique ---------- */
H.sel=today();H.month=today().slice(0,7);
function weekChart(){const c=calc(),days=[...Array(7)].map((_,i)=>dAdd(today(),i-6)),k=days.map(d=>r0(sum(dayMeals(d),'kcal'))),s=days.map(d=>sum(dayWork(d),'kcal')),g=days.map((d,i)=>c.target+s[i]);
 const sk=H.chart!=='s',ss=H.chart!=='k',both=sk&&ss,mx=Math.max(1,...(sk?[...k,...g]:[0]),...(ss?s:[0])),sl=300/7,bw=both?17:30,hh=v=>v/mx*95;
 const kt=days.map(d=>MEALS.map(t=>sum(dayMeals(d).filter(m=>m.type===t),'kcal')));
 const tr=(x,w)=>`<rect x="${x}" y="30" width="${w}" height="95" rx="9" fill="#1f2e27" opacity=".55"/>`;
 const bar=(id,x,w,T,inner)=>{if(T<=0)return tr(x,w);const r=Math.min(9,T/2),y=125-T;return tr(x,w)+`<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${T}" rx="${r}"/></clipPath><g clip-path="url(#${id})">${inner}<rect x="${x}" y="${y}" width="${w}" height="${T}" fill="url(#sh)"/><rect x="${x}" y="${y}" width="${w}" height="${T}" fill="url(#sv)"/></g>`};
 const stk=(i,x)=>{let y=125;return bar('k'+i,x,bw,hh(k[i]),kt[i].map((v,j)=>{const h=hh(v);y-=h;return h>0?`<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${MCOL[j]}" stroke="#16211c" stroke-width="1"/>`:''}).join(''))};
 const cols=days.map((d,i)=>{const cx=sl*i+sl/2,lab=new Date(d).toLocaleDateString('fr-FR',{weekday:'short',timeZone:'UTC'}).slice(0,3),kx=both?cx-bw-1:cx-bw/2,sx=both?cx+1:cx-bw/2;let o='';
  if(sk)o+=stk(i,kx)+`<text x="${kx+bw/2}" y="${121-hh(k[i])}" font-size="9" fill="#8aa196" text-anchor="middle">${k[i]||''}</text>`;
  if(ss)o+=bar('s'+i,sx,bw,hh(s[i]),`<rect x="${sx}" y="${125-hh(s[i])}" width="${bw}" height="${hh(s[i])}" fill="url(#sg)"/>`)+`<text x="${sx+bw/2}" y="${121-hh(s[i])}" font-size="9" fill="#8aa196" text-anchor="middle">${s[i]||''}</text>`;
  if(sk)o+=`<line x1="${cx-sl/2+4}" x2="${cx+sl/2-4}" y1="${125-hh(g[i])}" y2="${125-hh(g[i])}" stroke="#e8f1ec" stroke-width="1.5" stroke-dasharray="3 3" stroke-linecap="round" opacity=".8"/>`;
  return o+`<text x="${cx}" y="142" font-size="11" fill="#8aa196" text-anchor="middle">${lab}</text>`}).join('');
 return`<div class="seg">${[['both','Les deux'],['k','Calories'],['s','Sport']].map(a=>`<button class="${H.chart===a[0]?'on':''}" onclick="H.chart='${a[0]}';render()">${a[1]}</button>`).join('')}</div><svg viewBox="0 0 300 150"><defs><linearGradient id="sh" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient><linearGradient id="sv" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffc27d"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient></defs><line x1="0" y1="125" x2="300" y2="125" stroke="#1f2e27"/>${cols}</svg><div class="lg">${MEALS.map((t,i)=>`<span><span class="dot" style="background:${MCOL[i]}"></span>${t}</span>`).join('')}<span><span class="dot" style="background:#ff9f43"></span>Sport (kcal)</span><span><span style="display:inline-block;width:16px;border-top:2px dashed #e8f1ec;opacity:.8;margin-right:6px;vertical-align:middle"></span>Objectif du jour (objectif + sport)</span></div>`}
function avgCard(){const days=[...Array(7)].map((_,i)=>dAdd(today(),i-6)).filter(d=>dayMeals(d).length),n=days.length,ms=days.flatMap(dayMeals),a=k=>n?fx(sum(ms,k)/n,k==='kcal'?0:1):'—';
 const bal=n?days.reduce((t,d)=>t+sum(dayMeals(d),'kcal')-calc().tdee-sum(dayWork(d),'kcal'),0)/n:0,balStat=`<div class="stat" style="margin-bottom:10px"><span class="mu">Bilan moyen vs dépenses (base + sport)</span><b>${n?signK(bal)+' kcal / jour':'—'}</b><span class="mu">${!n?'':bal<0?'Déficit moyen':'Surplus moyen'}</span></div>`;
 return`<h2>Moyenne par jour (${n} jour${n>1?'s':''} renseigné${n>1?'s':''} sur 7)</h2>${balStat}<div class="grid">${[['Calories','kcal','kcal'],['Protéines','p','g'],['Glucides','c','g'],['Lipides','f','g'],['Sucre','s','g'],['Sel','na','g'],['Fibres','fi','g'],['AG saturés','sat','g']].map(r=>`<div class="stat"><span class="mu">${r[0]}</span><b>${a(r[1])} ${r[2]}</b></div>`).join('')}</div>`}
function calendar(){const [y,m]=H.month.split('-').map(Number),off=(new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7,nd=new Date(Date.UTC(y,m,0)).getUTCDate(),t=today();
 const has=d=>D.meals.some(x=>x.date===d)||D.workouts.some(x=>x.date===d)||D.weights.some(x=>x.date===d);
 let c='';for(let i=0;i<off;i++)c+='<i></i>';
 for(let d=1;d<=nd;d++){const ds=`${y}-${pad(m)}-${pad(d)}`;c+=`<button class="${ds===H.sel?'on ':''}${ds===t?'td ':''}${has(ds)?'has':''}" onclick="H.sel='${ds}';render()">${d}</button>`}
 return`<div class="row" style="margin-bottom:10px"><button class="x" aria-label="Mois précédent" onclick="calMove(-1)">‹</button><b>${new Date(Date.UTC(y,m-1,1)).toLocaleDateString('fr-FR',{month:'long',year:'numeric',timeZone:'UTC'})}</b><button class="x" aria-label="Mois suivant" onclick="calMove(1)">›</button></div><div class="cal">${['L','M','M','J','V','S','D'].map(x=>`<span>${x}</span>`).join('')}${c}</div>`}
function calMove(n){let [y,m]=H.month.split('-').map(Number);m+=n;if(m<1){m=12;y--}if(m>12){m=1;y++}H.month=y+'-'+pad(m);render()}
function dayDetail(d){const ms=dayMeals(d),ws=dayWork(d),w=D.weights.find(x=>x.date===d),c=calc(),ex=c.tdee+sum(ws,'kcal'),bal=sum(ms,'kcal')-ex;
 return`<div class="card"><h2 style="text-transform:capitalize">${fdate(d)}</h2><div class="grid"><div class="stat"><span class="mu">Calories ingérées</span><b>${r0(sum(ms,'kcal'))}</b></div><div class="stat"><span class="mu">Dépenses (base + sport)</span><b>${ex}</b></div><div class="stat"><span class="mu">${ms.length&&bal<0?'Déficit du jour':'Surplus du jour'}</span><b>${ms.length?signK(bal)+' kcal':'—'}</b></div><div class="stat"><span class="mu">Sport</span><b>${sum(ws,'kcal')} kcal</b></div><div class="stat"><span class="mu">Poids</span><b>${w?fx(w.kg)+' kg':'—'}</b></div><div class="stat"><span class="mu">Macros (P/G/L)</span><b style="font-size:16px">${r0(sum(ms,'p'))} / ${r0(sum(ms,'c'))} / ${r0(sum(ms,'f'))} g</b></div></div>
<div class="grid" style="margin-top:10px">${NUT.map(n=>`<div class="stat"><span class="mu">${n[0]}</span><b>${fx(sum(ms,n[1]))} g</b></div>`).join('')}</div></div>
<div class="card"><h2>Repas</h2>${mealRing(ms,c.target+sum(ws,'kcal'))}</div><div class="card"><h2>Détail des repas</h2>${mealList(ms)}</div><div class="card"><h2>Séances</h2>${workList(ws)}</div>
<div class="card"><details><summary>Ajouter un aliment à ce jour</summary><div style="margin-top:10px">${foodChips(d)}${mealForm(d)}</div></details></div>
<div class="card"><details><summary>Ajouter une séance à ce jour</summary><div style="margin-top:10px">${sportForm(d)}</div></details></div>`}
function histView(){return`<h1>Historique</h1><div class="seg"><button class="${H.view==='week'?'on':''}" onclick="H.view='week';render()">7 jours</button><button class="${H.view==='cal'?'on':''}" onclick="H.view='cal';render()">Calendrier</button></div>`+
 (H.view==='week'?`<div class="card"><h2>7 derniers jours</h2>${weekChart()}</div><div class="card">${avgCard()}</div>`:`<div class="card">${calendar()}</div>${dayDetail(H.sel)}`)}

/* ---------- Profil ---------- */
function profileView(){const p=D.profile,g=D.goal,c=calc();
 return`<h1>Profil</h1><div class="card"><form onchange="saveProfile(this)" onsubmit="return false">
<div class="grid"><div><label>Poids actuel (kg)</label><input name="weight" inputmode="decimal" value="${fx(c.w).replace('.',',')}"></div><div><label>Taille (cm)</label><input name="height" inputmode="decimal" value="${p.height}"></div>
<div><label>Âge</label><input name="age" inputmode="numeric" value="${p.age}"></div><div><label>Sexe (formule métabolique)</label><select name="sex"><option value="m" ${p.sex==='m'?'selected':''}>Homme</option><option value="f" ${p.sex==='f'?'selected':''}>Femme</option></select></div></div>
<label>Activité quotidienne (hors sport enregistré)</label><select name="activity">${ACT.map(a=>`<option value="${a[1]}" ${a[1]===p.activity?'selected':''}>${a[0]} (×${fx(a[1],3)})</option>`).join('')}</select>
<label>Objectif</label><select name="type"><option value="maintain" ${g.type==='maintain'?'selected':''}>Maintien du poids</option><option value="lose" ${g.type==='lose'?'selected':''}>Perte de masse</option><option value="gain" ${g.type==='gain'?'selected':''}>Prise de masse</option></select>
${g.type!=='maintain'?`<label>Rythme</label><select name="rate">${RATES.map(r=>`<option value="${r}" ${r===g.rate?'selected':''}>${fx(r,2)} kg/semaine</option>`).join('')}</select>`:''}</form></div>
<div class="card"><h2>Résultat</h2><div class="item"><span>Métabolisme de base</span><b>${c.bmr} kcal</b></div><div class="item"><span>Dépense quotidienne</span><b>${c.tdee} kcal</b></div>
<div class="item"><span>${g.type==='maintain'?'Maintien':g.type==='lose'?'Déficit ('+fx(g.rate,2)+' kg/sem)':'Surplus ('+fx(g.rate,2)+' kg/sem)'}</span><b>${c.delta>0?'+':''}${c.delta} kcal</b></div>
<div class="item"><span>Objectif quotidien</span><b class="ac">${c.target} kcal</b></div>
<p class="mu">Protéines ${r0(c.P)} g · Glucides ${r0(c.C)} g · Lipides ${r0(c.F)} g. La conversion 7 700 kcal/kg est une approximation : l'évolution réelle peut différer. Ces repères ne sont pas des prescriptions médicales. Les calories du sport du jour s'ajoutent à l'objectif.</p></div>
<div class="card"><h2>Données</h2><p class="mu">Tout reste sur cet appareil. Elles peuvent être perdues si les données de Safari sont effacées ou l'app réinstallée : exportez régulièrement.</p>
<button class="btn" onclick="exp()">Exporter (JSON)</button><div style="height:8px"></div><label class="btn s" style="display:block;text-align:center;color:var(--tx);font-size:16px">Importer une sauvegarde<input type="file" accept=".json,application/json" onchange="imp(this)" hidden></label></div>`}

/* ---------- actions ---------- */
const views={home,meals:mealsView,sport:sportView,weight:weightView,hist:histView,profile:profileView};
function render(){const y=scrollY;$('#view').innerHTML=views[tab]();document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));scrollTo(0,y)}
const commit=()=>{save();render()};
function addFood(id,d){const f=D.foods.find(x=>x.id===id);if(!f)return;const{id:_i,fav,...n}=f;
 D.meals.push({...n,id:uid(),type:MEALS[d===today()?hourType():1],time:d===today()?nowT():'12:00',date:d});commit()}
function addMeal(e,d){e.preventDefault();const f=e.target,v=n=>f[n].value,m={id:uid(),name:v('name').trim(),qty:v('qty').trim(),kcal:num(v('kcal')),p:num(v('p')),c:num(v('c')),f:num(v('f')),s:num(v('s')),na:num(v('na')),fi:num(v('fi')),sat:num(v('sat')),type:v('type'),time:v('time')||nowT(),date:d};
 D.meals.push(m);if(f.mem.checked||f.fav.checked){const{id,type,time,date,...n}=m;D.foods.push({...n,id:uid(),fav:f.fav.checked})}commit()}
function toggleFav(id){const f=D.foods.find(x=>x.id===id);if(f)f.fav=!f.fav;commit()}
function addSport(e,d){e.preventDefault();const f=e.target,min=S.h*60+S.m;let name,kcal;
 if(S.mode){name=f.name.value.trim();kcal=num(f.kcal.value)}else{name=S.type;kcal=sportKcal(name,min,S.int,latestW());if(min<=0)return alert('Choisissez une durée.')}
 if(!name)return;D.workouts.push({id:uid(),type:name,min,time:f.time.value||nowT(),date:d,int:S.int,kcal,manual:!!S.mode});commit()}
function addW(e){e.preventDefault();const kg=num(e.target.kg.value),date=e.target.date.value;if(kg<20||kg>400)return alert('Poids invalide.');
 D.weights=D.weights.filter(x=>x.date!==date);D.weights.push({date,kg});commit()}
function delW(d){D.weights=D.weights.filter(x=>x.date!==d);commit()}
function del(k,id){D[k]=D[k].filter(x=>x.id!==id);commit()}
function saveProfile(f){const p=D.profile,g=D.goal,w=num(f.weight.value);
 p.height=num(f.height.value)||p.height;p.age=num(f.age.value)||p.age;p.sex=f.sex.value;p.activity=num(f.activity.value);
 if(w>=20&&w<=400&&w!==latestW()){p.weight=w;D.weights=D.weights.filter(x=>x.date!==today());D.weights.push({date:today(),kg:w})}
 g.type=f.type.value;if(f.rate)g.rate=num(f.rate.value);commit()}
function exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(D,null,1)],{type:'application/json'}));a.download='count-'+today()+'.json';a.click()}
function imp(i){const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!o||typeof o!=='object'||!(o.profile||o.meals||o.weights||o.workouts))throw 0;
 if(!confirm('Remplacer les données actuelles par cette sauvegarde ?'))return;merge(o);commit();alert('Sauvegarde importée.')}catch(e){alert('Fichier invalide.')}};r.readAsText(f);i.value=''}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;if(tab==='hist'){H.sel=today();H.month=H.sel.slice(0,7)}scrollTo(0,0);render()});
render();
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
