import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

import { IPost } from "../interfaces/IPost";
import { ITelegramService } from "../interfaces/ITelegramService";
import { sleep } from '../utils';

const _messagesInterval = 3000;

const chatId = process.env.CHAT_ID ?? '';
const token = process.env.BOT_API_KEY ?? '';

export class TelegramService implements ITelegramService {
    private _bot: TelegramBot;
    private _dateTimeFormat: Intl.DateTimeFormat;

    constructor() {
        this._dateTimeFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        this._bot = new TelegramBot(token, {polling: false});
    }
    async sendPost(post: IPost): Promise<void> {
        const title = post.link ?
                        `[${post.title}](${post.link})` :
                        `*${post.title}*`;

        const message = `${title}\n\n_Data: ${this._dateTimeFormat.format(post.date)}_\n\n ${post.content}`;

        await this._bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

        await sleep(_messagesInterval);
    }
}
