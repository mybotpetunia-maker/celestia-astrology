const { Redis } = require('@upstash/redis');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });

    const data = req.body || {};

    const submission = {
      ...data,
      site: 'celestia',
      timestamp: new Date().toISOString(),
      type: 'upgrade_notify'
    };

    await redis.lpush('upgrade_submissions:celestia', JSON.stringify(submission));
    await redis.hincrby('funnel:celestia', 'upgradeSubmitted', 1);

    const today = new Date().toISOString().split('T')[0];
    await redis.hincrby(`daily:celestia:${today}`, 'upgradeSubmitted', 1);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Upgrade notify error:', error);
    return res.status(500).json({ error: 'Failed to process submission' });
  }
}
