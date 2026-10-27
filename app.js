/* ==========================================================================
   SPOTMVP CORE SYSTEM APPLICATION CODE
   ========================================================================== */

// 1. COMPLEX DATA STATE: Grouped Playlist Catalog Collections
const playlists = {
    "Liked Songs": [
        { id: 1, title: "Cyber Sunset", artist: "Neon Pulse", album: "Vapor Horizon", duration: "3:45", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
        { id: 2, title: "Midnight Drive", artist: "Crimson Eclipse", album: "Velocity Run", duration: "2:30", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }
    ],
    "Coding Beats": [
        { id: 3, title: "Velvet Velocity", artist: "Astra Core", album: "Dark Void", duration: "4:12", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
        { id: 4, title: "Synthwave Symphony", artist: "Retro Driver", album: "Grid Runner", duration: "3:15", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
        { id: 5, title: "Lofi Focus Loop", artist: "Chill Scholar", album: "Study Session", duration: "2:55", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" }
    ],
    "Discover Weekly": [
        { id: 6, title: "Nebula Dreams", artist: "Cosmic Kid", album: "Stargazer", duration: "5:01", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
        { id: 7, title: "Laser Lounge", artist: "Neon Pulse", album: "Vapor Horizon", duration: "3:22", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" }
    ],
    "Awesome Mix": [
        { id: 8, title: "Hooked on a Code", artist: "The Devs", album: "Git Commits", duration: "4:05", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
    ],
    "Lo-Fi Chill": [
        { id: 9, title: "Rainy Cafe Window", artist: "Chill Scholar", album: "Study Session", duration: "3:40", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" }
    ],
    "Daily Mix 1": [
        { id: 10, title: "Neon Horizon", artist: "Retro Driver", album: "Grid Runner", duration: "3:45", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" }
    ]
};

// 2. ACTIVE VIEW STATE TRACKERS
const audioNode = new Audio();
let activePlaylistName = "Liked Songs"; // Default active list on boot
let currentTrackIndex = 0;
let navigationHistory = ['home']; 
let historyPointer = 0;

// Media Controls UI Framework Selectors
const prevButton = document.getElementById('btn-prev');
const playButton = document.getElementById('btn-play');
const nextButton = document.getElementById('btn-next');
const trackProgress = document.getElementById('track-progress');
const volumeSlider = document.getElementById('volume');
const currentTimeDisplay = document.getElementById('current-time');
const totalDurationDisplay = document.getElementById('total-duration');
const nowPlayingTitle = document.querySelector('.now-playing strong');
const nowPlayingArtist = document.querySelector('.now-playing small');

// Panel Workspace & Header Title Selectors
const homeView = document.getElementById('home-view');
const searchView = document.getElementById('search-view');
const searchBar = document.getElementById('search-bar');
const playlistHeaderTitle = document.querySelector('#home-view .track-list-container h2');
const homeTableBody = document.querySelector('#home-view table tbody');
const searchTableBody = document.querySelector('#search-results-table tbody');

// Navigation Selectors
const btnHome = document.getElementById('nav-home');
const btnSearch = document.getElementById('nav-search');
const btnBack = document.getElementById('btn-back');
const btnForward = document.getElementById('btn-forward');

// Sync default initialization values from our data collections
audioNode.src = playlists[activePlaylistName][currentTrackIndex].url;
audioNode.volume = volumeSlider.value / 100;

// ==========================================================================
// 3. UTILITY ENGINES: Time Formatter & UI View Swapping
// ==========================================================================
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function switchView(viewName, recordHistory = true) {
    if (viewName === 'home') {
        homeView.style.display = 'block';
        searchView.style.display = 'none';
    } else if (viewName === 'search') {
        homeView.style.display = 'none';
        searchView.style.display = 'block';
        searchBar.focus();
    }

    if (recordHistory) {
        if (historyPointer < navigationHistory.length - 1) {
            navigationHistory = navigationHistory.slice(0, historyPointer + 1);
        }
        navigationHistory.push(viewName);
        historyPointer = navigationHistory.length - 1;
    }
}

// ==========================================================================
// 4. RENDERING FUNCTIONS: Loading Tracks from the Active Playlist Selection
// ==========================================================================
function renderPlaylistTracks(playlistName) {
    activePlaylistName = playlistName;
    playlistHeaderTitle.textContent = `${playlistName}`;
    homeTableBody.innerHTML = "";
    
    const activeTracks = playlists[playlistName] || [];

    if (activeTracks.length === 0) {
        homeTableBody.innerHTML = `<tr><td colspan="4" style="color: #da9eb7; text-align: center; padding: 20px;">This playlist is currently empty.</td></tr>`;
        return;
    }

    activeTracks.forEach((track, index) => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${track.title}</strong><br><small style="color: #da9eb7;">${track.artist}</small></td>
            <td>${track.album}</td>
            <td>${track.duration}</td>
        `;
        row.addEventListener('click', () => selectTrack(index, playlistName));
        homeTableBody.appendChild(row);
    });
}

function selectTrack(index, playlistName) {
    activePlaylistName = playlistName;
    currentTrackIndex = index;
    const currentTrack = playlists[activePlaylistName][currentTrackIndex];
    
    nowPlayingTitle.textContent = currentTrack.title;
    nowPlayingArtist.textContent = currentTrack.artist;
    
    audioNode.src = currentTrack.url;
    audioNode.play();
    playButton.textContent = "⏸";
}

function renderSearchTracks(filterText) {
    searchTableBody.innerHTML = "";
    const allTracksPool = Object.values(playlists).flat();
    const uniqueTracks = Array.from(new Map(allTracksPool.map(item => [item.id, item])).values());

    const filtered = uniqueTracks.filter(track => 
        track.title.toLowerCase().includes(filterText.toLowerCase()) ||
        track.artist.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        searchTableBody.innerHTML = `<tr><td colspan="4" style="color: #da9eb7; text-align: center; padding: 20px;">No tracks found.</td></tr>`;
        return;
    }

    filtered.forEach((track) => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <td>🏷️</td>
            <td><strong>${track.title}</strong><br><small style="color: #da9eb7;">${track.artist}</small></td>
            <td>${track.album}</td>
            <td>${track.duration}</td>
        `;
        row.addEventListener('click', () => {
            nowPlayingTitle.textContent = track.title;
            nowPlayingArtist.textContent = track.artist;
            audioNode.src = track.url;
            audioNode.play();
            playButton.textContent = "⏸";
        });
        searchTableBody.appendChild(row);
    });
}

// ==========================================================================
// 5. ATTACHING ACTION LISTENERS TO ELEMENTS
// ==========================================================================
playButton.addEventListener('click', () => {
    if (!audioNode.paused) {
        audioNode.pause();
        playButton.textContent = "▶";
    } else {
        audioNode.play();
        playButton.textContent = "⏸";
    }
});

nextButton.addEventListener('click', () => {
    const activeTracks = playlists[activePlaylistName];
    let index = (currentTrackIndex + 1) >= activeTracks.length ? 0 : currentTrackIndex + 1;
    selectTrack(index, activePlaylistName);
});

prevButton.addEventListener('click', () => {
    const activeTracks = playlists[activePlaylistName];
    let index = (currentTrackIndex - 1) < 0 ? activeTracks.length - 1 : currentTrackIndex - 1;
    selectTrack(index, activePlaylistName);
});

audioNode.addEventListener('timeupdate', () => {
    if (audioNode.duration) {
        trackProgress.value = (audioNode.currentTime / audioNode.duration) * 100;
        currentTimeDisplay.textContent = formatTime(audioNode.currentTime);
        totalDurationDisplay.textContent = formatTime(audioNode.duration);
    }
});

trackProgress.addEventListener('input', () => {
    if (audioNode.duration) {
        audioNode.currentTime = (trackProgress.value / 100) * audioNode.duration;
    }
});

volumeSlider.addEventListener('input', () => {
    audioNode.volume = volumeSlider.value / 100;
});

btnHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
btnSearch.addEventListener('click', (e) => { e.preventDefault(); switchView('search'); });

searchBar.addEventListener('input', (e) => {
    renderSearchTracks(e.target.value);
});

btnBack.addEventListener('click', () => {
    if (historyPointer > 0) {
        historyPointer--;
        switchView(navigationHistory[historyPointer], false);
    }
});

btnForward.addEventListener('click', () => {
    if (historyPointer < navigationHistory.length - 1) {
        historyPointer++;
        switchView(navigationHistory[historyPointer], false);
    }
});

document.querySelectorAll('.card, .sidebar-playlist').forEach(element => {
    element.addEventListener('click', () => {
        const targetPlaylist = element.getAttribute('data-playlist');
        if (playlists[targetPlaylist]) {
            switchView('home');
            renderPlaylistTracks(targetPlaylist);
        }
    });
});

const hour = new Date().getHours();
document.getElementById('greeting').textContent = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

renderPlaylistTracks("Liked Songs");
renderSearchTracks("");
