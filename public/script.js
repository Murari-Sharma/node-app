// Client-side: script.js
const imgContainer = document.querySelector(".imgContainer");

fetch('/api/images')
  .then(res => res.json())
  .then(items => {
    let innerHtml = "";
    items.forEach(item => {
      innerHtml += `
        <div class="imgBox">
          <img loading="lazy" src="${item.url}" alt="${item.name}" width="200" height="200" />
          <div class="imgName">${item.name}</div>
        </div>`;
    });
    imgContainer.innerHTML = innerHtml;
  })
  .catch(err => {
    console.error("Error loading images:", err);
    imgContainer.innerHTML = "<p>Failed to load images.</p>";
  });
