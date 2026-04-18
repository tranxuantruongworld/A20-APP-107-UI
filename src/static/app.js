const roomIdInput = document.getElementById("roomId");
const speakerNameInput = document.getElementById("speakerName");
const questionTextInput = document.getElementById("questionText");
const statusBox = document.getElementById("statusBox");
const questionList = document.getElementById("questionList");
const previewAudio = document.getElementById("previewAudio");
const recordDot = document.getElementById("recordDot");
const recordLabel = document.getElementById("recordLabel");

const sendTextBtn = document.getElementById("sendTextBtn");
const startRecordBtn = document.getElementById("startRecordBtn");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const sendVoiceBtn = document.getElementById("sendVoiceBtn");
const refreshBtn = document.getElementById("refreshBtn");

let mediaRecorder = null;
let recordedChunks = [];
let recordedBlob = null;

function getOrCreateSpeakerId() {
  const key = "audience_speaker_id";
  const cached = localStorage.getItem(key);
  if (cached) {
    return cached;
  }
  const value = `spk_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, value);
  return value;
}

function setStatus(message, variant = "neutral") {
  statusBox.textContent = message;
  statusBox.className = `status ${variant}`;
}

function getAudienceInfo() {
  const roomId = roomIdInput.value.trim();
  const speakerName = speakerNameInput.value.trim();
  if (!roomId || !speakerName) {
    setStatus("Bạn cần nhập Room ID và Tên khán giả trước khi gửi.", "warn");
    return null;
  }
  return {
    roomId,
    speakerName,
    speakerId: getOrCreateSpeakerId(),
  };
}

function renderQuestions(items) {
  if (!items.length) {
    questionList.innerHTML = "<p class='meta' style='padding: 8px;'>Chưa có câu hỏi nào.</p>";
    return;
  }

  questionList.innerHTML = items
    .slice()
    .reverse()
    .map((q) => {
      const when = new Date(q.created_at).toLocaleString("vi-VN");
      return `
        <article class="item">
          <p class="meta">${q.room_id} · ${q.speaker_name} · ${q.source} · ${when}</p>
          <p class="content">${q.content}</p>
        </article>
      `;
    })
    .join("");
}

async function refreshQuestions() {
  const roomId = roomIdInput.value.trim();
  const endpoint = roomId
    ? `/api/questions?room_id=${encodeURIComponent(roomId)}`
    : "/api/questions";

  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Không tải được danh sách câu hỏi");
    }
    renderQuestions(data.items || []);
  } catch (error) {
    setStatus(`Tải danh sách thất bại: ${error.message}`, "err");
  }
}

async function sendTextQuestion() {
  const info = getAudienceInfo();
  if (!info) {
    return;
  }

  const content = questionTextInput.value.trim();
  if (!content) {
    setStatus("Nội dung text đang trống.", "warn");
    return;
  }

  sendTextBtn.disabled = true;
  setStatus("Đang gửi text question...", "neutral");

  try {
    const response = await fetch("/api/questions/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_id: info.roomId,
        speaker_name: info.speakerName,
        speaker_id: info.speakerId,
        content,
        source: "text",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || data.message || "Gửi text thất bại");
    }

    questionTextInput.value = "";
    setStatus("Đã gửi câu hỏi text thành công.", "ok");
    await refreshQuestions();
  } catch (error) {
    setStatus(`Gửi text thất bại: ${error.message}`, "err");
  } finally {
    sendTextBtn.disabled = false;
  }
}

async function startRecording() {
  const info = getAudienceInfo();
  if (!info) {
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus("Trình duyệt không hỗ trợ thu âm micro.", "err");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      previewAudio.src = URL.createObjectURL(recordedBlob);
      previewAudio.style.display = "block";
      sendVoiceBtn.disabled = recordedBlob.size === 0;

      stream.getTracks().forEach((track) => track.stop());
      recordDot.classList.remove("live");
      recordLabel.textContent = "Đã ghi âm xong";
      setStatus("Đã dừng ghi âm. Bạn có thể gửi voice.", "ok");
    };

    mediaRecorder.start();
    startRecordBtn.disabled = true;
    stopRecordBtn.disabled = false;
    sendVoiceBtn.disabled = true;
    recordDot.classList.add("live");
    recordLabel.textContent = "Đang ghi âm...";
    setStatus("Micro đang thu âm.", "neutral");
  } catch (error) {
    setStatus(`Không thể truy cập micro: ${error.message}`, "err");
  }
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state !== "recording") {
    return;
  }
  mediaRecorder.stop();
  startRecordBtn.disabled = false;
  stopRecordBtn.disabled = true;
}

async function sendVoiceQuestion() {
  const info = getAudienceInfo();
  if (!info) {
    return;
  }
  if (!recordedBlob || recordedBlob.size === 0) {
    setStatus("Bạn chưa có file ghi âm để gửi.", "warn");
    return;
  }

  sendVoiceBtn.disabled = true;
  setStatus("Đang upload voice và chạy ASR...", "neutral");

  try {
    const formData = new FormData();
    formData.append("room_id", info.roomId);
    formData.append("speaker_name", info.speakerName);
    formData.append("speaker_id", info.speakerId);
    formData.append("source", "voice");
    formData.append("file", recordedBlob, "question.webm");

    const response = await fetch("/api/questions/voice", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || data.message || "Gửi voice thất bại");
    }

    const transcript = data?.transcript?.text || "";
    setStatus(`Voice đã gửi thành công. Transcript: ${transcript}`, "ok");
    await refreshQuestions();
  } catch (error) {
    setStatus(`Gửi voice thất bại: ${error.message}`, "err");
  } finally {
    sendVoiceBtn.disabled = false;
  }
}

sendTextBtn.addEventListener("click", sendTextQuestion);
startRecordBtn.addEventListener("click", startRecording);
stopRecordBtn.addEventListener("click", stopRecording);
sendVoiceBtn.addEventListener("click", sendVoiceQuestion);
refreshBtn.addEventListener("click", refreshQuestions);

refreshQuestions();
