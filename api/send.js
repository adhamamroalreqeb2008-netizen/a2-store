export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // ضع التوكن الصحيح الذي جربته ونجح في المتصفح هنا مباشرة
  const BOT_TOKEN = "9287234458:AAELwciHtjDTWTwq_IfWxEpqADMI49LEo7U";
  const CHAT_ID = "8040433133";

  let bodyData = req.body;
  if (typeof bodyData === 'string') {
    try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
  }

  const { user_id, الاسم_الكامل, رقم_الهوية, تاريخ_انتهاء } = bodyData || {};

  const message = `🚨 طلب جديد:\nالاسم: ${الاسم_الكامل || 'تجربة'}\nالهوية: ${رقم_الهوية || '123'}`;

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const telegramData = await telegramRes.json();

    // إرجاع رد تيليجرام الحقيقي لكي يظهر لك في Hoppscotch بالأسفل
    return res.status(200).json({
      sent_to_telegram: telegramData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
