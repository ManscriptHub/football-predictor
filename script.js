// ============================================
// JOHNSON'S HUB - FOOTBALL EDGE AI
// THE ODDS API INTEGRATION
// ============================================

const API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';

let currentSport = 'soccer_epl'; // Default: Premier League
let currentDate = new Date().toISOString().split('T')[0];

// ============================================
// FETCH REAL MATCHES & ODDS
// ============================================
async function fetchMatches() {
  try {
    const url = `${BASE_URL}/sports/${currentSport}/odds/?apiKey=${API_KEY}&regions=us,uk,eu&markets=h2h,spreads,totals&oddsFormat=decimal`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data || data.length === 0) {
      showEmptyState();
      return;
    }

    renderMatches(data);
    updateMatchCount(data.length);
    
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('matchesContainer').innerHTML = `
      <div class="loading">❌ API Error: ${error.message}<br>
      <button onclick="fetchMatches()" style="margin-top:1rem;padding:0.5rem 1.5rem;border-radius:20px;background:#00d4ff;border:none;cursor:pointer;color:#000;">Retry</button></div>
    `;
  }
}

// ============================================
// RENDER MATCHES
// ============================================
function renderMatches(fixtures) {
  const container = document.getElementById('matchesContainer');
  
  if (!fixtures || fixtures.length === 0) {
    container.innerHTML = `<div class="loading">No matches today</div>`;
    return;
  }

  container.innerHTML = fixtures.map(f => {
    const homeTeam = f.home_team;
    const awayTeam = f.away_team;
    const odds = f.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
    
    // Extract odds
    let homeOdds = '--', drawOdds = '--', awayOdds = '--';
    let homeProb = '33%', drawProb = '33%', awayProb = '33%';
    
    if (odds.length >= 3) {
      homeOdds = odds[0]?.price?.toFixed(2) || '--';
      drawOdds = odds[1]?.price?.toFixed(2) || '--';
      awayOdds = odds[2]?.price?.toFixed(2) || '--';
      
      // Calculate implied probabilities
      const total = 1/parseFloat(homeOdds) + 1/parseFloat(drawOdds) + 1/parseFloat(awayOdds);
      if (homeOdds !== '--') homeProb = Math.round((1/parseFloat(homeOdds) / total) * 100) + '%';
      if (drawOdds !== '--') drawProb = Math.round((1/parseFloat(drawOdds) / total) * 100) + '%';
      if (awayOdds !== '--') awayProb = Math.round((1/parseFloat(awayOdds) / total) * 100) + '%';
    }

    // Prediction logic
    let prediction = 'Draw';
    let confidence = '33%';
    if (odds.length >= 3) {
      const homeP = parseFloat(homeOdds) || 999;
      const drawP = parseFloat(drawOdds) || 999;
      const awayP = parseFloat(awayOdds) || 999;
      
      if (homeP < drawP && homeP < awayP) {
        prediction = 'Home';
        confidence = homeProb;
      } else if (awayP < homeP && awayP < drawP) {
        prediction = 'Away';
        confidence = awayProb;
      } else {
        prediction = 'Draw';
        confidence = drawProb;
      }
    }

    const matchTime = f.commence_time ? new Date(f.commence_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--';

    return `
      <div class="match-row" data-prediction="${prediction.toLowerCase()}">
        <span class="time">${matchTime}</span>
        <span class="match-col"><strong>${homeTeam}</strong> vs ${awayTeam}</span>
        <span>${homeOdds}</span>
        <span>${drawOdds}</span>
        <span>${awayOdds}</span>
        <span>--</span><span>--</span>
        <span>${homeProb}</span>
        <span>${drawProb}</span>
        <span>${awayProb}</span>
        <span>--</span><span>--</span>
        <span class="best-edge highlight">${confidence}</span>
      </div>
    `;
  }).join('');
}

function showEmptyState() {
  document.getElementById('matchesContainer').innerHTML = `
    <div class="loading">📭 No matches scheduled for today<br>
    <span style="font-size:0.9rem;color:#556677;">Try checking another league</span></div>
  `;
}

function updateMatchCount(count) {
  document.getElementById('matchCount').textContent = `${count} matches`;
}

// ============================================
// SPORT/LEAGUE SELECTOR
// ============================================
const SPORT_IDS = {
  'all': 'soccer_epl',
  'Premier League': 'soccer_epl',
  'La Liga': 'soccer_spain_la_liga',
  'Serie A': 'soccer_italy_serie_a',
  'Bundesliga': 'soccer_germany_bundesliga',
  'Ligue 1': 'soccer_france_ligue_one',
  'Champions League': 'soccer_uefa_champs_league'
};

document.querySelectorAll('.league-list li:not(.more)').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.league-list li').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    
    const leagueName = this.textContent.trim().replace(/[^\w\s]/g, '').trim();
    currentSport = SPORT_IDS[leagueName] || SPORT_IDS['all'];
    fetchMatches();
  });
});

// ============================================
// REFRESH BUTTON
// ============================================
document.querySelector('.refresh-btn')?.addEventListener('click', function() {
  this.textContent = '⏳ Loading...';
  this.disabled = true;
  fetchMatches().finally(() => {
    this.textContent = '🔄 Refresh';
    this.disabled = false;
  });
});

// ============================================
// FILTER TABS
// ============================================
document.querySelectorAll('.filter-tabs button').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-tabs button').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});

// ============================================
// AUTO-REFRESH
// ============================================
setInterval(() => {
  const refreshBtn = document.querySelector('.refresh-btn');
  if (!refreshBtn?.disabled) {
    fetchMatches();
  }
}, 60000);

// ============================================
// MATCH ROW CLICK
// ============================================
document.addEventListener('click', function(e) {
  const row = e.target.closest('.match-row');
  if (row) {
    const match = row.querySelector('.match-col')?.textContent?.trim() || 'Match';
    alert(`📊 Match Details\n${match}\n\nClick OK to view full analysis`);
  }
});

// ============================================
// INIT
// ============================================
if (!API_KEY || API_KEY === 'undefined') {
  document.getElementById('matchesContainer').innerHTML = `
    <div class="loading">🔑 Please add your ODDS_API_KEY in Vercel environment variables<br>
    <span style="font-size:0.9rem;color:#556677;">Settings → Environment Variables</span></div>
  `;
} else {
  fetchMatches();
  console.log('⚡ Johnson\'s Hub - Football Edge AI loaded!');
  console.log('📊 Fetching real data from The Odds API');
}
