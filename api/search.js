const NETEASE_BASE = 'https://netease-cloudmusic-api-rosy.vercel.app';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, cors).end();
  }
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

  const { q, limit = 10 } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query param: q' });

  try {
    const r = await fetch(
      `${NETEASE_BASE}/search?keywords=${encodeURIComponent(q)}&type=1&limit=${limit}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await r.json();
    const songs = data?.result?.songs || [];

    const results = songs.map((s) => ({
      id: s.id,
      name: s.name,
      artist: s.artists?.[0]?.name || '',
      artists: s.artists?.map((a) => ({ name: a.name })) || [],
      album: s.album?.name || '',
      albumId: s.album?.id || null,
      duration: Math.floor((s.duration || 0) / 1000),
      fee: s.fee, // 0=free, 1=limited, 8=vip
      source: 'netease',
    }));

    return res.json({ results, total: data?.result?.songCount || results.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
