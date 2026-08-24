/* ==========================================================================
   Phase 1 MVP - Realtime Sync & Voting Server (Node.js + Express + Socket.io)
   ========================================================================== */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from workspace root
app.use(express.static(path.join(__dirname)));

// --- Pre-defined Master Video List (Admin Candidates Data) ---
const MASTER_VIDEOS = [
    {
        id: "znX2lhAiuxM",
        title: "アイドルライフスターターパック",
        artist: "iLiFE!",
        tag: "代表曲・コール",
        durationSec: 220,
        thumbnail: "https://img.youtube.com/vi/znX2lhAiuxM/mqdefault.jpg"
    },
    {
        id: "tOikkAn18l0",
        title: "メロメラ",
        artist: "iLiFE!",
        tag: "公式MV",
        durationSec: 212,
        thumbnail: "https://img.youtube.com/vi/tOikkAn18l0/mqdefault.jpg"
    },
    {
        id: "R9Z8X8_K3i4",
        title: "初恋リバイバル",
        artist: "iLiFE!",
        tag: "神曲MV",
        durationSec: 230,
        thumbnail: "https://img.youtube.com/vi/R9Z8X8_K3i4/mqdefault.jpg"
    },
    {
        id: "xlg9Wc-FJjY",
        title: "ガンバッテンダー",
        artist: "iLiFE!",
        tag: "公式MV",
        durationSec: 225,
        thumbnail: "https://img.youtube.com/vi/xlg9Wc-FJjY/mqdefault.jpg"
    },
    {
        id: "NQX2v6F6S5w",
        title: "わたしの一番かわいいところ",
        artist: "FRUITS ZIPPER",
        tag: "SNSバズ",
        durationSec: 225,
        thumbnail: "https://img.youtube.com/vi/NQX2v6F6S5w/mqdefault.jpg"
    },
    {
        id: "z3x6Z46w-gI",
        title: "最上級にかわいいの！",
        artist: "超ときめき♡宣伝部",
        tag: "TikTokバズ",
        durationSec: 195,
        thumbnail: "https://img.youtube.com/vi/z3x6Z46w-gI/mqdefault.jpg"
    }
];

// --- Server Global Room State ---
let currentVideoIndex = 0;
let currentVideo = MASTER_VIDEOS[currentVideoIndex];
let videoStartTime = Date.now();

let pollState = {
    active: false,
    candidates: [],
    votes: {},      // { 0: count, 1: count, 2: count }
    userVotes: {}   // { socketId: candidateIndex }
};

// --- Helper Functions ---
function getRandomCandidates(count = 3) {
    // Exclude currently playing video
    const available = MASTER_VIDEOS.filter(v => v.id !== currentVideo.id);
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function computePollResults() {
    if (!pollState.active || !pollState.candidates.length) return null;
    
    let totalVotes = 0;
    const voteCounts = {};
    const percentages = {};

    pollState.candidates.forEach((cand, idx) => {
        const count = pollState.votes[idx] || 0;
        voteCounts[idx] = count;
        totalVotes += count;
    });

    pollState.candidates.forEach((cand, idx) => {
        const count = voteCounts[idx];
        percentages[idx] = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    });

    return {
        candidates: pollState.candidates,
        voteCounts,
        percentages,
        totalVotes
    };
}

function determineWinnerCandidate() {
    if (!pollState.active || !pollState.candidates.length) {
        // Fallback: next video in index order
        const nextIndex = (currentVideoIndex + 1) % MASTER_VIDEOS.length;
        return MASTER_VIDEOS[nextIndex];
    }

    const voteCounts = pollState.votes;
    let maxVotes = -1;
    let winners = [];

    pollState.candidates.forEach((cand, idx) => {
        const count = voteCounts[idx] || 0;
        if (count > maxVotes) {
            maxVotes = count;
            winners = [cand];
        } else if (count === maxVotes) {
            winners.push(cand);
        }
    });

    // Pick winner (random tie-breaker if equal votes)
    const winner = winners[Math.floor(Math.random() * winners.length)];
    return winner || pollState.candidates[0];
}

function startPoll() {
    const candidates = getRandomCandidates(3);
    const initialVotes = {};
    candidates.forEach((_, idx) => { initialVotes[idx] = 0; });

    pollState = {
        active: true,
        candidates: candidates,
        votes: initialVotes,
        userVotes: {}
    };

    console.log(`[POLL STARTED] Candidates: ${candidates.map(c => c.title).join(' / ')}`);
    io.emit('poll_started', computePollResults());
}

function changeToNextVideo(nextVideo) {
    currentVideo = nextVideo;
    currentVideoIndex = MASTER_VIDEOS.findIndex(v => v.id === currentVideo.id);
    if (currentVideoIndex === -1) currentVideoIndex = 0;

    videoStartTime = Date.now();
    pollState = {
        active: false,
        candidates: [],
        votes: {},
        userVotes: {}
    };

    console.log(`[VIDEO CHANGED] Now Playing: ${currentVideo.artist} - ${currentVideo.title}`);
    io.emit('video_changed', {
        currentVideo: currentVideo,
        elapsedSeconds: 0,
        remainingSeconds: currentVideo.durationSec
    });
}

// --- Main 1-Second Sync Tick Loop ---
setInterval(() => {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - videoStartTime) / 1000);
    const remainingSeconds = Math.max(0, currentVideo.durationSec - elapsedSeconds);

    // 1. Trigger Poll when remaining <= 30 seconds
    if (remainingSeconds <= 30 && remainingSeconds > 0 && !pollState.active) {
        startPoll();
    }

    // 2. Trigger Video Change when remaining <= 0
    if (remainingSeconds <= 0) {
        const winner = determineWinnerCandidate();
        changeToNextVideo(winner);
        return;
    }

    // Broadcast tick state to all connected clients
    io.emit('sync_tick', {
        currentVideo: currentVideo,
        elapsedSeconds: elapsedSeconds,
        remainingSeconds: remainingSeconds,
        onlineCount: io.sockets.sockets.size,
        pollResults: computePollResults()
    });

}, 1000);

// --- Socket.io Realtime Events ---
io.on('connection', (socket) => {
    console.log(`[CLIENT CONNECTED] Socket ID: ${socket.id}`);

    const elapsedSeconds = Math.floor((Date.now() - videoStartTime) / 1000);
    const remainingSeconds = Math.max(0, currentVideo.durationSec - elapsedSeconds);

    // Send initial sync payload to newly connected tab
    socket.emit('initial_sync', {
        currentVideo: currentVideo,
        elapsedSeconds: elapsedSeconds,
        remainingSeconds: remainingSeconds,
        onlineCount: io.sockets.sockets.size,
        pollResults: computePollResults(),
        userVotedIndex: pollState.userVotes[socket.id] !== undefined ? pollState.userVotes[socket.id] : null
    });

    // Broadcast updated online user count
    io.emit('online_count_updated', { onlineCount: io.sockets.sockets.size });

    // Handle Vote Action from Client
    socket.on('vote', (candidateIndex) => {
        if (!pollState.active) return;
        if (candidateIndex < 0 || candidateIndex >= pollState.candidates.length) return;

        const previousVote = pollState.userVotes[socket.id];

        // If user already voted for another option, decrement old option count
        if (previousVote !== undefined) {
            pollState.votes[previousVote] = Math.max(0, (pollState.votes[previousVote] || 1) - 1);
        }

        // Record new vote
        pollState.userVotes[socket.id] = candidateIndex;
        pollState.votes[candidateIndex] = (pollState.votes[candidateIndex] || 0) + 1;

        console.log(`[VOTE RECEIVED] Socket ${socket.id} voted for Option #${candidateIndex} (${pollState.candidates[candidateIndex].title})`);

        // Acknowledge vote to voter socket
        socket.emit('vote_acknowledged', { votedIndex: candidateIndex });

        // Broadcast updated poll results in realtime to ALL connected clients!
        io.emit('poll_updated', computePollResults());
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        console.log(`[CLIENT DISCONNECTED] Socket ID: ${socket.id}`);
        delete pollState.userVotes[socket.id];
        io.emit('online_count_updated', { onlineCount: io.sockets.sockets.size });
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`=====================================================`);
    console.log(`🚀 Phase 1 MVP Realtime Sync Server running on:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`=====================================================`);
});
