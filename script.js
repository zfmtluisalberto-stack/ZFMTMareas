/* ============================= MAPA BASE ============================= */
const PUERTOS = [
  {id:'lapaz',   nombre:'La Paz',            lat:24.1426, lon:-110.3128},
  {id:'cabo',    nombre:'Cabo San Lucas',     lat:22.8905, lon:-109.9167},
  {id:'loreto',  nombre:'Loreto',             lat:26.0111, lon:-111.3467},
  {id:'santarosalia', nombre:'Santa Rosalía', lat:27.3383, lon:-112.2683},
  {id:'lopezmateos', nombre:'Pto. Adolfo López Mateos', lat:24.8000, lon:-112.1500}
];

const map = L.map('map', {zoomControl:true}).setView([24.6,-111.0], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:'&copy; OpenStreetMap',
  maxZoom:19
}).addTo(map);

/* Poblar selects de puerto */
['moonPort','tidePort'].forEach(id=>{
  const sel = document.getElementById(id);
  PUERTOS.forEach(p=>{
    const o = document.createElement('option');
    o.value = p.id; o.textContent = p.nombre;
    sel.appendChild(o);
  });
});

/* Tabs */
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x=>x.classList.add('hidden'));
    t.classList.add('active');
    document.getElementById('panel-'+t.dataset.tab).classList.remove('hidden');
  });
});

/* ============================= ASTRONOMÍA LUNAR ============================= */
const RAD = Math.PI/180;

function diasJuliano(date){
  return (date.getTime()/86400000) - 10957.5;
}
function normDeg(d){ d = d % 360; return d<0 ? d+360 : d; }

function posicionLunaGeocentrica(d){
  const L = RAD*normDeg(218.316 + 13.176396*d);
  const M = RAD*normDeg(134.963 + 13.064993*d);
  const F = RAD*normDeg(93.272  + 13.229350*d);

  const lon = L + RAD*6.289*Math.sin(M);
  const lat = RAD*5.128*Math.sin(F);
  const dist = 385001 - 20905*Math.cos(M);

  const eps = RAD*23.4393;
  const ra = Math.atan2(Math.sin(lon)*Math.cos(eps) - Math.tan(lat)*Math.sin(eps), Math.cos(lon));
  const dec = Math.asin(Math.sin(lat)*Math.cos(eps) + Math.cos(lat)*Math.sin(eps)*Math.sin(lon));
  return {ra, dec, dist, lonEcl:lon};
}

function posicionSolGeocentrica(d){
  const g = RAD*normDeg(357.529 + 0.98560028*d);
  const q = normDeg(280.459 + 0.98564736*d);
  const L = RAD*normDeg(q + 1.915*Math.sin(g) + 0.020*Math.sin(2*g));
  const eps = RAD*23.4393;
  const ra = Math.atan2(Math.cos(eps)*Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(eps)*Math.sin(L));
  return {ra, dec, lonEcl:L};
}

function tiempoSiderealLocal(d, lonOeste){
  const gst = normDeg(280.16 + 360.9856235*d);
  return RAD*normDeg(gst - lonOeste);
}

function altAz(H, dec, latRad){
  const alt = Math.asin(Math.sin(latRad)*Math.sin(dec) + Math.cos(latRad)*Math.cos(dec)*Math.cos(H));
  let az = Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(latRad) - Math.tan(dec)*Math.cos(latRad));
  az = normDeg(az/RAD + 180);
  return {alt: alt/RAD, az};
}

function altitudLunaEnFecha(date, lat, lon){
  const d = diasJuliano(date);
  const moon = posicionLunaGeocentrica(d);
  const lst = tiempoSiderealLocal(d, -lon);
  const H = lst - moon.ra;
  return altAz(H, moon.dec, lat*RAD).alt;
}

function faseLunar(date){
  const d = diasJuliano(date);
  const moon = posicionLunaGeocentrica(d);
  const sol = posicionSolGeocentrica(d);
  let elong = normDeg((moon.lonEcl - sol.lonEcl)/RAD);
  const fase01 = elong/360;
  const iluminacion = (1 - Math.cos(elong*RAD))/2;
  return {fase01, iluminacion, elong, dist: moon.dist};
}

function nombreFase(fase01){
  const f = fase01;
  if (f < 0.02 || f > 0.98) return 'Luna nueva';
  if (f < 0.24) return 'Luna creciente';
  if (f < 0.26) return 'Cuarto creciente';
  if (f < 0.49) return 'Gibosa creciente';
  if (f < 0.51) return 'Luna llena';
  if (f < 0.74) return 'Gibosa menguante';
  if (f < 0.76) return 'Cuarto menguante';
  return 'Luna menguante';
}

function dibujarIconoLuna(svg, fase01){
  svg.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  const r = 42, cx = 50, cy = 50;
  const disco = document.createElementNS(ns,'circle');
  disco.setAttribute('cx',cx); disco.setAttribute('cy',cy); disco.setAttribute('r',r);
  disco.setAttribute('fill','#13293D'); disco.setAttribute('stroke','#3aa8a0'); disco.setAttribute('stroke-width','2');
  svg.appendChild(disco);

  const ang = fase01*2*Math.PI;
  const k = -Math.cos(ang);
  const iluminadoDerecha = fase01 < 0.5;
  const rx = Math.abs(k)*r;

  const path = document.createElementNS(ns,'path');
  let d;
  if (k >= 0){
    const sweepOuter = iluminadoDerecha ? 1 : 0;
    d = `M ${cx} ${cy-r} A ${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy+r} A ${rx} ${r} 0 0 ${sweepOuter?0:1} ${cx} ${cy-r} Z`;
  } else {
    const sweepOuter = iluminadoDerecha ? 1 : 0;
    d = `M ${cx} ${cy-r} A ${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy+r} A ${rx} ${r} 0 0 ${sweepOuter?1:0} ${cx} ${cy-r} Z`;
  }
  path.setAttribute('d', d);
  path.setAttribute('fill', '#e7e3d8');
  svg.appendChild(path);
}

function buscarCruce(date0, lat, lon, buscarSubida){
  let prev = altitudLunaEnFecha(date0, lat, lon);
  let prevT = date0.getTime();
  for(let m=5; m<=24*60; m+=5){
    const t = new Date(date0.getTime() + m*60000);
    const cur = altitudLunaEnFecha(t, lat, lon);
    if ((buscarSubida && prev<0 && cur>=0) || (!buscarSubida && prev>0 && cur<=0)){
      const frac = prev/(prev-cur);
      return new Date(prevT + frac*(t.getTime()-prevT));
    }
    prev = cur; prevT = t.getTime();
  }
  return null;
}

function fmtHora(date){
  if(!date) return '— (no ocurre en 24h)';
  return date.toLocaleString('es-MX', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short'});
}

function actualizarLuna(){
  const puerto = PUERTOS.find(p=>p.id === document.getElementById('moonPort').value) || PUERTOS[0];
  let dtVal = document.getElementById('moonDatetime').value;
  const date = dtVal ? new Date(dtVal) : new Date();

  const {fase01, iluminacion} = faseLunar(date);
  document.getElementById('moonPhaseName').textContent = nombreFase(fase01);
  document.getElementById('moonIllum').textContent = Math.round(iluminacion*100) + '% iluminada';
  document.getElementById('moonAge').textContent = 'Edad lunar: ' + (fase01*29.53).toFixed(1) + ' días';
  dibujarIconoLuna(document.getElementById('moonIcon'), fase01);

  const d = diasJuliano(date);
  const moon = posicionLunaGeocentrica(d);
  const lst = tiempoSiderealLocal(d, -puerto.lon);
  const H = lst - moon.ra;
  const {alt, az} = altAz(H, moon.dec, puerto.lat*RAD);
  document.getElementById('moonAlt').textContent = alt.toFixed(1)+'°';
  document.getElementById('moonAz').textContent = az.toFixed(0)+'°';
  document.getElementById('moonDist').textContent = Math.round(moon.dist).toLocaleString('es-MX')+' km';

  const orto = buscarCruce(date, puerto.lat, puerto.lon, true);
  const ocaso = buscarCruce(date, puerto.lat, puerto.lon, false);
  document.getElementById('moonRise').textContent = fmtHora(orto);
  document.getElementById('moonSet').textContent = fmtHora(ocaso);

  let t = new Date(date);
  let prevFase = faseLunar(t).fase01;
  let full = null;
  for(let i=0; i<40; i++){
    t = new Date(t.getTime() + 12*3600000);
    const f = faseLunar(t).fase01;
    if (prevFase < 0.5 && f >= 0.5){ full = t; break; }
    prevFase = f;
  }
  document.getElementById('moonNextFull').textContent = full ? full.toLocaleDateString('es-MX',{day:'2-digit',month:'short'}) : '—';
}

document.getElementById('moonDatetime').value = new Date().toISOString().slice(0,16);
document.getElementById('moonPort').addEventListener('change', actualizarLuna);
document.getElementById('moonDatetime').addEventListener('change', actualizarLuna);

/* ============================= MODELO DE MAREA ARMÓNICO ============================= */
const PERIODOS = {M2:12.4206012, S2:12.0, N2:12.6583475, K1:23.9344696, O1:25.8193387};

const CONST_DEFAULT = {
  lapaz: {z0:0.55, list:[
    {n:'M2', a:0.28, f:110}, {n:'S2', a:0.10, f:135}, {n:'N2', a:0.06, f:95},
    {n:'K1', a:0.22, f:200}, {n:'O1', a:0.17, f:160}
  ]},
  cabo: {z0:0.45, list:[
    {n:'M2', a:0.20, f:95}, {n:'S2', a:0.07, f:120}, {n:'N2', a:0.04, f:80},
    {n:'K1', a:0.19, f:190}, {n:'O1', a:0.15, f:150}
  ]},
  loreto: {z0:0.60, list:[
    {n:'M2', a:0.32, f:130}, {n:'S2', a:0.12, f:150}, {n:'N2', a:0.07, f:110},
    {n:'K1', a:0.20, f:210}, {n:'O1', a:0.16, f:170}
  ]},
  santarosalia: {z0:0.65, list:[
    {n:'M2', a:0.35, f:140}, {n:'S2', a:0.14, f:160}, {n:'N2', a:0.08, f:120},
    {n:'K1', a:0.19, f:215}, {n:'O1', a:0.15, f:175}
  ]},
  lopezmateos: {z0:0.80, list:[
    {n:'M2', a:0.55, f:60}, {n:'S2', a:0.20, f:85}, {n:'N2', a:0.12, f:45},
    {n:'K1', a:0.25, f:180}, {n:'O1', a:0.20, f:140}
  ]}
};

let constActuales = null;
let tideChart = null;
const userConst = {};

function construirConst(id){
  if (!userConst[id]){
    const base = CONST_DEFAULT[id] || CONST_DEFAULT.lapaz;
    userConst[id] = {
      z0: base.z0,
      list: base.list.map(c => ({n:c.n, a:c.a, f:c.f, periodo: PERIODOS[c.n] || 12.42}))
    };
  }
  return userConst[id];
}

function cargarConstPuerto(id){
  constActuales = construirConst(id);
  pintarConstList();
}

function pintarConstList(){
  const cont = document.getElementById('constList');
  cont.innerHTML = '';
  constActuales.list.forEach((c, i)=>{
    const row = document.createElement('div');
    row.className = 'const-row';
    row.innerHTML = `
      <input data-i="${i}" data-k="n" value="${c.n}">
      <input data-i="${i}" data-k="a" type="number" step="0.01" value="${c.a}">
      <input data-i="${i}" data-k="f" type="number" step="1" value="${c.f}">
      <input data-i="${i}" data-k="periodo" type="number" step="0.001" value="${c.periodo}">
      <button class="del" data-i="${i}">✕</button>`;
    cont.appendChild(row);
  });
  cont.querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input', e=>{
      const i = +e.target.dataset.i, k = e.target.dataset.k;
      constActuales.list[i][k] = (k==='n') ? e.target.value : parseFloat(e.target.value)||0;
      calcularYPintarMarea();
    });
  });
  cont.querySelectorAll('.del').forEach(b=>{
    b.addEventListener('click', e=>{
      constActuales.list.splice(+e.target.dataset.i, 1);
      pintarConstList(); calcularYPintarMarea();
    });
  });
}

document.getElementById('addConst').addEventListener('click', ()=>{
  constActuales.list.push({n:'NUEVO', a:0.10, f:0, periodo:12.42});
  pintarConstList(); calcularYPintarMarea();
});

document.getElementById('constCsv').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    const lines = reader.result.split(/\r?\n/).filter(l=>l.trim());
    const start = /amp/i.test(lines[0]) ? 1 : 0;
    const nuevos = [];
    for(let i=start;i<lines.length;i++){
      const parts = lines[i].split(',').map(s=>s.trim());
      if (parts.length>=4){
        nuevos.push({n:parts[0], a:parseFloat(parts[1])||0, f:parseFloat(parts[2])||0, periodo:parseFloat(parts[3])||12.42});
      }
    }
    if (nuevos.length){ constActuales.list = nuevos; pintarConstList(); calcularYPintarMarea(); }
  };
  reader.readAsText(file);
});

function alturaMarea(date, refDate, cset){
  cset = cset || constActuales;
  const h = (date.getTime()-refDate.getTime())/3600000;
  let val = cset.z0;
  cset.list.forEach(c=>{
    val += c.a*Math.cos(2*Math.PI*h/c.periodo - c.f*RAD);
  });
  return val;
}

function calcularYPintarMarea(){
  const dateStr = document.getElementById('tideDate').value;
  const dia0 = dateStr ? new Date(dateStr+'T00:00:00') : new Date(new Date().toDateString());
  const ahora = new Date();

  const labels = [], valores = [];
  const pasoMin = 15, totalH = 48;
  for(let m=0; m<=totalH*60; m+=pasoMin){
    const t = new Date(dia0.getTime() + m*60000);
    labels.push(t);
    valores.push(alturaMarea(t, dia0));
  }

  const hActual = alturaMarea(ahora, dia0);
  const hActualMas = alturaMarea(new Date(ahora.getTime()+5*60000), dia0);
  document.getElementById('tideNow').textContent = hActual.toFixed(2)+' m';
  document.getElementById('tideTrend').textContent = hActualMas > hActual ? '▲ Subiendo' : '▼ Bajando';

  let nextHigh=null, nextLow=null;
  for(let m=5; m<=72*60 && (!nextHigh||!nextLow); m+=5){
    const t = new Date(ahora.getTime()+m*60000);
    const v = alturaMarea(t, dia0);
    const t2 = new Date(ahora.getTime()+(m+5)*60000);
    const v2 = alturaMarea(t2, dia0);
    if (!nextHigh && v2 < v){ nextHigh = t; }
    if (!nextLow && v2 > v){ nextLow = t; }
  }
  document.getElementById('tideNextHigh').textContent = nextHigh ? fmtHora(nextHigh) : '—';
  document.getElementById('tideNextLow').textContent = nextLow ? fmtHora(nextLow) : '—';

  const ctx = document.getElementById('tideChart').getContext('2d');
  const dataPoints = labels.map((l,i)=>({x:l, y:valores[i]}));
  if (tideChart) tideChart.destroy();
  tideChart = new Chart(ctx, {
    type:'line',
    data:{ datasets:[{
      label:'Altura de marea (m)', data:dataPoints, borderColor:'#3aa8a0',
      backgroundColor:'rgba(58,168,160,.15)', fill:true, pointRadius:0, tension:.35, borderWidth:2
    }]},
    options:{
      responsive:true,
      scales:{
        x:{ 
          type:'time', 
          time:{
            unit:'hour',
            displayFormats: { hour: 'HH:mm' }
          }, 
          ticks:{color:'#8fa4ae', maxTicksLimit:8}, 
          grid:{color:'#1c3b52'} 
        },
        y:{ ticks:{color:'#8fa4ae'}, grid:{color:'#1c3b52'}, title:{display:true,text:'metros',color:'#8fa4ae'} }
      },
      plugins:{ legend:{display:false} }
    }
  });
  actualizarMareasEnMapa();
  actualizarContorno();
}

document.getElementById('tidePort').addEventListener('change', e=>{
  cargarConstPuerto(e.target.value); calcularYPintarMarea();
});
document.getElementById('tideDate').addEventListener('change', calcularYPintarMarea);
document.getElementById('tideDate').value = new Date().toISOString().slice(0,10);

/* ============================= MAREAS SOBRE EL MAPA ============================= */
const puertoMarkers = {};

function crearMarcadoresMarea(){
  PUERTOS.forEach(p=>{
    const marker = L.marker([p.lat, p.lon], {
      icon: L.divIcon({className:'tide-marker', html:'', iconSize:[70,34], iconAnchor:[35,17]})
    }).addTo(map);

    marker.on('click', ()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x=>x.classList.add('hidden'));
      document.querySelector('.tab[data-tab="marea"]').classList.add('active');
      document.getElementById('panel-marea').classList.remove('hidden');
      const sel = document.getElementById('tidePort');
      sel.value = p.id;
      sel.dispatchEvent(new Event('change'));
    });

    puertoMarkers[p.id] = marker;
  });
}

function actualizarMareasEnMapa(){
  const ahora = new Date();
  PUERTOS.forEach(p=>{
    const cset = construirConst(p.id);
    const dia0 = new Date(ahora.toDateString());
    const h = alturaMarea(ahora, dia0, cset);
    const hMas = alturaMarea(new Date(ahora.getTime()+5*60000), dia0, cset);
    const subiendo = hMas > h;
    const color = subiendo ? '#3aa8a0' : '#e3b34f';
    const flecha = subiendo ? '▲' : '▼';
    const marker = puertoMarkers[p.id];
    if (!marker) return;
    marker.setIcon(L.divIcon({
      className:'tide-marker',
      html: `<div class="tide-badge" style="border-color:${color};">
               <span>${h.toFixed(2)} m</span><span class="tide-arrow" style="color:${color};">${flecha}</span>
             </div>
             <div class="tide-label">${p.nombre}</div>`,
      iconSize:[70,34], iconAnchor:[35,17]
    }));
  });
}

/* ============================= CONTORNO DE MAREA ============================= */
const BCS_CONTORNO_DEFAULT = [
  [-114.15,28.02],[-114.30,27.75],[-114.35,27.40],[-114.45,27.00],[-114.20,26.60],
  [-113.55,26.30],[-112.90,25.75],[-112.45,25.20],[-112.15,24.65],[-111.90,24.30],
  [-111.50,23.90],[-110.90,23.55],[-110.35,23.10],[-109.95,22.92],[-109.83,22.87],
  [-109.70,23.02],[-109.55,23.35],[-109.75,23.75],[-110.05,24.05],[-110.32,24.14],
  [-110.55,24.45],[-110.85,24.85],[-111.20,25.25],[-111.55,25.65],[-111.85,26.05],
  [-111.98,26.65],[-112.05,26.95],[-112.15,27.15],[-112.27,27.34],[-112.55,27.55],
  [-112.95,27.70],[-113.40,27.85],[-113.80,27.95],[-114.15,28.02]
];
const NOMBRES_CONST_INTERP = ['M2','S2','N2','K1','O1'];

function diezmar(vertices, maxPuntos){
  maxPuntos = maxPuntos || 300;
  if (vertices.length <= maxPuntos) return vertices;
  const paso = Math.ceil(vertices.length/maxPuntos);
  const out = [];
  for(let i=0;i<vertices.length;i+=paso) out.push(vertices[i]);
  return out;
}

function extraerContornoDeGeoJSON(gj){
  let mejor = null, mejorLen = 0;
  const consid = (coords)=>{ if (coords && coords.length > mejorLen){ mejor = coords; mejorLen = coords.length; } };
  const visit = (geom)=>{
    if (!geom) return;
    if (geom.type==='LineString') consid(geom.coordinates);
    else if (geom.type==='Polygon') consid(geom.coordinates[0]);
    else if (geom.type==='MultiLineString') geom.coordinates.forEach(consid);
    else if (geom.type==='MultiPolygon') geom.coordinates.forEach(poly=>consid(poly[0]));
    else if (geom.type==='GeometryCollection') geom.geometries.forEach(visit);
  };
  (gj.features || [gj]).forEach(f=> visit(f.geometry || f));
  return mejor ? mejor.map(c=>[c[0], c[1]]) : null;
}

function calcularPesosIDW(vertice){
  const dists = PUERTOS.map(p=> Math.max(0.05, Math.hypot(vertice[0]-p.lon, vertice[1]-p.lat)));
  const inv = dists.map(d=> 1/(d*d));
  const suma = inv.reduce((a,b)=>a+b, 0);
  return inv.map(v=> v/suma);
}

function constInterpolado(pesos){
  let z0 = 0;
  const acc = {}; NOMBRES_CONST_INTERP.forEach(n=> acc[n] = {re:0, im:0});
  PUERTOS.forEach((p,i)=>{
    const cset = construirConst(p.id);
    z0 += cset.z0 * pesos[i];
    NOMBRES_CONST_INTERP.forEach(n=>{
      const c = cset.list.find(x=>x.n===n);
      if (c){
        acc[n].re += pesos[i]*c.a*Math.cos(c.f*RAD);
        acc[n].im += pesos[i]*c.a*Math.sin(c.f*RAD);
      }
    });
  });
  const list = NOMBRES_CONST_INTERP.map(n=>{
    const re=acc[n].re, im=acc[n].im;
    return {n, a:Math.hypot(re,im), f:normDeg(Math.atan2(im,re)/RAD), periodo:PERIODOS[n]};
  });
  return {z0, list};
}

function hexARgb(h){ h=h.replace('#',''); return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)]; }
function mezclarColor(t, c1, c2){
  t = Math.max(0, Math.min(1, t));
  const a = hexARgb(c1), b = hexARgb(c2);
  const rgb = a.map((v,i)=> Math.round(v + (b[i]-v)*t));
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

const contornoLayer = L.layerGroup().addTo(map);
let contornoVertices = [];
let contornoPesos = [];
let contornoSegmentos = [];

function construirContorno(vertices, nombre){
  contornoLayer.clearLayers();
  contornoVertices = vertices;
  contornoPesos = vertices.map(calcularPesosIDW);
  contornoSegmentos = vertices.slice(0, -1).map((v,i)=>
    L.polyline([[v[1],v[0]], [vertices[i+1][1],vertices[i+1][0]]], {color:'#3aa8a0', weight:4, opacity:.85})
      .addTo(contornoLayer)
  );
  const label = document.getElementById('contornoActivoNombre');
  if (label) label.textContent = nombre;
}

function actualizarContorno(){
  if (!contornoVertices.length) return;
  const ahora = new Date();
  const dia0 = new Date(ahora.toDateString());
  const niveles = contornoVertices.map((v,i)=>{
    const cset = constInterpolado(contornoPesos[i]);
    const h = alturaMarea(ahora, dia0, cset);
    const rango = cset.list.reduce((s,c)=>s+c.a, 0) || 1;
    return (h - cset.z0)/rango;
  });
  contornoSegmentos.forEach((seg,i)=>{
    const t = ((niveles[i]+niveles[i+1])/2 + 1)/2;
    seg.setStyle({color: mezclarColor(t, '#e3b34f', '#3aa8a0')});
  });
}

document.getElementById('resetContorno').addEventListener('click', ()=>{
  construirContorno(BCS_CONTORNO_DEFAULT, 'Contorno esquemático de BCS (demo)');
  actualizarContorno();
});

/* ============================= CAPAS GIS ============================= */
const capasGrupo = L.layerGroup().addTo(map);
const capas = [];
const paleta = ['#e3b34f','#3aa8a0','#d9704f','#8b9dc3','#c98bd0','#7fd97f'];
let contadorCapa = 0;

function mensajeCapa(txt, tipo){
  const el = document.getElementById('layerStatus');
  el.innerHTML = `<div class="status-msg ${tipo}">${txt}</div>`;
  setTimeout(()=>{ if(el.firstChild) el.innerHTML=''; }, 6000);
}

function agregarCapaGeoJSON(nombre, geojson){
  const color = paleta[contadorCapa % paleta.length];
  const layer = L.geoJSON(geojson, {
    style: {color, weight:2, fillColor:color, fillOpacity:.25},
    pointToLayer: (f, latlng)=> L.circleMarker(latlng, {radius:5, color, fillColor:color, fillOpacity:.8}),
    onEachFeature: (f, l)=>{
      if (f.properties && Object.keys(f.properties).length){
        const rows = Object.entries(f.properties).slice(0,12)
          .map(([k,v])=>`<tr><td style="padding-right:8px;color:#8fa4ae;">${k}</td><td>${v}</td></tr>`).join('');
        l.bindPopup(`<table>${rows}</table>`);
      }
    }
  }).addTo(capasGrupo);

  const count = geojson.features ? geojson.features.length : 1;
  const id = 'capa_' + (contadorCapa++);
  capas.push({id, name:nombre, layer, count, color, geojson});
  pintarListaCapas();
  try{ map.fitBounds(layer.getBounds(), {maxZoom:14}); }catch(e){}
}

function pintarListaCapas(){
  const cont = document.getElementById('layerList');
  cont.innerHTML = '';
  capas.forEach(c=>{
    const row = document.createElement('div');
    row.className = 'layer-row';
    row.innerHTML = `<div class="swatch" style="background:${c.color};"></div>
      <div class="name" title="${c.name}">${c.name}</div>
      <div class="count">${c.count} obj.</div>
      <button class="use-contour" data-id="${c.id}" title="Usar como contorno de marea">〰</button>
      <button class="del" data-id="${c.id}" title="Quitar capa">✕</button>`;
    row.querySelector('.del').addEventListener('click', ()=>{
      capasGrupo.removeLayer(c.layer);
      const idx = capas.findIndex(x=>x.id===c.id);
      if (idx>=0) capas.splice(idx,1);
      pintarListaCapas();
    });
    row.querySelector('.use-contour').addEventListener('click', ()=>{
      const verts = extraerContornoDeGeoJSON(c.geojson);
      if (!verts || verts.length < 2){
        mensajeCapa(`"${c.name}" no tiene una línea o polígono utilizable como contorno.`, 'err');
        return;
      }
      construirContorno(diezmar(verts), c.name);
      actualizarContorno();
      mensajeCapa(`Contorno de marea actualizado con "${c.name}".`, 'ok');
    });
    cont.appendChild(row);
  });
}

document.getElementById('fitAll').addEventListener('click', ()=>{
  if (!capas.length) return;
  const group = L.featureGroup(capas.map(c=>c.layer));
  map.fitBounds(group.getBounds(), {maxZoom:14});
});
document.getElementById('clearAll').addEventListener('click', ()=>{
  capasGrupo.clearLayers(); capas.length = 0; pintarListaCapas();
});

function kmlAGeoJSON(xmlText){
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
  const features = [];
  const parseCoords = (txt)=> txt.trim().split(/\s+/).map(tuple=>{
    const parts = tuple.split(',').map(Number);
    return [parts[0], parts[1]];
  });

  xml.querySelectorAll('Placemark').forEach(pm=>{
    const name = pm.querySelector('name')?.textContent || '';
    const desc = pm.querySelector('description')?.textContent || '';
    const props = {name, description: desc};

    const geoms = [];
    pm.querySelectorAll('Point coordinates').forEach(c=>{
      const [x,y] = parseCoords(c.textContent)[0];
      geoms.push({type:'Point', coordinates:[x,y]});
    });
    pm.querySelectorAll('LineString coordinates').forEach(c=>{
      geoms.push({type:'LineString', coordinates:parseCoords(c.textContent)});
    });
    pm.querySelectorAll('Polygon').forEach(poly=>{
      const outer = poly.querySelector('outerBoundaryIs coordinates');
      const rings = [];
      if (outer) rings.push(parseCoords(outer.textContent));
      poly.querySelectorAll('innerBoundaryIs coordinates').forEach(inn=> rings.push(parseCoords(inn.textContent)));
      geoms.push({type:'Polygon', coordinates:rings});
    });

    if (geoms.length === 1) features.push({type:'Feature', properties:props, geometry:geoms[0]});
    else if (geoms.length > 1) features.push({type:'Feature', properties:props, geometry:{type:'GeometryCollection', geometries:geoms}});
  });

  return {type:'FeatureCollection', features};
}

function leerPuntosXY(view, offset, n){
  const pts = [];
  for(let i=0;i<n;i++){
    pts.push([view.getFloat64(offset, true), view.getFloat64(offset+8, true)]);
    offset += 16;
  }
  return {pts, offset};
}

function parseSHP(buffer){
  const view = new DataView(buffer);
  const features = [];
  let offset = 100;
  while(offset < buffer.byteLength - 8){
    const contentLenWords = view.getInt32(offset+4, false);
    const contentBytes = contentLenWords*2;
    const recStart = offset+8;
    const type = view.getInt32(recStart, true);
    let geom = null;
    if (type===1 || type===11 || type===21){
      const x = view.getFloat64(recStart+4, true), y = view.getFloat64(recStart+12, true);
      geom = {type:'Point', coordinates:[x,y]};
    } else if (type===8 || type===18 || type===28){
      const numPoints = view.getInt32(recStart+36, true);
      const {pts} = leerPuntosXY(view, recStart+40, numPoints);
      geom = {type:'MultiPoint', coordinates:pts};
    } else if (type===3||type===13||type===23 || type===5||type===15||type===25){
      const numParts = view.getInt32(recStart+36, true);
      const numPoints = view.getInt32(recStart+40, true);
      const partsIdx = [];
      let po = recStart+44;
      for(let i=0;i<numParts;i++){ partsIdx.push(view.getInt32(po, true)); po+=4; }
      const {pts} = leerPuntosXY(view, po, numPoints);
      const rings = partsIdx.map((start,i)=>{
        const end = (i+1<partsIdx.length) ? partsIdx[i+1] : numPoints;
        return pts.slice(start, end);
      });
      const esPoligono = (type===5||type===15||type===25);
      geom = esPoligono ? {type:'Polygon', coordinates:rings} : (rings.length>1 ? {type:'MultiLineString', coordinates:rings} : {type:'LineString', coordinates:rings[0]});
    }
    if (geom) features.push(geom);
    offset = recStart + contentBytes;
  }
  return {geoms:features};
}

function parseDBF(buffer){
  const view = new DataView(buffer);
  const numRecords = view.getInt32(4, true);
  const headerLen = view.getInt16(8, true);
  const recordLen = view.getInt16(10, true);
  const fields = [];
  let off = 32;
  const dec = new TextDecoder('latin1');
  while (view.getUint8(off) !== 0x0D){
    const nameBytes = new Uint8Array(buffer, off, 11);
    const name = dec.decode(nameBytes).replace(/\0.*$/,'');
    const type = String.fromCharCode(view.getUint8(off+11));
    const len = view.getUint8(off+16);
    fields.push({name, type, len});
    off += 32;
  }
  const records = [];
  let recOff = headerLen;
  for(let r=0;r<numRecords;r++){
    const bytes = new Uint8Array(buffer, recOff, recordLen);
    const line = dec.decode(bytes);
    let p = 1;
    const obj = {};
    fields.forEach(f=>{
      let raw = line.substr(p, f.len).trim();
      obj[f.name] = (f.type==='N'||f.type==='F') ? (raw===''? null : parseFloat(raw)) : raw;
      p += f.len;
    });
    records.push(obj);
    recOff += recordLen;
  }
  return records;
}

async function shpZipAGeoJSON(arrayBuffer){
  const zip = await JSZip.loadAsync(arrayBuffer);
  let shpFile=null, dbfFile=null;
  zip.forEach((path, entry)=>{
    if (/\.shp$/i.test(path)) shpFile = entry;
    if (/\.dbf$/i.test(path)) dbfFile = entry;
  });
  if (!shpFile) throw new Error('El .zip no contiene un archivo .shp');
  const shpBuf = await shpFile.async('arraybuffer');
  const {geoms} = parseSHP(shpBuf);
  let atributos = [];
  if (dbfFile){
    const dbfBuf = await dbfFile.async('arraybuffer');
    atributos = parseDBF(dbfBuf);
  }
  const features = geoms.map((g,i)=>({type:'Feature', properties: atributos[i]||{}, geometry:g}));
  return {type:'FeatureCollection', features};
}

let SQLPromise = null;
function getSQL(){
  if (!SQLPromise){
    SQLPromise = initSqlJs({ locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}` });
  }
  return SQLPromise;
}

function leerPuntoWKB(view, off, le, hasZ){
  const x = le ? view.getFloat64(off,true) : view.getFloat64(off,false);
  const y = le ? view.getFloat64(off+8,true) : view.getFloat64(off+8,false);
  return {pt:[x,y], next: off+16+(hasZ?8:0)};
}

function leerAnilloWKB(view, off, le, hasZ){
  const n = le?view.getUint32(off,true):view.getUint32(off,false); off+=4;
  const pts = [];
  for(let i=0;i<n;i++){ const r = leerPuntoWKB(view, off, le, hasZ); pts.push(r.pt); off = r.next; }
  return {pts, next:off};
}

function leerGeomWKB(view, off){
  const le = view.getUint8(off) === 1; off+=1;
  let type = le?view.getUint32(off,true):view.getUint32(off,false); off+=4;
  const hasZ = type >= 1000 && type < 4000;
  const base = type % 1000;
  if (base===1){ const r=leerPuntoWKB(view,off,le,hasZ); return {geom:{type:'Point',coordinates:r.pt}, next:r.next}; }
  if (base===2){ const r=leerAnilloWKB(view,off,le,hasZ); return {geom:{type:'LineString',coordinates:r.pts}, next:r.next}; }
  if (base===3){
    const nRings = le?view.getUint32(off,true):view.getUint32(off,false); off+=4;
    const rings=[];
    for(let i=0;i<nRings;i++){ const r=leerAnilloWKB(view,off,le,hasZ); rings.push(r.pts); off=r.next; }
    return {geom:{type:'Polygon',coordinates:rings}, next:off};
  }
  if (base===4||base===5||base===6){
    const nGeoms = le?view.getUint32(off,true):view.getUint32(off,false); off+=4;
    const subs=[];
    for(let i=0;i<nGeoms;i++){ const r=leerGeomWKB(view,off); subs.push(r.geom.coordinates); off=r.next; }
    const tipoMulti = base===4?'MultiPoint':(base===5?'MultiLineString':'MultiPolygon');
    return {geom:{type:tipoMulti, coordinates:subs}, next:off};
  }
  return {geom:null, next:off};
}

function gpkgBlobAGeoJSONGeom(blob){
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const flags = view.getUint8(3);
  const envIndicator = (flags >> 1) & 0x07;
  const envSizes = {0:0, 1:32, 2:48, 3:48, 4:64};
  const envBytes = envSizes[envIndicator] || 0;
  const wkbOffset = 8 + envBytes;
  const {geom} = leerGeomWKB(view, wkbOffset);
  return geom;
}

async function gpkgAGeoJSON(arrayBuffer){
  const SQL = await getSQL();
  const db = new SQL.Database(new Uint8Array(arrayBuffer));
  const info = db.exec("SELECT table_name, column_name FROM gpkg_geometry_columns");
  if (!info.length) throw new Error('No se encontraron tablas de geometría en el GeoPackage');
  const capasOut = [];
  info[0].values.forEach(([tabla, col])=>{
    let res;
    try{ res = db.exec(`SELECT * FROM "${tabla}"`); }catch(e){ return; }
    if (!res.length) return;
    const cols = res[0].columns;
    const geomIdx = cols.indexOf(col);
    const features = [];
    res[0].values.forEach(row=>{
      const props = {};
      cols.forEach((c,i)=>{ if (i!==geomIdx) props[c]=row[i]; });
      let geom = null;
      try{ if (row[geomIdx]) geom = gpkgBlobAGeoJSONGeom(row[geomIdx]); }catch(e){}
      if (geom) features.push({type:'Feature', properties:props, geometry:geom});
    });
    capasOut.push({tabla, geojson:{type:'FeatureCollection', features}});
  });
  db.close();
  return capasOut;
}

async function procesarArchivo(file){
  const nombre = file.name;
  const ext = nombre.split('.').pop().toLowerCase();
  try{
    if (ext === 'geojson' || ext === 'json'){
      const txt = await file.text();
      agregarCapaGeoJSON(nombre, JSON.parse(txt));
      mensajeCapa(`Capa "${nombre}" cargada.`, 'ok');
    } else if (ext === 'kml'){
      const txt = await file.text();
      agregarCapaGeoJSON(nombre, kmlAGeoJSON(txt));
      mensajeCapa(`Capa "${nombre}" cargada.`, 'ok');
    } else if (ext === 'zip'){
      const buf = await file.arrayBuffer();
      const gj = await shpZipAGeoJSON(buf);
      agregarCapaGeoJSON(nombre, gj);
      mensajeCapa(`Shapefile "${nombre}" cargado.`, 'ok');
    } else if (ext === 'gpkg'){
      const buf = await file.arrayBuffer();
      const tablas = await gpkgAGeoJSON(buf);
      tablas.forEach(t=> agregarCapaGeoJSON(`${nombre}:${t.tabla}`, t.geojson));
      mensajeCapa(`GeoPackage "${nombre}" cargado (${tablas.length} tabla(s)).`, 'ok');
    } else {
      mensajeCapa(`Formato ".${ext}" no soportado.`, 'err');
    }
  } catch(err){
    console.error(err);
    mensajeCapa(`Error al leer "${nombre}": ${err.message}`, 'err');
  }
}

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
dropZone.addEventListener('click', ()=> fileInput.click());
fileInput.addEventListener('change', e=>{
  Array.from(e.target.files).forEach(procesarArchivo);
  fileInput.value = '';
});
['dragover','dragenter'].forEach(ev=> dropZone.addEventListener(ev, e=>{ e.preventDefault(); dropZone.classList.add('over'); }));
['dragleave','drop'].forEach(ev=> dropZone.addEventListener(ev, e=>{ e.preventDefault(); dropZone.classList.remove('over'); }));
dropZone.addEventListener('drop', e=>{
  Array.from(e.dataTransfer.files).forEach(procesarArchivo);
});

/* ============================= INICIO ============================= */
crearMarcadoresMarea();
construirContorno(BCS_CONTORNO_DEFAULT, 'Contorno esquemático de BCS (demo)');
cargarConstPuerto('lapaz');
actualizarLuna();
calcularYPintarMarea();
setInterval(()=>{
  if(!document.getElementById('panel-luna').classList.contains('hidden')) actualizarLuna();
  actualizarMareasEnMapa();
  actualizarContorno();
}, 60000);