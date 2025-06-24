
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

// ✅ Handle Add Friend Button Toggle
const addBtn = document.getElementById('friend-add');
const addContainer = document.getElementById('add-friend-container');

addBtn.addEventListener('click', () => {
  if (addContainer.style.display === 'block') {
    addContainer.style.display = 'none';
    addBtn.innerText = '+ Add';
  } else {
    addContainer.style.display = 'block';
    addBtn.innerText = 'Close';
  }
});


// ✅ Handle Search & Add Friend
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
    friendsSnapshot.forEach(f => {
      addedFriendIds.add(f.val().friendId);
    });

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
          addBtn.innerText = "Adding...";
          await db.ref(`users/${currentUserId}/friends`).push({
            friendId: userId,
            friendUsername: user.username
          });
          addBtn.innerText = "Added";
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


// ✅ Load Friend List & Enable Friend Search
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
      allFriends.push(child.val());
    });
    displayFriends(allFriends);
  });
}

function displayFriends(friends) {
  chatContainer.innerHTML = "";

  if (friends.length === 0) {
    chatContainer.innerHTML = "<p style='text-align:center;'>No friends found.</p>";
    return;
  }

  friends.forEach(friend => {
    const friendDiv = document.createElement("div");
    friendDiv.classList.add("chat-user");

    friendDiv.innerHTML = `
      <div class="avatar">${friend.friendUsername.charAt(0).toUpperCase()}</div>
      <div class="chat-info">
        <h3>${friend.friendUsername}</h3>
        <p>Tap to chat</p>
      </div>
    `;

    friendDiv.addEventListener("click", () => {
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

// Load initial list
loadFriends();
