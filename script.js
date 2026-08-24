/* ==========================================================================
   IDOL TV LIVE - Continuous YouTube Broadcast Engine & Interactive Logic
   ========================================================================== */

// --- Pre-Curated Channel Playlists (Real YouTube Video IDs) ---
const CHANNELS = {
    sakamichi: {
        name: "坂道・46グループ Special",
        category: "【46グループ特番】",
        ticker: "♪ ただいま「坂道・46グループ Special」を絶賛放送中！ 乃木坂46・櫻坂46・日向坂46の最新ヒットMVを24時間オンエア！",
        videos: [
            { id: "_bHwB6q6xBc", title: "Monopoly", artist: "乃木坂46", tag: "神回", duration: "03:58" },
            { id: "yJ-_S-_P_s8", title: "Start over!", artist: "櫻坂46", tag: "ダンス", duration: "04:12" },
            { id: "1J18eB99s6g", title: "Am I ready?", artist: "日向坂46", tag: "おすすめMV", duration: "04:15" },
            { id: "b4_S5V2Z2tM", title: "おひとりさま天国", artist: "乃木坂46", tag: "神回", duration: "04:20" },
            { id: "x_b_8Z2t0kM", title: "承認欲求", artist: "櫻坂46", tag: "ダンス", duration: "03:45" },
            { id: "m2046s85N-E", title: "君は0から1になれ", artist: "日向坂46", tag: "ライブ映像", duration: "04:30" },
            { id: "r4SdiT7mm7Y", title: "インフルエンサー", artist: "乃木坂46", tag: "伝説のMV", duration: "04:45" },
            { id: "w2X58x5uXbU", title: "自業自得", artist: "櫻坂46", tag: "おすすめMV", duration: "03:52" }
        ]
    },
    newwave: {
        name: "令和ブレイクアイドル大集合",
        category: "【注目アイドル】",
        ticker: "♪ 令和SNSバズアイドル特集！ FRUITS ZIPPER / 超ときめき♡宣伝部 / ME:I などのバズソング連続再生中！",
        videos: [
            { id: "NQX2v6F6S5w", title: "わたしの一番かわいいところ", artist: "FRUITS ZIPPER", tag: "SNSバズ", duration: "03:45" },
            { id: "z3x6Z46w-gI", title: "最上級にかわいいの！", artist: "超ときめき♡宣伝部", tag: "神回", duration: "03:15" },
            { id: "Z1_b-8w0N3k", title: "Click", artist: "ME:I", tag: "ダンス", duration: "03:30" },
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
            { id: "_bHwB6q6xBc", title: "Monopoly", artist: "乃木坂46", tag: "おすすめMV", duration: "03:58" },
            { id: "NQX2v6F6S5w", title: "わたしの一番かわいいところ", artist: "FRUITS ZIPPER", tag: "神回", duration: "03:45" },
            { id: "yJ-_S-_P_s8", title: "Start over!", artist: "櫻坂46", tag: "ダンス", duration: "04:12" }
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
let progressUpdateTimer = null;
let onlineViewers = 1248;

// --- Fan Comment Pool for Live Atmosphere ---
const FAN_COMMENTS = [
    { name: "みーちゃん推し", text: "推しが尊すぎて直視できない😭✨", badge: "ファン暦3年" },
    { name: "サクラ坂ファン", text: "この表現力とダンスのキレ最高すぎる！", badge: "VIP" },
    { name: "おひさまパパ", text: "コール入れたくなるｗｗｗ", badge: "LIVE参戦組" },
    { name: "アイドルヲタA", text: "神曲きたああああ＼(^o^)／", badge: "常連" },
    { name: "乃木坂DD", text: "イントロから鳥肌立つレベルで好き", badge: "ガチ勢" },
    { name: "トキメキLOVE", text: "衣装めっちゃかわいくない！？❤️", badge: "ファン" },
    { name: "ライブ最高", text: "24時間流しっぱなしにできるの神サイトだわ", badge: "プレミアム" },
    { name: "フルッパー", text: "みんな可愛すぎて語彙力消えた", badge: "推し活中" }
];

// --- YouTube IFrame API Lifecycle ---
function onYouTubeIframeAPIReady() {
    console.log("YouTube IFrame API Ready");
    initPlayer();
}

function initPlayer() {
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
            'origin': window.location.origin,
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
    updateUIWithCurrentVideo();
    startProgressTimer();
}

// Key Event: Continuous Auto-Playback Hook
function onPlayerStateChange(event) {
    // YT.PlayerState.ENDED === 0
    if (event.data === YT.PlayerState.ENDED) {
        console.log("Video ended. Play next track automatically!");
        playNextVideo();
    } else if (event.data === YT.PlayerState.PLAYING) {
        updatePlayPauseButtonIcon(true);
        updateUIWithCurrentVideo();
    } else if (event.data === YT.PlayerState.PAUSED) {
        updatePlayPauseButtonIcon(false);
    }
}

function onPlayerError(event) {
    console.warn("YouTube Player Error code:", event.data, "Skipping to next video...");
    // Auto skip on broken / unembeddable video
    setTimeout(playNextVideo, 1500);
}

// --- Navigation & Playback Logic ---
function playVideoAtIndex(index) {
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
    currentVideoIndex = 0;

    // Update Channel Tabs Active Class
    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.channel === channelKey);
    });

    // Update Ticker Text
    document.getElementById('tickerText').textContent = CHANNELS[channelKey].ticker;

    playVideoAtIndex(0);
}

// --- UI Updates ---
function updateUIWithCurrentVideo() {
    const channel = CHANNELS[currentChannelKey];
    const video = channel.videos[currentVideoIndex];
    const nextVideo = channel.videos[(currentVideoIndex + 1) % channel.videos.length];

    // Category Tag & Program Name
    document.getElementById('overlayCategory').textContent = channel.category;
    document.getElementById('overlayProgramName').textContent = channel.name;

    // Now Playing Banner
    document.getElementById('npTitle').textContent = video.title;
    document.getElementById('npArtist').textContent = video.artist;
    document.getElementById('npTag').textContent = video.tag || "おすすめMV";
    document.getElementById('npDuration').textContent = video.duration || "--:--";

    // Next Up Preview
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
                    ${isActive ? '再生中' : '#' + (idx + 1)}
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
        }
    }, 500);
}

function formatSeconds(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- Realtime Simulated Chat & Screen Danmaku ---
function appendChatMessage(user, text, badge = "ファン", isMe = false) {
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

    // Trigger Danmaku (Screen Telop Comment) if enabled
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
    
    // Random vertical position (10% to 75% of screen height)
    const topPos = Math.floor(Math.random() * 65) + 10;
    el.style.top = `${topPos}%`;

    overlay.appendChild(el);

    // Remove element after animation finishes (9s)
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 9500);
}

function startSimulatedFanChat() {
    setInterval(() => {
        // 40% chance every 4 seconds to spawn a fan comment
        if (Math.random() < 0.45) {
            const randomFan = FAN_COMMENTS[Math.floor(Math.random() * FAN_COMMENTS.length)];
            appendChatMessage(randomFan.name, randomFan.text, randomFan.badge, false);
            
            // Fluctuate viewer count slightly for realism
            onlineViewers += Math.floor(Math.random() * 7) - 3;
            document.getElementById('onlineCount').innerHTML = `<i data-lucide="users"></i> ${onlineViewers.toLocaleString()}人`;
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
    
    // Live Digital Clock Tick
    setInterval(() => {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const clockEl = document.getElementById('tvCurrentTime');
        if (clockEl) clockEl.textContent = timeStr;
    }, 1000);

    // Start Overlay Autoplay Trigger Button
    document.getElementById('startBroadcastBtn').addEventListener('click', () => {
        document.getElementById('startOverlay').classList.add('hidden');
        if (isPlayerReady && player) {
            player.unMute();
            player.playVideo();
        }
    });

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
            appendChatMessage("あなた (You)", text, "ファン", true);
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

        // Simple YouTube ID Extractor
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
            alert(`「${newVideo.title}」を放送プレイリストに追加しました！`);
        }
    });

    // Initialize Initial Chat Messages
    appendChatMessage("みーちゃん推し", "今日もお疲れ様〜！画面流しっぱなしにして作業する！", "ファン", false);
    appendChatMessage("サクラ坂ファン", "画質と音質良くて最高！次の曲楽しみ", "VIP", false);

    // Initialize Icons & Simulated Chat
    if (window.lucide) lucide.createIcons();
    startSimulatedFanChat();
});
