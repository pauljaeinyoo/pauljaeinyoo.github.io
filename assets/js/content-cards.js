// Content Cards functionality
function initializeContentCards() {
  braze.subscribeToContentCardsUpdates(function(cards) {
    console.log('Content Cards updated:', cards);
    renderContentCards(cards);
  });
  
  braze.requestContentCardsRefresh();
}

function renderContentCards(cards) {
  const container = document.getElementById('content-cards-container');
  if (!container) return;
  
  // Handle different data structures from Braze
  let cardArray = [];
  if (cards && cards.cards) {
    cardArray = cards.cards;
  } else if (Array.isArray(cards)) {
    cardArray = cards;
  } else {
    console.log('Unexpected cards format:', cards);
    cardArray = [];
  }
  
  console.log('Processing cards:', cardArray);
  
  if (!cardArray || cardArray.length === 0) {
    container.innerHTML = `
      <div class="no-content-cards">
        <h3>No recommendations yet</h3>
        <p>Check back later for personalized book recommendations!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  const visibleCards = cardArray.filter(card => !card.isControl && !card.dismissed);
  
  if (visibleCards.length === 0) {
    container.innerHTML = `
      <div class="no-content-cards">
        <h3>No new recommendations</h3>
        <p>You've seen all current recommendations. Check back later!</p>
      </div>
    `;
    return;
  }
  
  visibleCards.forEach(card => {
    const cardElement = createContentCardElement(card);
    container.appendChild(cardElement);
    card.logImpression();
  });
}

function createContentCardElement(card) {
  const cardDiv = document.createElement('div');
  cardDiv.className = `content-card ${card.pinned ? 'pinned' : ''}`;
  
  let imageHtml = '';
  if (card.imageUrl) {
    imageHtml = `<img src="${card.imageUrl}" alt="${card.title || 'Recommendation'}" class="content-card-image">`;
  }
  
  let domainHtml = '';
  if (card.url && card.domain) {
    domainHtml = `<a href="${card.url}" class="content-card-domain" target="_blank" rel="noopener">${card.domain}</a>`;
  }
  
  cardDiv.innerHTML = `
    ${imageHtml}
    <div class="content-card-body">
      <h3 class="content-card-title">${card.title || 'Recommended for You'}</h3>
      <p class="content-card-description">${card.description || 'Check out this recommendation!'}</p>
      ${domainHtml}
      <div class="content-card-meta">
        <span>Updated ${formatCardDate(card.created)}</span>
        ${card.pinned ? '<span class="pinned-badge">Pinned</span>' : ''}
      </div>
    </div>
  `;
  
  cardDiv.addEventListener('click', () => {
    card.logClick();
    if (card.url) {
      window.open(card.url, '_blank', 'noopener,noreferrer');
    }
  });
  
  return cardDiv;
}

function formatCardDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function refreshContentCards() {
  const container = document.getElementById('content-cards-container');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Refreshing recommendations...</div>';
  braze.requestContentCardsRefresh();
}