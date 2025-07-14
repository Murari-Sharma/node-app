// Enhanced Client-side: script.js
const imgContainer = document.querySelector('.imgContainer');
const searchInput = document.getElementById('searchInput');
const galleryStatus = document.getElementById('gallery-status');
const darkModeToggle = document.getElementById('darkModeToggle');

// Chat box elements
const userInput = document.getElementById('userInput');
const botReply = document.getElementById('botReply');

let allImages = [];

// Fetch and display images
async function loadImages() {
  galleryStatus.textContent = 'Loading...';
  try {
    const res = await fetch('/api/images');
    if (!res.ok) throw new Error('Failed to fetch images');
    allImages = await res.json();
    galleryStatus.textContent = '';
    renderImages();
  } catch (err) {
    galleryStatus.textContent = 'Failed to load images.';
    imgContainer.innerHTML = '';
    console.error(err);
  }
}

// Render images with search filter
function renderImages() {
  const filter = searchInput.value.trim().toLowerCase();
  const filtered = allImages.filter(img => img.name.toLowerCase().includes(filter));
  if (filtered.length === 0) {
    imgContainer.innerHTML = '<p>No images found.</p>';
    return;
  }
  imgContainer.innerHTML = filtered.map(item => `
    <div class="imgBox">
      <img loading="lazy" src="${item.url}" alt="${item.name}" />
      <div class="imgName">${item.name}</div>
    </div>
  `).join('');
}

// Copy image URL
window.copyImageUrl = function(url, btn) {
  navigator.clipboard.writeText(url).then(() => {
    const status = btn.parentElement.parentElement.querySelector('.copyStatus');
    if (status) {
      status.style.display = 'inline';
      setTimeout(() => { status.style.display = 'none'; }, 1200);
    }
  });
};

// Delete image
window.deleteImage = async function(filename) {
  if (!confirm('Are you sure you want to delete this image?')) return;
  galleryStatus.textContent = 'Deleting...';
  try {
    const res = await fetch(`/api/images/${filename}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete image');
    allImages = allImages.filter(img => img.url.split('/').pop() !== filename);
    galleryStatus.textContent = 'Image deleted.';
    renderImages();
  } catch (err) {
    galleryStatus.textContent = 'Error deleting image.';
    console.error(err);
  }
};

// Search filter event
searchInput.addEventListener('input', renderImages);

document.addEventListener('DOMContentLoaded', () => {
  loadImages();
  // Dark mode: persistent and instant
  function applyDarkMode(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    darkModeToggle.textContent = isDark ? '\u2600\ufe0f' : '\ud83c\udf19';
  }
  // On load
  const darkPref = localStorage.getItem('darkMode') === 'true';
  applyDarkMode(darkPref);

  darkModeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    applyDarkMode(isDark);
    localStorage.setItem('darkMode', isDark);
  });

  // Chat: Enter key support
  if (userInput) {
    userInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        chat();
      }
    });
  }
});

// Chat function for Hemant's List Box
function chat() {
  if (!userInput || !botReply) return;
  const msg = userInput.value.trim();
  if (!msg) return;
  // User message
  const userLi = document.createElement('li');
  userLi.className = 'user-msg';
  userLi.innerHTML = `<span class="chat-bubble user-bubble">${escapeHtml(msg)}</span>`;
  botReply.appendChild(userLi);
  botReply.scrollTop = botReply.scrollHeight;
  // Bot reply with typing animation
  const typingLi = document.createElement('li');
  typingLi.className = 'bot-msg';
  typingLi.innerHTML = '<span class="chat-bubble bot-bubble">Typing...</span>';
  botReply.appendChild(typingLi);
  botReply.scrollTop = botReply.scrollHeight;
  setTimeout(() => {
    typingLi.innerHTML = `<span class="chat-bubble bot-bubble">${getBotReply(msg)}</span>`;
    botReply.scrollTop = botReply.scrollHeight;
  }, 700);
  userInput.value = '';
  userInput.focus();
  botReply.scrollTop = botReply.scrollHeight;
}

// Simple bot reply logic
function getBotReply(msg) {
  if (/hello|hi|namaste|hey/i.test(msg)) return 'Namaste! How can I help you?';
  if (/photo|image/i.test(msg)) return 'You can upload or search for project photos above.';
  if (/help/i.test(msg)) return 'Type your question or contact 9216159406.';
  if (/thanks|thank/i.test(msg)) return 'You are welcome!';
  return 'Received: ' + escapeHtml(msg);
}

// Escape HTML for safe rendering
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose chat for button
window.chat = chat;
