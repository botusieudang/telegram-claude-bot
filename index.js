const TelegramBot = require("node-telegram-bot-api");
const Anthropic = require("@anthropic-ai/sdk");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const conversations = {};
bot.onText(/\/start/, (msg) => { conversations[msg.chat.id] = []; bot.sendMessage(msg.chat.id, "Xin chao! Tao la Claude Bot. Go /clear de xoa lich su."); });
bot.onText(/\/clear/, (msg) => { conversations[msg.chat.id] = []; bot.sendMessage(msg.chat.id, "Da xoa lich su."); });
bot.on("message", async (msg) => {
  const chatId = msg.chat.id; const text = msg.text;
  if (!text || text.startsWith("/")) return;
  if (!conversations[chatId]) conversations[chatId] = [];
  conversations[chatId].push({ role: "user", content: text });
  if (conversations[chatId].length > 20) conversations[chatId] = conversations[chatId].slice(-20);
  try {
    await bot.sendChatAction(chatId, "typing");
    const r = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 1024, messages: conversations[chatId] });
    const reply = r.content[0].text;
    conversations[chatId].push({ role: "assistant", content: reply });
    bot.sendMessage(chatId, reply);
  } catch(e) { bot.sendMessage(chatId, "Co loi xay ra."); }
});
console.log("Bot dang chay...");