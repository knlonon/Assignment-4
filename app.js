/*
  Name: Keith N Lonon
  Date: 10.16.2026
  CSC 372-01

  This JavaScript file powers the TVmaze show gallery. It uses the Fetch API to search for
  shows, retrieve cast information, handle errors, and update the page based on user input.
*/

/**
 * Initializes the page by wiring up event listeners and performing a default search.
 */
function initGallery() {
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");

  if (searchForm) {
    searchForm.addEventListener("submit", function handleSearchSubmit(event) {
      event.preventDefault();
      const query = searchInput ? searchInput.value.trim() : "";
      if (!query) {
        showMessage("Please enter a search term.");
        clearGallery();
        return;
      }
      searchShows(query);
    });
  }

  // Default search on load
  searchShows("office");
}

/**
 * Displays a status or error message to the visitor.
 * @param {string} message - The message to display.
 */
function showMessage(message) {
  const messageContainer = document.getElementById("message-container");
  if (messageContainer) {
    messageContainer.textContent = message;
  }
}

/**
 * Clears all show cards from the gallery.
 */
function clearGallery() {
  const gallery = document.getElementById("gallery");
  if (gallery) {
    gallery.textContent = "";
  }
}

/**
 * Performs a search for shows using the TVmaze API.
 * @param {string} query - The search term entered by the visitor.
 * @returns {Promise<void>} A promise that resolves when the gallery is updated.
 */
async function searchShows(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = "https://api.tvmaze.com/search/shows?q=" + encodedQuery;

  showMessage("Searching for shows...");
  clearGallery();

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        showMessage("Rate limit exceeded. Please wait a moment and try again.");
        return;
      }
      showMessage("Request failed with status " + response.status + ".");
      return;
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      showMessage("No results found for \"" + query + "\".");
      return;
    }

    const limitedResults = results.slice(0, 10);
    showMessage("Showing results for \"" + query + "\".");
    await displayShows(limitedResults);
  } catch (error) {
    showMessage("Network error. Please check your connection and try again.");
  }
}

/**
 * Retrieves cast information for a given show from the TVmaze API.
 * @param {number} showId - The unique ID of the show.
 * @returns {Promise<string[]>} A promise that resolves to an array of cast member names.
 */
async function fetchCast(showId) {
  const url = "https://api.tvmaze.com/shows/" + showId + "/cast";

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        return ["Cast unavailable (rate limit exceeded)"];
      }
      return [];
    }

    const castData = await response.json();

    if (!Array.isArray(castData) || castData.length === 0) {
      return [];
    }

    const names = castData.slice(0, 5).map(function mapCastEntry(entry) {
      return entry && entry.person && entry.person.name ? entry.person.name : "";
    }).filter(function filterEmpty(name) {
      return name !== "";
    });

    return names;
  } catch (error) {
    return [];
  }
}

/**
 * Converts an HTML summary string into plain text.
 * @param {string|null} htmlSummary - The HTML summary from the API.
 * @returns {string} A plain text version of the summary.
 */
function stripHtmlSummary(htmlSummary) {
  if (!htmlSummary) {
    return "";
  }
  const temp = document.createElement("div");
  temp.innerHTML = htmlSummary;
  return temp.textContent || "";
}

/**
 * Creates and appends show cards to the gallery for the given search results.
 * @param {Object[]} results - The array of search results from TVmaze.
 * @returns {Promise<void>} A promise that resolves when all cards are rendered.
 */
async function displayShows(results) {
  const gallery = document.getElementById("gallery");
  if (!gallery) {
    return;
  }

  clearGallery();

  for (let i = 0; i < results.length; i += 1) {
    const result = results[i];
    const show = result && result.show ? result.show : null;

    if (!show) {
      continue;
    }

    const card = document.createElement("article");
    card.className = "show-card";

    const header = document.createElement("div");
    header.className = "show-card-header";

    const imageElement = document.createElement("img");
    imageElement.className = "show-image";
    if (show.image && show.image.medium) {
      imageElement.src = show.image.medium;
      imageElement.alt = show.name ? show.name + " poster" : "Show poster";
    } else {
      imageElement.src = "";
      imageElement.alt = "Poster not available";
    }

    const titleContainer = document.createElement("div");

    const titleElement = document.createElement("h2");
    titleElement.className = "show-title";
    titleElement.textContent = show.name || "Title not available";

    const metaElement = document.createElement("p");
    metaElement.className = "show-meta";

    const premiered = show.premiered ? show.premiered : "Not available";
    const updated = show.updated ? new Date(show.updated * 1000).toLocaleString() : "Not available";

    metaElement.textContent = "Premiered: " + premiered + " | Last updated: " + updated;

    titleContainer.appendChild(titleElement);
    titleContainer.appendChild(metaElement);

    header.appendChild(imageElement);
    header.appendChild(titleContainer);

    const summaryElement = document.createElement("p");
    summaryElement.className = "show-summary";
    const summaryText = stripHtmlSummary(show.summary);
    summaryElement.textContent = summaryText || "Summary not available.";

    const genresElement = document.createElement("p");
    genresElement.className = "show-genres";
    const genres = Array.isArray(show.genres) && show.genres.length > 0
      ? show.genres.join(", ")
      : "Not available";
    genresElement.textContent = "Genres: " + genres;

    const ratingElement = document.createElement("p");
    ratingElement.className = "show-rating";
    const rating = show.rating && show.rating.average !== null
      ? show.rating.average
      : "Not available";
    ratingElement.textContent = "Average rating: " + rating;

    const castElement = document.createElement("p");
    castElement.className = "show-cast";
    castElement.textContent = "Loading cast...";

    const linkElement = document.createElement("a");
    linkElement.className = "show-link";
    if (show.url) {
      linkElement.href = show.url;
      linkElement.target = "_blank";
      linkElement.rel = "noopener noreferrer";
      linkElement.textContent = "View show on TVmaze";
    } else {
      linkElement.textContent = "Show link not available";
    }

    card.appendChild(header);
    card.appendChild(summaryElement);
    card.appendChild(genresElement);
    card.appendChild(ratingElement);
    card.appendChild(castElement);
    card.appendChild(linkElement);

    gallery.appendChild(card);

    const castNames = await fetchCast(show.id);
    if (castNames.length > 0) {
      castElement.textContent = "Cast: " + castNames.join(", ");
    } else {
      castElement.textContent = "Cast not available.";
    }
  }
}

window.addEventListener("DOMContentLoaded", initGallery);
