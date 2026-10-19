let appData;
const $ = (selector) => document.querySelector(selector);
let view = 'standings';
const groupSelect = $('#league-select');
const sourceUrl = 'https://www.sabga.co.za/league/';
const groupIds = {
  'A-League': 91, 'B-League': 92, 'C-League': 93, 'D-League': 94,
  'E-League': 95, 'F-League': 96, 'G-League': 97,
  'Guppy Group Yellow': 98, 'Guppy Group Blue': 100,
  'Guppy Group Red': 99, 'Guppy Group Green': 101
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function officialUrl(group, officialView = 'standings') {
  return `${sourceUrl}?sabga_view=${officialView}&sabga_group=${groupIds[group]}`;
}

function currentLeague() {
  return appData?.leagues?.[groupSelect.value];
}

function renderSummary(league) {
  const [played, total] = String(league.played).split('/').map(value => value.trim());
  const values = [
    ['Matches played', played, `of ${total} scheduled`],
    ['Still to play', league.outstanding, 'fixtures outstanding'],
    ['Group average PR', league.averagePR, 'lower is stronger'],
    ['Series deadline', league.deadline || 'â', '2026 season']
  ];
  $('#summary').innerHTML = values.map(([label, value, note]) =>
    `<article class="stat-card"><div class="stat-label">${escapeHtml(label)}</div><div class="stat-value">${escapeHtml(value)}</div><div class="stat-note">${escapeHtml(note)}</div></article>`
  ).join('');
}

function playerCell(name, handle) {
  return `<span class="player-name">${escapeHtml(name)}</span><span class="player-handle">${escapeHtml(handle)}</span>`;
}

function renderStandings(league, filter = '') {
  const rows = league.standings.filter(row => `${row[0]} ${row[1]}`.toLowerCase().includes(filter.toLowerCase()));
  const lead = rows[0];
  return `${lead ? `<article class="leader-card"><div class="rank-badge">01</div><div class="leader-meta"><small>TOP OF THE TABLE</small><strong>${playerCell(lead[0], lead[1])}</strong></div><div class="leader-points"><strong>${escapeHtml(lead[3])} pts</strong><span>${escapeHtml(lead[4])} POINTS RATE</span></div></article>` : ''}
  <div class="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>Played</th><th>Points</th><th>Pts %</th><th>Wins</th><th>PR wins</th><th>H2H</th><th>Avg PR</th><th>Losses</th><th>Win %</th><th>Avg luck</th></tr></thead><tbody>
  ${rows.map((row, index) => `<tr class="${index === 0 ? 'top-row' : ''}"><td class="rank-cell"><span class="rank-pill">${league.standings.indexOf(row) + 1}</span></td><td>${playerCell(row[0], row[1])}</td><td>${escapeHtml(row[2])}</td><td class="points-cell">${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}</td><td>${escapeHtml(row[5])}</td><td>${escapeHtml(row[6])}</td><td>${escapeHtml(row[7])}</td><td class="pr-cell"><span class="pr-chip">${escapeHtml(row[8])}</span></td><td>${escapeHtml(row[9])}</td><td>${escapeHtml(row[10])}</td><td>${escapeHtml(row[11])}</td></tr>`).join('')}
  ${rows.length ? '' : '<tr><td colspan="12">No players match your search.</td></tr>'}</tbody></table></div>`;
}

function matchCard(match, isResult) {
  const [date, name1, handle1, score1, score2, name2, handle2, pr1, pr2] = match;
  const dateLabel = isResult
    ? new Date(`${date}T12:00:00`).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
    : 'FIXTURE';
  return `<article class="match-card"><div><div class="match-date">${escapeHtml(dateLabel)}</div><div class="match-players"><span class="match-side">${playerCell(name1, handle1)}</span><span class="versus">VS</span><span class="match-side">${playerCell(name2, handle2)}</span></div></div>${isResult ? `<div class="match-score">${escapeHtml(score1)} â ${escapeHtml(score2)}<small>PR ${escapeHtml(pr1)} Â· ${escapeHtml(pr2)}</small></div>` : '<span class="status-badge">UPCOMING</span>'}</article>`;
}

function renderMatches(rows, filter, isResult) {
  const matches = rows.filter(match => match.join(' ').toLowerCase().includes(filter.toLowerCase()));
  return matches.length
    ? `<div class="match-list">${matches.map(match => matchCard(match, isResult)).join('')}</div>`
    : '<div class="empty-state">No matches found for that player.</div>';
}

function render() {
  const group = groupSelect.value;
  const league = currentLeague();
  if (!league) {
    $('#content').innerHTML = '<div class="empty-state">League data is unavailable. Please refresh the page.</div>';
    return;
  }
  renderSummary(league);
  $('#fixture-count').textContent = league.fixtures.length;
  $('#result-count').textContent = league.results.length;
  const titles = {
    standings: ['THE TABLE', `${group} standings`],
    fixtures: ['UP NEXT', 'Remaining fixtures'],
    results: ['RECENT FORM', 'Match results & PR']
  };
  $('#panel-kicker').textContent = titles[view][0];
  $('#panel-title').textContent = titles[view][1];
  const filter = $('#search').value.trim();
  if (view === 'standings') $('#content').innerHTML = renderStandings(league, filter);
  if (view === 'fixtures') {
    const fixtures = league.fixtures.map(match => [null, ...match.slice(0, 2), null, null, ...match.slice(2, 4)]);
    $('#content').innerHTML = renderMatches(fixtures, filter, false);
  }
  if (view === 'results') $('#content').innerHTML = renderMatches(league.results, filter, true);
  $('#data-note').textContent = `All 11 league groups Â· Snapshot retrieved ${appData.fetched}. SABGA may update scores after this snapshot. Tap Refresh for the official live page.`;
}

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  view = button.dataset.view;
  document.querySelectorAll('.tab').forEach(tab => {
    const active = tab.dataset.view === view;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.bottom-nav button').forEach(tab => tab.classList.toggle('active', tab.dataset.view === view));
  render();
}));
$('#search').addEventListener('input', render);
groupSelect.addEventListener('change', render);
$('#refresh-button').addEventListener('click', () => window.open(officialUrl(groupSelect.value, view === 'fixtures' ? 'remaining' : view), '_blank', 'noopener,noreferrer'));
fetch('./data.json')
  .then(response => { if (!response.ok) throw new Error('League data unavailable'); return response.json(); })
  .then(data => { appData = data; render(); })
  .catch(() => { $('#content').innerHTML = '<div class="empty-state">League data could not be loaded. Please try again.</div>'; });
