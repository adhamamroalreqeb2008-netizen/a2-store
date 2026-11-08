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
    
    // ضع هنا توكن البوت الجديد
    const BOT_TOKEN = "9011285196:AAFLcMJppnOU51HosR3g1ujHC4Vx0HVtXTg";
    
    // ضع هنا الـ BIN_ID و الـ Master Key الخاص بـ JSONBin
    const BIN_ID = "6af041a3ffd5d16053b0b102";
    const API_KEY = "$2a$10$KdTTWrgsRm/Rk01Njf6HmurDvGeNyAcYaUsLuCIWF20baDFcigsQ6";

    let action = '';
    let userId = '';

    if (data.startsWith('approve_pay_')) {
      action = 'approved';
      userId = data.replace('approve_pay_', '');
    } else if (data.startsWith('reject_pay_')) {
      action = 'rejected';
      userId = data.replace('reject_pay_', '');
    }

    if (userId) {
      // 1. جلب البيانات من JSONBin
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Master-Key': API_KEY }
      });
      const currentData = await getRes.json();
      const record = currentData.record || {};

      // 2. تحديث حالة المستخدم
      record[`pay_${userId}`] = action;

      // 3. حفظ الحالة الجديدة في JSONBin
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify(record)
      });

      // 4. تعديل شكل الرسالة في تليجرام لتظهر أنه تم القبول أو الرفض
      const statusText = action === 'approved' ? "✅ *تمت موافقة عملية الدفع*" : "❌ *تم رفض عملية الدفع*";
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
