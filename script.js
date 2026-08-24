/* ==========================================================================
   IDOL TV LIVE - Continuous YouTube Broadcast Engine & Nico Cruise Logic
   ========================================================================== */

// --- Pre-Curated Channel Playlists (Verified Embeddable YouTube Video IDs) ---
const CHANNELS = {
    sakamichi: {
        name: "坂道・46グループ & AKB48 Special",
        category: "【アイドル大特集】",
        ticker: "♪ ただいま「坂道・46グループ & AKB48 Special」を全人類同時放送中！ 伝説のヒットMV『インフルエンサー』『シンクロニシティ』など24時間オンエア！",
        videos: [
            { id: "r4SdiT7mm7Y", title: "インフルエンサー", artist: "乃木坂46", tag: "伝説のMV", duration: "04:45" },
            { id: "fIqKWLyiAc0", title: "シンクロニシティ", artist: "乃木坂46", tag: "レコード大賞", duration: "04:14" },
            { id: "dFfNYBo7f4E", title: "恋するフォーチュンクッキー", artist: "AKB48", tag: "ミリオンセラー", duration: "04:54" },
            { id: "XiYjkSyu0eY", title: "Sing Out!", artist: "乃木坂46", tag: "神曲", duration: "05:25" },
            { id: "lkHlnWFnA0c", title: "ヘビーローテーション", artist: "AKB48", tag: "国民的ソング", duration: "04:42" },
            { id: "ReI6gvzVP0Y", title: "泡沫サタデーナイト！", artist: "モーニング娘。'16", tag: "ダンス", duration: "03:48" }
        ]
    },
    newwave: {
        name: "令和ブレイクアイドル大集合",
        category: "【注目アイドル】",
        ticker: "♪ 令和SNSバズアイドル特集！ FRUITS ZIPPER / 超ときめき♡宣伝部 / ME:I などのバズソングを全国同時放送中！",
        videos: [
            { id: "NQX2v6F6S5w", title: "わたしの一番かわいいところ", artist: "FRUITS ZIPPER", tag: "SNSバズ", duration: "03:45" },
            { id: "z3x6Z46w-gI", title: "最上級にかわいいの！", artist: "超ときめき♡宣伝部", tag: "神回", duration: "03:15" },
            { id: "Z1_b-8w0N3k", title: "Click", artist: "ME:I", tag: "ダンス", duration: "03:30" },
            { id: "QW28PUVeLpw", title: "Make you happy", artist: "NiziU", tag: "縄跳びダンス", duration: "03:44" },
            { id: "m3uYmZ6K9zM", title: "絶対アイドル辞めないで", artist: "=LOVE", tag: "おすすめMV", duration: "04:10" },
            { id: "3Z1w5w7v22c", title: "HEARTRIS", artist: "NiziU", tag: "神回", duration: "03:22" }
        ]
    },
    allstar: {
        name: "ALL STAR MV コレクション",
        category: "【グランドヒット】",
        ticker: "♪ アイドル＆J-POPオールスターMV特番！ 世界中で大ヒットの『アイドル』をはじめ人気曲をメドレーでお送りします！",
        videos: [
            { id: "ZRtdQ81jPUQ", title: "アイドル (Idol)", artist: "YOASOBI", tag: "世界ヒット", duration: "03:32" },
            { id: "r4SdiT7mm7Y", title: "インフルエンサー", artist: "乃木坂46", tag: "おすすめMV", duration: "04:45" },
            { id: "NQX2v6F6S5w", title: "わたしの一番かわいいところ", artist: "FRUITS ZIPPER", tag: "神回", duration: "03:45" },
            { id: "z3x6Z46w-gI", title: "最上級にかわいいの！", artist: "超ときめき♡宣伝部", tag: "TikTokバズ", duration: "03:15" },
            { id: "fIqKWLyiAc0", title: "シンクロニシティ", artist: "乃木坂46", tag: "神回", duration: "04:14" }
        ]
    }
};

// --- State Variables ---
let currentChannelKey = "sakamichi";
let currentVideoIndex = 0;
let player = null;
let isPlayerReady = false;
let isDanmakuEnabled = true;
let isOverlaysEnabled = true;
let isCruiseMode = true;
let progressUpdateTimer = null;
let onlineViewers = 1248;

// --- Nico Cruise Poll State ---
let isPollActive = false;
let pollCountdownSeconds = 20;
let pollTimerInterval = null;
let pollNextVotes = 65;
let pollStayVotes = 35;
let userHasVoted = false;

// --- Fan Comment Pool for Live Atmosphere ---
const FAN_COMMENTS = [
    { name: "クルーズ乗組員 #04", text: "推しが尊すぎて直視できない😭✨", badge: "乗組員" },
    { name: "サクラ坂ファン", text: "この表現力とダンスのキレ最高すぎる！", badge: "VIP乗組員" },
    { name: "おひさまパパ", text: "次のアイドルへ出航投票した！ｗｗｗ", badge: "投票済み" },
    { name: "アイドルヲタA", text: "神曲きたああああ＼(^o^)/", badge: "常連" },
    { name: "乃木坂DD", text: "イントロから鳥肌立つレベルで好き", badge: "ガチ勢" },
    { name: "トキメキLOVE", text: "次どこに寄港するのか楽しみ！⚓️", badge: "乗組員" },
    { name: "ライブ最高", text: "クルーズ機能懐かしすぎてテンション上がるｗ", badge: "ニコ生世代" },
    { name: "フルッパー", text: "みんな可愛すぎて語彙力消えた", badge: "推し活中" }
];

// --- Global Master Clock Sync Algorithm ---
function getGlobalSyncPosition() {
    const channel = CHANNELS[currentChannelKey];
    let totalDuration = 0;
    
    const videoSecs = channel.videos.map(v => {
        const parts = (v.duration || "03:30").split(':').map(Number);
        const sec = parts[0] * 60 + (parts[1] || 0);
        totalDuration += sec;
        return sec;
    });

    if (totalDuration === 0) return { index: 0, seek: 0 };

    const MASTER_EPOCH_SEC = 1767225600;
    const currentUnixSec = Math.floor(Date.now() / 1000);
    const elapsed = Math.max(0, currentUnixSec - MASTER_EPOCH_SEC);
    const cycleOffset = elapsed % totalDuration;

    let accum = 0;
    for (let i = 0; i < channel.videos.length; i++) {
        const dur = videoSecs[i];
        if (cycleOffset < accum + dur) {
            const seekTime = cycleOffset - accum;
            return { index: i, seek: seekTime };
        }
        accum += dur;
    }

    return { index: 0, seek: 0 };
}

// --- YouTube IFrame API Lifecycle ---
window.onYouTubeIframeAPIReady = function() {
    console.log("YouTube IFrame API Ready triggered");
    initPlayer();
};

function checkAndInitPlayer() {
    if (window.YT && window.YT.Player && !player) {
        console.log("YT Player API already available, initializing immediately");
        initPlayer();
    }
}

function initPlayer() {
    if (player) return;
    
    const syncPos = getGlobalSyncPosition();
    currentVideoIndex = syncPos.index;
    const initialVideo = CHANNELS[currentChannelKey].videos[currentVideoIndex];

    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: initialVideo.id,
        playerVars: {
            'autoplay': 1,
            'controls': 1,
            'rel': 0,
            'modestbranding': 1,
            'enablejsapi': 1,
            'playsinline': 1,
            'start': Math.floor(syncPos.seek),
            'fs': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    isPlayerReady = true;
    console.log("Player is Ready");
    
    const syncPos = getGlobalSyncPosition();
    if (syncPos.seek > 0 && typeof player.seekTo === 'function') {
        player.seekTo(syncPos.seek, true);
    }
    
    updateUIWithCurrentVideo();
    startProgressTimer();

    const overlay = document.getElementById('startOverlay');
    if (overlay && overlay.classList.contains('hidden')) {
        player.unMute();
        player.playVideo();
    }
}

// Key Event: Continuous Auto-Playback Hook
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        console.log("Video ended. Cruise sailing to next track!");
        closeCruisePoll();
        playNextVideo();
    } else if (event.data === YT.PlayerState.PLAYING) {
        updatePlayPauseButtonIcon(true);
        updateUIWithCurrentVideo();
    } else if (event.data === YT.PlayerState.PAUSED) {
        updatePlayPauseButtonIcon(false);
    }
}

function onPlayerError(event) {
    console.warn("YouTube Player Error code:", event.data, "Video cannot be embedded in 3rd party site. Auto-skipping to next video...");
    closeCruisePoll();
    setTimeout(() => {
        playNextVideo();
    }, 400);
}

// --- Nico Cruise Voting Poll Engine ---
function triggerCruisePoll() {
    if (isPollActive || !isCruiseMode) return;
    isPollActive = true;
    userHasVoted = false;
    pollCountdownSeconds = 20;

    // Initial randomized vote percentages
    pollNextVotes = Math.floor(Math.random() * 25) + 55; // 55% - 80%
    pollStayVotes = 100 - pollNextVotes;

    updatePollUI();
    const pollCard = document.getElementById('cruisePollCard');
    if (pollCard) pollCard.classList.remove('hidden');

    // Announce Cruise Poll
    const nextVideo = CHANNELS[currentChannelKey].videos[(currentVideoIndex + 1) % CHANNELS[currentChannelKey].videos.length];
    appendChatMessage("⚓️ クルーズBOT", `【アンケート発動中】次の寄港地『${nextVideo.artist} - ${nextVideo.title}』へ出航しますか？`, "CRUISE BOT", false);

    if (pollTimerInterval) clearInterval(pollTimerInterval);
    pollTimerInterval = setInterval(() => {
        pollCountdownSeconds--;
        const countEl = document.getElementById('pollCountdown');
        if (countEl) countEl.textContent = pollCountdownSeconds;

        // Fluctuate votes slightly
        if (Math.random() < 0.6) {
            pollNextVotes += (Math.random() > 0.4 ? 1 : -1);
            pollNextVotes = Math.min(90, Math.max(30, pollNextVotes));
            pollStayVotes = 100 - pollNextVotes;
            updatePollUI();
        }

        if (pollCountdownSeconds <= 0) {
            clearInterval(pollTimerInterval);
            finishCruisePoll();
        }
    }, 1000);
}

function updatePollUI() {
    const nextPctEl = document.getElementById('voteNextPct');
    const stayPctEl = document.getElementById('voteStayPct');
    const nextBarEl = document.getElementById('voteNextBar');
    const stayBarEl = document.getElementById('voteStayBar');

    if (nextPctEl) nextPctEl.textContent = `${pollNextVotes}%`;
    if (stayPctEl) stayPctEl.textContent = `${pollStayVotes}%`;
    if (nextBarEl) nextBarEl.style.width = `${pollNextVotes}%`;
    if (stayBarEl) stayBarEl.style.width = `${pollStayVotes}%`;
}

function voteCruise(option) {
    if (userHasVoted) return;
    userHasVoted = true;

    if (option === 'next') {
        pollNextVotes += 3;
        pollStayVotes = Math.max(0, 100 - pollNextVotes);
        document.getElementById('voteNextBtn').classList.add('voted');
        appendChatMessage("あなた (乗組員)", "投票完了: 次の動画へ出航！ ⛵️", "乗組員", true);
    } else {
        pollStayVotes += 3;
        pollNextVotes = Math.max(0, 100 - pollStayVotes);
        document.getElementById('voteStayBtn').classList.add('voted');
        appendChatMessage("あなた (乗組員)", "投票完了: この曲を最後まで見る 🎵", "乗組員", true);
    }
    updatePollUI();
}

function finishCruisePoll() {
    closeCruisePoll();
    if (pollNextVotes >= 50) {
        appendChatMessage("⚓️ クルーズBOT", `得票率 ${pollNextVotes}% で「次の動画へ出航」が決定しました！面舵一杯！⛵️`, "CRUISE BOT", false);
        playNextVideo();
    } else {
        appendChatMessage("⚓️ クルーズBOT", `得票率 ${pollStayVotes}% で「完奏」が決定しました！そのままお楽しみください🎵`, "CRUISE BOT", false);
    }
}

function closeCruisePoll() {
    isPollActive = false;
    if (pollTimerInterval) clearInterval(pollTimerInterval);
    const pollCard = document.getElementById('cruisePollCard');
    if (pollCard) pollCard.classList.add('hidden');
    document.getElementById('voteNextBtn').classList.remove('voted');
    document.getElementById('voteStayBtn').classList.remove('voted');
}

// Sync to global clock manually
function syncToGlobalClock() {
    if (!isPlayerReady || !player) return;
    closeCruisePoll();
    const syncPos = getGlobalSyncPosition();
    if (syncPos.index !== currentVideoIndex) {
        currentVideoIndex = syncPos.index;
        const video = CHANNELS[currentChannelKey].videos[currentVideoIndex];
        player.loadVideoById(video.id, Math.floor(syncPos.seek));
    } else {
        player.seekTo(syncPos.seek, true);
    }
    updateUIWithCurrentVideo();
}

// --- Navigation & Playback Logic ---
function playVideoAtIndex(index) {
    closeCruisePoll();
    const channel = CHANNELS[currentChannelKey];
    if (index < 0) index = channel.videos.length - 1;
    if (index >= channel.videos.length) index = 0;
    
    currentVideoIndex = index;
    const video = channel.videos[currentVideoIndex];

    if (isPlayerReady && player) {
        player.loadVideoById(video.id);
    }
    updateUIWithCurrentVideo();
    renderPlaylistQueue();
}

function playNextVideo() {
    playVideoAtIndex(currentVideoIndex + 1);
}

function playPrevVideo() {
    playVideoAtIndex(currentVideoIndex - 1);
}

function switchChannel(channelKey) {
    if (!CHANNELS[channelKey]) return;
    currentChannelKey = channelKey;
    closeCruisePoll();
    
    const syncPos = getGlobalSyncPosition();
    currentVideoIndex = syncPos.index;

    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.channel === channelKey);
    });

    document.getElementById('tickerText').textContent = CHANNELS[channelKey].ticker;

    if (isPlayerReady && player) {
        const video = CHANNELS[currentChannelKey].videos[currentVideoIndex];
        player.loadVideoById(video.id, Math.floor(syncPos.seek));
    }
    updateUIWithCurrentVideo();
}

// --- UI Updates ---
function updateUIWithCurrentVideo() {
    const channel = CHANNELS[currentChannelKey];
    const video = channel.videos[currentVideoIndex];
    const nextVideo = channel.videos[(currentVideoIndex + 1) % channel.videos.length];

    document.getElementById('overlayCategory').textContent = channel.category;
    document.getElementById('overlayProgramName').textContent = channel.name;

    document.getElementById('npTitle').textContent = video.title;
    document.getElementById('npArtist').textContent = video.artist;
    document.getElementById('npTag').textContent = video.tag || "おすすめMV";
    document.getElementById('npDuration').textContent = video.duration || "--:--";

    document.getElementById('nextTitle').textContent = `${nextVideo.artist}「${nextVideo.title}」`;

    renderPlaylistQueue();
}

function renderPlaylistQueue() {
    const queueContainer = document.getElementById('playlistQueue');
    if (!queueContainer) return;

    const channel = CHANNELS[currentChannelKey];
    queueContainer.innerHTML = channel.videos.map((vid, idx) => {
        const isActive = idx === currentVideoIndex;
        const thumbUrl = `https://img.youtube.com/vi/${vid.id}/mqdefault.jpg`;
        return `
            <div class="queue-item ${isActive ? 'active' : ''}" onclick="playVideoAtIndex(${idx})">
                <img src="${thumbUrl}" class="queue-thumb" alt="${vid.title}">
                <div class="queue-info">
                    <div class="queue-title">${vid.title}</div>
                    <div class="queue-artist">${vid.artist}</div>
                </div>
                <div class="queue-status-badge">
                    ${isActive ? '寄港中' : '#' + (idx + 1)}
                </div>
            </div>
        `;
    }).join('');
}

function updatePlayPauseButtonIcon(isPlaying) {
    const btn = document.getElementById('playPauseBtn');
    if (!btn) return;
    btn.innerHTML = isPlaying ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
    if (window.lucide) lucide.createIcons();
}

// --- Progress & Time Tracking ---
function startProgressTimer() {
    if (progressUpdateTimer) clearInterval(progressUpdateTimer);
    
    progressUpdateTimer = setInterval(() => {
        if (!isPlayerReady || !player || typeof player.getCurrentTime !== 'function') return;

        const currentTime = player.getCurrentTime() || 0;
        const duration = player.getDuration() || 0;

        document.getElementById('currentTimeDisplay').textContent = formatSeconds(currentTime);
        document.getElementById('totalTimeDisplay').textContent = formatSeconds(duration);

        if (duration > 0) {
            const pct = (currentTime / duration) * 100;
            document.getElementById('progressBarFill').style.width = pct + '%';

            // Trigger Cruise Voting Poll during final 35 seconds of video
            const remaining = duration - currentTime;
            if (remaining <= 35 && remaining > 5 && !isPollActive && isCruiseMode) {
                triggerCruisePoll();
            }
        }
    }, 500);
}

function formatSeconds(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- Realtime Simulated Chat & Screen Danmaku ---
function appendChatMessage(user, text, badge = "乗組員", isMe = false) {
    const chatBox = document.getElementById('chatMessages');
    if (!chatBox) return;

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${isMe ? 'is-me' : ''}`;
    const initial = user.charAt(0);

    msgEl.innerHTML = `
        <div class="chat-avatar">${initial}</div>
        <div class="chat-bubble">
            <div class="chat-user">
                <span>${user}</span>
                <span class="user-badge">${badge}</span>
            </div>
            <div class="chat-text">${escapeHTML(text)}</div>
        </div>
    `;

    chatBox.appendChild(msgEl);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (isDanmakuEnabled) {
        spawnDanmakuText(text, isMe);
    }
}

function spawnDanmakuText(text, isMe = false) {
    const overlay = document.getElementById('screenCommentsOverlay');
    if (!overlay) return;

    const el = document.createElement('div');
    el.className = `danmaku-item ${isMe ? 'my-comment' : ''}`;
    el.textContent = text;
    
    const topPos = Math.floor(Math.random() * 65) + 10;
    el.style.top = `${topPos}%`;

    overlay.appendChild(el);

    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 9500);
}

function startSimulatedFanChat() {
    setInterval(() => {
        if (Math.random() < 0.45) {
            const randomFan = FAN_COMMENTS[Math.floor(Math.random() * FAN_COMMENTS.length)];
            appendChatMessage(randomFan.name, randomFan.text, randomFan.badge, false);
            
            onlineViewers += Math.floor(Math.random() * 7) - 3;
            const onlineEl = document.getElementById('onlineCount');
            if (onlineEl) onlineEl.innerHTML = `<i data-lucide="users"></i> ${onlineViewers.toLocaleString()}人`;
            if (window.lucide) lucide.createIcons();
        }
    }, 4000);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// --- Event Listeners Setup ---
document.addEventListener('DOMContentLoaded', () => {
    
    checkAndInitPlayer();

    setInterval(() => {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const clockEl = document.getElementById('tvCurrentTime');
        if (clockEl) clockEl.textContent = timeStr;
    }, 1000);

    // Start Overlay Autoplay Trigger Button
    document.getElementById('startBroadcastBtn').addEventListener('click', () => {
        document.getElementById('startOverlay').classList.add('hidden');
        if (!player) {
            checkAndInitPlayer();
        }
        if (isPlayerReady && player) {
            player.unMute();
            player.playVideo();
        }
    });

    // Toggle Cruise Mode Button
    const toggleCruiseBtn = document.getElementById('toggleCruiseBtn');
    toggleCruiseBtn.addEventListener('click', () => {
        isCruiseMode = !isCruiseMode;
        toggleCruiseBtn.classList.toggle('active', isCruiseMode);
        document.getElementById('cruiseModeBadge').style.display = isCruiseMode ? 'flex' : 'none';
        toggleCruiseBtn.innerHTML = `<i data-lucide="ship"></i> クルーズモード: ${isCruiseMode ? 'ON' : 'OFF'}`;
        if (window.lucide) lucide.createIcons();
        if (!isCruiseMode) closeCruisePoll();
    });

    // Force Sail Next Button
    document.getElementById('forceSailBtn').addEventListener('click', () => {
        appendChatMessage("あなた (乗組員)", "面舵一杯！次の寄港地へ即時出航！ ⛵️", "乗組員", true);
        playNextVideo();
    });

    // Cruise Poll Buttons
    document.getElementById('voteNextBtn').addEventListener('click', () => voteCruise('next'));
    document.getElementById('voteStayBtn').addEventListener('click', () => voteCruise('stay'));

    // Channel Switchers
    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = e.currentTarget.dataset.channel;
            switchChannel(key);
        });
    });

    // Playback Controls
    document.getElementById('playPauseBtn').addEventListener('click', () => {
        if (!isPlayerReady || !player) return;
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', playNextVideo);
    document.getElementById('prevBtn').addEventListener('click', playPrevVideo);

    // Volume Slider
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

    // Seek Click on Progress Bar
    document.getElementById('progressBarContainer').addEventListener('click', (e) => {
        if (!isPlayerReady || !player) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = clickX / rect.width;
        const duration = player.getDuration() || 0;
        player.seekTo(duration * pct, true);
    });

    // Toggle Screen Danmaku Comments
    const toggleDanmakuBtn = document.getElementById('toggleDanmakuBtn');
    toggleDanmakuBtn.addEventListener('click', () => {
        isDanmakuEnabled = !isDanmakuEnabled;
        toggleDanmakuBtn.classList.toggle('active', isDanmakuEnabled);
        toggleDanmakuBtn.innerHTML = `<i data-lucide="message-square"></i> 画面テロップ: ${isDanmakuEnabled ? 'ON' : 'OFF'}`;
        if (window.lucide) lucide.createIcons();
    });

    // Toggle TV Overlays Visibility
    const toggleOverlaysBtn = document.getElementById('toggleOverlaysBtn');
    toggleOverlaysBtn.addEventListener('click', () => {
        isOverlaysEnabled = !isOverlaysEnabled;
        toggleOverlaysBtn.classList.toggle('active', isOverlaysEnabled);
        document.getElementById('tvOverlayLayer').classList.toggle('hidden-overlays', !isOverlaysEnabled);
        toggleOverlaysBtn.innerHTML = `<i data-lucide="tv-2"></i> TVオーバーレイ: ${isOverlaysEnabled ? 'ON' : 'OFF'}`;
        if (window.lucide) lucide.createIcons();
    });

    // Sidebar Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.currentTarget.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            e.currentTarget.classList.add('active');
            if (targetTab === 'chat') {
                document.getElementById('tabChat').classList.add('active');
            } else if (targetTab === 'timetable') {
                document.getElementById('tabTimetable').classList.add('active');
            }
        });
    });

    // User Chat Submit Form
    document.getElementById('chatForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (text) {
            appendChatMessage("あなた (乗組員)", text, "乗組員", true);
            input.value = '';
        }
    });

    // Add Video Modal Handlers
    const modal = document.getElementById('addVideoModal');
    document.getElementById('addVideoBtn').addEventListener('click', () => {
        modal.classList.add('show');
    });
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        modal.classList.remove('show');
    });
    document.getElementById('cancelAddBtn').addEventListener('click', () => {
        modal.classList.remove('show');
    });

    // Form Submit to Add Custom Video
    document.getElementById('addVideoForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const urlOrId = document.getElementById('videoUrlInput').value.trim();
        const title = document.getElementById('videoTitleInput').value.trim();
        const artist = document.getElementById('videoArtistInput').value.trim();
        const tag = document.getElementById('videoTagInput').value;

        let videoId = urlOrId;
        if (urlOrId.includes('v=')) {
            videoId = urlOrId.split('v=')[1].split('&')[0];
        } else if (urlOrId.includes('youtu.be/')) {
            videoId = urlOrId.split('youtu.be/')[1].split('?')[0];
        }

        if (videoId) {
            const newVideo = {
                id: videoId,
                title: title || "ユーザー追加動画",
                artist: artist || "Unknown Artist",
                tag: tag || "ユーザー追加",
                duration: "03:30"
            };
            CHANNELS[currentChannelKey].videos.push(newVideo);
            renderPlaylistQueue();
            modal.classList.remove('show');
            document.getElementById('addVideoForm').reset();
            alert(`「${newVideo.title}」をクルーズ巡回ルートに追加しました！`);
        }
    });

    appendChatMessage("みーちゃん推し", "アイドルクルーズ出航キター！！乗船します！⚓️", "乗組員", false);
    appendChatMessage("サクラ坂ファン", "終盤のアンケートで次の動画決めるシステム面白すぎｗ", "VIP乗組員", false);

    if (window.lucide) lucide.createIcons();
    startSimulatedFanChat();
});
