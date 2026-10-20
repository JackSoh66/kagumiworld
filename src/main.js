import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import experiments from '../data/experiments.json';

const collection = [...experiments].sort((a, b) => b.date.localeCompare(a.date));
const container = document.querySelector('#experiments');
const search = document.querySelector('#search');
let selectedFilter = 'All';
const total = String(collection.length).padStart(3, '0');
document.querySelector('#collection-count').textContent = `/ ${total}`;
document.querySelector('#nav-count').textContent = String(collection.length).padStart(2, '0');
document.querySelector('#all-count').textContent = collection.length;

function render() {
  const query = search.value.trim().toLowerCase();
  const visible = collection.filter((item) =>
    (selectedFilter === 'All' || item.category === selectedFilter) &&
    [item.title, item.description, item.category, ...item.tags].join(' ').toLowerCase().includes(query));
  container.replaceChildren();
  for (const item of visible) {
    const article = document.createElement('article');
    article.className = 'experiment-card';
    const link = document.createElement('a');
    link.className = 'experiment-link';
    link.href = `${import.meta.env.BASE_URL}${item.path}`;
    link.setAttribute('aria-label', `Explore ${item.title}`);
    const visual = document.createElement('div');
    visual.className = 'card-visual';
    const image = document.createElement('img');
    image.src = `${import.meta.env.BASE_URL}${item.preview}`;
    image.alt = item.title + ' — ' + item.subtitle;
    image.width = 1440;
    image.height = 850;
    image.loading = 'lazy';
    const badge = document.createElement('span');
    badge.className = 'card-badge';
    badge.textContent = item === collection[0] ? 'THE LATEST EXPERIMENT' : item.category.toUpperCase();
    const explore = document.createElement('span');
    explore.className = 'card-explore';
    explore.textContent = 'Come play ';
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('viewBox', '0 0 24 24');
    arrow.setAttribute('class', 'inline-icon');
    arrow.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M5 19 19 5M5 5h14v14');
    arrow.append(path);
    explore.append(arrow);
    visual.append(image, badge, explore);
    const details = document.createElement('div');
    details.className = 'card-details';
    const titleWrap = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'card-index';
    eyebrow.textContent = `${String(collection.length - collection.indexOf(item)).padStart(3, '0')} / ${item.category.toUpperCase()}`;
    const title = document.createElement('h3');
    title.textContent = item.title;
    const description = document.createElement('p');
    description.className = 'card-description';
    description.textContent = item.subtitle;
    titleWrap.append(eyebrow, title, description);
    const date = document.createElement('time');
    date.dateTime = item.date;
    date.textContent = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${item.date}T00:00:00Z`));
    details.append(titleWrap, date);
    link.append(visual, details);
    article.append(link);
    container.append(article);
  }
  document.querySelector('#empty-state').hidden = visible.length !== 0;
  document.querySelector('#results-status').textContent = `${visible.length} experiment${visible.length === 1 ? '' : 's'} shown`;
}

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    selectedFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    render();
  });
});
search.addEventListener('input', render);
render();
