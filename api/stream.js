const match = require('@unblockneteasemusic/server');

const NETEASE_BASE = 'https://netease-cloudmusic-api-rosy.vercel.app';

// CORS headers — allows OxcyMusic to call this from browser
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, cors).end();
  }

  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing song id' });
  }

  const songId = Number(id);
  if (isNaN(songId)) {
    return res.status(400).json({ error: 'Invalid song id' });
  }

  // Step 1: Try official Netease URL first (works for free songs)
  try {
    const neteaseRes = await fetch(
      `${NETEASE_BASE}/song/url?id=${songId}&br=320000`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await neteaseRes.json();
    const url = data?.data?.[0]?.url;
    if (url) {
      return res.json({ url, source: 'netease', quality: 320 });
    }
  } catch (e) {
    console.warn('Netease official failed:', e.message);
  }

  // Step 2: Unblock via KuWo, KuGou, Bilibili
  try {
    const result = await match(songId, ['kuwo', 'kugou', 'bilibili']);
    if (result?.url) {
      return res.json({
        url: result.url,
        source: result.source,
        quality: result.br ? Math.round(result.br / 1000) : null,
      });
    }
  } catch (e) {
    console.warn('Unblock failed:', e.message);
  }

  return res.status(404).json({ error: 'No stream URL found for this song' });
};
