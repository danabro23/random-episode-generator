const apiKey = 'f2d40a6b7a6cd21204042b563b30848e'; // your TMDB key

const shows = [
  { name: "Buffy the Vampire Slayer", tmdbId: 95 },
  { name: "Charmed", tmdbId: 1816 },
  { name: "Criminal Minds", tmdbId: 4057 },
  { name: "Grey's Anatomy", tmdbId: 1416 },
  { name: "Law and Order SVU", tmdbId: 2734 },
  { name: "Supernatural", tmdbId: 1622 }
];

// --- FAVORITES ----
const favoritesKey = "tvFavorites";
function getFavorites() {
  return JSON.parse(localStorage.getItem(favoritesKey) || "[]");
}
function setFavorites(favs) {
  localStorage.setItem(favoritesKey, JSON.stringify(favs));
}
function episodeToFavoriteObj(show, season, ep, posterUrl) {
  return {
    show: show.name,
    tmdbId: show.tmdbId,
    season: season,
    epNum: ep.episode_number,
    epTitle: ep.name,
    overview: ep.overview || '',
    poster: posterUrl,
    tmdbEpId: ep.id
  };
}
function renderFavorites() {
  const favs = getFavorites();
  const container = document.getElementById('favorites');
  container.innerHTML = '';
  if (favs.length === 0) {
    container.innerHTML = '<p style="opacity:.77">No favorites yet. Click the ⭐️ on a result to save one!</p>';
    return;
  }
  favs.slice().reverse().forEach((fav, idx) => {
    const div = document.createElement('div');
    div.className = "fav-item";
    div.innerHTML = `
      <img class="poster-img" src="${fav.poster || ''}" alt="${fav.show} poster" onerror="this.style.display='none'"/>
      <div style="flex:1 1 0">
        <span class="fav-title">${fav.show} — S${fav.season}E${fav.epNum}: ${fav.epTitle}</span>
        <div class="fav-meta">${fav.overview || ''}</div>
        <button class="fav-remove" data-idx="${favs.length-1-idx}">Remove</button>
      </div>
    `;
    container.appendChild(div);
  });
  // Remove event
  container.querySelectorAll('.fav-remove').forEach(btn => {
    btn.onclick = (e) => {
      const idx = +btn.dataset.idx;
      const favs = getFavorites();
      favs.splice(idx, 1);
      setFavorites(favs);
      renderFavorites();
    }
  });
}
renderFavorites();

// --- Populate dropdown ---
const pickBtn = document.getElementById('pickBtn');
const result = document.getElementById('result');
const showSelect = document.getElementById('showSelect');
const pickFromShowBtn = document.getElementById('pickFromShowBtn');
const resultSingle = document.getElementById('resultSingle');

shows.forEach(show => {
  const option = document.createElement('option');
  option.value = show.tmdbId;
  option.textContent = show.name;
  showSelect.appendChild(option);
});

function renderEpisodeResult(show, seasonNumber, ep, posterUrl, outputElement) {
  // Add favorite button
  const favs = getFavorites();
  const isFav = favs.some(f =>
    f.tmdbEpId === ep.id && String(f.tmdbId) === String(show.tmdbId)
  );
  outputElement.innerHTML = `
    <div class="poster-wrapper">
      ${posterUrl ? `<img class="poster-img" src="${posterUrl}" alt="${show.name} poster" />` : ''}
      <div class="episode-info">
        <div style="font-weight:bold;font-size:1.07em;margin-bottom:4px;">
          📺 ${show.name} — Season ${seasonNumber}, Episode ${ep.episode_number}
        </div>
        <div style="font-size:1.07em;margin-bottom:4px;">${ep.name}</div>
        <div style="margin-bottom:7px;color:#446;opacity:.86;">${ep.overview || 'No overview available.'}</div>
        <button class="favorite-btn${isFav ? ' favorited' : ''}" title="Save as favorite" aria-label="Save as favorite">
          ${isFav ? '★' : '☆'}
        </button>
      </div>
    </div>
  `;
  // Add event to favorite button
  const favBtn = outputElement.querySelector('.favorite-btn');
  favBtn.onclick = () => {
    if (!isFav) {
      const favObj = episodeToFavoriteObj(show, seasonNumber, ep, posterUrl);
      setFavorites([...getFavorites(), favObj]);
      renderFavorites();
      favBtn.textContent = '★';
      favBtn.classList.add('favorited');
    }
  };
}

// Helper: fetch and pick episode with poster
function pickRandomEpisode(show, outputElement) {
  if (!show) {
    outputElement.textContent = 'Pick a show first 🙂';
    return;
  }
  outputElement.textContent = 'Finding something good…';

  fetch(`https://api.themoviedb.org/3/tv/${show.tmdbId}?api_key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      const posterUrl = data.poster_path
        ? `https://image.tmdb.org/t/p/w185${data.poster_path}`
        : '';
      const seasons = (data.seasons || []).filter(s => s.season_number > 0);
      if (!seasons.length) throw new Error('No seasons found');

      const randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
      const seasonNumber = randomSeason.season_number;

      return fetch(`https://api.themoviedb.org/3/tv/${show.tmdbId}/season/${seasonNumber}?api_key=${apiKey}`)
        .then(res => res.json())
        .then(seasonData => {
          const episodes = seasonData.episodes || [];
          if (!episodes.length) throw new Error('No episodes found');
          const randomEpisode = episodes[Math.floor(Math.random() * episodes.length)];
          renderEpisodeResult(show, seasonNumber, randomEpisode, posterUrl, outputElement);
        });
    })
    .catch(err => {
      console.error(err);
      outputElement.textContent = 'Oops! Could not get episode details.';
    });
}

// Event: Fully random
pickBtn.addEventListener('click', () => {
  const randomShow = shows[Math.floor(Math.random() * shows.length)];
  pickRandomEpisode(randomShow, result);
});

// Event: Pick from dropdown
pickFromShowBtn.addEventListener('click', () => {
  const selectedId = showSelect.value;
  const selectedShow = shows.find(show => String(show.tmdbId) === String(selectedId));
  pickRandomEpisode(selectedShow, resultSingle);
});

