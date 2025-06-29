const currentUserId = localStorage.getItem("vchatUserId");

const firebaseConfig = {
  apiKey: "AIzaSyDMg6CD6aBHSix57jcxFDvB4uHk4RDrJyc",
  authDomain: "vchat-5ba2e.firebaseapp.com",
  databaseURL: "https://vchat-5ba2e-default-rtdb.firebaseio.com",
  projectId: "vchat-5ba2e",
  storageBucket: "vchat-5ba2e.firebasestorage.app",
  messagingSenderId: "64968376129",
  appId: "1:64968376129:web:367ef0bdb422eb1904ebc0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const addBtn = document.getElementById('friend-add');
const addContainer = document.getElementById('add-friend-container');

addBtn.addEventListener('click', () => {
  addContainer.style.display = addContainer.style.display === 'block' ? 'none' : 'block';
  addBtn.innerText = addContainer.style.display === 'block' ? 'Close' : '+ Add';
});

async function getCurrentUsername() {
  if (!currentUserId) return null;
  const snap = await db.ref(`users/${currentUserId}/username`).once('value');
  return snap.val();
}

document.getElementById('search-btn-add').addEventListener('click', async () => {
  const query = document.getElementById('search-bt-add').value.trim().toLowerCase();
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = "";

  if (!query) {
    resultsContainer.innerText = "❗ Please enter a username to search.";
    return;
  }

  try {
    const usersSnapshot = await db.ref("users").once('value');
    const friendsSnapshot = await db.ref(`users/${currentUserId}/friends`).once('value');

    const addedFriendIds = new Set();
    friendsSnapshot.forEach(f => addedFriendIds.add(f.val().friendId));

    const currentUsername = await getCurrentUsername();
    const shownUserIds = new Set();
    let found = false;

    usersSnapshot.forEach(child => {
      const user = child.val();
      const userId = child.key;

      if (
        user.username &&
        user.username.toLowerCase().includes(query) &&
        userId !== currentUserId &&
        !shownUserIds.has(userId)
      ) {
        shownUserIds.add(userId);
        found = true;

        const userBox = document.createElement("div");
        userBox.classList.add("chat-user");

        userBox.innerHTML = `
          <div class="avatar">${user.username.charAt(0).toUpperCase()}</div>
          <div class="chat-info">
            <h3>${user.username}</h3>
            <p>Want to add?</p>
          </div>
        `;

        const addBtn = document.createElement('button');
        addBtn.style.marginTop = "5px";
        addBtn.innerText = addedFriendIds.has(userId) ? "Added" : "Add";
        addBtn.disabled = addedFriendIds.has(userId);

        addBtn.addEventListener('click', async () => {
          addBtn.disabled = true;
          addBtn.innerText = "Request sent";
          await db.ref(`users/${userId}/requests/${currentUserId}`).set({
            friendId: currentUserId,
            friendUsername: currentUsername
          });
        });

        userBox.appendChild(addBtn);
        resultsContainer.appendChild(userBox);
      }
    });

    if (!found) {
      resultsContainer.innerText = "❌ No matching user found.";
    }
  } catch (err) {
    console.error("Search error:", err);
    resultsContainer.innerText = "❌ Something went wrong.";
  }
});

if (!currentUserId) {
  alert("Not logged in!");
  window.location.href = "index.html";
}

const chatContainer = document.querySelector(".chat-container");
const searchInput = document.getElementById("search-btn");
let allFriends = [];

function loadFriends() {
  db.ref(`users/${currentUserId}/friends`).once('value').then(snapshot => {
    allFriends = [];
    snapshot.forEach(child => {
      const data = child.val();
      if (data && data.friendId && data.friendUsername) {
        allFriends.push({
          friendId: data.friendId,
          friendUsername: data.friendUsername
        });
      }
    });
    displayFriends(allFriends);
    loadFriendStories(); // ✅ Load story rings
  });
}



function displayFriends(friends) {
  chatContainer.innerHTML = friends.length === 0
    ? "<p style='text-align:center;'>No friends found.</p>"
    : "";

  friends.forEach(friend => {
  const friendDiv = document.createElement("div");
  friendDiv.classList.add("chat-user");

  friendDiv.innerHTML = `
    <div class="avatar">${friend.friendUsername.charAt(0).toUpperCase()}</div>
    <div class="chat-info">
      <h3>${friend.friendUsername}</h3>
      <p style="font-weight: bolder;" class="tap-to-chat">Tap to chat</p>
    </div>
  `;

  // Use querySelector on friendDiv to target just this one
  const tapToChat = friendDiv.querySelector(".tap-to-chat");
  tapToChat.addEventListener("click", () => {
    localStorage.setItem("chatWithUserId", friend.friendId);
    localStorage.setItem("chatWithUsername", friend.friendUsername);
    window.location.href = "chat.html";
  });

  chatContainer.appendChild(friendDiv);
});
}

searchInput.addEventListener("input", function () {
  const query = this.value.trim().toLowerCase();
  const filtered = allFriends.filter(f => f.friendUsername.toLowerCase().includes(query));
  displayFriends(filtered);
});

document.getElementById('view-requests-btn').addEventListener('click', () => {
  const container = document.getElementById("request-container");
  container.style.display = container.style.display === "block" ? "none" : "block";
});

function listenForRequests() {
  const reqBtn = document.getElementById("view-requests-btn");
  const reqList = document.getElementById("request-list");

  db.ref(`users/${currentUserId}/requests`).on("value", snapshot => {
    reqBtn.innerText = `Requests (${snapshot.numChildren()})`;
    reqList.innerHTML = "";

    snapshot.forEach(child => {
      const senderId = child.key;
      const senderData = child.val();

      const div = document.createElement("div");
      div.className = "chat-user";
      div.innerHTML = `
        <div class="avatar">${senderData.friendUsername.charAt(0).toUpperCase()}</div>
        <div class="chat-info">
          <h3 style="color:black;">${senderData.friendUsername}</h3>
          <p>Wants to add you</p>
        </div>
      `;

      const acceptBtn = document.createElement("button");
      acceptBtn.innerText = "Accept";
      acceptBtn.onclick = async () => {
        await db.ref(`users/${currentUserId}/friends`).push({
          friendId: senderId,
          friendUsername: senderData.friendUsername
        });

        const currentUsername = await getCurrentUsername();

        await db.ref(`users/${senderId}/friends`).push({
          friendId: currentUserId,
          friendUsername: currentUsername
        });

        await db.ref(`users/${currentUserId}/requests/${senderId}`).remove();
      };

      div.appendChild(acceptBtn);
      reqList.appendChild(div);
    });
  });
}



listenForRequests();
loadFriends();
loadMyStoryRing();

function loadFriendStories() {
  const now = Date.now();
  allFriends.forEach(friend => {
    db.ref(`stories/${friend.friendId}`).once('value').then(snap => {
      if (!snap.exists()) return;

      let hasRecent = false;

      snap.forEach(child => {
        const story = child.val();
        if (now - story.timestamp < 24 * 60 * 60 * 1000) {
          hasRecent = true;
        }
      });

      if (hasRecent) {
        const chatUser = Array.from(document.querySelectorAll('.chat-user')).find(div =>
          div.innerHTML.includes(friend.friendUsername)
        );
        if (chatUser) {
          chatUser.classList.add("has-story");
          chatUser.setAttribute("data-fid", friend.friendId);
        }
      }
    });
  });
}

chatContainer.addEventListener('click', e => {
  const target = e.target.closest('.chat-user.has-story');
  if (target) {
    const friendId = target.getAttribute('data-fid');
    db.ref(`stories/${friendId}`).once('value').then(snap => {
      const allStories = Object.values(snap.val());
      const validStories = allStories.filter(s => Date.now() - s.timestamp < 24 * 60 * 60 * 1000);
      if (validStories.length === 0) return;

      const latest = validStories.sort((a, b) => b.timestamp - a.timestamp)[0];

      const storyOverlay = document.createElement('div');
      storyOverlay.id = "story-overlay";
      storyOverlay.style.position = "fixed";
      storyOverlay.style.top = 0;
      storyOverlay.style.left = 0;
      storyOverlay.style.width = "100vw";
      storyOverlay.style.height = "100vh";
      storyOverlay.style.background = "#000";
      storyOverlay.style.zIndex = "9999";
      storyOverlay.innerHTML = `
        <button style="position: absolute; top: 10px; left: 10px; z-index: 10000; background: none; border: 2px solid white; border-radius:10px; color: white; font-weight:bolder;padding: 10px;">Back</button>
        <video src="${latest.url}" autoplay loop style="width: 100%; height: 100%; object-fit: contain;"></video>
      `;
      document.body.appendChild(storyOverlay);

      storyOverlay.querySelector('button').onclick = () => {
        storyOverlay.remove();
      };
    });
  }
});

document.getElementById('my-avatar').addEventListener('click', () => {
  db.ref(`stories/${currentUserId}`).once('value').then(snap => {
    const all = snap.val();
    if (!all) return;

    const valid = Object.values(all).filter(s => Date.now() - s.timestamp < 86400000);
    if (valid.length === 0) return;

    const latest = valid.sort((a, b) => b.timestamp - a.timestamp)[0];

    const storyOverlay = document.createElement('div');
    storyOverlay.id = "story-overlay";
    storyOverlay.style = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: black; z-index: 9999;
    `;
    storyOverlay.innerHTML = `
      <button style="position: absolute; top: 10px; left: 10px; z-index: 10000; background: none; border: 2px solid white; border-radius:10px; color: white; font-weight:bolder;padding: 10px;">Back</button>
      <video src="${latest.url}" autoplay loop style="width: 100%; height: 100%; object-fit: contain;"></video>
    `;
    document.body.appendChild(storyOverlay);

    storyOverlay.querySelector('button').onclick = () => storyOverlay.remove();
  });
});


function loadMyStoryRing() {
  db.ref(`stories/${currentUserId}`).once('value').then(snap => {
    const now = Date.now();
    let hasValidStory = false;

    snap.forEach(child => {
      const story = child.val();
      if (now - story.timestamp < 24 * 60 * 60 * 1000) {
        hasValidStory = true;
      }
    });

    if (hasValidStory) {
      document.getElementById('my-avatar').classList.add("hass-story");
    }
  });
}
