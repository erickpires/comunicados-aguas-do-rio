import { AxiosInstance } from "axios";
import { parse, HTMLElement } from 'node-html-parser';
import { createHash } from 'crypto';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/pt-br';

import { IPost } from "../interfaces/IPost";
import { IPostProviderService } from "../interfaces/IPostProviderService";

dayjs.extend(customParseFormat);
dayjs.locale('pt-br');

const _rioSaneamentoNewsPageUrl = 'https://www.riomaissaneamento.com.br/noticias/';

interface NewsEntryData {
    title: string;
    link: string;
    date: Date;
}

export class RioSaneamentoService implements IPostProviderService {

    constructor(
        private _axios: AxiosInstance
    ) {}

    async getPosts(): Promise<IPost[]> {
        const { data: pageData } = await this._axios.get(_rioSaneamentoNewsPageUrl);

        const newsEntries = this.getNewsEntries(pageData);

        const posts: IPost[] = [];

        for (const newsEntry of newsEntries) {
            const content = await this.getPostContent(newsEntry.link);

            if (!content) { continue; }

            posts.push({
                id: createHash('sha1').update(content).digest('hex'),
                content,
                ...newsEntry,
            });
        }

        return posts;
    }

    private getNewsEntries(responseData: string): NewsEntryData[] {
        const rootNode = parse(responseData);
        const mainNews = rootNode.querySelector('.gab-newsBlockWrapper');
        const secondaryNews = rootNode.querySelector('.gab-latest-posts');

        if (!mainNews || !secondaryNews) { return []; }

        return [
            ...this.getMainNews(mainNews),
            ...this.getSecondaryNews(secondaryNews)
        ];
    }

    private getMainNews(newsRootElement: HTMLElement): NewsEntryData[] {
        const newsElements = newsRootElement.getElementsByTagName('a');

        const entries: NewsEntryData[] = [];
        for (const newsElement of newsElements) {
            const dateElement = newsElement.querySelector('.gab-newsBlockWrapper__date');
            const dateString = dateElement?.text.trim();
            const date = dayjs(dateString, 'D/MM/YYYY').toDate();

            const titleElement = newsElement.querySelector('.gab-newsBlockWrapper__title');
            const title = titleElement?.text.trim();

            const link = newsElement.getAttribute('href');

            if (!date || !title || !link) { continue; }

            entries.push({
                title,
                date,
                link: new URL(link, _rioSaneamentoNewsPageUrl).href,
            });
        }

        return entries;
    }

    private getSecondaryNews(newsRootElement: HTMLElement): NewsEntryData[] {
        const newsElements = newsRootElement.querySelectorAll('.href-wrapper');

        const entries: NewsEntryData[] = [];
        for (const newsElement of newsElements) {
            const dateElement = newsElement.querySelector('.card-date');
            const dateString = dateElement?.text.trim();
            const date = dayjs(dateString, 'D/MM/YYYY').toDate();

            const titleElement = newsElement.querySelector('.card-title');
            const title = titleElement?.text.trim();

            const link = newsElement.getAttribute('href');

            if (!date || !title || !link) { continue; }

            entries.push({
                title,
                date,
                link: new URL(link, _rioSaneamentoNewsPageUrl).href,
            });
        }

        return entries;
    }

    private async getPostContent(link: string): Promise<string | undefined> {
        const { data } = await this._axios.get(link);

        const rootNode = parse(data);

        const contentElement = rootNode.querySelector('.content-single__content');
        const content = contentElement?.text.trim().replace(/(\r?\n)+/g, '\n\n');

        return content;
    }
}
