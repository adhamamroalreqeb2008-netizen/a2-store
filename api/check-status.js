// تخزين مؤقت لحالات المستخدمين في الذاكرة (Memory Store)
global.userStatuses = global.userStatuses || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }

  const status = global.userStatuses[user_id] || 'pending';
  return res.status(200).json({ status });
}
