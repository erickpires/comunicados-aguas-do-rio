import { Knex, knex } from 'knex';
import { PostDAO } from '../daos/PostDAO';

const POSTS_DB_TABLE = 'Posts';

export class StorageService {
    private _knexInstance: Knex<any, unknown[]>;

    private constructor() {
        const config: Knex.Config = {
            client: 'sqlite3',
            connection: {
                filename: './data.db'
            },
            useNullAsDefault: true
        }

        this._knexInstance = knex(config);
    }

    async getPostsWithIds(currentIds: string[]): Promise<PostDAO[]> {
        return await this._knexInstance<PostDAO>(POSTS_DB_TABLE).select().whereIn('id', currentIds);
    }

    async savePosts(posts: PostDAO[]): Promise<void> {
        // NOTE: If this query is taking too long, we can try to bulk insert here.
        for (const post of posts) {
            await this._knexInstance<PostDAO>(POSTS_DB_TABLE).insert(post);
        }
    }

    static async create(): Promise<StorageService> {
        const result = new StorageService();

        await result.initialize();

        return result;
    }

    private async initialize(): Promise<void> {
        if (!(await this._knexInstance.schema.hasTable(POSTS_DB_TABLE))) {
            await this._knexInstance.schema.createTable(POSTS_DB_TABLE, (table) => {
                table.string('id'),
                table.dateTime('date'),
                table.dateTime('handledAt')
            });
        }
    }

    async close(): Promise<void> {
        await this._knexInstance.destroy();
    }
}
