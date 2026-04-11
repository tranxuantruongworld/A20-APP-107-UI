/**
 * WebSpeech AI - Frontend Application
 * Xử lý tất cả logic UI, Speech Recognition, và API calls
 */

// ======================== Global Variables ========================
let recognition;
let silenceTimer;
let pendingQuestion = null;
let currentUserId = null;
let isInRoom = false;

// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusBadge = document.getElementById('statusBadge');
const transcriptDiv = document.getElementById('transcript');
const roomInput = document.getElementById('roomId');
const nameInput = document.getElementById('speakerName');
const appCard = document.getElementById('appCard');
const lobbyView = document.getElementById('lobbyView');
const recordingView = document.getElementById('recordingView');
const confirmLeaveModal = document.getElementById('confirmLeaveModal');


// ======================== User ID Management ========================
/**
 * Tạo ID ngẫu nhiên dạng user_xxxxx
 */
function generateRandomUserId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'user_';
    for (let i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

/**
 * Lấy hoặc tạo User ID từ localStorage
 */
function getOrCreateUserId() {
    let userId = localStorage.getItem('unique_user_id');
    if (!userId) {
        userId = generateRandomUserId();
        localStorage.setItem('unique_user_id', userId);
    }
    return userId;
}


// ======================== Room Management ========================
/**
 * Vào phòng - lock inputs và chuyển sang recording view
 */
function joinRoom() {
    const room_id = roomInput.value.trim();
    const speaker_name = nameInput.value.trim();

    if (!room_id) {
        alert('Vui lòng nhập ID Phòng.');
        return;
    }
    if (!speaker_name) {
        alert('Vui lòng nhập Tên hiển thị.');
        return;
    }

    // Lock inputs
    roomInput.disabled = true;
    nameInput.disabled = true;
    document.getElementById('joinRoomBtn').disabled = true;

    // Switch to recording view
    isInRoom = true;
    lobbyView.classList.add('hidden');
    recordingView.classList.remove('hidden');

    // Update room info
    document.getElementById('roomInfo').innerText = `Phòng: ${room_id} • Người dùng: ${speaker_name}`;

    setStatus('Sẵn sàng', 'success');
}

/**
 * Rời phòng - hiển thị modal xác nhận
 */
function leaveRoom() {
    confirmLeaveModal.classList.add('active');
}

/**
 * Xác nhận rời phòng
 */
function handleConfirmLeave() {
    // Unlock inputs
    roomInput.disabled = false;
    nameInput.disabled = false;
    document.getElementById('joinRoomBtn').disabled = false;

    // Switch back to lobby
    isInRoom = false;
    recordingView.classList.add('hidden');
    lobbyView.classList.remove('hidden');

    // Clear transcript
    transcriptDiv.innerText = '';

    // Reset buttons
    resetButtons();

    // Close modal
    confirmLeaveModal.classList.remove('active');

    setStatus('Sẵn sàng', 'neutral');
}

/**
 * Hủy rời phòng
 */
function handleCancelLeave() {
    confirmLeaveModal.classList.remove('active');
}


// ======================== Status Management ========================
/**
 * Cập nhật status badge
 */
function setStatus(text, variant = 'neutral') {
    statusBadge.textContent = text;
    const base = 'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold';
    const variants = {
        neutral: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300',
        listening: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300',
        success: 'bg-green-100 text-green-800 ring-1 ring-green-300',
        error: 'bg-red-100 text-red-800 ring-1 ring-red-300'
    };
    statusBadge.className = `${base} ${variants[variant] || variants.neutral}`;
}

/**
 * Cập nhật listening state (animate audio wave)
 */
function setListeningState(isListening) {
    appCard.classList.toggle('listening', isListening);
    if (isListening) {
        setStatus('Đang nghe...', 'listening');
    } else {
        setStatus('Đã dừng nghe', 'neutral');
    }
}

/**
 * Animate transcript update
 */
function animateTranscriptUpdate(newText) {
    transcriptDiv.style.transition = 'opacity 0.25s ease';
    transcriptDiv.style.opacity = '0.2';
    setTimeout(() => {
        transcriptDiv.innerText = newText || '';
        transcriptDiv.style.opacity = '1';
    }, 250);
}

/**
 * Reset silence timer (auto-stop after 3s)
 */
function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
        if (recognition && !stopBtn.disabled) {
            recognition.stop();
        }
    }, 3000);
}

/**
 * Reset buttons to initial state
 */
function resetButtons() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    clearTimeout(silenceTimer);
    setListeningState(false);
}


// ======================== Speech Recognition Setup ========================
if (!('webkitSpeechRecognition' in window)) {
    alert('Vui lòng sử dụng Google Chrome để dùng tính năng nhận diện giọng nói!');
    setStatus('Trình duyệt không hỗ trợ', 'error');
} else {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        setListeningState(true);
        resetSilenceTimer();
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript = transcript;
            }
        }
        transcriptDiv.innerText = (finalTranscript + interimTranscript).trim();
        resetSilenceTimer();
    };

    recognition.onerror = (event) => {
        setStatus('Lỗi: ' + event.error, 'error');
        resetButtons();
    };

    recognition.onend = () => {
        setListeningState(false);
        setStatus('Đã dừng nghe', 'neutral');
        resetButtons();
    };
}

/**
 * Bắt đầu ghi âm
 */
function startRecognition() {
    transcriptDiv.innerText = '';
    if (recognition) {
        recognition.start();
    }
}

/**
 * Dừng ghi âm
 */
function stopRecognition() {
    if (recognition) {
        recognition.stop();
    }
}


// ======================== Data Sending ========================
/**
 * Gửi dữ liệu câu hỏi đến backend
 */
function sendData() {
    const room_id = roomInput.value.trim();
    const speaker_name = nameInput.value.trim();
    const content = transcriptDiv.innerText.trim();

    if (!content) {
        alert('Nội dung trống, không có gì để gửi!');
        return;
    }

    // Use the persistent speaker_id from localStorage
    const speaker_id = currentUserId;

    const payload = {
        room_id,
        speaker_name,
        speaker_id,
        content,
        timestamp: new Date().toISOString()
    };

    // Lưu payload để dùng trong Modal
    pendingQuestion = payload;

    setStatus('Đang gửi dữ liệu...', 'neutral');
    fetch('http://localhost:8080/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(async response => {
        const data = await response.json().catch(() => null);
        
        if (response.ok) {
            // Nếu phát hiện duplicate
            if (data?.status === 'duplicate_detected' && data?.is_duplicate) {
                showDuplicateModal(data);
                setStatus('Phát hiện trùng', 'listening');
            } else {
                // Nếu lưu thành công
                setStatus('Đã lưu thành công', 'success');
                if (data?.refined_content) {
                    animateTranscriptUpdate(data.refined_content);
                } else {
                    // Clear transcript nếu không có refined_content
                    animateTranscriptUpdate('');
                }
                alert('Đã lưu thành công.');
            }
        } else {
            setStatus('Lỗi server', 'error');
            alert('Lỗi server: ' + (data?.message || response.statusText));
        }
    })
    .catch(err => {
        setStatus('Lỗi kết nối', 'error');
        alert('Lỗi kết nối! Hãy chắc chắn Backend đang chạy.');
        console.error(err);
    });
}

/**
 * Hiển thị modal phát hiện duplicate
 */
function showDuplicateModal(data) {
    // Lưu matched_content để sử dụng trong merge
    pendingQuestion.matched_content = data.matched_content;
    
    document.getElementById('displayMessage').innerText = data.display_message || 'Có người khác cũng muốn hỏi câu này';
    document.getElementById('matchedContent').innerText = data.matched_content || 'Không có dữ liệu';
    document.getElementById('synthesizedPreview').innerText = data.synthesized_preview || 'Không có dữ liệu';
    document.getElementById('duplicateModal').classList.add('active');
}

/**
 * Ẩn modal duplicate
 */
function hideDuplicateModal() {
    document.getElementById('duplicateModal').classList.remove('active');
}

/**
 * Gộp câu hỏi (merge)
 */
function handleMerge() {
    if (!pendingQuestion) return;
    
    const payload = {
        room_id: pendingQuestion.room_id,
        speaker_id: pendingQuestion.speaker_id,
        speaker_name: pendingQuestion.speaker_name,
        timestamp: pendingQuestion.timestamp,
        content: pendingQuestion.matched_content,  // Gửi matched_content làm nội dung để tìm trong file
        synthesized_content: document.getElementById('synthesizedPreview').innerText
    };

    setStatus('Đang gộp & tổng hợp...', 'neutral');
    fetch('http://localhost:8080/api/questions/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(async response => {
        const data = await response.json().catch(() => null);
        if (response.ok) {
            setStatus('Đã gộp & lưu thành công', 'success');
            animateTranscriptUpdate('');
            hideDuplicateModal();
            alert('Đã gộp câu hỏi thành công.');
        } else {
            setStatus('Lỗi server', 'error');
            alert('Lỗi: ' + (data?.message || response.statusText));
        }
    })
    .catch(err => {
        setStatus('Lỗi kết nối', 'error');
        alert('Lỗi kết nối!');
        console.error(err);
    });
}

/**
 * Vẫn gửi câu hỏi mặc dù phát hiện duplicate (bỏ qua kiểm tra)
 */
function handleKeepSend() {
    if (!pendingQuestion) return;
    
    const payload = {
        ...pendingQuestion,
        force_save: true
    };

    setStatus('Đang gửi (bỏ qua kiểm tra)...', 'neutral');
    fetch('http://localhost:8080/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(async response => {
        const data = await response.json().catch(() => null);
        if (response.ok) {
            setStatus('Đã lưu thành công', 'success');
            animateTranscriptUpdate('');
            hideDuplicateModal();
            alert('Đã lưu câu hỏi của bạn.');
        } else {
            setStatus('Lỗi server', 'error');
            alert('Lỗi: ' + (data?.message || response.statusText));
        }
    })
    .catch(err => {
        setStatus('Lỗi kết nối', 'error');
        alert('Lỗi kết nối!');
        console.error(err);
    });
}


// ======================== Modal Management ========================
document.getElementById('duplicateModal').addEventListener('click', (e) => {
    if (e.target.id === 'duplicateModal') {
        hideDuplicateModal();
    }
});

confirmLeaveModal.addEventListener('click', (e) => {
    if (e.target.id === 'confirmLeaveModal') {
        handleCancelLeave();
    }
});


// ======================== Initialize ========================
document.addEventListener('DOMContentLoaded', () => {
    // Get or create user ID
    currentUserId = getOrCreateUserId();
    console.log('User ID:', currentUserId);

    // Initialize UI
    lobbyView.classList.remove('hidden');
    recordingView.classList.add('hidden');
    setStatus('Sẵn sàng', 'neutral');

    if (window.lucide) {
        window.lucide.replace();
    }
});
