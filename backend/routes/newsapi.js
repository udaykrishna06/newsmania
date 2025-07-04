const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  const { q = '', category = 'general' } = req.query;
  const API_KEY = process.env.NEWS_API_KEY;

  try {
    let url = '';
    const params = { apiKey: API_KEY };

    if (q.trim()) {
      url = 'https://newsapi.org/v2/everything';
      params.q = q;
      params.language = 'en';
      params.sortBy = 'publishedAt';
      params.pageSize = 20;
    } else {
      url = 'https://newsapi.org/v2/top-headlines';
      params.country = 'us';
      params.category = category;
    }

    const response = await axios.get(url, { params });
    res.json(response.data.articles);
  } catch (error) {
    console.error('Error fetching news:', error.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;

