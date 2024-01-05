import { AxiosInstance } from "axios";
import { parse } from 'node-html-parser';
import { createHash } from 'crypto';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { IPost } from "../interfaces/IPost";
import { IPostProviderService } from "../interfaces/IPostProviderService";

dayjs.extend(customParseFormat);

const totalPostsToQuery = 10;
const AguasDoRioServiceQueryUrl = `https://aguasdorio.com.br/wp-admin/admin-ajax.php?id=lista-noticias&posts_per_page=${totalPostsToQuery}&page=0&offset=0&repeater=default&preloaded=false&preloaded_amount=0&category=comunicados&order=DESC&orderby=date&action=alm_get_posts`;

export class AguasDoRioService implements IPostProviderService {

    constructor(
        private _axios: AxiosInstance
    ) {}

    async getPosts(): Promise<IPost[]> {
        const responseData = await this.getRequestData();

        const rootNode = parse(responseData);
        const postsNodes = rootNode.querySelectorAll('.content-holder');

        const posts: IPost[] = [];
        for (const postNode of postsNodes) {
            const dateNode = postNode.querySelector('.date');
            const dateString = dateNode?.text;
            const date = dayjs(dateString, 'DD/MM/YYYY').toDate();

            const linkNode = postNode.querySelector('.link-title');
            const link = linkNode?.getAttribute('href');

            const titleNode = postNode.querySelector('.card-title');
            const title = titleNode?.text;

            const contentNode = postNode.querySelector('.card-text');
            const contentText = contentNode?.text;
            const content = contentText?.trim().replace(/\n+/g, '\n\n');

            // Ignoring cards without content.
            if (!content) {
                continue;
            }

            posts.push({
                id: createHash('sha1').update(content).digest('hex'),
                date,
                title,
                link,
                content
            });
        }

        return posts;
    }

    private async getRequestData(): Promise<string> {
        const { data } = await this._axios.get(AguasDoRioServiceQueryUrl);

        return data.html;
    }
}
