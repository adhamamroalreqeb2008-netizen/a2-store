global.userStatuses = global.userStatuses || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const update = req.body;

  if (update.callback_query) {
    const data = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const BOT_TOKEN = "9287234458:AAELwciHtjDTWTwq_IfWxEpqADMI49LEo7U";

    if (data.startsWith('approve_')) {
      const userId = data.replace('approve_', '');
      global.userStatuses[userId] = 'approved';

      // تحديث رسالة تليجرام لإزالة الأزرار وإظهار أنه تم قبول الطلب
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: update.callback_query.message.text + "\n\n✅ *حالة الطلب: تم الموافقة بنجاح*",
          parse_mode: 'Markdown'
        })
      });
    } else if (data.startsWith('reject_')) {
      const userId = data.replace('reject_', '');
      global.userStatuses[userId] = 'rejected';

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: update.callback_query.message.text + "\n\n❌ *حالة الطلب: تم الرفض*",
          parse_mode: 'Markdown'
        })
      });
    }
  }

  return res.status(200).json({ ok: true });
}
