/* ==========================================================================
   Phase 1 MVP Client Logic - Socket.io & YouTube IFrame API Integration
   ========================================================================== */

// --- Socket.io Client Connection ---
const socket = io();

// --- State Variables ---
let player = null;
let isPlayerReady = false;
let currentVideoId = null;
let userVotedIndex = null;
let isPollActive = false;
let pendingInitArgs = null;

// --- YouTube IFrame API Lifecycle ---
window.onYouTubeIframeAPIReady = function() {
    console.log("[YT API] Ready triggered");
    if (pendingInitArgs && !player) {
        initYouTubePlayer(pendingInitArgs.id, pendingInitArgs.start);
    }
};

function safeInitPlayer(videoId, startSeconds = 0) {
    if (player) return;
    pendingInitArgs = { id: videoId, start: startSeconds };
    
    if (window.YT && window.YT.Player) {
        initYouTubePlayer(videoId, startSeconds);
    } else {
        console.log("[YT API] Waiting for window.YT.Player...");
        setTimeout(() => safeInitPlayer(videoId, startSeconds), 300);
    }
}

function initYouTubePlayer(initialVideoId, startSeconds = 0) {
    if (player) return;
    currentVideoId = initialVideoId;

    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: initialVideoId,
        playerVars: {
            'autoplay': 1,
            'controls': 1,
            'rel': 0,
            'modestbranding': 1,
            'enablejsapi': 1,
            'playsinline': 1,
            'start': Math.floor(startSeconds),
            'fs': 1
        },
        events: {
            'onReady': (event) => {
                isPlayerReady = true;
                console.log("[YT API] Player is Ready");
                if (startSeconds > 0 && typeof player.seekTo === 'function') {
                    player.seekTo(startSeconds, true);
                }
                const overlay = document.getElementById('startOverlay');
                if (overlay && overlay.classList.contains('hidden')) {
                    player.unMute();
                    player.playVideo();
                }
            },
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    // Standard player state handler
}

// --- Socket.io Realtime Event Listeners ---

// 1. Initial Sync Payload on Connection
socket.on('initial_sync', (data) => {
    console.log("[SOCKET] Initial sync payload received:", data);

    updateOnlineCount(data.onlineCount);
    updateUIWithVideo(data.currentVideo, data.elapsedSeconds, data.remainingSeconds);

    if (data.userVotedIndex !== null) {
        userVotedIndex = data.userVotedIndex;
    }

    if (!player) {
        safeInitPlayer(data.currentVideo.id, data.elapsedSeconds);
    } else if (currentVideoId !== data.currentVideo.id) {
        currentVideoId = data.currentVideo.id;
        player.loadVideoById(data.currentVideo.id, Math.floor(data.elapsedSeconds));
    }

    if (data.pollResults && data.pollResults.candidates.length > 0) {
        renderPollState(data.pollResults);
    } else {
        resetPollToIdle();
    }
});

// 2. Continuous 1-Second Sync Tick
socket.on('sync_tick', (data) => {
    updateOnlineCount(data.onlineCount);
    updateProgressAndRemaining(data.elapsedSeconds, data.remainingSeconds, data.currentVideo.durationSec);

    // If client video falls behind by more than 4 seconds, soft resync
    if (isPlayerReady && player && typeof player.getCurrentTime === 'function') {
        const clientCurrentSec = player.getCurrentTime() || 0;
        const drift = Math.abs(clientCurrentSec - data.elapsedSeconds);
        if (drift > 4) {
            console.warn(`[SYNC DRIFT] Drift detected: ${drift.toFixed(1)}s. Soft resyncing...`);
            player.seekTo(data.elapsedSeconds, true);
        }
    }

    // Update poll panel state if active
    if (data.pollResults && data.pollResults.candidates.length > 0) {
        updatePollCountdown(data.remainingSeconds);
        renderPollState(data.pollResults);
    } else {
        resetPollToIdle();
    }
});

// 3. Poll Started (Remaining <= 30s)
socket.on('poll_started', (pollResults) => {
    console.log("[SOCKET] Poll started! Candidates:", pollResults);
    userVotedIndex = null;
    renderPollState(pollResults);
});

// 4. Realtime Poll Updated (Another Tab Voted!)
socket.on('poll_updated', (pollResults) => {
    console.log("[SOCKET] Poll results updated in realtime across tabs:", pollResults);
    renderPollState(pollResults);
});

// 5. Vote Acknowledged for this socket
socket.on('vote_acknowledged', (data) => {
    userVotedIndex = data.votedIndex;
    console.log("[SOCKET] Vote acknowledged. Voted index:", userVotedIndex);
});

// 6. Video Changed (Remaining <= 0s) - Winner Chosen!
socket.on('video_changed', (data) => {
    console.log("[SOCKET] Video changed! Winner:", data.currentVideo);
    currentVideoId = data.currentVideo.id;
    userVotedIndex = null;

    updateUIWithVideo(data.currentVideo, 0, data.currentVideo.durationSec);
    resetPollToIdle();

    if (isPlayerReady && player) {
        player.loadVideoById(data.currentVideo.id, 0);
        player.unMute();
        player.playVideo();
    }
});

// 7. Online User Count Updated
socket.on('online_count_updated', (data) => {
    updateOnlineCount(data.onlineCount);
});

// --- UI Rendering Functions ---

function updateOnlineCount(count) {
    const onlineEl = document.getElementById('onlineViewersCount');
    if (onlineEl) onlineEl.textContent = count;
}

function updateUIWithVideo(video, elapsed, remaining) {
    document.getElementById('npTitle').textContent = video.title;
    document.getElementById('npArtist').textContent = video.artist;
    document.getElementById('npTag').textContent = video.tag || "全参加者同期";
    document.getElementById('npDuration').textContent = formatSeconds(video.durationSec);

    updateProgressAndRemaining(elapsed, remaining, video.durationSec);
}

function updateProgressAndRemaining(elapsed, remaining, totalSec) {
    document.getElementById('currentTimeDisplay').textContent = formatSeconds(elapsed);
    document.getElementById('totalTimeDisplay').textContent = formatSeconds(totalSec);
    document.getElementById('remainingTimeText').textContent = formatSeconds(remaining);

    if (totalSec > 0) {
        const pct = (elapsed / totalSec) * 100;
        document.getElementById('progressBarFill').style.width = `${pct}%`;
    }
}

function updatePollCountdown(remainingSec) {
    const countdownEl = document.getElementById('pollCountdownSec');
    if (countdownEl) {
        countdownEl.textContent = `${Math.max(0, remainingSec)}秒`;
    }
}

function renderPollState(pollResults) {
    isPollActive = true;

    document.getElementById('pollIdleBox').classList.add('hidden');
    document.getElementById('pollActiveBox').classList.remove('hidden');

    const statusIndicator = document.getElementById('pollStatusIndicator');
    statusIndicator.className = 'poll-status-indicator active';
    statusIndicator.textContent = '投票受付中 (残り30秒)';

    const container = document.getElementById('candidateChoicesList');
    if (!container) return;

    container.innerHTML = pollResults.candidates.map((cand, idx) => {
        const votes = pollResults.voteCounts[idx] || 0;
        const pct = pollResults.percentages[idx] || 0;
        const isVoted = userVotedIndex === idx;

        return `
            <div class="candidate-choice-card ${isVoted ? 'voted' : ''}" onclick="submitVote(${idx})">
                ${isVoted ? '<div class="voted-badge">あなたの投票</div>' : ''}
                <div class="cand-thumb-wrap">
                    <img src="${cand.thumbnail}" class="cand-thumb" alt="${cand.title}">
                </div>
                <div class="cand-info">
                    <div class="cand-title">${escapeHTML(cand.title)}</div>
                    <div class="cand-artist">${escapeHTML(cand.artist)}</div>
                    <div class="cand-vote-stats">
                        <span class="cand-pct">${pct}%</span>
                        <span class="cand-votes-count">${votes}票</span>
                    </div>
                </div>
                <div class="cand-bar-fill" style="width: ${pct}%;"></div>
            </div>
        `;
    }).join('');
}

function resetPollToIdle() {
    isPollActive = false;
    userHasVoted = false;
    userVotedIndex = null;

    document.getElementById('pollIdleBox').classList.remove('hidden');
    document.getElementById('pollActiveBox').classList.add('hidden');

    const statusIndicator = document.getElementById('pollStatusIndicator');
    statusIndicator.className = 'poll-status-indicator idle';
    statusIndicator.textContent = '待機中 (残り30秒で開始)';
}

function submitVote(candidateIndex) {
    if (!isPollActive) return;
    console.log(`[CLIENT VOTE] Submitting vote for Candidate #${candidateIndex}`);
    socket.emit('vote', candidateIndex);
}

function formatSeconds(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// --- Event Listeners Setup ---
document.addEventListener('DOMContentLoaded', () => {
    
    document.getElementById('startBroadcastBtn').addEventListener('click', () => {
        document.getElementById('startOverlay').classList.add('hidden');
        if (isPlayerReady && player) {
            player.unMute();
            player.playVideo();
        }
    });

    const volSlider = document.getElementById('volumeSlider');
    volSlider.addEventListener('input', (e) => {
        if (isPlayerReady && player) {
            player.setVolume(e.target.value);
            if (e.target.value === '0') {
                player.mute();
            } else {
                player.unMute();
            }
        }
    });

    if (window.lucide) lucide.createIcons();
});
