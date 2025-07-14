// Admin Photo Manager JS
// Features: fetch, upload, delete, update, copy URL

document.addEventListener('DOMContentLoaded', () => {
  // Dark mode persistent toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  function applyDarkMode(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    if (darkModeToggle) darkModeToggle.textContent = isDark ? '\u2600\ufe0f' : '\ud83c\udf19';
  }
  const darkPref = localStorage.getItem('darkMode') === 'true';
  applyDarkMode(darkPref);
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      const isDark = !document.body.classList.contains('dark-mode');
      applyDarkMode(isDark);
      localStorage.setItem('darkMode', isDark);
    });
  }

  const gallery = document.getElementById('adminGallery');
  const form = document.getElementById('adminUploadForm');
  const status = document.getElementById('adminStatus');

  // Fetch and render all images
  async function loadImages() {
    gallery.innerHTML = '<div style="text-align:center;color:#888;">Loading...</div>';
    try {
      const res = await fetch('/api/images');
      const images = await res.json();
      if (!images.length) {
        gallery.innerHTML = '<div style="color:#888;text-align:center;">No images found.</div>';
        return;
      }
      gallery.innerHTML = images.map(img => `
        <div class="admin-imgBox">
          <img src="${img.url}" alt="${img.name}" />
          <div class="admin-imgName">${img.name}</div>
          <div class="admin-actions">
            <button class="admin-btn delete" onclick="deleteAdminImage('${img.url.split('/').pop()}')">Delete</button>
            <button class="admin-btn update" onclick="showUpdateForm('${img.url.split('/').pop()}', '${img.name.replace(/'/g, '\'')}')">Update</button>
            <button class="admin-btn copy" onclick="copyAdminUrl('${location.origin}${img.url}', this)">Copy URL</button>
          </div>
          <span class="admin-copy-status" style="display:none;color:#047857;font-size:0.91rem;">Copied!</span>
        </div>
      `).join('');
    } catch (err) {
      gallery.innerHTML = '<div style="color:#b91c1c;text-align:center;">Failed to load images.</div>';
    }
  }

  loadImages();

  // Upload photo
  form.onsubmit = async (e) => {
    e.preventDefault();
    status.textContent = 'Uploading...';
    const fd = new FormData(form);
    try {
      const res = await fetch('/uploaded', { method: 'POST', body: fd });
      if (res.ok) {
        status.textContent = 'Photo uploaded successfully!';
        form.reset();
        loadImages();
      } else {
        status.textContent = 'Upload failed.';
      }
    } catch {
      status.textContent = 'Error uploading photo.';
    }
    setTimeout(() => status.textContent = '', 1800);
  };

  // Expose for inline HTML
  window.deleteAdminImage = async function(filename) {
    if (!confirm('Delete this photo?')) return;
    status.textContent = 'Deleting...';
    try {
      const res = await fetch('/api/images/' + filename, { method: 'DELETE' });
      if (res.ok) {
        status.textContent = 'Photo deleted.';
        loadImages();
      } else {
        status.textContent = 'Delete failed.';
      }
    } catch {
      status.textContent = 'Error deleting.';
    }
    setTimeout(() => status.textContent = '', 1600);
  };

  // Copy URL
  window.copyAdminUrl = function(url, btn) {
    navigator.clipboard.writeText(url).then(() => {
      const status = btn.parentElement.parentElement.querySelector('.admin-copy-status');
      if (status) {
        status.style.display = 'inline';
        setTimeout(() => { status.style.display = 'none'; }, 1200);
      }
    });
  };

  // Update photo name (inline form)
  window.showUpdateForm = function(filename, currentName) {
    const imgBox = Array.from(document.querySelectorAll('.admin-imgBox')).find(div =>
      div.querySelector('.admin-actions .update').getAttribute('onclick').includes(filename)
    );
    if (!imgBox) return;
    const nameDiv = imgBox.querySelector('.admin-imgName');
    const actionsDiv = imgBox.querySelector('.admin-actions');
    nameDiv.innerHTML = `<input id="updateNameInput" value="${currentName}" style="width:80px; padding:2px 6px; border-radius:4px; border:1px solid #ccc; font-size:0.96rem;" />`;
    actionsDiv.innerHTML = `<button class='admin-btn update' onclick='submitUpdateName("${filename}")'>Save</button><button class='admin-btn copy' onclick='loadImages()'>Cancel</button>`;
  };

  window.submitUpdateName = async function(filename) {
    const input = document.getElementById('updateNameInput');
    if (!input || !input.value.trim()) return;
    status.textContent = 'Updating...';
    try {
      const res = await fetch('/api/images/' + filename, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: input.value.trim() })
      });
      if (res.ok) {
        status.textContent = 'Photo name updated!';
        loadImages();
      } else {
        status.textContent = 'Update failed.';
      }
    } catch {
      status.textContent = 'Error updating.';
    }
    setTimeout(() => status.textContent = '', 1400);
  };
});
