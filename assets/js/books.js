// Book search functionality using Open Library API
const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const COVERS_API_BASE = "https://covers.openlibrary.org/b";

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
    const url = new URL(`${OPEN_LIBRARY_BASE}/search.json`);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "10");
    url.searchParams.set("fields", "key,title,author_name,first_publish_year,number_of_pages_median,isbn,cover_i,subject,want_to_read_count,currently_reading_count,already_read_count,readinglog_count,ratings_average,ratings_count,publisher,language");

    const headers = {
      'User-Agent': 'BookReviews/1.0 (https://pauljaeinyoo.github.io; contact@example.com)'
    };

    const res = await fetch(url, { headers });
    const data = await res.json();
    renderResults(data.docs || []);
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
    const card = document.createElement("div");
    card.className = "card book-card-clickable";
    
    // Get cover image URL
    const coverUrl = item.cover_i 
      ? `${COVERS_API_BASE}/id/${item.cover_i}-M.jpg`
      : "";
    
    card.innerHTML = `
      <div class="book-info">
        <img class="book-cover" src="${coverUrl}" alt="" />
        <div class="book-details">
          <h3>${item.title || "Untitled"}</h3>
          <div class="meta">By ${(item.author_name || []).join(", ") || "Unknown author"}</div>
          <div class="meta">Published ${item.first_publish_year || "Unknown"}</div>
          ${item.number_of_pages_median ? `<div class="meta">${item.number_of_pages_median} pages</div>` : ''}
          ${renderOpenLibraryRating(item)}
          <div class="click-hint">Click for details</div>
        </div>
      </div>
    `;

    // Add click handler for book details
    card.addEventListener('click', () => {
      showBookDetails(item);
    });

    grid.appendChild(card);
  }
}

function renderOpenLibraryRating(item) {
  // Check if we have actual ratings data
  if (item.ratings_average && item.ratings_count) {
    return `
      <div class="book-rating" data-rating-type="actual">
        <span class="rating-label">Open Library Rating</span>
        <div class="rating-display">
          <span class="stars">${generateStars(item.ratings_average)}</span>
          <span class="rating-text">${item.ratings_average.toFixed(1)}/5</span>
          <span class="rating-count">(${item.ratings_count.toLocaleString()} ratings)</span>
        </div>
      </div>
    `;
  }
  
  // Calculate popularity score from reading statistics
  const popularityScore = calculatePopularityScore(item);
  
  if (popularityScore.score > 0) {
    return `
      <div class="book-rating" data-rating-type="popularity">
        <span class="rating-label">Popularity Score</span>
        <div class="rating-display">
          <span class="stars">${generateStars(popularityScore.score)}</span>
          <span class="rating-text">${popularityScore.score.toFixed(1)}/5</span>
          <span class="rating-count">(${popularityScore.totalReaders.toLocaleString()} readers)</span>
        </div>
      </div>
    `;
  }
  
  // Fallback to subjects if no rating data
  if (item.subject && item.subject.length > 0) {
    const subjects = item.subject.slice(0, 2).join(", ");
    return `
      <div class="book-rating" data-rating-type="subjects">
        <span class="rating-label">Subjects</span>
        <div class="rating-display">
          <span class="rating-text">${subjects}</span>
        </div>
      </div>
    `;
  }
  
  return '<div class="no-rating">No rating data available</div>';
}

function calculatePopularityScore(item) {
  const wantToRead = item.want_to_read_count || 0;
  const currentlyReading = item.currently_reading_count || 0;
  const alreadyRead = item.already_read_count || 0;
  
  const totalReaders = wantToRead + currentlyReading + alreadyRead;
  
  if (totalReaders === 0) {
    return { score: 0, totalReaders: 0 };
  }
  
  // Weight different reading statuses
  // Already read = 3 points (completed, likely enjoyed)
  // Currently reading = 2 points (engaged)
  // Want to read = 1 point (interested)
  const weightedScore = (alreadyRead * 3) + (currentlyReading * 2) + (wantToRead * 1);
  
  // Normalize to 1-5 scale based on logarithmic scaling
  // This prevents books with massive readership from dominating
  const normalizedScore = Math.min(5, Math.max(1, 
    1 + (Math.log10(weightedScore + 1) / Math.log10(1000)) * 4
  ));
  
  return {
    score: normalizedScore,
    totalReaders: totalReaders
  };
}

function generateStars(rating, maxRating = 5) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
}

// Generate compact rating display for book previews
function generatePreviewRating(book) {
  // Check if we have actual ratings data
  if (book.ratings_average && book.ratings_count) {
    return `★ ${book.ratings_average.toFixed(1)} (${book.ratings_count.toLocaleString()})`;
  }
  
  // Calculate popularity score from reading statistics
  const popularityScore = calculatePopularityScore(book);
  
  if (popularityScore.score > 0) {
    return `★ ${popularityScore.score.toFixed(1)} popularity`;
  }
  
  // Fallback to subject or no rating
  if (book.subject && book.subject.length > 0) {
    return book.subject[0]; // Show first subject
  }
  
  return "No rating";
}

// Fetch detailed book information including description
async function fetchBookDetails(workKey) {
  try {
    const headers = {
      'User-Agent': 'BookReviews/1.0 (https://pauljaeinyoo.github.io; contact@example.com)'
    };

    // Fetch work details
    const workRes = await fetch(`${OPEN_LIBRARY_BASE}${workKey}.json`, { headers });
    const workData = await workRes.json();
    
    return workData;
  } catch (error) {
    console.error('Error fetching book details:', error);
    return null;
  }
}

// Show book details in a modal
async function showBookDetails(bookItem) {
  // Show loading modal first
  showModal(`
    <div class="modal-content">
      <div class="modal-header">
        <h2>Loading book details...</h2>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="loading">Fetching detailed information...</div>
      </div>
    </div>
  `);

  // Fetch detailed information
  const workDetails = await fetchBookDetails(bookItem.key);
  
  // Prepare description
  let description = "No description available.";
  if (workDetails && workDetails.description) {
    if (typeof workDetails.description === 'string') {
      description = workDetails.description;
    } else if (workDetails.description.value) {
      description = workDetails.description.value;
    }
  }

  // Get cover image URL (larger version for modal)
  const coverUrl = bookItem.cover_i 
    ? `${COVERS_API_BASE}/id/${bookItem.cover_i}-L.jpg`
    : "";

  // Prepare additional details
  const subjects = bookItem.subject ? bookItem.subject.slice(0, 5).join(", ") : "Not specified";
  const languages = bookItem.language ? bookItem.language.join(", ") : "Not specified";
  const publishers = bookItem.publisher ? bookItem.publisher.slice(0, 3).join(", ") : "Not specified";

  // Show detailed modal
  showModal(`
    <div class="modal-content">
      <div class="modal-header">
        <h2>${bookItem.title || "Untitled"}</h2>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="book-detail-layout">
          <div class="book-detail-cover">
            ${coverUrl ? `<img src="${coverUrl}" alt="${bookItem.title}" class="modal-book-cover">` : '<div class="no-cover">No Cover Available</div>'}
          </div>
          <div class="book-detail-info">
            <div class="book-detail-section">
              <h3>Description</h3>
              <p class="book-description">${description}</p>
            </div>
            
            <div class="book-detail-section">
              <h3>Details</h3>
              <div class="book-meta-grid">
                <div class="meta-item">
                  <strong>Author(s):</strong> ${(bookItem.author_name || []).join(", ") || "Unknown"}
                </div>
                <div class="meta-item">
                  <strong>First Published:</strong> ${bookItem.first_publish_year || "Unknown"}
                </div>
                <div class="meta-item">
                  <strong>Pages:</strong> ${bookItem.number_of_pages_median || "Unknown"}
                </div>
                <div class="meta-item">
                  <strong>Publisher(s):</strong> ${publishers}
                </div>
                <div class="meta-item">
                  <strong>Languages:</strong> ${languages}
                </div>
                <div class="meta-item">
                  <strong>Subjects:</strong> ${subjects}
                </div>
              </div>
            </div>

            ${renderModalRating(bookItem)}
            
            <div class="book-actions">
              <a href="${OPEN_LIBRARY_BASE}${bookItem.key}" target="_blank" rel="noopener" class="open-library-link">
                View on Open Library
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);
}

function renderModalRating(item) {
  const popularityScore = calculatePopularityScore(item);
  
  if (item.ratings_average && item.ratings_count) {
    return `
      <div class="book-detail-section">
        <h3>Rating</h3>
        <div class="modal-rating">
          <span class="stars">${generateStars(item.ratings_average)}</span>
          <span class="rating-text">${item.ratings_average.toFixed(1)}/5</span>
          <span class="rating-count">(${item.ratings_count.toLocaleString()} ratings)</span>
        </div>
      </div>
    `;
  } else if (popularityScore.score > 0) {
    return `
      <div class="book-detail-section">
        <h3>Popularity</h3>
        <div class="modal-rating">
          <span class="stars">${generateStars(popularityScore.score)}</span>
          <span class="rating-text">${popularityScore.score.toFixed(1)}/5 popularity</span>
          <span class="rating-count">(${popularityScore.totalReaders.toLocaleString()} readers)</span>
        </div>
      </div>
    `;
  }
  return '';
}

// Modal functionality
function showModal(content) {
  // Remove existing modal if any
  closeModal();
  
  const modal = document.createElement('div');
  modal.id = 'book-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = content;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', handleEscapeKey);
}

function closeModal() {
  const modal = document.getElementById('book-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = ''; // Restore scrolling
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

async function searchSingleBook(query) {
  try {
    const url = new URL(`${OPEN_LIBRARY_BASE}/search.json`);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "1");
    url.searchParams.set("fields", "key,title,author_name,first_publish_year,number_of_pages_median,isbn,cover_i,subject,want_to_read_count,currently_reading_count,already_read_count,readinglog_count,ratings_average,ratings_count,publisher,language");

    const headers = {
      'User-Agent': 'BookReviews/1.0 (https://pauljaeinyoo.github.io; contact@example.com)'
    };

    const res = await fetch(url, { headers });
    const data = await res.json();
    
    if (data.docs && data.docs[0]) {
      return data.docs[0];
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
    const genreBook = document.createElement('div');
    genreBook.className = 'genre-book';
    
    const coverUrl = book.cover_i 
      ? `${COVERS_API_BASE}/id/${book.cover_i}-M.jpg`
      : "";
    
    genreBook.innerHTML = `
      <div class="trending-rank">${book.rank}</div>
      <img class="trending-cover" src="${coverUrl}" alt="" />
      <div class="trending-title">${book.title || "Untitled"}</div>
      <div class="trending-author">${(book.author_name || []).join(", ") || "Unknown author"}</div>
      <div class="trending-stats">${generatePreviewRating(book)}</div>
    `;
    
    genreBook.addEventListener('click', () => {
      // Show book details modal directly on genre pages
      showBookDetails(book);
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
    const trendingBook = document.createElement('div');
    trendingBook.className = 'trending-book';
    
    const coverUrl = book.cover_i 
      ? `${COVERS_API_BASE}/id/${book.cover_i}-M.jpg`
      : "";
    
    trendingBook.innerHTML = `
      <div class="trending-rank">${book.rank}</div>
      <img class="trending-cover" src="${coverUrl}" alt="" />
      <div class="trending-title">${book.title || "Untitled"}</div>
      <div class="trending-author">${(book.author_name || []).join(", ") || "Unknown author"}</div>
      <div class="trending-stats">${generatePreviewRating(book)}</div>
    `;
    
    trendingBook.addEventListener('click', () => {
      // Show book details modal directly for trending books
      showBookDetails(book);
    });
    
    trendingEl.appendChild(trendingBook);
  });
}