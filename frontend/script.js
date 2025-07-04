document.addEventListener('DOMContentLoaded', () => {
  const newsContainer = document.getElementById('news-container');
  const categorySelector = document.getElementById('category');
  const categoryLabel = document.getElementById('category-label');
  const searchInput = document.getElementById('search');
  const themeToggle = document.getElementById('theme-toggle');
  const searchButton = document.getElementById('search-button');
  const viewSavedBtn = document.getElementById('view-saved');

  const voiceButton = document.getElementById('voice-button');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  voiceButton.addEventListener('click', () => {
    recognition.start();
    voiceButton.textContent = '🎙️ Listening...';
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    searchInput.value = transcript;
    voiceButton.textContent = '🎤';
    fetchNews(categorySelector.value, transcript);
  };

  recognition.onerror = (event) => {
    console.error('Voice recognition error:', event.error);
    voiceButton.textContent = '🎤';
  };

  recognition.onend = () => {
    voiceButton.textContent = '🎤';
  };
} else {
  voiceButton.disabled = true;
  voiceButton.title = "Voice search not supported on this browser.";
}



  let isViewingSaved = false;

  const categoryIcons = {
    general: '📰',
    technology: '💻',
    sports: '⚽',
    business: '💼',
    health: '🧠'
  };

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function updateCategoryLabel(text) {
    categoryLabel.textContent = text;
  }

  function getSavedArticles() {
    return JSON.parse(localStorage.getItem('savedArticles') || '[]');
  }

  function saveArticle(article) {
    const saved = getSavedArticles();
    if (!saved.some(a => a.url === article.url)) {
      saved.push(article);
      localStorage.setItem('savedArticles', JSON.stringify(saved));
    }
  }

  function removeArticle(url) {
    let saved = getSavedArticles();
    saved = saved.filter(article => article.url !== url);
    localStorage.setItem('savedArticles', JSON.stringify(saved));
  }

  function isArticleSaved(url) {
    return getSavedArticles().some(article => article.url === url);
  }

  function displayArticles(articles, readonly = false) {
    newsContainer.innerHTML = '';

    if (!articles.length) {
      newsContainer.innerHTML = '<p>No articles found.</p>';
      return;
    }

    articles.forEach(article => {
      const card = document.createElement('div');
      card.className = 'news-card';

      const saved = isArticleSaved(article.url);
      const icon = saved || readonly ? '✅' : '⭐';

      card.innerHTML = `
        <div class="news-header">
          <h2>${article.title}</h2>
          <span class="save-icon ${saved ? 'saved' : ''}" data-url="${article.url}" title="${saved ? 'Unsave' : 'Save'}">${icon}</span>
        </div>
        <p>${article.description || ''}</p>
        <a href="${article.url}" target="_blank">Read more</a>
      `;

      const iconElement = card.querySelector('.save-icon');

      iconElement.addEventListener('click', () => {
        if (saved || isViewingSaved) {
          removeArticle(article.url);
          if (isViewingSaved) {
            loadSavedArticles(); // refresh list
          } else {
            iconElement.textContent = '⭐';
            iconElement.classList.remove('saved');
          }
        } else {
          saveArticle(article);
          iconElement.textContent = '✅';
          iconElement.classList.add('saved');
        }
      });

      newsContainer.appendChild(card);
    });
  }

  async function fetchNews(category = 'general', query = '') {
    if (isViewingSaved) return;

    const url = `http://localhost:5000/api/news?category=${category}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);

    if (!res.ok) {
      newsContainer.innerHTML = '<p>Failed to fetch news. Please try again later.</p>';
      return;
    }

    const articles = await res.json();

    if (query) {
      updateCategoryLabel(`Results for: "${query}"`);
    } else {
      updateCategoryLabel(`Showing: ${capitalize(category)} ${categoryIcons[category] || ''}`);
    }

    displayArticles(articles);
  }

  function loadSavedArticles() {
    const saved = getSavedArticles();
    displayArticles(saved, true);
    updateCategoryLabel('📌 Saved Articles');
  }

  categorySelector.addEventListener('change', () => {
    isViewingSaved = false;
    fetchNews(categorySelector.value, searchInput.value.trim());
  });

  searchButton.addEventListener('click', () => {
    isViewingSaved = false;
    fetchNews(categorySelector.value, searchInput.value.trim());
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      isViewingSaved = false;
      fetchNews(categorySelector.value, searchInput.value.trim());
    }
  });

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });

  viewSavedBtn.addEventListener('click', () => {
    isViewingSaved = true;
    loadSavedArticles();
  });

  
  fetchNews();
});
