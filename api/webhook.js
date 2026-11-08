export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const update = req.body;

  if (update && update.callback_query) {
    const data = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const BOT_TOKEN = "9287234458:AAELwciHtjDTWTwq_IfWxEpqADMI49LEo7U";
    
    // ضع مفتاح الـ API و الـ Bin ID هنا
    const BIN_ID = "6af041a3ffd5d16053b0b102";
    const API_KEY = "$2a$10$KdTTWrgsRm/Rk01Njf6HmurDvGeNyAcYaUsLuCIWF20baDFcigsQ6";

    let action = '';
    let userId = '';

    if (data.startsWith('approve_')) {
      action = 'approved';
      userId = data.replace('approve_', '');
    } else if (data.startsWith('reject_')) {
      action = 'rejected';
      userId = data.replace('reject_', '');
    }

    if (userId) {
      // 1. جلب البيانات الحالية من السحابة
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Master-Key': API_KEY }
      });
      const currentData = await getRes.json();
      const record = currentData.record || {};

      // 2. تحديث حالة المستخدم
      record[userId] = action;

      // 3. حفظ الحالة الجديدة في السحابة
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify(record)
      });

      // 4. تحديث نص الرسالة في تليجرام
      const statusText = action === 'approved' ? "✅ *حالة الطلب: تم الموافقة بنجاح*" : "❌ *حالة الطلب: تم الرفض*";
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: update.callback_query.message.text + `\n\n${statusText}`,
          parse_mode: 'Markdown'
        })
      });
    }
  }

  return res.status(200).json({ ok: true });
}
