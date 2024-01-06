import { AxiosInstance } from "axios";
import { parse, HTMLElement } from 'node-html-parser';
import { createHash } from 'crypto';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { IPost } from "../interfaces/IPost";
import { IPostProviderService } from "../interfaces/IPostProviderService";

dayjs.extend(customParseFormat);

const _cedaeNewsPageUrl = 'https://cedae.com.br/Noticias/';

interface NewsEntryData {
    title: string;
    link: string;
}

interface NewsContentAndDate {
    content: string,
    date: Date
}

export class CedaeService implements IPostProviderService {

    constructor(
        private _axios: AxiosInstance
    ) {}

    async getPosts(): Promise<IPost[]> {
        const responseData = await this.getNewsData();

        const newsEntries = this.getNewsEntries(responseData);

        const posts: IPost[] = [];

        for (const newsEntry of newsEntries) {
            const contentAndDate = await this.getPostContentAndDate(newsEntry.link);

            if (!contentAndDate) { continue; }

            posts.push({
                id: createHash('sha1').update(contentAndDate.content).digest('hex'),
                ...contentAndDate,
                ...newsEntry,
            });
        }

        return posts;
    }

    private async getNewsData(): Promise<string> {
        const { data } = await this._axios.get(_cedaeNewsPageUrl);

        return data;
    }

    private getNewsEntries(responseData: string): NewsEntryData[] {
        const rootNode = parse(responseData);
        const searchList = rootNode.querySelector('.lista-busca');

        const entries: NewsEntryData[] = [];
        for (const titleElement of searchList?.querySelectorAll('a') ?? []) {
            const postPath = titleElement.getAttribute('href');

            if (!postPath) { continue; }

            entries.push({
                title: titleElement.text,
                link: new URL(postPath, _cedaeNewsPageUrl).href
            });
        }

        return entries;
    }

    private async getPostContentAndDate(link: string): Promise<NewsContentAndDate | undefined> {
        const { data } = await this._axios.get(link);

        const rootNode = parse(data);

        const dateElement = rootNode.querySelector('[id$=DateStart]');
        const contentElement = rootNode.querySelector('[id$=NewsBody]');

        if (!dateElement || !contentElement) {
            return undefined;
        }

        const dateString = dateElement.text;
        const date = dayjs(dateString, 'DD/MM/YYYY').toDate();

        const contentText = contentElement.text;
        const content = contentText?.trim().replace(/(\r?\n)+/g, '\n\n');

        return { content, date };
    }
}
