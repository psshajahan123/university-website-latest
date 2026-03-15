// Universities Component

import { showToast } from './auth.js';

export async function initUniversities() {
  try {
    const res = await fetch('/data/universities.json');
    const data = await res.json();
    renderUniversities(data.universities);
    initSearch(data.universities);
    updateStats(data.universities);
  } catch (err) {
    console.error('Failed to load universities data:', err);
    document.getElementById('universitiesGrid').innerHTML = `
      <div class="search-no-results">
        <div class="icon">⚠️</div>
        <p>Failed to load university data. Please refresh the page.</p>
      </div>`;
  }
}

function renderUniversities(universities, filter = '') {
  const grid = document.getElementById('universitiesGrid');
  if (!grid) return;

  const filtered = filter
    ? universities.filter(u =>
        u.name.toLowerCase().includes(filter.toLowerCase()) ||
        u.location.toLowerCase().includes(filter.toLowerCase()) ||
        u.results.some(r => r.title.toLowerCase().includes(filter.toLowerCase()))
      )
    : universities;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="search-no-results" style="grid-column:1/-1">
        <div class="icon">🔍</div>
        <p>No universities found matching "<strong>${filter}</strong>"</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(uni => renderUniCard(uni, filter)).join('');

  // Attach click handlers
  grid.querySelectorAll('.uni-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.uni-card');
      const isExpanded = card.classList.contains('expanded');
      // Close all others
      grid.querySelectorAll('.uni-card.expanded').forEach(c => c.classList.remove('expanded'));
      if (!isExpanded) card.classList.add('expanded');
    });
  });

  // Attach result item click
  grid.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', () => {
      const uniId = parseInt(item.dataset.uniId);
      const resultId = item.dataset.resultId;
      const uni = universities.find(u => u.id === uniId);
      const result = uni?.results.find(r => r.id === resultId);
      if (uni && result) openResultModal(uni, result);
    });
  });
}

function renderUniCard(uni, highlight = '') {
  const totalResults = uni.results.length;

  const resultsHTML = uni.results.map(result => {
    const titleHighlighted = highlight
      ? result.title.replace(new RegExp(`(${highlight})`, 'gi'), '<mark style="background:rgba(37,99,235,0.2);color:inherit;border-radius:2px;">$1</mark>')
      : result.title;

    return `
      <div class="result-item" data-uni-id="${uni.id}" data-result-id="${result.id}">
        <div class="result-item-left">
          <div class="result-title">${titleHighlighted}</div>
          <div class="result-date">📅 ${formatDate(result.date)}</div>
        </div>
        <span class="result-status">${result.status}</span>
        <span class="result-arrow">→</span>
      </div>
    `;
  }).join('');

  return `
    <div class="uni-card" data-uni-id="${uni.id}">
      <div class="uni-card-header">
        <div class="uni-logo" style="background:${uni.color}">${uni.logo}</div>
        <div class="uni-info">
          <div class="uni-name">${uni.name}</div>
          <div class="uni-location">📍 ${uni.location}</div>
        </div>
        <span class="uni-results-count">${totalResults}</span>
        <span class="uni-chevron">▼</span>
      </div>
      <div class="uni-dropdown">
        ${resultsHTML}
      </div>
    </div>
  `;
}

function openResultModal(uni, result) {
  const backdrop = document.getElementById('resultModal');
  if (!backdrop) return;

  backdrop.innerHTML = `
    <div class="modal result-modal">
      <button class="modal-close" id="resultModalClose">✕</button>
      <div class="modal-header">
        <div class="uni-logo" style="background:${uni.color};width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:800;font-size:0.85rem;color:#fff;flex-shrink:0;">${uni.logo}</div>
        <div>
          <span class="result-uni-badge" style="background:${uni.color}">${uni.name}</span>
        </div>
      </div>

      <h2 style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;line-height:1.3;">${result.title}</h2>
      <p class="modal-sub">Result announcement details</p>

      <div class="result-modal-body">
        <p><strong>University:</strong> ${uni.name}</p>
        <p><strong>Location:</strong> ${uni.location}</p>
        <p><strong>Result Title:</strong> ${result.title}</p>
        <p><strong>Published Date:</strong> ${formatDate(result.date)}</p>
        <p><strong>Status:</strong> <span style="color:#16a34a;font-weight:600;">${result.status}</span></p>
      </div>

      <div class="result-modal-actions">
        <button class="btn btn-primary" onclick="showToastFromWindow('📋 Results copied to clipboard!', 'success')">
          View Results
        </button>
        <button class="btn btn-outline" id="resultModalCloseBtn">Close</button>
      </div>
    </div>
  `;

  backdrop.classList.add('active');

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) backdrop.classList.remove('active');
  });
  document.getElementById('resultModalClose')?.addEventListener('click', () =>
    backdrop.classList.remove('active'));
  document.getElementById('resultModalCloseBtn')?.addEventListener('click', () =>
    backdrop.classList.remove('active'));
}

function initSearch(universities) {
  const heroInput = document.getElementById('heroSearch');
  heroInput?.addEventListener('input', e => {
    renderUniversities(universities, e.target.value.trim());
  });

  document.getElementById('heroSearchBtn')?.addEventListener('click', () => {
    renderUniversities(universities, heroInput?.value.trim() || '');
    document.getElementById('universitiesSection')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function updateStats(universities) {
  const totalResults = universities.reduce((sum, u) => sum + u.results.length, 0);
  document.getElementById('statUniversities').textContent = universities.length + '+';
  document.getElementById('statResults').textContent = totalResults + '+';
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
}

// Expose showToast for inline onclick in dynamically created modal
window.showToastFromWindow = showToast;
