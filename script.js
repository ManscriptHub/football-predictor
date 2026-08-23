// ============================================
// JOHNSON'S HUB - FOOTBALL EDGE AI
// THE ODDS API - WORKING VERSION
// ============================================

const API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';

let currentSport = 'soccer_epl';
let allMatches = [];

// ============================================
// DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('⚡ Johnson\'s Hub loaded!');
    console.log('API Key:', API_KEY ? '✅ Present' : '❌ Missing');
    
    // ---- MOBILE MENU ----
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

    // ---- DATE PICKER ----
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        const today = new Date().toISOString().split('T')[0];
        datePicker.value = today;
        datePicker.addEventListener('change', fetchMatches);
    }

    // ---- LEAGUE SELECTOR ----
    const LEAGUE_NAMES = {
        'soccer_epl': 'ENGLAND: PREMIER LEAGUE',
        'soccer_spain_la_liga': 'SPAIN: LA LIGA',
        'soccer_italy_serie_a': 'ITALY: SERIE A',
        'soccer_germany_bundesliga': 'GERMANY: BUNDESLIGA',
        'soccer_france_ligue_one': 'FRANCE: LIGUE 1',
        'soccer_netherlands_eredivisie': 'NETHERLANDS: EREDIVISIE',
        'soccer_portugal_primeira_liga': 'PORTUGAL: PRIMEIRA LIGA'
    };

    document.querySelectorAll('.league-list li[data-league]').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.league-list li').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            currentSport = this.dataset.league;
            
            const display = document.getElementById('currentLeagueDisplay');
            if (display && LEAGUE_NAMES[currentSport]) {
                display.textContent = `🏆 ${LEAGUE_NAMES[currentSport]}`;
            }
            
            fetchMatches();
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        });
    });

    // ---- FILTER TABS ----
    document.querySelectorAll('.filter-tabs button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-tabs button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterMatches(this.dataset.filter);
        });
    });

    // ---- REFRESH BUTTON ----
    document.querySelector('.refresh-btn').addEventListener('click', function() {
        this.textContent = '⏳ Loading...';
        this.disabled = true;
        fetchMatches().finally(() => {
            this.textContent = '🔄 Refresh';
            this.disabled = false;
        });
    });

    // ---- MATCH CLICK ----
    document.addEventListener('click', function(e) {
        const row = e.target.closest('.match-row');
        if (row) {
            const match = row.querySelector('.match-col')?.textContent?.trim() || 'Match';
            const pred = row.dataset.prediction || 'N/A';
            alert(`📊 ${match}\n\n🤖 AI Prediction: ${pred.toUpperCase()}`);
        }
    });

    // ---- NAV MENU ----
    document.querySelectorAll('.nav-menu li:not(.logout)').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-menu li').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            const action = this.textContent.trim();
            if (action !== '⭐ My Favourites') {
                alert(`🔄 ${action}\n\nComing soon!`);
            }
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        });
    });

    // ---- LOGOUT ----
    document.querySelector('.nav-menu li.logout')?.addEventListener('click', function() {
        if (confirm('🚪 Logout?')) {
            alert('👋 Logged out!');
        }
    });

    // ---- MORE LEAGUES ----
    document.querySelector('.league-list li.more')?.addEventListener('click', function() {
        alert('🌍 More leagues coming soon!');
    });

    // ---- LOAD MATCHES ----
    fetchMatches();
});

// ============================================
// FETCH MATCHES
// ============================================
async function fetchMatches() {
    const container = document.getElementById('matchesContainer');
    container.innerHTML = `<div class="loading">⏳ Loading matches...</div>`;

    if (!API_KEY) {
        container.innerHTML = `
            <div class="loading">🔑 ODDS_API_KEY missing in Vercel</div>
        `;
        return;
    }

    try {
        // Get today's matches with odds
        const url = `${BASE_URL}/sports/${currentSport}/odds/?apiKey=${API_KEY}&regions=us,uk,eu&markets=h2h&oddsFormat=decimal`;
        console.log('Fetching:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        console.log('Matches found:', data.length);
        
        if (data.error) {
            container.innerHTML = `
                <div class="loading">❌ API Error: ${data.error}</div>
            `;
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="loading">📭 No matches today in this league<br>
                <span style="font-size:0.8rem;color:#556677;">Try another league</span></div>
            `;
            return;
        }

        allMatches = data;
        renderMatches(data);
        updateMatchCount(data.length);
        updateScanTime();
        updateAIPredictions(data);
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <div class="loading">❌ Error: ${error.message}<br>
            <button onclick="fetchMatches()" style="margin-top:1rem;padding:0.5rem 1.5rem;border-radius:20px;background:#00d4ff;border:none;cursor:pointer;color:#000;">🔄 Retry</button>
        `;
    }
}

// ============================================
// RENDER MATCHES
// ============================================
function renderMatches(matches) {
    const container = document.getElementById('matchesContainer');
    
    if (!matches || matches.length === 0) {
        container.innerHTML = `<div class="loading">No matches</div>`;
        return;
    }

    let html = '';
    matches.forEach(match => {
        const homeTeam = match.home_team || 'Home';
        const awayTeam = match.away_team || 'Away';
        const matchTime = match.commence_time ? 
            new Date(match.commence_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 
            '--:--';
        
        // Get odds from first bookmaker
        const bookmaker = match.bookmakers?.[0];
        const market = bookmaker?.markets?.find(m => m.key === 'h2h');
        const outcomes = market?.outcomes || [];
        
        let homeOdds = '--', drawOdds = '--', awayOdds = '--';
        
        outcomes.forEach(o => {
            if (o.name === homeTeam) homeOdds = o.price.toFixed(2);
            if (o.name === 'Draw') drawOdds = o.price.toFixed(2);
            if (o.name === awayTeam) awayOdds = o.price.toFixed(2);
        });
        
        // Calculate probabilities
        let homeProb = '33%', drawProb = '33%', awayProb = '33%';
        if (homeOdds !== '--' && drawOdds !== '--' && awayOdds !== '--') {
            const total = 1/parseFloat(homeOdds) + 1/parseFloat(drawOdds) + 1/parseFloat(awayOdds);
            homeProb = Math.round((1/parseFloat(homeOdds) / total) * 100) + '%';
            drawProb = Math.round((1/parseFloat(drawOdds) / total) * 100) + '%';
            awayProb = Math.round((1/parseFloat(awayOdds) / total) * 100) + '%';
        }

        // AI Prediction
        let prediction = 'Draw';
        let predictionClass = 'draw';
        if (homeOdds !== '--' && drawOdds !== '--' && awayOdds !== '--') {
            const homeP = parseFloat(homeOdds);
            const drawP = parseFloat(drawOdds);
            const awayP = parseFloat(awayOdds);
            
            if (homeP < drawP && homeP < awayP) {
                prediction = 'Home';
                predictionClass = 'home';
            } else if (awayP < homeP && awayP < drawP) {
                prediction = 'Away';
                predictionClass = 'away';
            } else {
                prediction = 'Draw';
                predictionClass = 'draw';
            }
        }

        html += `
            <div class="match-row" data-prediction="${predictionClass}">
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
                <span class="best-edge highlight" style="color:#ffd700;">${prediction}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================
// FILTER MATCHES
// ============================================
function filterMatches(filter) {
    if (!allMatches || allMatches.length === 0) return;
    
    let filtered = allMatches;
    if (filter === 'live') {
        filtered = allMatches.filter(m => m.live);
    } else if (filter === 'upcoming') {
        filtered = allMatches.filter(m => !m.live && !m.completed);
    } else if (filter === 'finished') {
        filtered = allMatches.filter(m => m.completed);
    }
    
    if (filtered.length === 0) {
        document.getElementById('matchesContainer').innerHTML = `
            <div class="loading">📭 No ${filter} matches</div>
        `;
        return;
    }
    
    renderMatches(filtered);
    updateMatchCount(filtered.length);
}

// ============================================
// UPDATE UI
// ============================================
function updateMatchCount(count) {
    const el = document.getElementById('matchCount');
    if (el) el.textContent = `${count} matches`;
}

function updateScanTime() {
    const el = document.getElementById('scanTime');
    if (el) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
        const timeStr = now.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
        el.textContent = `Last scanned: ${dateStr}, ${timeStr}`;
    }
}

function updateAIPredictions(matches) {
    const container = document.getElementById('aiPicks');
    if (!container || !matches || matches.length === 0) return;
    
    const predictions = matches.slice(0, 5).map(match => {
        const homeTeam = match.home_team;
        const awayTeam = match.away_team;
        const outcomes = match.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h')?.outcomes || [];
        
        let homeOdds = '--', drawOdds = '--', awayOdds = '--';
        outcomes.forEach(o => {
            if (o.name === homeTeam) homeOdds = o.price;
            if (o.name === 'Draw') drawOdds = o.price;
            if (o.name === awayTeam) awayOdds = o.price;
        });
        
        let prediction = 'Draw';
        if (homeOdds !== '--' && drawOdds !== '--' && awayOdds !== '--') {
            if (homeOdds < drawOdds && homeOdds < awayOdds) prediction = 'Home';
            else if (awayOdds < homeOdds && awayOdds < drawOdds) prediction = 'Away';
        }
        return prediction;
    });
    
    const pickClasses = {
        'Home': 'pick home',
        'Away': 'pick away',
        'Draw': 'pick draw'
    };
    
    container.innerHTML = predictions.map(p => 
        `<span class="${pickClasses[p] || 'pick draw'}">${p === 'Home' ? '🏠' : p === 'Away' ? '✈️' : '⚖️'} ${p.toUpperCase()}</span>`
    ).join('');
}

// ============================================
// AUTO-REFRESH
// ============================================
setInterval(() => {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (!refreshBtn?.disabled) {
        fetchMatches();
    }
}, 60000);
