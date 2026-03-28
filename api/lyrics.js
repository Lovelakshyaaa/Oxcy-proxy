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

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const r = await fetch(
      `${NETEASE_BASE}/lyric?id=${id}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await r.json();

    return res.json({
      lrc: data?.lrc?.lyric || null,       // plain lyrics
      tlyric: data?.tlyric?.lyric || null, // translated lyrics
      romalrc: data?.romalrc?.lyric || null // romanized lyrics
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
