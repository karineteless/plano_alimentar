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
const UI = { tab:'hoje', dia:null, rasc:null, serie:'peso', sel:hoje(), mes:null, semana:segunda(hoje()), pendDel:null, perfilSujo:false, cardOp:{}, confApagar:false, planoFds:null, aguaEdit:false };
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
/* Cardápio flexível: nos dias de P.fimDeSemana.dias as opções Flex entram junto das habituais */
const FDS = P.fimDeSemana || null;
const ehFlex = data => !!FDS && FDS.dias.includes(new Date(data+'T12:00:00').getDay());
const flexRef = r => (FDS && FDS.refeicoes && FDS.refeicoes[r.id]) || null;
const flexOps = r => (flexRef(r)||{}).opcoes || [];
const opcoes = (r,data) => (data && ehFlex(data)) ? r.opcoes.concat(flexOps(r)) : r.opcoes;
const diaDe = data => S.dias[data]||{};
const feitasDe = data => diaDe(data).feitas||{};
const extrasDe = data => Array.isArray(diaDe(data).extras)?diaDe(data).extras:[];
function adesao(data){ const r=obrigatorias(); const f=feitasDe(data); return r.filter(x=>f[x.id]).length/r.length; }
/* A sugestão automática gira só entre as opções habituais */
function sugestao(r,data){ const ops=r.opcoes; return ops.length ? ops[diaNum(data)%ops.length].id : null; }
function escolha(r,data,dia=diaDe(data)){ const e=(dia.escolhas||{})[r.id]; return opcoes(r,data).some(o=>o.id===e) ? e : null; }
const opcaoEfetiva = (r,data,dia) => escolha(r,data,dia) || sugestao(r,data);
const opcaoPorId = (r,id) => r.opcoes.concat(flexOps(r)).find(o=>o.id===id);
const resumoOpcao = o => o ? [o.subtitulo, ...o.grupos.filter(g=>g.res).map(g=>g.res)].filter(Boolean).join(' · ') : '';
/* Dias de cardápio flexível em sequência (ex.: sex–dom) que contêm `data` */
function blocoFds(data){
  const b=[data];
  for(let d=somaDias(data,-1), i=0; i<6 && ehFlex(d); d=somaDias(d,-1), i++) b.unshift(d);
  for(let d=somaDias(data,1), i=0; i<6 && ehFlex(d); d=somaDias(d,1), i++) b.push(d);
  return b;
}
/* Opção "uma vez por fim de semana" já escolhida em outro dia do mesmo bloco → data desse dia */
function flexUsadaEm(r, data){
  if(!ehFlex(data)) return null;
  return blocoFds(data).find(d=>{ if(d===data) return false; const o=opcaoPorId(r,escolha(r,d)); return o && o.umaVez; }) || null;
}
const diaCurto = s => `${SEM[new Date(s+'T12:00:00').getDay()].split('-')[0].slice(0,3)} (${ddmm(s)})`;
/* Doce flexível */
const DOCES = FDS && FDS.doces;
const doceIdx = id => DOCES ? DOCES.itens.findIndex(x=>x.id===id) : -1;
const boloOntem = data => !!(DOCES && DOCES.bolo && diaDe(somaDias(data,-1)).doce===DOCES.bolo.id);
/* Marca/desmarca uma refeição; ao marcar, fixa a opção sugerida se nenhuma foi escolhida */
function marcar(c, id, data){
  if(c.feitas[id]){ delete c.feitas[id]; return; }
  c.feitas[id]=true; const r=refeicoes().find(x=>x.id===id);
  if(r && !c.escolhas[r.id] && opcoes(r,data).length>1) c.escolhas[r.id]=sugestao(r,data);
}
/* `dia` opcional: rascunho de um dia anterior */
function metaAgua(data, dia){ const h=P.hidratacao, t=(dia||diaDe(data)).treinoMin||0; return h.baseMl + Math.round(h.porHoraTreinoMl*t/60); }
/* Registros antigos guardavam copos de 250 ml; os novos guardam aguaMl */
const mlDia = c => c.aguaMl!=null ? c.aguaMl : (c.copos||0)*250;
const aguaDe = data => mlDia(diaDe(data));
const meds = () => S.medicoes.slice().sort((a,b)=> a.data<b.data?-1:a.data>b.data?1:(a.criado||0)-(b.criado||0));
function imc(peso){ const a=S.perfil&&S.perfil.altura_cm; if(!a||!peso) return null; return peso/((a/100)**2); }
/* Derivados da bioimpedância: massa gorda/magra a partir do % de gordura; músculo e osso como % do peso */
function composicao(m){
  const p=m.peso, gk = m.gordura!=null ? p*m.gordura/100 : null, pct = v => v!=null ? v/p*100 : null;
  /* Novos registros guardam musculoPct/osseaPct (%); os antigos podem ter musculo/ossea em kg */
  const mp = m.musculoPct!=null ? m.musculoPct : pct(m.musculo), op = m.osseaPct!=null ? m.osseaPct : pct(m.ossea), kg = v => v!=null ? p*v/100 : null;
  return { gordaKg:gk, magraKg: gk!=null ? p-gk : null, musculoPct:mp, musculoKg:kg(mp), osseaPct:op, osseaKg:kg(op), agua:m.agua };
}
function classeImc(v){ if(v==null) return ''; if(v<18.5) return 'Abaixo do peso'; if(v<25) return 'Peso normal'; if(v<30) return 'Sobrepeso'; if(v<35) return 'Obesidade grau I'; if(v<40) return 'Obesidade grau II'; return 'Obesidade grau III'; }
/* Dia exibido na tela Hoje (padrão: hoje). Dias anteriores são editados num rascunho
   (refeições, água, treino, extras e doce) e só salvos em "Registrar". */
const diaAtual = () => (UI.dia && UI.dia<hoje()) ? UI.dia : hoje();
function rascunho(){
  const d=diaAtual();
  if(d===hoje()){ UI.rasc=null; return null; }
  if(!UI.rasc || UI.rasc.data!==d){
    const x=diaDe(d);
    UI.rasc={data:d, feitas:{...(x.feitas||{})}, escolhas:{...(x.escolhas||{})}, aguaMl:mlDia(x), treinoMin:x.treinoMin||0, extras:extrasDe(d).slice(), doce:x.doce||null};
  }
  return UI.rasc;
}
function mesmoObj(a,b){ const ka=Object.keys(a).filter(k=>a[k]), kb=Object.keys(b).filter(k=>b[k]); return ka.length===kb.length && ka.every(k=>a[k]===b[k]); }
const mesmaLista = (a,b) => a.slice().sort().join('|')===b.slice().sort().join('|');
function rascSujo(){
  const r=UI.rasc; if(!r) return false; const x=diaDe(r.data);
  return !mesmoObj(r.feitas,x.feitas||{}) || !mesmoObj(r.escolhas,x.escolhas||{}) || r.aguaMl!==mlDia(x)
    || r.treinoMin!==(x.treinoMin||0) || !mesmaLista(r.extras,extrasDe(r.data)) || (r.doce||null)!==(x.doce||null);
}
/* Altera o dia exibido: hoje salva na hora; dia anterior altera o rascunho */
function editarDia(fn){
  const r=rascunho();
  if(r){ fn(r); renderHoje(); return; }
  alterarDia(hoje(), fn);
}
function mudarDia(d){
  if(d>hoje()) d=hoje();
  if(d===diaAtual()){ renderHoje(); return; }
  if(rascSujo() && !confirm('Descartar as alterações não registradas?')){ renderHoje(); return; }
  UI.rasc=null; UI.aguaEdit=false; UI.dia = d===hoje() ? null : d; renderHoje();
}

/* ---------- Render ---------- */
const TITULOS = {hoje:'Hoje', plano:'Plano alimentar', semana:'Resumo semanal', evo:'Evolução', cal:'Calendário', perfil:'Perfil'};
function render(){
  $('titulo').textContent = TITULOS[UI.tab];
  const nome = (S.perfil&&S.perfil.nome) || P.titular || 'Diário SMV';
  $('eyebrow').textContent = nome;
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

/* Avisos do cardápio flexível para uma refeição num dia de fim de semana */
function avisoFlex(r, data, src){
  const fr=flexRef(r); if(!fr || !ehFlex(data)) return '';
  const e=escolha(r,data,src), o=opcaoPorId(r,e), usada=flexUsadaEm(r,data);
  if(r.id==='lanche' && DOCES && src.doce===DOCES.bolo.id) return '<p class="aviso-flex">Hoje o bolo (doce 10) substitui o lanche da tarde.</p>';
  if(usada && o && o.umaVez) return `<p class="aviso-flex alerta">Opção flexível também escolhida em ${diaCurto(usada)}. A regra é 1 dia por fim de semana.</p>`;
  if(usada) return `<p class="aviso-flex">Flex já usado em ${diaCurto(usada)}. ${esc(fr.outroDia||'')}</p>`;
  return fr.dica ? `<p class="aviso-flex">${esc(fr.dica)}</p>` : '';
}

/* `dia` opcional: rascunho exibido no lugar do registro salvo */
function blocoRefeicoes(data, dia){
  const src=dia||diaDe(data), f=src.feitas||{}, rs=dia?' data-rasc="1"':'';
  return '<ul class="refs">'+refeicoes().map(r=>{
    const ops=opcoes(r,data), e=escolha(r,data,src), ef=opcaoEfetiva(r,data,src), feita=!!f[r.id];
    const usada=flexUsadaEm(r,data);
    const chips = ops.length>1 ? `<div class="op-chips" role="group" aria-label="Opções de ${esc(r.nome)}">`+ops.map((o,i)=>{
      const cls = [o.id===e?'on':(!e&&o.id===ef?'sug':''), o.flex?'flex':'', o.flex&&o.umaVez&&usada&&o.id!==e?'bloq':''].filter(Boolean).join(' ');
      const div = o.flex && !(ops[i-1]||{}).flex ? '<span class="op-div" aria-hidden="true"></span>' : '';
      return `${div}<button class="op ${cls}" data-esc="${r.id}" data-op="${o.id}" data-data="${data}"${rs} aria-pressed="${o.id===e}"${o.subtitulo?` title="${esc(o.subtitulo)}"`:''}>${esc(o.sigla||o.titulo)}</button>`;
    }).join('')+'</div>' : '';
    const sub = r.opcional ? 'opcional' : (!e&&ops.length>1 ? 'sugestão do dia' : '');
    return `<li class="ref-item${feita?' feita':''}${r.opcional?' opc':''}">
      <div class="ref-linha">
        <button class="chk" data-check="${r.id}" data-data="${data}"${rs} aria-pressed="${feita}" aria-label="Marcar ${esc(r.nome)} como feita">${CHECK}</button>
        <div class="ref-info"><span class="ref-nome">${esc(r.nome)}</span><span class="ref-hora">${esc(r.hora)}${sub?' · '+sub:''}</span></div>
        <button class="link" data-ver="${r.id}" data-op="${ef||''}" data-data="${data}">Detalhes</button>
      </div>${chips}
      <p class="ref-resumo">${esc(resumoOpcao(opcaoPorId(r,ef)))}</p>${avisoFlex(r,data,src)}
    </li>`;
  }).join('')+'</ul>';
}

function renderHoje(){
  const h=hoje(), d=diaAtual(), rasc=rascunho(), src=rasc||diaDe(d), rs=obrigatorias(), f=src.feitas||{}, feitas=rs.filter(x=>f[x.id]).length, frac=feitas/rs.length;
  const passado = d!==h, flex=ehFlex(d);
  $('titulo').textContent = passado ? 'Dia anterior' : 'Hoje';
  $('eyebrow').textContent = dataLonga(d);
  $('dieta-label').textContent = passado ? `Dieta de ${ddmm(d)}` : 'Dieta de hoje';
  $('flex-badge').hidden = $('flex-legenda').hidden = !flex;
  $('dia-sel').value=d; $('dia-sel').max=h;
  $('dia-prox').disabled = d>=h; $('dia-hoje').hidden = !passado;
  $('dia-bar').classList.toggle('passado', passado); $('dia-aviso').hidden = !passado;
  $('ring-prog').setAttribute('stroke-dashoffset', (213.6*(1-frac)).toFixed(1));
  $('ring-txt').textContent = `${feitas}/${rs.length}`;
  $('dieta-resumo').textContent = feitas===rs.length ? 'Dieta do dia concluída' : `${feitas} de ${rs.length} refeições`;
  $('dieta-dica').textContent = 'Escolha a opção e marque ao concluir';
  $('refs-hoje').innerHTML = blocoRefeicoes(d, rasc);
  const sujo=rascSujo();
  $('registrar').hidden = !rasc; $('btn-registrar').disabled = $('btn-descartar').disabled = !sujo;
  $('registrar-txt').textContent = sujo ? `Alterações em ${ddmm(d)} ainda não salvas` : `Nenhuma alteração em ${ddmm(d)}`;

  const a=mlDia(src), m=metaAgua(d,src), tm=src.treinoMin||0;
  $('agua-val').innerHTML = `${ml(a)}<small>ml</small>`;
  $('agua-meta').textContent = a>=m ? `Meta de ${ml(m)} ml atingida` : `meta ${ml(m)} ml · faltam ${ml(m-a)}`;
  $('agua-barra').style.width = Math.min(100,a/m*100).toFixed(0)+'%';
  $('agua-ok').hidden = a<m;
  $('agua-form').hidden = !UI.aguaEdit; $('agua-dica').hidden = UI.aguaEdit;
  $('treino-label').textContent = `Treino ${passado?'no dia':'hoje'} (+${P.hidratacao.porHoraTreinoMl} ml por hora):`;
  $('treino-chips').innerHTML = TREINO_OPC.map(v=>`<button class="op ${v===tm?'on':''}" data-treino="${v}" aria-pressed="${v===tm}">${v?v+' min':'Sem treino'}</button>`).join('');

  /* Doce flexível (só nos dias de fim de semana) */
  $('card-doce').hidden = !(flex && DOCES);
  if(flex && DOCES){
    const restr = boloOntem(d) ? DOCES.bolo.diaSeguinte : null, dc=src.doce||null;
    $('doce-regra').textContent = DOCES.regra;
    $('doce-livre').textContent = '+ ' + DOCES.livre;
    $('doce-info').textContent = dc ? `opção ${doceIdx(dc)+1} escolhida` : '1 por dia';
    const fora = restr && dc && !restr.includes(dc);
    $('doce-aviso').hidden = !restr;
    $('doce-aviso').className = 'aviso-flex' + (fora ? ' alerta' : '');
    if(restr) $('doce-aviso').textContent = `Ontem teve bolo: hoje escolha só entre as opções 1 e ${doceIdx(restr[restr.length-1])+1}.`;
    $('doce-chips').innerHTML = DOCES.itens.map((x,i)=>`<button class="chip tg doce${restr&&!restr.includes(x.id)&&x.id!==dc?' bloq':''}" data-doce="${x.id}" aria-pressed="${x.id===dc}"><b>${i+1}</b> ${esc(x.texto)}</button>`).join('');
  }

  const marc=src.extras||[];
  $('extras-label').textContent = passado ? 'Extras do dia' : 'Extras de hoje';
  $('extras-n').textContent = marc.length ? `${marc.length} marcado${marc.length>1?'s':''}` : '';
  $('extras-hoje').innerHTML = P.extras.map(e=>`<button class="chip tg" data-extra="${e.id}" aria-pressed="${marc.includes(e.id)}">${esc(e.texto)}</button>`).join('');

  const ms=meds(), u=ms[ms.length-1], ant=ms[ms.length-2];
  $('ult-data').textContent = u ? `em ${ddmm(u.data)}` : '';
  const delta = (x,y,un) => (x==null||y==null) ? '' : `${x-y>0?'+':''}${num(x-y)} ${un} vs. anterior`;
  if(!u){ $('tiles').innerHTML = '<p class="vazio" style="grid-column:1/-1">Nenhuma medição ainda. Registre a primeira abaixo.</p>'; return; }
  const iu=imc(u.peso), cp=composicao(u);
  /* valor da medição anterior que tenha o dado, para mostrar a variação */
  const antC = k => { const a=ms.slice(0,-1).reverse().find(x=>composicao(x)[k]!=null); return a ? composicao(a)[k] : null; };
  const linhas = [
    ['Massa gorda', cp.gordaKg, 'kg', null, 'gordaKg', 'peso × % gordura'],
    ['Massa magra', cp.magraKg, 'kg', null, 'magraKg', 'peso − massa gorda'],
    ['Massa muscular', cp.musculoPct, '%', cp.musculoKg, 'musculoPct', 'peso × % músculo'],
    ['Massa óssea', cp.osseaPct, '%', cp.osseaKg, 'osseaPct', 'peso × % osso'],
    ['Água corporal', cp.agua, '%', null, 'agua', ''],
  ].filter(l=>l[1]!=null);
  $('comp').hidden = !linhas.length;
  $('comp').innerHTML = linhas.length ? '<span class="label c-bio">Composição corporal</span><ul>'+linhas.map(([n,v,un,kg,k,dica])=>{
    const a=antC(k), dl = a!=null ? `${v-a>0?'+':''}${num(v-a)} ${un==='%'?'p.p.':un} vs. anterior` : '';
    return `<li><span>${n}${dica?`<small>${dica}</small>`:''}</span><b>${num(v)}${un==='%'?'%':' '+un}${kg!=null?`<small> · ${num(kg)} kg</small>`:''}</b><small class="dl">${dl}</small></li>`;
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
/* Regras do cardápio flexível no topo do card da refeição (modo Fim de semana) */
function htmlRegraFlex(r){
  const fr=flexRef(r); if(!fr) return '';
  let h = `<span class="label c-flex">Fim de semana</span><p>${esc(fr.regra)}</p>`;
  if(fr.outroDia) h += `<p class="nota">${esc(fr.outroDia)}</p>`;
  if(fr.exemplos) h += `<span class="subs-l">Exemplos de preparo</span><div class="chips">${fr.exemplos.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div>`;
  if(fr.sobremesa) h += `<p class="nota">${esc(fr.sobremesa)}</p>`;
  return `<div class="flex-box">${h}</div>`;
}
function renderPlano(){
  const h=hoje();
  if(UI.planoFds==null) UI.planoFds = ehFlex(h);
  const fds = !!(FDS && UI.planoFds);
  document.querySelectorAll('[data-plano]').forEach(b=>b.setAttribute('aria-pressed', String((b.dataset.plano==='fds')===fds)));
  $('atalhos').innerHTML = refeicoes().map(r=>`<button data-sec="r-${r.id}">${esc(r.nome)}</button>`).join('') + (fds&&DOCES?'<button data-sec="doces">Doces</button>':'') + '<button data-sec="extras">Extras</button><button data-sec="frutas">Frutas</button><button data-sec="receita">Capuccino</button><button data-sec="agua">Água</button>';
  let html = fds ? `<div class="card card-flex"><div class="card-head"><h2>${esc(FDS.nome)}</h2><span class="badge-flex">${esc(FDS.dias.map(n=>SEM[n].split('-')[0].slice(0,3)).join(' · '))}</span></div><p class="nota">Nesses dias, as opções <b class="c-flex">Flex</b> aparecem na tela Hoje junto das habituais. Quantidades e regras abaixo, em cada refeição.</p></div>` : '';
  html += refeicoes().map(r=>{
    const ops = fds ? r.opcoes.concat(flexOps(r)) : r.opcoes;
    const atual = UI.cardOp[r.id] || opcaoEfetiva(r,h), o = ops.find(x=>x.id===atual) || ops[0];
    const chip = x => `<button class="op ${x.id===o.id?'on':''}${x.flex?' flex':''}" data-card="${r.id}" data-op="${x.id}" aria-pressed="${x.id===o.id}">${esc(x.titulo)}</button>`;
    let seg = ops.length>1 ? `<div class="op-chips" role="group" aria-label="Opções">${ops.map(chip).join('')}</div>` : '';
    if(o.subtitulo) seg += `<p class="op-sub${o.flex?' c-flex':''}">${esc(o.subtitulo)}</p>`;
    let nota = o.nota ? `<p class="op-nota">${esc(o.nota)}</p>` : '';
    const beb = r.bebida ? `<p class="nota"><b>Bebida opcional:</b> ${esc(r.bebida)}</p>` : '';
    return `<div class="card" id="sec-r-${r.id}"><div class="card-head"><h2>${esc(r.nome)}</h2><span class="ref-hora">${esc(r.hora)}</span></div>${fds?htmlRegraFlex(r):''}${seg}<div class="grps">${o.grupos.map(htmlGrupo).join('')}</div>${nota}${beb}</div>`;
  }).join('');
  if(fds && DOCES) html += `<div class="card card-flex" id="sec-doces"><div class="card-head"><h2>Doce flexível</h2><span class="meta-info">1 por dia · ao longo do dia</span></div><p class="nota">${esc(DOCES.regra)}</p><ol class="lista-simples">${DOCES.itens.map(x=>`<li>${esc(x.texto)}</li>`).join('')}</ol><p class="nota"><b>Livre:</b> ${esc(DOCES.livre)}</p><p class="op-nota">${esc(DOCES.bolo.regra)}</p></div>`;
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
    t+=`<tr><td class="rot">${esc(r.nome.replace(' da manhã','').replace(' da tarde','').replace('Pré-treino','Pré'))}<small>${esc(r.opcional?'opcional':r.hora.split(' ')[0])}</small></td>`;
    dias.forEach(d=>{
      const ops=opcoes(r,d), f=!!feitasDe(d)[r.id], e=escolha(r,d), o=opcaoPorId(r,opcaoEfetiva(r,d));
      const txt = ops.length>1 ? (o?o.sigla:'') : (f?'✓':'•');
      let cls='cel'+(o&&o.flex?' flex':'');
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
    const usos = (r.opcoes.length>1 || flexOps(r).length) && Object.keys(cont).length ? Object.entries(cont).map(([k,v])=>`${k} ×${v}`).join(' · ') : '';
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
    const docesSem=dias.filter(d=>diaDe(d).doce).map(d=>doceIdx(diaDe(d).doce)+1);
    if(docesSem.length) dest.push(`Doce flexível: opç${docesSem.length>1?'ões':'ão'} ${docesSem.join(', ')} no fim de semana.`);
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
  document.querySelectorAll('.seg button[data-serie]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.serie===UI.serie)));
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
    return `<li><span class="d">${ddmm(x.data)}</span><span class="vs"><b class="c-peso">${num(x.peso)} kg</b>${x.gordura!=null?`<b class="c-bio">${num(x.gordura)}%</b>`:''}${(cx=>`${cx.musculoPct!=null?`<b class="c-bio">músc. ${num(cx.musculoPct)}%</b>`:''}${cx.osseaPct!=null?`<b class="c-bio">osso ${num(cx.osseaPct)}%</b>`:''}`)(composicao(x))}${i!=null?`<b class="c-imc">IMC ${num(i)}</b>`:''}</span><button class="del${c?' conf':''}" data-del="${esc(x.id)}">${c?'Confirmar':'Apagar'}</button></li>`;
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
  $('med-sel').innerHTML = (md ? `<b class="c-peso">${num(md.peso)} kg</b>${md.gordura!=null?`<b class="c-bio">${num(md.gordura)}% gordura</b>`:''}${(cx=>`${cx.musculoPct!=null?`<b class="c-bio">${num(cx.musculoPct)}% massa muscular</b>`:''}${cx.osseaPct!=null?`<b class="c-bio">${num(cx.osseaPct)}% massa óssea</b>`:''}`)(composicao(md))}${imc(md.peso)!=null?`<b class="c-imc">IMC ${num(imc(md.peso))}</b>`:''}` : '<span class="meta-info">Sem medição neste dia.</span>')
    + `<b class="c-agua">${ml(ag)} ml de água</b>`
    + (diaDe(UI.sel).doce ? `<b class="c-flex">Doce ${doceIdx(diaDe(UI.sel).doce)+1}</b>` : '');
  $('btn-editar-dia').hidden = UI.sel>h;
}

/* ---------- Perfil ---------- */
function renderPerfil(){
  if(!UI.perfilSujo){
    const p=S.perfil||{};
    $('p-nome').value=p.nome||''; $('p-alt').value=p.altura_cm||''; $('p-meta').value=p.meta_peso!=null?String(p.meta_peso).replace('.',','):'';
  }
  $('backup-info').textContent = `${S.medicoes.length} medições e ${Object.keys(S.dias).length} dias registrados. ` + (S.ultimoBackup ? `Último backup em ${ddmm(S.ultimoBackup)}.` : 'Nenhum backup feito ainda.');
  $('btn-apagar').textContent = UI.confApagar ? 'Toque de novo para confirmar: apagar tudo' : 'Apagar todos os registros deste aparelho';
  $('plano-info').innerHTML = `<p style="margin:0">Plano <b>${esc(P.versao)}</b> de ${esc(P.titular)} · objetivo: ${esc(P.objetivo.toLowerCase())}. ${obrigatorias().length} refeições diárias, pré-treino opcional e ${P.extras.length} extras.${FDS?` Cardápio flexível em: ${FDS.dias.map(n=>SEM[n].split('-')[0]).join(', ')}.`:''}</p><p class="meta-info">Nutricionista: ${esc(P.nutricionista)}. Quando vier um plano novo, atualize o arquivo <code>plano.js</code> no GitHub.</p>`;
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
    const r=refeicoes().find(x=>x.id===ds.cel), ops=opcoes(r,ds.data), i=ops.findIndex(o=>o.id===opcaoEfetiva(r,ds.data));
    alterarDia(ds.data, c=>{ c.escolhas[r.id]=ops[(i+1)%ops.length].id; }); return;
  }
  /* Água, treino, extras e doce seguem o dia exibido na tela Hoje */
  if(ds.extra){ editarDia(c=>{ const i=c.extras.indexOf(ds.extra); if(i>=0) c.extras.splice(i,1); else c.extras.push(ds.extra); }); return; }
  if(ds.treino!=null){ editarDia(c=>{ c.treinoMin=Number(ds.treino); }); return; }
  if(ds.doce){ editarDia(c=>{ c.doce = c.doce===ds.doce ? null : ds.doce; }); return; }
  if(ds.plano){ UI.planoFds = ds.plano==='fds'; renderPlano(); return; }
  if(ds.ver){ if(ds.op) UI.cardOp[ds.ver]=ds.op; if(ds.data) UI.planoFds=ehFlex(ds.data); irPara('plano'); rolar('sec-r-'+ds.ver); return; }
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
      editarDia(c=>{ c.aguaMl=Math.max(0, mlDia(c)+passo); delete c.copos; }); break;
    }
    case 'agua-editar': {
      UI.aguaEdit=true; renderHoje();
      const src=rascunho()||diaDe(diaAtual()), inp=$('agua-input'); inp.value=mlDia(src); mostrarErro('agua-erro','');
      inp.focus(); inp.select(); break;
    }
    case 'agua-cancelar': UI.aguaEdit=false; renderHoje(); break;
    case 'editar-dia': irPara('hoje'); mudarDia(UI.sel); break;
    case 'dia-ant': mudarDia(somaDias(diaAtual(),-1)); break;
    case 'dia-prox': mudarDia(somaDias(diaAtual(),1)); break;
    case 'dia-hoje': mudarDia(hoje()); break;
    case 'registrar': {
      const r=UI.rasc; if(!r) break;
      alterarDia(r.data, c=>{
        c.feitas={...r.feitas}; c.escolhas={...r.escolhas}; c.aguaMl=r.aguaMl; delete c.copos;
        c.treinoMin=r.treinoMin; c.extras=r.extras.slice(); if(r.doce) c.doce=r.doce; else delete c.doce;
      });
      toast(`Dia ${ddmm(r.data)} registrado`); break;
    }
    case 'descartar': UI.rasc=null; UI.aguaEdit=false; renderHoje(); break;
    case 'abrir-form': $('form-med').hidden=false; $('btn-medir').hidden=true; $('m-data').value=diaAtual(); $('m-peso').focus(); break;
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
  const opc={gordura:[parse($('m-gord').value),3,70,'gordura (3 a 70%)'], musculoPct:[parse($('m-musc').value),10,90,'massa muscular (10 a 90%)'], agua:[parse($('m-agua').value),30,80,'água (30 a 80%)'], osseaPct:[parse($('m-ossea').value),1,15,'massa óssea (1 a 15%)']};
  if(!data) return mostrarErro('m-erro','Informe a data da medição.');
  if(data>hoje()) return mostrarErro('m-erro','A data não pode estar no futuro.');
  if(peso==null) return mostrarErro('m-erro','Informe o peso.');
  if(isNaN(peso)||peso<30||peso>300) return mostrarErro('m-erro','Peso fora da faixa esperada (30 a 300 kg).');
  const m={id:'m'+Date.now(), data, peso:Math.round(peso*10)/10, criado:Date.now()};
  for(const k in opc){ const [v,a,b,n]=opc[k]; if(v==null) continue; if(isNaN(v)||v<a||v>b) return mostrarErro('m-erro','Valor inválido em '+n+'.'); m[k]=Math.round(v*10)/10; }
  /* Coerência: músculo + osso não passam de 100%, nem somados à gordura (margem de 5 p.p. da balança) */
  const mu=m.musculoPct||0, os=m.osseaPct||0;
  if(mu+os > 100) return mostrarErro('m-erro','Massa muscular + massa óssea não podem passar de 100%.');
  if(m.gordura!=null && m.gordura+mu+os > 105) return mostrarErro('m-erro',`Gordura + músculo + osso somam ${num(m.gordura+mu+os)}%. Confira os valores.`);
  S.medicoes.push(m); salvar(); fecharForm(); render(); toast('Medição registrada');
});
$('agua-form').addEventListener('submit', e=>{
  e.preventDefault();
  const v=parse($('agua-input').value);
  if(v==null||isNaN(v)||v<0||v>10000) return mostrarErro('agua-erro','Informe um valor entre 0 e 10.000 ml.');
  UI.aguaEdit=false;
  editarDia(c=>{ c.aguaMl=Math.round(v); delete c.copos; });
  toast(diaAtual()===hoje() ? 'Água atualizada' : `Água de ${ddmm(diaAtual())} ajustada · toque em Registrar`);
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
