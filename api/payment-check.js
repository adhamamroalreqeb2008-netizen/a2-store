export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { user_id } = req.query;
  
  // ضع هنا الـ BIN_ID و الـ Master Key الخاص بـ JSONBin (نفسهم اللي استخدمتهم بالملف السابق)
  const BIN_ID = "6af041a3ffd5d16053b0b102";
  const API_KEY = "$2a$10$KdTTWrgsRm/Rk01Njf6HmurDvGeNyAcYaUsLuCIWF20baDFcigsQ6";

  try {
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    const currentData = await getRes.json();
    const record = currentData.record || {};

    const status = record[`pay_${user_id}`] || 'pending';
    return res.status(200).json({ status });
  } catch (err) {
    return res.status(200).json({ status: 'pending' });
  }
}
