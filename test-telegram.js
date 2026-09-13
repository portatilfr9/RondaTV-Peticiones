async function run() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("Missing tokens. token:", !!token, "chatId:", !!chatId);
    return;
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  console.log("Sending to:", chatId, "using URL:", url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: "Prueba desde AI Studio",
        parse_mode: 'Markdown'
      })
    });
    console.log("Status:", res.status);
    const data = await res.text();
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch err:", err);
  }
}
run();
