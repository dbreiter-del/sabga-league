let appData;
const $ = (selector) => document.querySelector(selector);
let view = 'standings';
let activePlayer = null;
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
    ['Series deadline', league.deadline || '-', '2026 season']
  ];
  $('#summary').innerHTML = values.map(([label, value, note]) =>
    `<article class="stat-card"><div class="stat-label">${escapeHtml(label)}</div><div class="stat-value">${escapeHtml(value)}</div><div class="stat-note">${escapeHtml(note)}</div></article>`
  ).join('');
}

function playerCell(name, handle, group = groupSelect.value) {
  return `<button type="button" class="player-link" data-player-name="${escapeHtml(name)}" data-player-handle="${escapeHtml(handle)}" data-player-group="${escapeHtml(group)}"><span class="player-name">${escapeHtml(name)}</span><span class="player-handle">${escapeHtml(handle)}</span></button>`;
}

function renderStandings(league, filter = '', group = groupSelect.value) {
  const rows = league.standings.filter(row => `${row[0]} ${row[1]}`.toLowerCase().includes(filter.toLowerCase()));
  const lead = rows[0];
  return `${lead ? `<article class="leader-card"><div class="rank-badge">01</div><div class="leader-meta"><small>TOP OF THE TABLE</small><strong>${playerCell(lead[0], lead[1], group)}</strong></div><div class="leader-points"><strong>${escapeHtml(lead[3])} pts</strong><span>PR ${escapeHtml(lead[8])}</span></div></article>` : ''}
  <div class="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>Played</th><th>Points</th><th>Pts %</th><th>Wins</th><th>PR wins</th><th>H2H</th><th>Avg PR</th><th>Losses</th><th>Win %</th><th>Avg luck</th></tr></thead><tbody>
  ${rows.map((row, index) => `<tr class="${index === 0 ? 'top-row' : ''}"><td class="rank-cell"><span class="rank-pill">${league.standings.indexOf(row) + 1}</span></td><td>${playerCell(row[0], row[1], group)}</td><td>${escapeHtml(row[2])}</td><td class="points-cell">${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}</td><td>${escapeHtml(row[5])}</td><td>${escapeHtml(row[6])}</td><td>${escapeHtml(row[7])}</td><td class="pr-cell"><span class="pr-chip">${escapeHtml(row[8])}</span></td><td>${escapeHtml(row[9])}</td><td>${escapeHtml(row[10])}</td><td>${escapeHtml(row[11])}</td></tr>`).join('')}
  ${rows.length ? '' : '<tr><td colspan="12">No players match your search.</td></tr>'}</tbody></table></div>`;
}

function matchCard(match, isResult, group) {
  const [date, name1, handle1, score1, score2, name2, handle2, pr1, pr2] = match;
  const dateLabel = isResult
    ? new Date(`${date}T12:00:00`).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
    : 'FIXTURE';
  return `<article class="match-card"><div><div class="match-date">${escapeHtml(dateLabel)}</div><div class="match-players"><span class="match-side">${playerCell(name1, handle1)}</span><span class="versus">VS</span><span class="match-side">${playerCell(name2, handle2)}</span></div></div>${isResult ? `<div class="match-score">${escapeHtml(score1)} - ${escapeHtml(score2)}<small>PR ${escapeHtml(pr1)} - ${escapeHtml(pr2)}</small></div>` : '<span class="status-badge">UPCOMING</span>'}</article>`;
}

function renderMatches(rows, filter, isResult, group, featuredPlayer = null) {
  const matches = rows.filter(match => match.join(' ').toLowerCase().includes(filter.toLowerCase()));
  return matches.length
    ? `<div class="match-list">${matches.map(match => {
        if (featuredPlayer && match[5] === featuredPlayer.name && match[6] === featuredPlayer.handle) {
          match = [match[0], match[5], match[6], match[4], match[3], match[1], match[2], match[8], match[7]];
        }
        return matchCard(match, isResult, group);
      }).join('')}</div>`
    : '<div class="empty-state">No matches found for that player.</div>';
}

function renderPlayerProfile(player) {
  const league = appData.leagues[player.group];
  const row = league.standings.find(item => item[0] === player.name && item[1] === player.handle);
  if (!row) return '<div class="empty-state">Player details are unavailable.</div>';
  const belongs = (match, indexes) => match[indexes[0]] === player.name && match[indexes[1]] === player.handle || match[indexes[2]] === player.name && match[indexes[3]] === player.handle;
  const results = league.results.filter(match => belongs(match, [1, 2, 5, 6]));
  const fixtures = league.fixtures.filter(match => belongs(match, [0, 1, 2, 3]));
  const stats = [
    ['League position', '#' + (league.standings.indexOf(row) + 1)], ['Played', row[2]],
    ['Points', row[3]], ['Wins', row[5]], ['PR wins', row[6]],
    ['Average PR', row[8]], ['Losses', row[9]], ['Average luck', row[11]]
  ];
  return '<button type="button" class="profile-back" id="profile-back">← Back to ' + escapeHtml(player.group) + '</button>' +
    '<section class="profile-card"><p class="eyebrow">PLAYER PROFILE · ' + escapeHtml(player.group) + '</p><h3>' + escapeHtml(player.name) + '</h3><p class="profile-handle">' + (player.handle ? '@' + escapeHtml(player.handle) : '') + '</p><div class="profile-stats">' + stats.map(([label, value]) => '<article><span>' + label + '</span><strong>' + escapeHtml(value) + '</strong></article>').join('') + '</div></section>' +
    '<section class="profile-section"><h3>Recent results <span>' + results.length + '</span></h3>' + renderMatches(results, '', true, player.group, player) + '</section>' +
    '<section class="profile-section"><h3>Upcoming fixtures <span>' + fixtures.length + '</span></h3>' + renderMatches(fixtures.map(match => [null, ...match.slice(0, 2), null, null, ...match.slice(2, 4)]), '', false, player.group, player) + '</section>';
}

function renderFunFacts() {
  const players = Object.entries(appData.leagues).flatMap(([group, league]) =>
    (league.standings || []).map(row => ({ name: row[0], handle: row[1], played: Number(row[2]) || 0, pr: Number(row[8]), luck: Number(row[11]), prWins: Number(row[6]), group }))
      .filter(player => player.played > 0)
  );
  const facts = [
    { title: 'Lowest PR', note: 'Lowest average Performance Rating', value: Math.min(...players.map(player => player.pr).filter(Number.isFinite)), key: 'pr', accent: 'gold' },
    { title: 'Most PR wins', note: 'Performance Rating wins', value: Math.max(...players.map(player => player.prWins).filter(Number.isFinite)), key: 'prWins', accent: 'blue' },
    { title: 'Luckiest player', note: 'Highest average luck', value: Math.max(...players.map(player => player.luck).filter(Number.isFinite)), key: 'luck', accent: 'green' },
    { title: 'Unluckiest player', note: 'Lowest average luck', value: Math.min(...players.map(player => player.luck).filter(Number.isFinite)), key: 'luck', accent: 'slate' }
  ];
  return '<div class="facts-intro">A little league-wide trivia, based on players who have played at least one match.</div><div class="facts-grid">' + facts.map(fact => {
    const player = players.find(item => item[fact.key] === fact.value);
    return '<article class="fact-card fact-' + fact.accent + '"><span class="fact-label">' + fact.title + '</span><strong class="fact-value">' + (fact.key === 'prWins' ? fact.value : fact.value.toFixed(2)) + '</strong><span class="fact-note">' + fact.note + '</span><div class="fact-player"><strong>' + escapeHtml(player.name) + '</strong><span>' + (player.handle ? '@' + escapeHtml(player.handle) + ' · ' : '') + escapeHtml(player.group) + '</span></div></article>';
  }).join('') + '</div><p class="facts-footnote">PR and luck are averages from the current league snapshot. Lower PR indicates stronger play.</p>';
}

function render() {
  const group = groupSelect.value;
  const isFacts = group === '__fun_facts__';
  if (activePlayer) {
    ['#summary', '.tabs', '.bottom-nav', '.search-box', '#refresh-button', '#data-note'].forEach(selector => $(selector).classList.add('hidden'));
    $('#panel-kicker').textContent = 'PLAYER PROFILE';
    $('#panel-title').textContent = activePlayer.name;
    $('#content').innerHTML = renderPlayerProfile(activePlayer);
    return;
  }
  ['#summary', '.tabs', '.bottom-nav', '.search-box', '#refresh-button', '#data-note'].forEach(selector => $(selector).classList.toggle('hidden', isFacts));
  if (isFacts) {
    $('#panel-kicker').textContent = 'ACROSS ALL GROUPS';
    $('#panel-title').textContent = 'League fun facts';
    $('#content').innerHTML = renderFunFacts();
    return;
  }
  const league = currentLeague();
  if (!league) {
    $('#content').innerHTML = '<div class="empty-state">League data is unavailable. Please refresh the page.</div>';
    return;
  }
  renderSummary(league);
  $('#fixture-count').textContent = league.fixtures.length;
  $('#result-count').textContent = league.results.length;
  const titles = {
    standings: ['THE TABLE', group + ' standings'],
    fixtures: ['UP NEXT', 'Remaining fixtures'],
    results: ['RECENT FORM', 'Match results & PR']
  };
  $('#panel-kicker').textContent = titles[view][0];
  $('#panel-title').textContent = titles[view][1];
  const filter = $('#search').value.trim();
  if (view === 'standings') $('#content').innerHTML = renderStandings(league, filter);
  if (view === 'fixtures') {
    const fixtures = league.fixtures.map(match => [null, ...match.slice(0, 2), null, null, ...match.slice(2, 4)]);
    $('#content').innerHTML = renderMatches(fixtures, filter, false, group);
  }
  if (view === 'results') $('#content').innerHTML = renderMatches(league.results, filter, true, group);
  $('#data-note').textContent = 'All 11 league groups - Snapshot retrieved ' + appData.fetched + '. SABGA may update scores after this snapshot. Tap Refresh for the official live page.';
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
groupSelect.addEventListener('change', () => { activePlayer = null; render(); });
$('#content').addEventListener('click', event => {
  if (event.target.closest('#profile-back')) { activePlayer = null; render(); return; }
  const button = event.target.closest('[data-player-name]');
  if (!button) return;
  activePlayer = { name: button.dataset.playerName, handle: button.dataset.playerHandle, group: button.dataset.playerGroup };
  render(); window.scrollTo(0, 0);
});
$('#refresh-button').addEventListener('click', () => window.open(officialUrl(groupSelect.value, view === 'fixtures' ? 'remaining' : view), '_blank', 'noopener,noreferrer'));
fetch('./data.json')
  .then(response => { if (!response.ok) throw new Error('League data unavailable'); return response.json(); })
  .then(data => { appData = data; render(); })
  .catch(() => { $('#content').innerHTML = '<div class="empty-state">League data could not be loaded. Please try again.</div>'; });
