import { AxiosInstance } from "axios";
import { parse } from 'node-html-parser';
import { createHash } from 'crypto';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';

import 'dayjs/locale/pt-br';
import 'dayjs/locale/en';

import { IPost } from "../interfaces/IPost";
import { IPostProviderService } from "../interfaces/IPostProviderService";

dayjs.extend(customParseFormat);
dayjs.extend(localeData);

dayjs.locale('pt-br');

const _iguaNewsPageUrl = 'https://igua.com.br/noticias?page=1';

interface NewsEntryData {
    title: string;
    link: string;
    date: Date;
}


export class IguaService implements IPostProviderService {

    constructor(
        private _axios: AxiosInstance
    ) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    async getPosts(): Promise<IPost[]> {
        const { data: pageData } = await this._axios.get(_iguaNewsPageUrl);

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
        const newsWrapperElement = rootNode.querySelector('.infinite-scroll');

        if (!newsWrapperElement) { return []; }

        const newsElements = newsWrapperElement.querySelectorAll('.infinite-scroll-content');

        const newsEntries: NewsEntryData[] = [];
        for (const newsElement of newsElements) {
            const titleElement = newsElement.querySelector('h3');
            const dateElement = newsElement.querySelector('p > span > span');
            const knowMoreElement = newsElement.querySelector('a');

            const title = titleElement?.text.trim();
            const dateString = dateElement?.text.trim();
            const link = knowMoreElement?.getAttribute('href');

            if (!title || !dateString || !link) { continue; }

            const date = this.parseDate(dateString);

            newsEntries.push({
                title,
                date,
                link: new URL(link, _iguaNewsPageUrl).href
            });
        }

        return newsEntries;
    }

    private parseDate(dateString: string): Date {
        const [day, monthName, year] = dateString.split('de').map(e => e.trim());

        const localeData = dayjs().locale('en').localeData();
        const months = localeData.months();
        const month = (months.findIndex((value) => value.toLowerCase() === monthName.toLocaleLowerCase()) + 1).toFixed(2);

        return dayjs(`${day}/${month}/${year}`, 'DD/MM/YYYY').toDate();
    }

    private async getPostContent(link: string): Promise<string | undefined> {
        const { data } = await this._axios.get(link);

        const rootNode = parse(data);

        const contentElement = rootNode.querySelector('.text-standard');
        const content = contentElement?.text.trim().replace(/(\r?\n)+/g, '\n\n');

        return content;
    }
}
