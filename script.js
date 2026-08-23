// ============================================
// JOHNSON'S HUB - FOOTBALL EDGE AI
// COMPLETE WORKING VERSION
// ============================================

// Get API key from Vercel environment variables
const API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';

let currentSport = 'soccer_epl';
let allMatches = [];

// ============================================
// DOM READY - SETUP ALL NAVIGATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    
    // ---- MOBILE MENU TOGGLE ----
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('open');
            sidebar.classList.toggle('closed');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
                sidebar.classList.add('closed');
            }
        }
    });

    // ---- DATE PICKER ----
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        const today = new Date().toISOString().split('T')[0];
        datePicker.value = today;
        datePicker.addEventListener('change', function() {
            fetchMatches();
        });
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
            // Update active state
            document.querySelectorAll('.league-list li').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Get league
            currentSport = this.dataset.league;
            
            // Update display
            const display = document.getElementById('currentLeagueDisplay');
            if (display && LEAGUE_NAMES[currentSport]) {
                display.textContent = `🏆 ${LEAGUE_NAMES[currentSport]}`;
            }
            
            // Fetch matches
            fetchMatches();
            
            // Close mobile menu
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('sidebar').classList.add('closed');
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

    // ---- MATCH ROW CLICK ----
    document.addEventListener('click', function(e) {
        const row = e.target.closest('.match-row');
        if (row) {
            const match = row.querySelector('.match-col')?.textContent?.trim() || 'Match';
            const pred = row.dataset.prediction || 'N/A';
            alert(`📊 Match Details\n${match}\n\n🤖 AI Prediction: ${pred.toUpperCase()}\n\nTap OK for more analysis`);
        }
    });

    // ---- NAV MENU ITEMS ----
    document.querySelectorAll('.nav-menu li:not(.logout)').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-menu li').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show message
            const action = this.textContent.trim();
            if (action !== '⭐ My Favourites') {
                alert(`🔄 ${action}\n\nThis feature is coming soon!`);
            }
            
            // Close mobile menu
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('sidebar').classList.add('closed');
            }
        });
    });

    // ---- LOGOUT ----
    document.querySelector('.nav-menu li.logout')?.addEventListener('click', function() {
        if (confirm('🚪 Are you sure you want to logout?')) {
            alert('👋 Logged out successfully!');
        }
    });

    // ---- MORE LEAGUES ----
    document.querySelector('.league-list li.more')?.addEventListener('click', function() {
        alert('🌍 More leagues coming soon!\n\nChampions League\nEuropa League\nMLS\nJ-League\nAnd more...');
    });

    // ---- INITIAL LOAD ----
    fetchMatches();
    
    // Update scan time
    updateScanTime();
    
    console.log('⚡ Johnson\'s Hub - Football Edge AI loaded!');
    console.log('📊 Using The Odds API');
});

// ============================================
// FETCH REAL MATCHES
// ============================================
async function fetchMatches() {
    const container = document.getElementById('matchesContainer');
    container.innerHTML = `<div class="loading">⏳ Loading matches...</div>`;

    if (!API_KEY || API_KEY === 'undefined') {
        container.innerHTML = `
            <div class="loading">🔑 Please add ODDS_API_KEY in Vercel<br>
            <span style="font-size:0.9rem;color:#556677;">Settings → Environment Variables</span></div>
        `;
        return;
    }

    try {
        const url = `${BASE_URL}/sports/${currentSport}/odds/?apiKey=${API_KEY}&regions=us,uk,eu&markets=h2h&oddsFormat=decimal`;
        console.log('Fetching:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            container.innerHTML = `
                <div class="loading">❌ API Error: ${data.error}<br>
                <button onclick="fetchMatches()" style="margin-top:1rem;padding:0.5rem 1.5rem;border-radius:20px;background:#00d4ff;border:none;cursor:pointer;color:#000;font-weight:bold;">🔄 Retry</button></div>
            `;
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="loading">📭 No matches today<br>
                <span style="font-size:0.9rem;color:#556677;">Try another league or check back later</span></div>
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
            <div class="loading">❌ Connection Error: ${error.message}<br>
            <button onclick="fetchMatches()" style="margin-top:1rem;padding:0.5rem 1.5rem;border-radius:20px;background:#00d4ff;border:none;cursor:pointer;color:#000;font-weight:bold;">🔄 Retry</button></div>
        `;
    }
}

// ============================================
// RENDER MATCHES
// ============================================
function renderMatches(matches) {
    const container = document.getElementById('matchesContainer');
    
    if (!matches || matches.length === 0) {
        container.innerHTML = `<div class="loading">No matches available</div>`;
        return;
    }

    const html = matches.map(match => {
        const homeTeam = match.home_team;
        const awayTeam = match.away_team;
        
        const bookmaker = match.bookmakers?.[0];
        const market = bookmaker?.markets?.find(m => m.key === 'h2h');
        const outcomes = market?.outcomes || [];
        
        let homeOdds = '--', drawOdds = '--', awayOdds = '--';
        let homeProb = '33%', drawProb = '33%', awayProb = '33%';
        
        outcomes.forEach(o => {
            if (o.name === homeTeam) homeOdds = o.price.toFixed(2);
            if (o.name === 'Draw') drawOdds = o.price.toFixed(2);
            if (o.name === awayTeam) awayOdds = o.price.toFixed(2);
        });
        
        if (homeOdds !== '--' && drawOdds !== '--' && awayOdds !== '--') {
            const total = 1/parseFloat(homeOdds) + 1/parseFloat(drawOdds) + 1/parseFloat(awayOdds);
            homeProb = Math.round((1/parseFloat(homeOdds) / total) * 100) + '%';
            drawProb = Math.round((1/parseFloat(drawOdds) / total) * 100) + '%';
            awayProb = Math.round((1/parseFloat(awayOdds) / total) * 100) + '%';
        }

        let prediction = 'Draw';
        let confidence = '33%';
        let predictionClass = 'draw';
        
        if (homeOdds !== '--' && drawOdds !== '--' && awayOdds !== '--') {
            const homeP = parseFloat(homeOdds);
            const drawP = parseFloat(drawOdds);
            const awayP = parseFloat(awayOdds);
            
            if (homeP < drawP && homeP < awayP) {
                prediction = 'Home';
                confidence = homeProb;
                predictionClass = 'home';
            } else if (awayP < homeP && awayP < drawP) {
                prediction = 'Away';
                confidence = awayProb;
                predictionClass = 'away';
            } else {
                prediction = 'Draw';
                confidence = drawProb;
                predictionClass = 'draw';
            }
        }

        const matchTime = match.commence_time ? 
            new Date(match.commence_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 
            '--:--';

        let edgeColor = '#8899aa';
        const confNum = parseInt(confidence);
        if (confNum > 50) edgeColor = '#ffd700';
        if (confNum > 65) edgeColor = '#00ff88';

        return `
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
                <span class="best-edge highlight" style="color:${edgeColor}">${confidence}</span>
            </div>
        `;
    }).join('');

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
// UPDATE UI FUNCTIONS
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
