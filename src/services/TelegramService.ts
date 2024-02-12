import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

import { IPost } from "../interfaces/IPost";
import { ITelegramService } from "../interfaces/ITelegramService";
import { sleep } from '../utils';

const _messagesInterval = 3000;
// NOTE: Telegram limit is 4096 characters. We are leaving some room at the end 
// so we can put a continuation message.
const _messageMaxSize = 4000; 

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

        const messageChunks = this.splitMessagesIntoChunks(message);

        for (const messageChunk of messageChunks) {
            await this._bot.sendMessage(chatId, messageChunk, { parse_mode: 'Markdown' });

            await sleep(_messagesInterval);
        }
    }

    private splitMessagesIntoChunks(message: string): string[] {
        const result = [] as string[];

        let remaining = message;
        while (remaining.length > _messageMaxSize) {
            // NOTE: First we try to break the message at a paragraph boundary
            // search for a newline character. If we can't find a suitable split point,
            // we try to break the message at a word boundary by searching for 
            // a space characters. If no neither case is found, we split the 
            // message at the last possible character.
            const indexOfLastNewLine = remaining.lastIndexOf('\n', _messageMaxSize);
            const indexOfLastSpace = remaining.lastIndexOf(' ', _messageMaxSize);

            const splitPoint = indexOfLastNewLine !== -1 ? indexOfLastNewLine : 
                                (indexOfLastSpace !== -1 ? indexOfLastSpace : _messageMaxSize);

            const messageChunk = remaining.substring(0, splitPoint).trimEnd() + ' […]';
            remaining = '[…] ' + remaining.substring(splitPoint).trimStart();

            result.push(messageChunk);
        }

        result.push(remaining);

        return result;
    }
}
