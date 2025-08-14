// Book search functionality
const API_KEY = ""; // Optional: add your Google Books API key

// Genre-specific book lists
const FANTASY_BOOKS = [
  { query: "The Name of the Wind Patrick Rothfuss", mockReads: "2.3k" },
  { query: "The Way of Kings Brandon Sanderson", mockReads: "2.1k" },
  { query: "The Hobbit J.R.R. Tolkien", mockReads: "1.9k" },
  { query: "Harry Potter and the Sorcerer's Stone", mockReads: "1.8k" },
  { query: "The Final Empire Brandon Sanderson", mockReads: "1.6k" },
  { query: "The Eye of the World Robert Jordan", mockReads: "1.4k" },
  { query: "The Lies of Locke Lamora Scott Lynch", mockReads: "1.2k" },
  { query: "The Blade Itself Joe Abercrombie", mockReads: "1.1k" }
];

const SCIFI_BOOKS = [
  { query: "Dune Frank Herbert", mockReads: "2.5k" },
  { query: "Project Hail Mary Andy Weir", mockReads: "2.2k" },
  { query: "The Martian Andy Weir", mockReads: "2.0k" },
  { query: "Foundation Isaac Asimov", mockReads: "1.8k" },
  { query: "Ender's Game Orson Scott Card", mockReads: "1.7k" },
  { query: "The Hitchhiker's Guide to the Galaxy", mockReads: "1.5k" },
  { query: "Neuromancer William Gibson", mockReads: "1.3k" },
  { query: "The Left Hand of Darkness Ursula K. Le Guin", mockReads: "1.1k" }
];

const TRENDING_BOOKS = [
  { query: "Project Hail Mary Andy Weir", mockReads: "2.1k" },
  { query: "Dune Frank Herbert", mockReads: "1.8k" },
  { query: "The Seven Husbands of Evelyn Hugo", mockReads: "1.6k" },
  { query: "Atomic Habits James Clear", mockReads: "1.4k" },
  { query: "The Silent Patient Alex Michaelides", mockReads: "1.2k" },
  { query: "Educated Tara Westover", mockReads: "1.1k" },
  { query: "The Midnight Library Matt Haig", mockReads: "980" },
  { query: "Where the Crawdads Sing", mockReads: "950" }
];

async function searchBooks(q) {
  const resultsEl = document.getElementById("results");
  if (!resultsEl) return;
  
  resultsEl.innerHTML = '<div class="loading">Searching for books...</div>';
  
  try {
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", q);
    url.searchParams.set("maxResults", "10");
    url.searchParams.set("printType", "books");
    if (API_KEY) url.searchParams.set("key", API_KEY);

    const res = await fetch(url);
    const data = await res.json();
    renderResults(data.items || []);
  } catch (e) {
    resultsEl.textContent = "Failed to fetch results.";
  }
}

function renderResults(items) {
  const resultsEl = document.getElementById("results");
  if (!resultsEl) return;
  
  if (!items.length) {
    resultsEl.innerHTML = '<div class="loading">No results found. Try a different search term.</div>';
    return;
  }
  
  resultsEl.innerHTML = '<div class="results-grid"></div>';
  const grid = resultsEl.querySelector('.results-grid');
  
  for (const item of items) {
    const v = item.volumeInfo || {};
    const id = item.id;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="book-info">
        <img class="book-cover" src="${(v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || ""}" alt="" />
        <div class="book-details">
          <h3>${v.title || "Untitled"}</h3>
          <div class="meta">By ${(v.authors || []).join(", ") || "Unknown author"}</div>
          <div class="meta">Published ${v.publishedDate || "Unknown"}</div>
          ${v.pageCount ? `<div class="meta">${v.pageCount} pages</div>` : ''}
          ${renderGoogleBooksRating(v)}
        </div>
      </div>
    `;

    grid.appendChild(card);
  }
}

function renderGoogleBooksRating(volumeInfo) {
  if (volumeInfo.averageRating && volumeInfo.ratingsCount) {
    return `
      <div class="book-rating">
        <span class="rating-label">Google Books Rating</span>
        <div class="rating-display">
          <span class="stars">${generateStars(volumeInfo.averageRating)}</span>
          <span class="rating-text">${volumeInfo.averageRating.toFixed(1)}/5</span>
          <span class="rating-count">(${volumeInfo.ratingsCount.toLocaleString()} reviews)</span>
        </div>
      </div>
    `;
  } else {
    return '<div class="no-rating">No rating available</div>';
  }
}

function generateStars(rating, maxRating = 5) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
}

async function searchSingleBook(query) {
  try {
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("printType", "books");
    if (API_KEY) url.searchParams.set("key", API_KEY);

    const res = await fetch(url);
    const data = await res.json();
    
    if (data.items && data.items[0]) {
      return data.items[0];
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function loadGenreBooks(genre, bookList) {
  const genreEl = document.getElementById(`${genre}-books`);
  if (!genreEl) return;
  
  genreEl.innerHTML = `<div class="loading">Loading ${genre} books...</div>`;
  
  try {
    const genreBooks = [];
    
    for (let i = 0; i < bookList.length; i++) {
      const book = bookList[i];
      const bookData = await searchSingleBook(book.query);
      if (bookData) {
        genreBooks.push({
          ...bookData,
          rank: i + 1,
          mockReads: book.mockReads,
          genre: genre
        });
      }
    }
    
    renderGenreBooks(genreBooks, genre);
  } catch (error) {
    genreEl.innerHTML = `<div class="loading">Unable to load ${genre} books.</div>`;
  }
}

function renderGenreBooks(books, genre) {
  const genreEl = document.getElementById(`${genre}-books`);
  if (!genreEl) return;
  
  if (!books.length) {
    genreEl.innerHTML = `<div class="loading">No ${genre} books available.</div>`;
    return;
  }
  
  genreEl.innerHTML = '';
  
  books.forEach(book => {
    const v = book.volumeInfo || {};
    const genreBook = document.createElement('div');
    genreBook.className = 'genre-book';
    genreBook.innerHTML = `
      <div class="trending-rank">${book.rank}</div>
      <img class="trending-cover" src="${(v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || ""}" alt="" />
      <div class="trending-title">${v.title || "Untitled"}</div>
      <div class="trending-author">${(v.authors || []).join(", ") || "Unknown author"}</div>
      <div class="trending-stats">${book.mockReads} reads</div>
    `;
    
    genreBook.addEventListener('click', () => {
      // For genre pages, redirect to search on discover page
      window.location.href = `/?search=${encodeURIComponent(v.title || '')}`;
    });
    
    genreEl.appendChild(genreBook);
  });
}

async function loadTrendingBooks() {
  const trendingEl = document.getElementById('trending-books');
  if (!trendingEl) return;
  
  trendingEl.innerHTML = '<div class="loading">Loading trending books...</div>';
  
  try {
    const trendingBooks = [];
    
    for (let i = 0; i < TRENDING_BOOKS.length; i++) {
      const trendingBook = TRENDING_BOOKS[i];
      const bookData = await searchSingleBook(trendingBook.query);
      if (bookData) {
        trendingBooks.push({
          ...bookData,
          rank: i + 1,
          mockReads: trendingBook.mockReads
        });
      }
    }
    
    renderTrendingBooks(trendingBooks);
  } catch (error) {
    trendingEl.innerHTML = '<div class="loading">Unable to load trending books.</div>';
  }
}

function renderTrendingBooks(books) {
  const trendingEl = document.getElementById('trending-books');
  if (!trendingEl) return;
  
  if (!books.length) {
    trendingEl.innerHTML = '<div class="loading">No trending books available.</div>';
    return;
  }
  
  trendingEl.innerHTML = '';
  
  books.forEach(book => {
    const v = book.volumeInfo || {};
    const trendingBook = document.createElement('div');
    trendingBook.className = 'trending-book';
    trendingBook.innerHTML = `
      <div class="trending-rank">${book.rank}</div>
      <img class="trending-cover" src="${(v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || ""}" alt="" />
      <div class="trending-title">${v.title || "Untitled"}</div>
      <div class="trending-author">${(v.authors || []).join(", ") || "Unknown author"}</div>
      <div class="trending-stats">${book.mockReads} reads</div>
    `;
    
    trendingBook.addEventListener('click', () => {
      const searchInput = document.getElementById('q');
      if (searchInput) {
        searchInput.value = v.title || '';
        searchBooks(v.title || '');
        const resultsEl = document.getElementById('results');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
    
    trendingEl.appendChild(trendingBook);
  });
}