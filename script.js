/* ========== 1. STATE: what the app remembers ========== */
let cur = -1;                 // index of the current song (-1 = none yet)
let playing = false;
let pos = 0;                  // seconds played
let shuffle = false, repeat = false;
let view = "home", query = "";
let lastLine = -1;            // which lyric line is lit
const liked = new Set();      // hearted songs

const $ = id => document.getElementById(id);
const fmt = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

// Album cover: uses the picture if there is one, otherwise a colored gradient
const bg = s => (s.img ? `url(${s.img}) center/cover,` : "") +
  `linear-gradient(135deg,hsl(${s.h} 75% 50%),hsl(${s.h + 30} 70% 15%))`;
const cover = s => `<div class="cover" style="background:${bg(s)}"></div>`;

/* ========== 2. PLAYER FUNCTIONS ========== */
const audio = new Audio();                            // plays the real song files
const hasAudio = () => cur >= 0 && songs[cur].src;    // true if this song has a file
function seek(t) { pos = t; if (hasAudio()) audio.currentTime = t; updateProgress(); }

function playSong(i) {
  cur = i; pos = 0; playing = true;
  audio.pause();
  if (songs[i].src) { audio.src = songs[i].src; audio.play().catch(() => {}); }
  document.documentElement.style.setProperty("--hue", songs[i].h);  // page color follows the song
  renderLyrics();
  render();
}
function togglePlay() {
  if (cur < 0) return playSong(0);
  playing = !playing;
  if (hasAudio()) playing ? audio.play() : audio.pause();
  render();
}
function next(auto) {
  let n = shuffle ? Math.floor(Math.random() * songs.length) : cur + 1;
  if (n >= songs.length) {
    if (repeat || !auto) n = 0;
    else { playing = false; pos = 0; audio.pause(); return render(); }   // playlist finished
  }
  playSong(n);
}
function prev() { if (pos > 3) { seek(0); } else playSong((cur - 1 + songs.length) % songs.length); }

// Timer: only used for songs WITHOUT a file (fake playback)
setInterval(() => {
  if (!playing || hasAudio()) return;
  pos++;
  if (pos >= songs[cur].d) next(true); else updateProgress();
}, 1000);

/* ========== 3. SCREENS ========== */
const all = () => songs.map((s, i) => ({ s, i }));

// One album card (used on the home page)
const card = (s, i) => `
  <div class="card" onclick="playSong(${i})">
    <div class="art">${cover(s)}<button class="go">▶</button></div>
    <b>${s.al}</b><small>${s.a}</small>
  </div>`;

// Song table (used on playlist, search and liked songs)
function trackList(list) {
  return `<div class="tr head"><span class="num">#</span><span>Title</span><span class="album">Album</span><span>⏱</span></div>` +
    list.map(({ s, i }) => `
    <div class="tr ${i === cur ? "current" : ""}" onclick="playSong(${i})">
      <span class="num"><span>${i === cur && playing ? "♫" : i + 1}</span><span class="play">▶</span></span>
      <div class="song">${cover(s)}<div style="min-width:0"><b>${s.t}</b><small>${s.a}</small></div></div>
      <span class="album">${s.al}</span>
      <span><button class="heart ${liked.has(i) ? "on" : ""}" onclick="event.stopPropagation();like(${i})">${liked.has(i) ? "♥" : "♡"}</button> ${fmt(s.d)}</span>
    </div>`).join("");
}

function render() {
  let html = "";
  const hr = new Date().getHours();
  const hello = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  if (view === "home") {               // HOMEPAGE
    html = `<div class="pad">
      <h1>${hello}</h1>
      <div class="quick">${songs.slice(0, 6).map((s, i) =>
        `<div class="qcard" onclick="playSong(${i})">${cover(s)}<span>${s.t}</span></div>`).join("")}</div>
      <h2>Our playlist</h2>
      <div class="cards">
        <div class="card" onclick="go('playlist')">
          <div class="art"><div class="cover" style="background:linear-gradient(135deg,#e5239d,#3a0a2b)"></div><button class="go">▶</button></div>
          <b>Nu Metal Essentials</b><small>${songs.length} songs</small>
        </div>
      </div>
      <h2>Popular albums</h2>
      <div class="cards">${songs.map(card).join("")}</div>
    </div>`;
  } else if (view === "playlist") {    // PLAYLIST PAGE
    html = `<div class="hero">
        <div class="bigcover">KOЯD</div>
        <div><small>PLAYLIST</small><h1>Nu Metal Essentials</h1><small>KOЯD · ${songs.length} songs</small></div>
      </div>
      <div class="actions">
        <button class="playbig" onclick="togglePlay()">${playing ? "❚❚" : "▶"}</button>
        <button class="icon ${shuffle ? "on" : ""}" onclick="toggleShuffle()">⤮</button>
      </div>` + trackList(all());
  } else if (view === "search") {      // SEARCH PAGE
    const found = all().filter(({ s }) => (s.t + s.a + s.al).toLowerCase().includes(query.toLowerCase()));
    html = `<div class="pad"><input class="search" id="q" placeholder="What do you want to play?" value="${query}">
      ${found.length ? trackList(found) : "<p style='color:var(--muted)'>No results found.</p>"}</div>`;
  } else if (view === "liked") {       // LIKED SONGS
    const l = all().filter(({ i }) => liked.has(i));
    html = `<div class="pad"><h1>Liked Songs</h1>${l.length ? trackList(l) : "<p style='color:var(--muted)'>Tap ♡ on a song to save it here.</p>"}</div>`;
  } else {                             // LIBRARY
    html = `<div class="pad"><h1>Your Library</h1>
      <button class="libitem" onclick="go('playlist')"><div class="cover" style="background:linear-gradient(135deg,#e5239d,#3a0a2b)"></div><div><b>Nu Metal Essentials</b><small>Playlist · ${songs.length} songs</small></div></button>
      <button class="libitem" onclick="go('liked')"><div class="cover" style="background:linear-gradient(135deg,#7b2ff7,#e5239d)"></div><div><b>Liked Songs</b><small>${liked.size} songs</small></div></button></div>`;
  }
  const scroll = $("main").scrollTop;
  $("main").innerHTML = html;
  $("main").scrollTop = scroll;
  const q = $("q");                    // keep typing in the search box
  if (q) { q.oninput = e => { query = e.target.value; render(); }; q.focus(); q.setSelectionRange(query.length, query.length); }

  // Player bar
  const s = songs[cur];
  $("now").innerHTML = s
    ? `${cover(s)}<div style="min-width:0"><b>${s.t}</b><small>${s.a}</small></div>
       <button class="heart ${liked.has(cur) ? "on" : ""}" onclick="like(${cur})">${liked.has(cur) ? "♥" : "♡"}</button>`
    : `<small>Pick a song to start</small>`;
  $("pp").textContent = playing ? "❚❚" : "▶";
  $("shuf").classList.toggle("on", shuffle);
  $("rep").classList.toggle("on", repeat);
  document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("on", b.dataset.view === view));
  updateProgress();
}

/* ========== 4. LYRICS ========== */
const lyricsOf = s => (s.lyrics && s.lyrics.length ? s.lyrics : demoLyrics);

function renderLyrics() {              // draws the current song's lyrics
  if (cur < 0) {
    $("lyr-title").textContent = "Lyrics";
    $("lyr-song-title").textContent = "Choose a song";
    $("lyr-artist").textContent = "Play a song to see its lyrics.";
    $("lyr-art").textContent = "KOЯD";
    $("lyr-art").style.backgroundImage = "";
    $("lines").innerHTML = "<p>Play a song to see lyrics.</p>";
    return;
  }
  const song = songs[cur];
  $("lyr-title").textContent = song.t;
  $("lyr-song-title").textContent = song.t;
  $("lyr-artist").textContent = song.a;
  $("lyr-art").textContent = song.img ? "" : "KOЯD";
  $("lyr-art").style.backgroundImage = song.img ? `url("${song.img}")` : `linear-gradient(135deg,hsl(${song.h} 75% 50%),hsl(${song.h + 30} 70% 15%))`;
  $("lines").innerHTML = lyricsOf(song).map(([t, text], i) =>
    `<p id="L${i}" onclick="seek(${t})">${text}</p>`).join("");
  lastLine = -1;
  updateLyrics();
}
function updateLyrics() {              // lights up the line matching the time
  if (cur < 0) return;
  let now = 0;
  const time = hasAudio() ? audio.currentTime : pos;   // exact time (with decimals) for accurate sync
  lyricsOf(songs[cur]).forEach(([t], i) => { if (time >= t) now = i; });
  if (now === lastLine) return;
  lastLine = now;
  document.querySelectorAll(".lines p").forEach((p, i) => p.classList.toggle("on", i === now));
  const el = $("L" + now);
  if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
}

/* ========== 5. PROGRESS BAR AND BUTTONS ========== */
function updateProgress() {
  const d = cur >= 0 ? songs[cur].d : 0;
  $("cur").textContent = fmt(pos);
  $("tot").textContent = fmt(d);
  $("fill").style.width = d ? (pos / d * 100) + "%" : "0";
  updateLyrics();
}
function like(i) { liked.has(i) ? liked.delete(i) : liked.add(i); render(); }
function toggleShuffle() { shuffle = !shuffle; render(); }
function go(v) { view = v; render(); }

$("pp").onclick = togglePlay;
$("next").onclick = () => next(false);
$("prev").onclick = prev;
$("shuf").onclick = toggleShuffle;
$("rep").onclick = () => { repeat = !repeat; render(); };
$("track").onclick = e => {            // click the bar to jump in the song
  if (cur < 0) return;
  const r = $("track").getBoundingClientRect();
  seek(Math.round((e.clientX - r.left) / r.width * songs[cur].d));
};
// Real audio events
audio.ontimeupdate = () => { pos = Math.floor(audio.currentTime); updateProgress(); };  // moves the bar
audio.onended = () => next(true);                                                      // next song
audio.onloadedmetadata = () => { songs[cur].d = Math.round(audio.duration); updateProgress(); };  // real length
$("vol").oninput = e => audio.volume = e.target.value / 100;                           // volume slider
audio.volume = 0.7;

```javascript
$("lyr-btn").onclick = () => {
  const panel = $("lyrics");
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  if (cur >= 0) {
    renderLyrics();
    updateLyrics();
  } else {
    renderLyrics();
  }
};

$("lyr-close").onclick = () => {
  const panel = $("lyrics");
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
};
```
document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => go(b.dataset.view));
document.addEventListener("keydown", e => {   // Space = play/pause; Escape closes lyrics
  if (e.code === "Escape") {
    $("lyrics").classList.remove("open");
    $("lyrics").setAttribute("aria-hidden", "true");
  }
  if (e.code === "Space" && !["INPUT", "TEXTAREA", "BUTTON"].includes(e.target.tagName)) {
    e.preventDefault(); togglePlay();
  }
});

render();   // draw the app when the page loads
