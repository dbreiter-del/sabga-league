let league;

const $ = (s) => document.querySelector(s);
let view = 'standings';
const groupSelect = $('#league-select');
const sourceUrl = 'https://www.sabga.co.za/league/';

function renderSummary() {
  const values = [
    ['Matches played', league.played, 'of 45 scheduled'],
    ['Still to play', String(league.outstanding), 'fixtures outstanding'],
    ['Group average PR', league.averagePR, 'lower is stronger'],
    ['Series deadline', '6 Dec', '2026 season']
  ];
  $('#summary').innerHTML = values.map(([label,value,note]) => `<article class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></article>`).join('');
}
function playerCell(name, handle) { return `<span class="player-name">${name}</span><span class="player-handle">${handle}</span>`; }
function renderStandings(filter='') {
  const rows=league.standings.filter(r=>`${r[0]} ${r[1]}`.toLowerCase().includes(filter.toLowerCase()));
  const lead=rows[0];
  return `${lead?`<article class="leader-card"><div class="rank-badge">01</div><div class="leader-meta"><small>TOP OF THE TABLE</small><strong>${playerCell(lead[0],lead[1])}</strong></div><div class="leader-points"><strong>${lead[3]} pts</strong><span>${lead[4]} POINTS RATE</span></div></article>`:''}
  <div class="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>Played</th><th>Points</th><th>Pts %</th><th>Wins</th><th>PR wins</th><th>H2H</th><th>Avg PR</th><th>Losses</th><th>Win %</th><th>Avg luck</th></tr></thead><tbody>
  ${rows.map((r,i)=>`<tr class="${i===0?'top-row':''}"><td class="rank-cell"><span class="rank-pill">${league.standings.indexOf(r)+1}</span></td><td>${playerCell(r[0],r[1])}</td><td>${r[2]}</td><td class="points-cell">${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6]}</td><td>${r[7]}</td><td class="pr-cell"><span class="pr-chip">${r[8]}</span></td><td>${r[9]}</td><td>${r[10]}</td><td>${r[11]}</td></tr>`).join('')}
  ${rows.length?'':'<tr><td colspan="12">No players match your search.</td></tr>'}</tbody></table></div>`;
}
function matchCard(m, isResult) {
  const [date,n1,h1,score1,score2,n2,h2,pr1,pr2]=m;
  return `<article class="match-card"><div><div class="match-date">${isResult?new Date(`${date}T12:00:00`).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}).toUpperCase():'FIXTURE'}</div><div class="match-players"><span class="match-side">${playerCell(n1,h1)}</span><span class="versus">VS</span><span class="match-side">${playerCell(n2,h2)}</span></div></div>${isResult?`<div class="match-score">${score1} – ${score2}<small>PR ${pr1} · ${pr2}</small></div>`:'<span class="status-badge">UPCOMING</span>'}</article>`;
}
function renderMatches(data,filter,isResult) {
  const rows=data.filter(m=>`${m[1]} ${m[2]} ${m[5]} ${m[6]}`.toLowerCase().includes(filter.toLowerCase()));
  return rows.length?`<div class="match-list">${rows.map(m=>matchCard(m,isResult)).join('')}</div>`:`<div class="empty-state">No matches found for that player.</div>`;
}
function render() {
  const group=groupSelect.value;
  const isA=group==='A-League';
  $('#summary').style.display=isA?'grid':'none';
  $('#fixture-count').textContent=isA?league.fixtures.length:'—';
  $('#result-count').textContent=isA?league.results.length:'—';
  const titles={standings:['THE TABLE',`${group} standings`],fixtures:['UP NEXT',`Remaining fixtures`],results:['RECENT FORM','Match results & PR']};
  $('#panel-kicker').textContent=titles[view][0]; $('#panel-title').textContent=titles[view][1];
  const filter=$('#search').value.trim();
  if(!isA) {
    $('#content').innerHTML=`<div class="empty-state"><strong>${group} data is available on the live SABGA league page.</strong><br><br>This app’s bundled snapshot currently covers A-League. Open SABGA for the latest ${group} standings, fixtures and results.<br><br><a href="${sourceUrl}" target="_blank" rel="noreferrer">Open live league data ↗</a></div>`;
    $('#data-note').textContent='Live league tables are maintained by SABGA.'; return;
  }
  if(view==='standings') $('#content').innerHTML=renderStandings(filter);
  if(view==='fixtures') $('#content').innerHTML=renderMatches(league.fixtures.map(x=>['2026-12-06',...x.slice(0,2),null,null,...x.slice(2)]),filter,false);
  if(view==='results') $('#content').innerHTML=renderMatches(league.results,filter,true);
  $('#data-note').textContent=`A-League snapshot retrieved ${league.fetched}. Data may have changed since then. Tap Refresh or open the official site for the current live table.`;
}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  view=button.dataset.view;
  document.querySelectorAll('.tab').forEach(b=>{const active=b.dataset.view===view;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  render();
}));
$('#search').addEventListener('input',render);
groupSelect.addEventListener('change',render);
$('#refresh-button').addEventListener('click',()=>window.open(sourceUrl,'_blank','noopener,noreferrer'));
fetch('./data.json').then(response => { if (!response.ok) throw new Error('League data unavailable'); return response.json(); }).then(data => { league = data; renderSummary(); render(); }).catch(() => { $('#content').innerHTML = '<div class="empty-state">League data could not be loaded. Please try again.</div>'; });
