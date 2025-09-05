const apiKey = 'f2d40a6b7a6cd21204042b563b30848e'; // your TMDB key

const shows = [
  { name: "Buffy the Vampire Slayer", tmdbId: 95 },
  { name: "Charmed", tmdbId: 620 },
  { name: "Criminal Minds", tmdbId: 4057 },
  { name: "Grey's Anatomy", tmdbId: 1416 },
  { name: "Law and Order SVU", tmdbId: 2734 },
  { name: "Supernatural", tmdbId: 1622 }
];

// Top: Full random picker
const pickBtn = document.getElementById('pickBtn');
const result = document.getElementById('result');

// Bottom: Pick show from dropdown
const showSelect = document.getElementById('showSelect');
const pickFromShowBtn = document.getElementById('pickFromShowBtn');
const resultSingle = document.getElementById('resultSingle');

// Populate dropdown with shows
shows.forEach(show => {
  const option = document.createElement('option');
  option.value = show.tmdbId;
  option.textContent = show.name;
  showSelect.appendChild(option);
});

// Format a nice result string
function formatResult(showName, seasonNumber, ep) {
  return `📺 ${showName}
Season: ${seasonNumber}
Episode: ${ep.episode_number} — ${ep.name}

${ep.overview || 'No overview available.'}`;
}

// Fetch & pick random episode
function pickRandomEpisode(show, outputElement) {
  if (!show) {
    outputElement.textContent = 'Pick a show first 🙂';
    return;
  }

  outputElement.textContent = 'Finding something good…';

  fetch(`https://api.themoviedb.org/3/tv/${show.tmdbId}?api_key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
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
          outputElement.textContent = formatResult(show.name, seasonNumber, randomEpisode);
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
