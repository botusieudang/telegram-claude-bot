const TelegramBot = require("node-telegram-bot-api");
const Anthropic = require("@anthropic-ai/sdk");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Lưu lịch sử chat theo từng user
const conversations = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  conversations[chatId] = [];
  bot.sendMessage(chatId, "Xin chào! Tao là Claude 🤖\nGõ /clear để xoá lịch sử hội thoại.");
});

bot.onText(/\/clear/, (msg) => {
  const chatId = msg.chat.id;
  conversations[chatId] = [];
  bot.sendMessage(chatId, "Đã xoá lịch sử hội thoại ✅");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text;

  if (!userText || userText.startsWith("/")) return;

  // Khởi tạo lịch sử nếu chưa có
  if (!conversations[chatId]) conversations[chatId] = [];

  // Thêm tin nhắn user vào lịch sử
  conversations[chatId].push({ role: "user", content: userText });

  // Giới hạn lịch sử 20 tin nhắn gần nhất để tiết kiệm token
  if (conversations[chatId].length > 20) {
    conversations[chatId] = conversations[chatId].slice(-20);
  }

  try {
    await bot.sendChatAction(chatId, "typing");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: conversations[chatId],
    });

    const reply = response.content[0].text;

    // Thêm reply của Claude vào lịch sử
    conversations[chatId].push({ role: "assistant", content: reply });

    bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Có lỗi xảy ra, thử lại sau nhé.");
  }
});

console.log("Bot đang chạy...");
