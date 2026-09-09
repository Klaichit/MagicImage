const gallery = document.querySelector('#gallery');
const search = document.querySelector('#search');
const filters = document.querySelector('#filters');
const resultCount = document.querySelector('#result-count');
const empty = document.querySelector('#empty');
const modal = document.querySelector('#lightbox');

let allItems = [];
let visibleItems = [];
let activeCategory = 'all';
let activeIndex = 0;

const thaiDate = (date) => new Intl.DateTimeFormat('th-TH', {
  day: 'numeric', month: 'short', year: 'numeric'
}).format(new Date(`${date}T12:00:00`));

function makeCard(item, index) {
  const article = document.createElement('article');
  article.className = 'card';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'card-button';
  button.setAttribute('aria-label', `เปิดภาพ ${item.topic} ${item.kind}`);
  button.addEventListener('click', () => openModal(index));

  const image = document.createElement('img');
  image.src = item.src;
  image.alt = `${item.topic} — ${item.kind}`;
  image.loading = 'lazy';
  image.decoding = 'async';
  button.append(image);

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const date = document.createElement('p');
  date.textContent = thaiDate(item.date);
  const title = document.createElement('h2');
  title.textContent = item.topic;
  const kind = document.createElement('span');
  kind.textContent = `${item.kind} · ${item.category}`;
  meta.append(date, title, kind);
  article.append(button, meta);
  return article;
}

function render() {
  const query = search.value.trim().toLocaleLowerCase('th');
  visibleItems = allItems.filter((item) => {
    const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
    const textMatch = `${item.topic} ${item.kind} ${item.category} ${item.date}`.toLocaleLowerCase('th').includes(query);
    return categoryMatch && textMatch;
  });

  gallery.replaceChildren(...visibleItems.map(makeCard));
  empty.hidden = visibleItems.length > 0;
  resultCount.textContent = `แสดง ${visibleItems.length} จาก ${allItems.length} ภาพ`;
}

function setModalItem(index) {
  if (!visibleItems.length) return;
  activeIndex = (index + visibleItems.length) % visibleItems.length;
  const item = visibleItems[activeIndex];
  document.querySelector('#modal-date').textContent = `${thaiDate(item.date)} · ${item.kind}`;
  document.querySelector('#modal-title').textContent = item.topic;
  const image = document.querySelector('#modal-image');
  image.src = item.src;
  image.alt = `${item.topic} — ${item.kind}`;
  const download = document.querySelector('#modal-download');
  download.href = item.src;
  download.download = `${item.date}-${item.download}`;
  document.querySelector('#modal-position').textContent = `${activeIndex + 1} / ${visibleItems.length}`;
}

function openModal(index) {
  setModalItem(index);
  modal.showModal();
}

document.querySelector('#modal-close').addEventListener('click', () => modal.close());
document.querySelector('#modal-prev').addEventListener('click', () => setModalItem(activeIndex - 1));
document.querySelector('#modal-next').addEventListener('click', () => setModalItem(activeIndex + 1));
modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });
modal.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') setModalItem(activeIndex - 1);
  if (event.key === 'ArrowRight') setModalItem(activeIndex + 1);
});
search.addEventListener('input', render);

fetch('gallery.json')
  .then((response) => {
    if (!response.ok) throw new Error('โหลดรายการภาพไม่สำเร็จ');
    return response.json();
  })
  .then((items) => {
    allItems = items;
    document.querySelector('#asset-count').textContent = items.length;
    document.querySelector('#topic-count').textContent = new Set(items.map((item) => item.topic)).size;

    [...new Set(items.map((item) => item.category))].sort().forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter';
      button.dataset.filter = category;
      button.textContent = category;
      filters.append(button);
    });

    filters.addEventListener('click', (event) => {
      const button = event.target.closest('.filter');
      if (!button) return;
      activeCategory = button.dataset.filter;
      filters.querySelectorAll('.filter').forEach((item) => item.classList.toggle('is-active', item === button));
      render();
    });
    render();
  })
  .catch((error) => {
    gallery.innerHTML = `<p class="loading">${error.message}</p>`;
  });
