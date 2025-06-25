const currentUserId = localStorage.getItem("vchatUserId");
const friendId = localStorage.getItem("chatWithUserId");
const friendName = localStorage.getItem("chatWithUsername");

if (!currentUserId || !friendId || !friendName) {
  alert("Something went wrong. Please go back and select a chat.");
  window.location.href = "home.html";
}

const firebaseConfig = {
  apiKey: "AIzaSyDMg6CD6aBHSix57jcxFDvB4uHk4RDrJyc",
  authDomain: "vchat-5ba2e.firebaseapp.com",
  databaseURL: "https://vchat-5ba2e-default-rtdb.firebaseio.com",
  projectId: "vchat-5ba2e",
  storageBucket: "vchat-5ba2e.appspot.com",
  messagingSenderId: "64968376129",
  appId: "1:64968376129:web:367ef0bdb422eb1904ebc0"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();

const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const messageContainer = document.getElementById("message-container");
const chatHeader = document.getElementById("chat-header");

// ✅ Render name first
chatHeader.innerHTML = `<strong>${friendName}</strong><br><small id="friend-status">Checking status...</small>`;

// ✅ NOW fetch the inserted element
const statusText = document.getElementById("friend-status");

// ✅ Online Status
firebase.database().ref(`/status/${friendId}`).on("value", snap => {
  const status = snap.val()?.state || "offline";
  if (statusText) {
    statusText.innerText = status === "online" ? "🟢 Online" : "⚫ Offline";
  }
});



function formatTime(ts) {
  const date = new Date(ts);
  const day = date.toLocaleDateString(); // e.g., 25/06/2025
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g., 10:35 AM
  return `${day} ${time}`;
}


function loadMessages() {
  const path = `chats/${currentUserId}_${friendId}`;
  db.ref(path).on("value", snapshot => {
    messageContainer.innerHTML = "";
    snapshot.forEach(child => {
      const msg = child.val();
      const div = document.createElement("div");
      div.className = `message ${msg.sender === currentUserId ? "sent" : "received"}`;
      const time = formatTime(msg.timestamp);
      div.innerHTML = `<span>${msg.text}</span><small>${time}</small>`;
      messageContainer.appendChild(div);
    });
    setTimeout(() => {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }, 100);
  });
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const msg = {
    text,
    sender: currentUserId,
    receiver: friendId,
    timestamp: Date.now(),
  };

  const chatPath1 = `chats/${currentUserId}_${friendId}`;
  const chatPath2 = `chats/${friendId}_${currentUserId}`;

  db.ref(chatPath1).push(msg);
  db.ref(chatPath2).push(msg);

  messageInput.value = "";
  messageInput.focus();
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

loadMessages();

function goBack() {
  window.location.href = "home.html"; // or use history.back();
}
   

