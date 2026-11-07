export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: 'Env variables BOT_TOKEN or CHAT_ID are missing!' });
  }

  const { user_id, الاسم_الكامل, رقم_الهوية, تاريخ_الانتهاء } = req.body || {};

  const message = `🚨 طلب جديد:\nالاسم: ${الاسم_الكامل}\nالهوية: ${رقم_الهوية}`;

  try {
    const tRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message })
    });

    const data = await tRes.json();
    
    // إرجاع رد تليجرام الحقيقي لترسله لي هنا
    return res.status(200).json({ telegram_response: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
