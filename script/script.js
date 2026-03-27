const songs = [
    {
        title: "Aphrodite - The Ridleys",
        src: "assets/audio/Aphrodite.mp3",
        album: "assets/images/aphrodite.jpg",
        lyricsFile: "assets/lyrics/aphrodite.txt"
    },
    {
        title: "Hurts - LANY",
        src: "assets/audio/lany-hurts.mp3",
        album: "assets/images/hurts.jpg",
        lyricsFile: "assets/lyrics/hurts.txt"
    },
    {
        title: "LOVE. - Kendrick Lamar",
        src: "assets/audio/Love.mp3",
        album: "assets/images/Love.jpg",
        lyricsFile: "assets/lyrics/love.txt"
    },
    {
        title: "Pink Skies - LANY",
        src: "assets/audio/pinkskies.mp3",
        album: "assets/images/pinkskies.jpg",
        lyricsFile: "assets/lyrics/pinkskies.txt"
    },
    {
        title: "Thick and Thin - LANY",
        src: "assets/audio/thick.mp3",
        album: "assets/images/thick.jpg",
        lyricsFile: "assets/lyrics/thick.txt"
    }
];

let currentSongIndex = 0;
let currentLyricIndex = -1;

const audio = document.getElementById("audio");
const songTitle = document.getElementById("song-title");
const albumCover = document.getElementById("album-cover");
const lyricsDisplay = document.getElementById("lyrics");

const playBtn = document.getElementById("play-btn");
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");

const playerBeats = document.getElementById("player-beats");

playBtn.addEventListener("click", playPause);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

audio.addEventListener("play", startBeats);
audio.addEventListener("pause", stopBeats);
audio.addEventListener("timeupdate", updateLyricHighlight);
audio.addEventListener("ended", () => {
    stopBeats();
    nextSong();
});

window.onload = function () {
    currentSongIndex = 0;
    updateSong(false);
    handleResponsiveLyrics();
};


function startBeats() {
    playerBeats.classList.add("playing");
}

function stopBeats() {
    playerBeats.classList.remove("playing");
}


function parseTimedLyrics(lyricsText) {
    if (!lyricsText) return [];

    const lines = lyricsText.split("\n");
    const timedLyrics = [];

    for (const line of lines) {
        const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2}))?\]\s*(.*)/);

        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const hundredths = parseInt(match[3] || "0", 10);
            const text = match[4].trim();

            const time = minutes * 60 + seconds + hundredths / 100;

            if (text) {
                timedLyrics.push({ time, text });
            }
        }
    }

    return timedLyrics;
}

function renderLyrics() {
    const currentSong = songs[currentSongIndex];
    lyricsDisplay.innerHTML = "";

    if (!currentSong.timedLyrics || currentSong.timedLyrics.length === 0) return;

    currentSong.timedLyrics.forEach((line, index) => {
        const p = document.createElement("p");
        p.textContent = line.text;
        p.className = "lyric-line";
        p.dataset.index = index;
        lyricsDisplay.appendChild(p);
    });
}

function updateLyricHighlight() {
    const currentSong = songs[currentSongIndex];
    if (!currentSong.timedLyrics || currentSong.timedLyrics.length === 0) return;

    const currentTime = audio.currentTime;
    let newIndex = -1;

    for (let i = 0; i < currentSong.timedLyrics.length; i++) {
        if (currentTime >= currentSong.timedLyrics[i].time) {
            newIndex = i;
        } else {
            break;
        }
    }

    if (newIndex !== currentLyricIndex) {
        currentLyricIndex = newIndex;

        const lines = lyricsDisplay.querySelectorAll(".lyric-line");
        lines.forEach((line, index) => {
            line.classList.remove("active-lyric", "past-lyric");

            if (index < currentLyricIndex) {
                line.classList.add("past-lyric");
            } else if (index === currentLyricIndex) {
                line.classList.add("active-lyric");
            }
        });

        const activeLine = lyricsDisplay.querySelector(".active-lyric");
        if (activeLine) {
            activeLine.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }
}

async function loadLyricsFromFile(filePath) {
    try {
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`Failed to load lyrics: ${response.status}`);
        }

        return await response.text();
    } catch (error) {
        console.error("Lyrics file error:", error);
        return "Lyrics could not be loaded.";
    }
}

function playPause() {
    if (audio.paused) {
        audio.play()
            .then(() => {
                playBtn.innerText = "Pause";
                startBeats();
            })
            .catch(error => {
                console.error("Play failed:", error);
            });
    } else {
        audio.pause();
        playBtn.innerText = "Play";
        stopBeats();
    }
}

function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    updateSong(true);
}

function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    updateSong(true);
}

async function updateSong(autoPlay = true) {
    const currentSong = songs[currentSongIndex];
    currentLyricIndex = -1;

    lyricsDisplay.innerHTML = "";
    audio.src = currentSong.src;
    songTitle.innerText = currentSong.title;

    if (currentSong.album) {
        albumCover.src = currentSong.album;
        albumCover.alt = "Album cover for " + currentSong.title;
    } else {
        albumCover.src = "assets/images/default.jpg";
        albumCover.alt = "Default album cover";
    }

    const lyricsText = await loadLyricsFromFile(currentSong.lyricsFile);

    // Use the correct parser
    currentSong.timedLyrics = parseTimedLyrics(lyricsText);

    renderLyrics();
    updateLyricHighlight();

    audio.load();

    if (autoPlay) {
        audio.play()
            .then(() => {
                playBtn.innerText = "Pause";
                startBeats();
            })
            .catch(error => {
                console.error("Autoplay failed:", error);
                playBtn.innerText = "Play";
                stopBeats();
            });
    } else {
        playBtn.innerText = "Play";
        stopBeats();
    }
}

function handleResponsiveLyrics() {
    lyricsDisplay.style.animation = "none";
    lyricsDisplay.style.position = "relative";
}