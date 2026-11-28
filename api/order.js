export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const botToken = process.env.ORDER_BOT_TOKEN;
  const chatId = process.env.ORDER_CHAT_ID;

  if (!botToken || !chatId) {
    return res.status(500).json({
      ok: false,
      error: "Missing ORDER_BOT_TOKEN or ORDER_CHAT_ID in Vercel"
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const product = String(body.product || "").trim();
    const downPayment = Number(body.downPayment ?? 0);
    const totalPrice = Number(body.totalPrice ?? 0);

    if (!name || !address || !product) {
      return res.status(400).json({
        ok: false,
        error: "يرجى إرسال الاسم والعنوان واسم الجهاز"
      });
    }

    const orderId =
      body.orderId ||
      ("INV-" + Date.now().toString().slice(-6));

    const host = req.headers["x-forwarded-host"] || req.headers.host || "playfonez2.vercel.app";
    const proto = req.headers["x-forwarded-proto"] || "https";

    const downVal = Number.isFinite(downPayment) ? downPayment : 0;
    const totalVal = Number.isFinite(totalPrice) ? totalPrice : 0;

    const params = new URLSearchParams({
      orderId,
      name,
      phone,
      address,
      product,
      qty: String(Number(body.qty || 1)),
      payMethod: String(body.payMethod || "تقسيط"),
      down: String(downVal),
      total: String(totalVal)
    });

    const invoiceUrl = `${proto}://${host}/invoice.html?${params.toString()}`;

    const text = [
      `• الاسم: ${name}`,
      `• الرقم: ${phone || "—"}`,
      `• العنوان: ${address}`,
      `• اسم الجهاز: ${product}`,
      `• الدفعة الأولى: ${downVal.toLocaleString("en-US")} د.إ`,
      `• السعر الكلي: ${totalVal.toLocaleString("en-US")} د.إ`,
      `• رابط الفاتورة: ${invoiceUrl}`
    ].join("\n");

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: false
      })
    });

    const tgData = await tgRes.json();
    if (!tgRes.ok || !tgData.ok) {
      return res.status(500).json({
        ok: false,
        error: tgData.description || "Telegram sendMessage failed"
      });
    }

    return res.status(200).json({ ok: true, orderId, invoiceUrl });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || "Server error"
    });
  }
}
