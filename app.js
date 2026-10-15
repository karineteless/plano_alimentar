/* Diário SMV — app estático (sem build). Dados ficam no localStorage do aparelho.
   O plano alimentar vem de plano.js (window.PLANO). */
(function(){
'use strict';
const P = window.PLANO;
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,'0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const hoje = () => iso(new Date());
const somaDias = (s,n) => { const d=new Date(s+'T12:00:00'); d.setDate(d.getDate()+n); return iso(d); };
const segunda = s => { const d=new Date(s+'T12:00:00'); d.setDate(d.getDate()-((d.getDay()+6)%7)); return iso(d); };
const diaNum = s => { const [y,m,d]=s.split('-').map(Number); return Math.floor(Date.UTC(y,m-1,d)/864e5); };
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const SEM = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const SEM_C = ['S','T','Q','Q','S','S','D'];
const num = (v,d=1) => (v==null||isNaN(v)) ? '—' : Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const ml = v => Number(v).toLocaleString('pt-BR');
const ddmm = s => { const [,m,d]=s.split('-'); return `${d}/${m}`; };
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parse = v => { const s=String(v||'').trim().replace(',','.'); if(!s) return null; const n=parseFloat(s); return isNaN(n)?NaN:n; };
const dataLonga = s => { const d=new Date(s+'T12:00:00'); return `${SEM[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`; };
const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TREINO_OPC = [0,30,45,60,90,120];

/* ---------- Estado e armazenamento ---------- */
const CHAVE = 'diario-smv-v1';
const S = { perfil:null, medicoes:[], dias:{}, ultimoBackup:null };
const UI = { tab:'hoje', dia:null, rasc:null, serie:'peso', sel:hoje(), mes:null, semana:segunda(hoje()), pendDel:null, perfilSujo:false, cardOp:{}, confApagar:false };
{ const d=new Date(); UI.mes={a:d.getFullYear(), m:d.getMonth()}; }

function salvar(){
  try{ localStorage.setItem(CHAVE, JSON.stringify(S)); return true; }
  catch(e){ toast('Não foi possível salvar neste aparelho.'); return false; }
}
function carregar(){
  try{
    const r = JSON.parse(localStorage.getItem(CHAVE)||'null');
    if(r){ S.perfil=r.perfil||null; S.medicoes=Array.isArray(r.medicoes)?r.medicoes:[]; S.dias=r.dias&&typeof r.dias==='object'?r.dias:{}; S.ultimoBackup=r.ultimoBackup||null; }
  }catch(e){}
  if(!S.perfil) S.perfil = { nome: P.titular || '' };
}
function alterarDia(data, fn){
  const c = JSON.parse(JSON.stringify(S.dias[data]||{}));
  c.feitas=c.feitas||{}; c.escolhas=c.escolhas||{}; c.extras=Array.isArray(c.extras)?c.extras:[];
  c.treinoMin=c.treinoMin||0;
  fn(c); S.dias[data]=c; salvar(); render();
}

/* ---------- Plano ---------- */
const refeicoes = () => P.refeicoes;
const obrigatorias = () => P.refeicoes.filter(r=>!r.opcional);
const opcoes = r => r.opcoes;
const diaDe = data => S.dias[data]||{};
const feitasDe = data => diaDe(data).feitas||{};
const extrasDe = data => Array.isArray(diaDe(data).extras)?diaDe(data).extras:[];
function adesao(data){ const r=obrigatorias(); const f=feitasDe(data); return r.filter(x=>f[x.id]).length/r.length; }
function sugestao(r,data){ const ops=opcoes(r); return ops.length ? ops[diaNum(data)%ops.length].id : null; }
function escolha(r,data,dia=diaDe(data)){ const e=(dia.escolhas||{})[r.id]; return opcoes(r).some(o=>o.id===e) ? e : null; }
const opcaoEfetiva = (r,data,dia) => escolha(r,data,dia) || sugestao(r,data);
const opcaoPorId = (r,id) => opcoes(r).find(o=>o.id===id);
const resumoOpcao = o => o ? [o.subtitulo, ...o.grupos.filter(g=>g.res).map(g=>g.res)].filter(Boolean).join(' · ') : '';
/* Marca/desmarca uma refeição; ao marcar, fixa a opção sugerida se nenhuma foi escolhida */
function marcar(c, id, data){
  if(c.feitas[id]){ delete c.feitas[id]; return; }
  c.feitas[id]=true; const r=refeicoes().find(x=>x.id===id);
  if(r && !c.escolhas[r.id] && opcoes(r).length>1) c.escolhas[r.id]=sugestao(r,data);
}
function metaAgua(data){ const h=P.hidratacao; return h.baseMl + Math.round(h.porHoraTreinoMl*(diaDe(data).treinoMin||0)/60); }
/* Registros antigos guardavam copos de 250 ml; os novos guardam aguaMl */
const mlDia = c => c.aguaMl!=null ? c.aguaMl : (c.copos||0)*250;
const aguaDe = data => mlDia(diaDe(data));
const meds = () => S.medicoes.slice().sort((a,b)=> a.data<b.data?-1:a.data>b.data?1:(a.criado||0)-(b.criado||0));
function imc(peso){ const a=S.perfil&&S.perfil.altura_cm; if(!a||!peso) return null; return peso/((a/100)**2); }
/* Derivados da bioimpedância: massa gorda/magra a partir do % de gordura; músculo e osso como % do peso */
function composicao(m){
  const p=m.peso, gk = m.gordura!=null ? p*m.gordura/100 : null, pct = v => v!=null ? v/p*100 : null;
  return { gordaKg:gk, magraKg: gk!=null ? p-gk : null, musculo:m.musculo, musculoPct:pct(m.musculo), ossea:m.ossea, osseaPct:pct(m.ossea), agua:m.agua };
}
function classeImc(v){ if(v==null) return ''; if(v<18.5) return 'Abaixo do peso'; if(v<25) return 'Peso normal'; if(v<30) return 'Sobrepeso'; if(v<35) return 'Obesidade grau I'; if(v<40) return 'Obesidade grau II'; return 'Obesidade grau III'; }
/* Dia exibido na tela Hoje (padrão: hoje). Dias anteriores são editados num rascunho e só salvos em "Registrar". */
const diaAtual = () => (UI.dia && UI.dia<hoje()) ? UI.dia : hoje();
function rascunho(){
  const d=diaAtual();
  if(d===hoje()){ UI.rasc=null; return null; }
  if(!UI.rasc || UI.rasc.data!==d){ const x=diaDe(d); UI.rasc={data:d, feitas:{...(x.feitas||{})}, escolhas:{...(x.escolhas||{})}}; }
  return UI.rasc;
}
function mesmoObj(a,b){ const ka=Object.keys(a).filter(k=>a[k]), kb=Object.keys(b).filter(k=>b[k]); return ka.length===kb.length && ka.every(k=>a[k]===b[k]); }
function rascSujo(){ const r=UI.rasc; if(!r) return false; const x=diaDe(r.data); return !mesmoObj(r.feitas,x.feitas||{}) || !mesmoObj(r.escolhas,x.escolhas||{}); }
function mudarDia(d){
  if(d>hoje()) d=hoje();
  if(d===diaAtual()){ renderHoje(); return; }
  if(rascSujo() && !confirm('Descartar as alterações não registradas?')){ renderHoje(); return; }
  UI.rasc=null; UI.dia = d===hoje() ? null : d; renderHoje();
}

/* ---------- Render ---------- */
const TITULOS = {hoje:'Hoje', plano:'Plano alimentar', semana:'Resumo semanal', evo:'Evolução', cal:'Calendário', perfil:'Perfil'};
function render(){
  $('titulo').textContent = TITULOS[UI.tab];
  const nome = (S.perfil&&S.perfil.nome) || P.titular || 'Diário SMV';
  $('eyebrow').textContent = UI.tab==='hoje' ? dataLonga(hoje()) : nome;
  Object.keys(TITULOS).forEach(t=>{ $('v-'+t).hidden = UI.tab!==t; });
  document.querySelectorAll('.tab').forEach(b=>{ if(b.dataset.tab===UI.tab) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  renderAvisoBackup();
  ({hoje:renderHoje, plano:renderPlano, semana:renderSemana, evo:renderEvo, cal:renderCal, perfil:renderPerfil})[UI.tab]();
}

function renderAvisoBackup(){
  const temDados = S.medicoes.length || Object.keys(S.dias).length;
  const dias = S.ultimoBackup ? diaNum(hoje())-diaNum(S.ultimoBackup) : null;
  const mostrar = temDados && UI.tab==='hoje' && (dias==null ? Object.keys(S.dias).length>=7 : dias>=14);
  $('aviso-backup').hidden = !mostrar;
  if(mostrar) $('aviso-backup-txt').textContent = dias==null ? 'Você ainda não fez backup dos registros.' : `Último backup há ${dias} dias.`;
}

/* `dia` opcional: rascunho exibido no lugar do registro salvo */
function blocoRefeicoes(data, dia){
  const src=dia||diaDe(data), f=src.feitas||{}, rs=dia?' data-rasc="1"':'';
  return '<ul class="refs">'+refeicoes().map(r=>{
    const ops=opcoes(r), e=escolha(r,data,src), ef=opcaoEfetiva(r,data,src), feita=!!f[r.id];
    const chips = ops.length>1 ? `<div class="op-chips" role="group" aria-label="Opções de ${esc(r.nome)}">`+ops.map(o=>{
      const cls = o.id===e?'on':(!e&&o.id===ef?'sug':'');
      return `<button class="op ${cls}" data-esc="${r.id}" data-op="${o.id}" data-data="${data}"${rs} aria-pressed="${o.id===e}">${esc(o.sigla||o.titulo)}</button>`;
    }).join('')+'</div>' : '';
    const sub = r.opcional ? 'opcional' : (!e&&ops.length>1 ? 'sugestão do dia' : '');
    return `<li class="ref-item${feita?' feita':''}${r.opcional?' opc':''}">
      <div class="ref-linha">
        <button class="chk" data-check="${r.id}" data-data="${data}"${rs} aria-pressed="${feita}" aria-label="Marcar ${esc(r.nome)} como feita">${CHECK}</button>
        <div class="ref-info"><span class="ref-nome">${esc(r.nome)}</span><span class="ref-hora">${esc(r.hora)}${sub?' · '+sub:''}</span></div>
        <button class="link" data-ver="${r.id}" data-op="${ef||''}">Detalhes</button>
      </div>${chips}
      <p class="ref-resumo">${esc(resumoOpcao(opcaoPorId(r,ef)))}</p>
    </li>`;
  }).join('')+'</ul>';
}

function renderHoje(){
  const h=hoje(), d=diaAtual(), rasc=rascunho(), rs=obrigatorias(), f=(rasc||diaDe(d)).feitas||{}, feitas=rs.filter(x=>f[x.id]).length, frac=feitas/rs.length;
  $('dieta-label').textContent = d===h ? 'Dieta de hoje' : `Dieta de ${ddmm(d)}`;
  $('dia-sel').value=d; $('dia-sel').max=h;
  $('dia-prox').disabled = d>=h; $('dia-hoje').hidden = d===h;
  $('ring-prog').setAttribute('stroke-dashoffset', (213.6*(1-frac)).toFixed(1));
  $('ring-txt').textContent = `${feitas}/${rs.length}`;
  $('dieta-resumo').textContent = feitas===rs.length ? 'Dieta do dia concluída' : `${feitas} de ${rs.length} refeições`;
  $('dieta-dica').textContent = rasc ? `${dataLonga(d)} · ajuste e toque em Registrar` : 'Escolha a opção e marque ao concluir';
  $('refs-hoje').innerHTML = blocoRefeicoes(d, rasc);
  $('registrar').hidden = !rasc; $('btn-registrar').disabled = $('btn-descartar').disabled = !rascSujo();

  const a=aguaDe(h), m=metaAgua(h), tm=diaDe(h).treinoMin||0;
  $('agua-val').innerHTML = `${ml(a)}<small>ml</small>`;
  $('agua-meta').textContent = a>=m ? `Meta de ${ml(m)} ml atingida` : `meta ${ml(m)} ml · faltam ${ml(m-a)}`;
  $('agua-barra').style.width = Math.min(100,a/m*100).toFixed(0)+'%';
  $('agua-ok').hidden = a<m;
  $('treino-chips').innerHTML = TREINO_OPC.map(v=>`<button class="op ${v===tm?'on':''}" data-treino="${v}" aria-pressed="${v===tm}">${v?v+' min':'Sem treino'}</button>`).join('');

  const marc=extrasDe(h);
  $('extras-n').textContent = marc.length ? `${marc.length} marcado${marc.length>1?'s':''}` : '';
  $('extras-hoje').innerHTML = P.extras.map(e=>`<button class="chip tg" data-extra="${e.id}" aria-pressed="${marc.includes(e.id)}">${esc(e.texto)}</button>`).join('');

  const ms=meds(), u=ms[ms.length-1], ant=ms[ms.length-2];
  $('ult-data').textContent = u ? `em ${ddmm(u.data)}` : '';
  const delta = (x,y,un) => (x==null||y==null) ? '' : `${x-y>0?'+':''}${num(x-y)} ${un} vs. anterior`;
  if(!u){ $('tiles').innerHTML = '<p class="vazio" style="grid-column:1/-1">Nenhuma medição ainda. Registre a primeira abaixo.</p>'; return; }
  const iu=imc(u.peso), cp=composicao(u);
  const ultCom = k => ms.slice(0,-1).reverse().find(x=>x[k]!=null);
  const antC = k => { const a=ultCom(k); return a ? composicao(a)[k] : null; };
  const linhas = [
    ['Massa gorda', cp.gordaKg, 'kg', null, 'gordaKg', 'peso × % gordura'],
    ['Massa magra', cp.magraKg, 'kg', null, 'magraKg', 'peso − massa gorda'],
    ['Massa muscular', cp.musculo, 'kg', cp.musculoPct, 'musculo', ''],
    ['Massa óssea', cp.ossea, 'kg', cp.osseaPct, 'ossea', ''],
    ['Água corporal', cp.agua, '%', null, 'agua', ''],
  ].filter(l=>l[1]!=null);
  $('comp').hidden = !linhas.length;
  $('comp').innerHTML = linhas.length ? '<span class="label c-bio">Composição corporal</span><ul>'+linhas.map(([n,v,un,pct,k,dica])=>{
    const a = k==='gordaKg'||k==='magraKg' ? (()=>{ const x=ultCom('gordura'); return x?composicao(x)[k]:null; })() : antC(k);
    const dl = a!=null ? `${v-a>0?'+':''}${num(v-a)} ${un==='%'?'p.p.':un}` : '';
    return `<li><span>${n}${dica?`<small>${dica}</small>`:''}</span><b>${num(v)} ${un}${pct!=null?`<small> · ${num(pct)}% do peso</small>`:''}</b>${dl?`<small class="dl">${dl}</small>`:'<small class="dl"></small>'}</li>`;
  }).join('')+'</ul>' : '';
  $('tiles').innerHTML =
    `<div class="tile peso"><span class="label">Peso</span><span class="val">${num(u.peso)}<small>kg</small></span><span class="sub">${ant?delta(u.peso,ant.peso,'kg'):'&nbsp;'}</span></div>`+
    `<div class="tile bio"><span class="label">Gordura</span><span class="val">${u.gordura!=null?num(u.gordura):'—'}<small>%</small></span><span class="sub">${ant&&u.gordura!=null&&ant.gordura!=null?delta(u.gordura,ant.gordura,'p.p.'):'bioimpedância'}</span></div>`+
    `<div class="tile imc"><span class="label">IMC</span><span class="val">${iu!=null?num(iu):'—'}</span><span class="sub">${iu!=null?classeImc(iu):'<button class="link" data-tab="perfil">Informe a altura</button>'}</span></div>`;
}

/* ---------- Plano ---------- */
function htmlGrupo(g){
  if(g.rotulo){
    return `<div class="grp"><span class="grp-rot">${esc(g.rotulo)}</span>${g.nota?`<p class="nota">${esc(g.nota)}</p>`:''}<span class="subs-l">Escolha</span><div class="chips">${g.alt.map(a=>`<span class="chip">${esc(a)}</span>`).join('')}</div></div>`;
  }
  const extra = (g.frutas?'<button class="link" data-sec="frutas">Ver frutas e porções equivalentes</button>':'') + (g.receita?'<button class="link" data-sec="receita">Ver receita do capuccino</button>':'');
  return `<div class="grp"><span class="principal">${esc(g.alt[0])}</span>${g.alt.length>1?`<span class="subs-l">Ou substitua por</span><div class="chips">${g.alt.slice(1).map(a=>`<span class="chip">${esc(a)}</span>`).join('')}</div>`:''}${extra?`<div>${extra}</div>`:''}</div>`;
}
function renderPlano(){
  const h=hoje();
  $('atalhos').innerHTML = refeicoes().map(r=>`<button data-sec="r-${r.id}">${esc(r.nome)}</button>`).join('') + '<button data-sec="extras">Extras</button><button data-sec="frutas">Frutas</button><button data-sec="receita">Capuccino</button><button data-sec="agua">Água</button>';
  let html = refeicoes().map(r=>{
    const ops=opcoes(r), atual = UI.cardOp[r.id] || opcaoEfetiva(r,h) || ops[0].id, o = opcaoPorId(r,atual) || ops[0];
    const chip = x => `<button class="op ${x.id===o.id?'on':''}" data-card="${r.id}" data-op="${x.id}" aria-pressed="${x.id===o.id}">${esc(x.titulo)}</button>`;
    let seg = ops.length>1 ? `<div class="op-chips" role="group" aria-label="Opções">${ops.map(chip).join('')}</div>` : '';
    if(o.subtitulo) seg += `<p class="op-sub">${esc(o.subtitulo)}</p>`;
    let nota = o.nota ? `<p class="op-nota">${esc(o.nota)}</p>` : '';
    const beb = r.bebida ? `<p class="nota"><b>Bebida opcional:</b> ${esc(r.bebida)}</p>` : '';
    return `<div class="card" id="sec-r-${r.id}"><div class="card-head"><h2>${esc(r.nome)}</h2><span class="ref-hora">${esc(r.hora)}</span></div>${seg}<div class="grps">${o.grupos.map(htmlGrupo).join('')}</div>${nota}${beb}</div>`;
  }).join('');
  html += `<div class="card" id="sec-extras"><div class="card-head"><h2>Lista extra</h2><span class="meta-info">Fome fora das refeições · uma opção</span></div><ol class="lista-simples">${P.extras.map(e=>`<li>${esc(e.texto)}</li>`).join('')}</ol><p class="nota"><b>Bebida opcional:</b> ${esc(P.chaExtras)}</p></div>`;
  html += `<div class="card" id="sec-frutas"><h2>Frutas · porções equivalentes</h2><div class="chips">${P.frutas.map(f=>`<span class="chip">${esc(f)}</span>`).join('')}</div><p class="nota">Adoçantes permitidos: ${esc(P.adocantes.join(', '))}.</p></div>`;
  const rc=P.capuccino;
  html += `<div class="card" id="sec-receita"><h2>${esc(rc.nome)}</h2><table class="receita"><thead><tr><th>Ingrediente</th><th>Quantidade</th></tr></thead><tbody>${rc.itens.map(i=>`<tr><td>${esc(i[0])}</td><td>${esc(i[1])}</td></tr>`).join('')}</tbody></table><p class="nota">${esc(rc.nota)}</p></div>`;
  const hd=P.hidratacao;
  html += `<div class="card" id="sec-agua"><h2>Ingestão hídrica</h2><p style="margin:0">${esc(hd.formula)} <b>+ ${hd.porHoraTreinoMl} ml por hora de treino</b>.</p><p class="nota">Na tela Hoje, informe o tempo de treino e a meta se ajusta sozinha.</p></div>`;
  $('cardapio').innerHTML = html;
}

/* ---------- Semana ---------- */
function renderSemana(){
  const ini=UI.semana, dias=[...Array(7)].map((_,i)=>somaDias(ini,i)), h=hoje(), rs=refeicoes(), ob=obrigatorias();
  const fim=dias[6], d0=new Date(ini+'T12:00:00'), d6=new Date(fim+'T12:00:00');
  $('sem-titulo').textContent = d0.getMonth()===d6.getMonth() ? `${d0.getDate()} a ${d6.getDate()} de ${MESES[d6.getMonth()]}` : `${d0.getDate()}/${pad(d0.getMonth()+1)} a ${d6.getDate()}/${pad(d6.getMonth()+1)}`;
  const passados=dias.filter(d=>d<=h), n=passados.length, total=ob.length*n;
  let feitas=0, completos=0, diasAgua=0;
  passados.forEach(d=>{ const f=feitasDe(d), k=ob.filter(r=>f[r.id]).length; feitas+=k; if(k===ob.length) completos++; if(aguaDe(d)>=metaAgua(d)) diasAgua++; });
  const ms=meds(), medsSem=ms.filter(m=>m.data>=ini&&m.data<=fim), antes=ms.filter(m=>m.data<ini).pop();
  let dPeso=null;
  if(medsSem.length){ const ref = antes || (medsSem.length>1?medsSem[0]:null); if(ref) dPeso = medsSem[medsSem.length-1].peso - ref.peso; }
  $('sem-kpis').innerHTML =
    `<div class="tile dieta"><span class="label">Adesão</span><span class="val">${total?Math.round(feitas/total*100):'—'}<small>%</small></span><span class="sub">${feitas} de ${total} refeições</span></div>`+
    `<div class="tile dieta"><span class="label">Dias completos</span><span class="val">${completos}<small>/ ${n||7}</small></span><span class="sub">todas as refeições</span></div>`+
    `<div class="tile agua"><span class="label">Água</span><span class="val">${diasAgua}<small>/ ${n||7}</small></span><span class="sub">dias com a meta batida</span></div>`+
    `<div class="tile peso"><span class="label">Peso</span><span class="val">${dPeso==null?'—':(dPeso>0?'+':'')+num(dPeso)}<small>kg</small></span><span class="sub">${dPeso==null?'sem medições suficientes':antes?'vs. semana anterior':'dentro da semana'}</span></div>`;

  let t='<thead><tr><th></th>'+dias.map((d,i)=>`<th class="${d===h?'hoje-col':''}">${SEM_C[i]}<span>${Number(d.slice(8))}</span></th>`).join('')+'</tr></thead><tbody>';
  rs.forEach(r=>{
    const ops=opcoes(r);
    t+=`<tr><td class="rot">${esc(r.nome.replace(' da manhã','').replace(' da tarde','').replace('Pré-treino','Pré'))}<small>${esc(r.opcional?'opcional':r.hora.split(' ')[0])}</small></td>`;
    dias.forEach(d=>{
      const f=!!feitasDe(d)[r.id], e=escolha(r,d), o=opcaoPorId(r,opcaoEfetiva(r,d));
      const txt = ops.length>1 ? (o?o.sigla:'') : (f?'✓':'•');
      let cls='cel';
      if(f) cls+=' feita'; else if(d<h) cls+=' perdida'; else if(e) cls+=' esc'; else cls+=' sug';
      const lab=`${r.nome}, ${dataLonga(d)}: ${o?o.titulo:''}${f?', feita':''}`;
      t+=`<td><button class="${cls}" data-cel="${r.id}" data-data="${d}" aria-label="${esc(lab)}" ${ops.length>1?'':'disabled'}>${esc(txt)}</button></td>`;
    });
    t+='</tr>';
  });
  t+='<tr><td class="rot">Dia</td>'+dias.map(d=>`<td class="pct">${d<=h?Math.round(adesao(d)*100)+'%':''}</td>`).join('')+'</tr></tbody>';
  $('matriz').innerHTML=t;

  $('sem-refs').innerHTML = rs.map(r=>{
    const feitasR=passados.filter(d=>feitasDe(d)[r.id]);
    const cont={}; feitasR.forEach(d=>{ const o=opcaoPorId(r,opcaoEfetiva(r,d)); if(o) cont[o.sigla]=(cont[o.sigla]||0)+1; });
    const usos = opcoes(r).length>1 && Object.keys(cont).length ? Object.entries(cont).map(([k,v])=>`${k} ×${v}`).join(' · ') : '';
    return `<div class="res-ref"><div class="res-top"><b>${esc(r.nome)}${r.opcional?' <span class="meta-info">(opcional)</span>':''}</b><span>${feitasR.length}/${n}</span></div><div class="barra"><span style="width:${n?feitasR.length/n*100:0}%"></span></div>${usos?`<span class="meta-info">Opções feitas: ${esc(usos)}</span>`:''}</div>`;
  }).join('');

  const dest=[], extrasSem=dias.flatMap(d=>extrasDe(d));
  if(!n) dest.push('Semana futura: use a matriz para planejar as opções de cada dia.');
  else {
    const taxas=ob.map(r=>({r, v:passados.filter(d=>feitasDe(d)[r.id]).length/n}));
    const pior=taxas.slice().sort((a,b)=>a.v-b.v)[0], melhor=taxas.slice().sort((a,b)=>b.v-a.v)[0];
    if(melhor.v>0) dest.push(`${melhor.r.nome} foi a refeição mais cumprida (${Math.round(melhor.v*100)}%).`);
    if(pior.v<1 && pior.r!==melhor.r) dest.push(`${pior.r.nome} teve a menor adesão (${Math.round(pior.v*100)}%). Vale planejar esse horário.`);
    dest.push(extrasSem.length ? `${extrasSem.length} extra${extrasSem.length>1?'s':''} na semana.` : 'Nenhum extra registrado na semana.');
    dest.push(`Meta de água batida em ${diasAgua} de ${n} dia${n>1?'s':''}.`);
  }
  if(dPeso!=null) dest.push(`Peso ${dPeso<0?'caiu':dPeso>0?'subiu':'ficou estável'}${dPeso?` ${num(Math.abs(dPeso))} kg`:''} ${antes?'em relação à última medição da semana anterior':'entre as medições da semana'}.`);
  $('sem-dest').innerHTML = dest.map(x=>`<li>${esc(x)}</li>`).join('');
}

/* ---------- Evolução ---------- */
function serieAtual(){
  const m=meds();
  if(UI.serie==='peso') return {pts:m.map(x=>({d:x.data,v:x.peso})), cor:'var(--peso)', label:'Peso (kg)', un:'kg', cls:'c-peso'};
  if(UI.serie==='gordura') return {pts:m.filter(x=>x.gordura!=null).map(x=>({d:x.data,v:x.gordura})), cor:'var(--bio)', label:'Gordura corporal (%)', un:'p.p.', cls:'c-bio'};
  if(UI.serie==='musculo') return {pts:m.filter(x=>x.musculo!=null).map(x=>({d:x.data,v:composicao(x).musculoPct})), cor:'var(--bio)', label:'Massa muscular (% do peso)', un:'p.p.', cls:'c-bio'};
  if(UI.serie==='ossea') return {pts:m.filter(x=>x.ossea!=null).map(x=>({d:x.data,v:x.ossea})), cor:'var(--bio)', label:'Massa óssea (kg)', un:'kg', cls:'c-bio'};
  return {pts:m.map(x=>({d:x.data,v:imc(x.peso)})).filter(p=>p.v!=null), cor:'var(--imc)', label:'IMC (kg/m²)', un:'', cls:'c-imc'};
}
function passoBom(x){ const p=Math.pow(10,Math.floor(Math.log10(x))); const f=x/p; return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p; }
function grafico(s){
  const pts=s.pts;
  if(pts.length<2){
    if(UI.serie==='imc' && !(S.perfil&&S.perfil.altura_cm)) return '<p class="vazio">Informe a altura em <button class="link" data-tab="perfil">Perfil</button> para calcular o IMC.</p>';
    return '<p class="vazio">Registre ao menos duas medições para ver a curva.</p>';
  }
  const W=340,H=190,L=40,R=46,T=14,B=26;
  const vs=pts.map(p=>p.v), mn=Math.min(...vs), mx=Math.max(...vs);
  const step=passoBom(Math.max(mx-mn,0.5)/3);
  const lo=Math.floor(mn/step)*step, hi=Math.max(Math.ceil(mx/step)*step, lo+step);
  const ts=pts.map(p=>new Date(p.d+'T12:00:00').getTime()), t0=ts[0], t1=ts[ts.length-1];
  const X=t=>L+(W-L-R)*((t-t0)/((t1-t0)||1)), Y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
  let g='';
  for(let v=lo; v<=hi+step/2; v+=step){ const y=Y(v).toFixed(1); g+=`<line class="grid" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text x="${L-6}" y="${(+y+4)}" text-anchor="end">${num(v, step<1?1:0)}</text>`; }
  const xy=pts.map((p,i)=>[X(ts[i]),Y(p.v)]);
  const linha='M'+xy.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L');
  const area=linha+` L${xy[xy.length-1][0].toFixed(1)} ${H-B} L${xy[0][0].toFixed(1)} ${H-B} Z`;
  const ult=xy[xy.length-1];
  const dots=xy.slice(0,-1).map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="var(--surface)" stroke="${s.cor}" stroke-width="2"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.label)} ao longo do tempo">${g}
    <path d="${area}" fill="${s.cor}" opacity=".12"/>
    <path d="${linha}" fill="none" stroke="${s.cor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}<circle cx="${ult[0].toFixed(1)}" cy="${ult[1].toFixed(1)}" r="5" fill="${s.cor}"/>
    <text class="end" x="${(ult[0]+8).toFixed(1)}" y="${(ult[1]+4).toFixed(1)}">${num(pts[pts.length-1].v)}</text>
    <text x="${L}" y="${H-6}">${ddmm(pts[0].d)}</text><text x="${W-R}" y="${H-6}" text-anchor="end">${ddmm(pts[pts.length-1].d)}</text></svg>`;
}
function renderEvo(){
  document.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.serie===UI.serie)));
  const s=serieAtual();
  $('graf-label').textContent=s.label; $('graf-label').className='label '+s.cls;
  $('grafico').innerHTML=grafico(s);
  const p=s.pts; $('graf-delta').textContent = p.length>=2 ? `${p[p.length-1].v-p[0].v>0?'+':''}${num(p[p.length-1].v-p[0].v)} ${s.un} no período` : '';
  const m=meds(), meta=S.perfil&&S.perfil.meta_peso;
  if(meta && m.length){
    const ini=m[0].peso, at=m[m.length-1].peso, tot=ini-meta;
    const pr = tot>0 ? Math.max(0,Math.min(1,(ini-at)/tot)) : (at<=meta?1:0);
    $('card-meta').hidden=false; $('meta-barra').style.width=(pr*100).toFixed(0)+'%';
    $('meta-txt').textContent = at<=meta ? `Meta de ${num(meta)} kg atingida` : `faltam ${num(at-meta)} kg para ${num(meta)} kg`;
  } else $('card-meta').hidden=true;
  if(!m.length){ $('hist').innerHTML='<li style="display:block"><p class="vazio">As medições registradas aparecem aqui.</p></li>'; return; }
  $('hist').innerHTML = m.slice().reverse().map(x=>{
    const i=imc(x.peso), c=UI.pendDel===x.id;
    return `<li><span class="d">${ddmm(x.data)}</span><span class="vs"><b class="c-peso">${num(x.peso)} kg</b>${x.gordura!=null?`<b class="c-bio">${num(x.gordura)}%</b>`:''}${x.musculo!=null?`<b class="c-bio">músc. ${num(composicao(x).musculoPct)}%</b>`:''}${x.ossea!=null?`<b class="c-bio">osso ${num(x.ossea)} kg</b>`:''}${i!=null?`<b class="c-imc">IMC ${num(i)}</b>`:''}</span><button class="del${c?' conf':''}" data-del="${esc(x.id)}">${c?'Confirmar':'Apagar'}</button></li>`;
  }).join('');
}

/* ---------- Calendário ---------- */
function renderCal(){
  const {a,m}=UI.mes, prim=new Date(a,m,1), nd=new Date(a,m+1,0).getDate(), h=hoje();
  $('mes-titulo').textContent = `${MESES[m][0].toUpperCase()+MESES[m].slice(1)} ${a}`;
  const comMed=new Set(S.medicoes.map(x=>x.data));
  let html=['D','S','T','Q','Q','S','S'].map(w=>`<span class="wd">${w}</span>`).join('');
  for(let i=0;i<prim.getDay();i++) html+='<span class="dia vazio-dia" aria-hidden="true"></span>';
  for(let d=1; d<=nd; d++){
    const ds=`${a}-${pad(m+1)}-${pad(d)}`, ad=adesao(ds);
    const cls=['dia', ad>=1?'a3':ad>=.5?'a2':ad>0?'a1':'', ds>h?'futuro':'', ds===h?'hoje':'', ds===UI.sel?'sel':''].filter(Boolean).join(' ');
    html+=`<button class="${cls}" data-dia="${ds}" aria-label="${dataLonga(ds)}">${d}${comMed.has(ds)?'<i class="pt"></i>':''}</button>`;
  }
  $('cal').innerHTML=html;
  $('sel-titulo').textContent = UI.sel===h ? 'Hoje' : dataLonga(UI.sel);
  $('refs-sel').innerHTML = blocoRefeicoes(UI.sel);
  const md=meds().filter(x=>x.data===UI.sel).pop(), ag=aguaDe(UI.sel);
  $('med-sel').innerHTML = (md ? `<b class="c-peso">${num(md.peso)} kg</b>${md.gordura!=null?`<b class="c-bio">${num(md.gordura)}% gordura</b>`:''}${md.musculo!=null?`<b class="c-bio">${num(composicao(md).musculoPct)}% massa muscular</b>`:''}${md.ossea!=null?`<b class="c-bio">${num(md.ossea)} kg massa óssea</b>`:''}${imc(md.peso)!=null?`<b class="c-imc">IMC ${num(imc(md.peso))}</b>`:''}` : '<span class="meta-info">Sem medição neste dia.</span>')
    + (ag ? `<b class="c-agua">${ml(ag)} ml de água</b>` : '');
}

/* ---------- Perfil ---------- */
function renderPerfil(){
  if(!UI.perfilSujo){
    const p=S.perfil||{};
    $('p-nome').value=p.nome||''; $('p-alt').value=p.altura_cm||''; $('p-meta').value=p.meta_peso!=null?String(p.meta_peso).replace('.',','):'';
  }
  $('backup-info').textContent = `${S.medicoes.length} medições e ${Object.keys(S.dias).length} dias registrados. ` + (S.ultimoBackup ? `Último backup em ${ddmm(S.ultimoBackup)}.` : 'Nenhum backup feito ainda.');
  $('btn-apagar').textContent = UI.confApagar ? 'Toque de novo para confirmar: apagar tudo' : 'Apagar todos os registros deste aparelho';
  $('plano-info').innerHTML = `<p style="margin:0">Plano <b>${esc(P.versao)}</b> de ${esc(P.titular)} · objetivo: ${esc(P.objetivo.toLowerCase())}. ${obrigatorias().length} refeições diárias, pré-treino opcional e ${P.extras.length} extras.</p><p class="meta-info">Nutricionista: ${esc(P.nutricionista)}. Quando vier um plano novo, atualize o arquivo <code>plano.js</code> no GitHub.</p>`;
}

/* ---------- Backup ---------- */
async function exportar(){
  const dados = { app:'diario-smv', formato:1, exportado:new Date().toISOString(), perfil:S.perfil, medicoes:S.medicoes, dias:S.dias };
  const nome = `diario-smv-${hoje()}.json`;
  const blob = new Blob([JSON.stringify(dados,null,2)], {type:'application/json'});
  try{
    const file = new File([blob], nome, {type:'application/json'});
    if(navigator.canShare && navigator.canShare({files:[file]}) && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)){
      await navigator.share({files:[file], title:'Backup Diário SMV'});
    } else {
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=nome; document.body.appendChild(a); a.click();
      setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }
    S.ultimoBackup=hoje(); salvar(); render(); toast('Backup gerado');
  }catch(e){ if(e && e.name!=='AbortError') toast('Não foi possível gerar o backup.'); }
}
function importar(arq){
  const r=new FileReader();
  r.onload=()=>{
    let d; try{ d=JSON.parse(r.result); }catch(e){ return toast('Arquivo inválido.'); }
    if(!d || d.app!=='diario-smv' || !Array.isArray(d.medicoes) || typeof d.dias!=='object') return toast('Este arquivo não é um backup do Diário SMV.');
    if(!confirm(`Substituir os registros deste aparelho pelo backup de ${d.exportado?ddmm(d.exportado.slice(0,10)):'—'}? (${d.medicoes.length} medições, ${Object.keys(d.dias).length} dias)`)) return;
    S.perfil=d.perfil||S.perfil; S.medicoes=d.medicoes; S.dias=d.dias; UI.perfilSujo=false;
    salvar(); render(); toast('Backup importado');
  };
  r.readAsText(arq);
}

/* ---------- Ações ---------- */
let tToast;
function toast(t){ const el=$('toast'); el.textContent=t; el.hidden=false; clearTimeout(tToast); tToast=setTimeout(()=>{el.hidden=true;},2600); }
function mostrarErro(id,t){ const el=$(id); el.textContent=t||''; el.hidden=!t; }
function irPara(tab){ UI.tab=tab; UI.pendDel=null; UI.confApagar=false; render(); window.scrollTo(0,0); }
const rolar = id => { const el=$(id); if(el) el.scrollIntoView({block:'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); };

document.addEventListener('click', e=>{
  const b=e.target.closest('button'); if(!b||b.disabled) return;
  const ds=b.dataset;
  if(ds.tab){ irPara(ds.tab); return; }
  if(ds.serie){ UI.serie=ds.serie; renderEvo(); return; }
  const escolher = c => { if(c.escolhas[ds.esc]===ds.op) delete c.escolhas[ds.esc]; else c.escolhas[ds.esc]=ds.op; };
  if(ds.rasc && UI.rasc && UI.rasc.data===ds.data){
    if(ds.check) marcar(UI.rasc, ds.check, ds.data); else if(ds.esc) escolher(UI.rasc);
    renderHoje(); return;
  }
  if(ds.check){ alterarDia(ds.data, c=>marcar(c, ds.check, ds.data)); return; }
  if(ds.esc){ alterarDia(ds.data, escolher); return; }
  if(ds.cel){
    const r=refeicoes().find(x=>x.id===ds.cel), ops=opcoes(r), i=ops.findIndex(o=>o.id===opcaoEfetiva(r,ds.data));
    alterarDia(ds.data, c=>{ c.escolhas[r.id]=ops[(i+1)%ops.length].id; }); return;
  }
  if(ds.extra){ alterarDia(hoje(), c=>{ const i=c.extras.indexOf(ds.extra); if(i>=0) c.extras.splice(i,1); else c.extras.push(ds.extra); }); return; }
  if(ds.treino!=null){ alterarDia(hoje(), c=>{ c.treinoMin=Number(ds.treino); }); return; }
  if(ds.ver){ if(ds.op) UI.cardOp[ds.ver]=ds.op; irPara('plano'); rolar('sec-r-'+ds.ver); return; }
  if(ds.card){ UI.cardOp[ds.card]=ds.op; renderPlano(); return; }
  if(ds.sec){ if(UI.tab!=='plano') irPara('plano'); rolar('sec-'+ds.sec); return; }
  if(ds.dia){ UI.sel=ds.dia; renderCal(); return; }
  if(ds.del){
    if(UI.pendDel===ds.del){ UI.pendDel=null; S.medicoes=S.medicoes.filter(x=>x.id!==ds.del); salvar(); render(); toast('Medição apagada'); }
    else { UI.pendDel=ds.del; renderEvo(); }
    return;
  }
  switch(ds.acao){
    case 'agua-mais': case 'agua-menos': {
      const passo = P.hidratacao.incrementoMl * (ds.acao==='agua-mais'?1:-1);
      alterarDia(hoje(), c=>{ c.aguaMl=Math.max(0, mlDia(c)+passo); delete c.copos; }); break;
    }
    case 'dia-ant': mudarDia(somaDias(diaAtual(),-1)); break;
    case 'dia-prox': mudarDia(somaDias(diaAtual(),1)); break;
    case 'dia-hoje': mudarDia(hoje()); break;
    case 'registrar': {
      const r=UI.rasc; if(!r) break;
      alterarDia(r.data, c=>{ c.feitas={...r.feitas}; c.escolhas={...r.escolhas}; });
      toast(`Refeições de ${ddmm(r.data)} registradas`); break;
    }
    case 'descartar': UI.rasc=null; renderHoje(); break;
    case 'abrir-form': $('form-med').hidden=false; $('btn-medir').hidden=true; $('m-data').value=hoje(); $('m-peso').focus(); break;
    case 'fechar-form': fecharForm(); break;
    case 'mes-ant': UI.mes.m--; if(UI.mes.m<0){UI.mes.m=11;UI.mes.a--;} renderCal(); break;
    case 'mes-prox': UI.mes.m++; if(UI.mes.m>11){UI.mes.m=0;UI.mes.a++;} renderCal(); break;
    case 'sem-ant': UI.semana=somaDias(UI.semana,-7); renderSemana(); break;
    case 'sem-prox': UI.semana=somaDias(UI.semana,7); renderSemana(); break;
    case 'exportar': exportar(); break;
    case 'importar': $('arq-import').click(); break;
    case 'apagar-tudo':
      if(!UI.confApagar){ UI.confApagar=true; renderPerfil(); break; }
      UI.confApagar=false; S.medicoes=[]; S.dias={}; S.ultimoBackup=null; salvar(); render(); toast('Registros apagados'); break;
  }
});
$('dia-sel').addEventListener('change', e=>{ if(e.target.value) mudarDia(e.target.value); else renderHoje(); });
$('arq-import').addEventListener('change', e=>{ const f=e.target.files[0]; if(f) importar(f); e.target.value=''; });
document.addEventListener('input', e=>{
  const t=e.target;
  if(t.closest('#form-perfil')){ UI.perfilSujo=true; mostrarErro('p-erro',''); }
  if(t.closest('#form-med')) mostrarErro('m-erro','');
});
function fecharForm(){ $('form-med').reset(); $('form-med').hidden=true; $('btn-medir').hidden=false; mostrarErro('m-erro',''); }

$('form-med').addEventListener('submit', e=>{
  e.preventDefault();
  const data=$('m-data').value, peso=parse($('m-peso').value);
  const opc={gordura:[parse($('m-gord').value),3,70,'gordura (3 a 70%)'], musculo:[parse($('m-musc').value),10,150,'massa muscular (10 a 150 kg)'], agua:[parse($('m-agua').value),30,80,'água (30 a 80%)'], ossea:[parse($('m-ossea').value),0.5,10,'massa óssea (0,5 a 10 kg)']};
  if(!data) return mostrarErro('m-erro','Informe a data da medição.');
  if(data>hoje()) return mostrarErro('m-erro','A data não pode estar no futuro.');
  if(peso==null) return mostrarErro('m-erro','Informe o peso.');
  if(isNaN(peso)||peso<30||peso>300) return mostrarErro('m-erro','Peso fora da faixa esperada (30 a 300 kg).');
  const m={id:'m'+Date.now(), data, peso:Math.round(peso*10)/10, criado:Date.now()};
  for(const k in opc){ const [v,a,b,n]=opc[k]; if(v==null) continue; if(isNaN(v)||v<a||v>b) return mostrarErro('m-erro','Valor inválido em '+n+'.'); m[k]=Math.round(v*10)/10; }
  /* Coerência: músculo + osso não passam do peso, nem somados à massa gorda (margem de 5% da balança) */
  const cp=composicao(m);
  if((m.musculo||0)+(m.ossea||0) > m.peso) return mostrarErro('m-erro','Massa muscular + massa óssea não podem passar do peso.');
  if(cp.gordaKg!=null && cp.gordaKg+(m.musculo||0)+(m.ossea||0) > m.peso*1.05) return mostrarErro('m-erro',`Gordura (${num(cp.gordaKg)} kg) + músculo + osso passam do peso. Confira os valores.`);
  S.medicoes.push(m); salvar(); fecharForm(); render(); toast('Medição registrada');
});
$('form-perfil').addEventListener('submit', e=>{
  e.preventDefault();
  const alt=parse($('p-alt').value), meta=parse($('p-meta').value);
  if(alt==null||isNaN(alt)||alt<120||alt>220) return mostrarErro('p-erro','Informe a altura em centímetros (120 a 220).');
  if(meta!=null&&(isNaN(meta)||meta<30||meta>300)) return mostrarErro('p-erro','Meta de peso fora da faixa (30 a 300 kg).');
  S.perfil={nome:$('p-nome').value.trim(), altura_cm:Math.round(alt)};
  if(meta!=null) S.perfil.meta_peso=Math.round(meta*10)/10;
  UI.perfilSujo=false; salvar(); render(); toast('Dados salvos');
});

/* Virada do dia com o app aberto: re-renderiza ao voltar para a aba */
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) render(); });

/* ---------- Início ---------- */
carregar(); render();
if('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
