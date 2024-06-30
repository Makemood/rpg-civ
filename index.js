// index.js
import TelegramBot from 'node-telegram-bot-api';
const token = '7010601200:AAEk91a9jJvEvtTt7_26oiOtWxK9sMzttk4';
const webAppUrl = 'https://tggame.netlify.app';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async(msg) => {

    const chatId = msg.chat.id;
    const text = msg.text;

    if(text === '/start'){
        await bot.sendMessage(chatId,'Ниже появится кнопка, заполни форму', {
            reply_markup:{
                inline_keyboard: [
                    [{text: 'Заполнить форму', web_app: {url: webAppUrl}}]
                ]
            }
        })
    }
    bot.sendMessage(chatId, "text");
});

