import { PostDAO } from "../daos/PostDAO";
import { IPost } from "../interfaces/IPost";
import { IPostProviderService } from "../interfaces/IPostProviderService";
import { IPostService } from "../interfaces/IPostService";
import { StorageService } from "./StorageService";

export class PostService implements IPostService {

    constructor(
        private _postProviders: IPostProviderService[],
        private _storageService: StorageService
    ){}

    async getCurrentPosts(): Promise<IPost[]> {
        const result: IPost[] = [];
        for (const provider of this._postProviders) {
            result.push(... (await provider.getPosts()));
        }

        return result;
    }

    async filterUnhandledPosts(posts: IPost[]): Promise<IPost[]> {
        const currentIds = posts.map(post => post.id);

        const handledPosts = await this._storageService.getPostsWithIds(currentIds);
        const handledIds = new Set(handledPosts.map(post => post.id));

        return posts.filter(post => !handledIds.has(post.id));
    }

    async saveHandledPosts(posts: IPost[]): Promise<void> {
        const now = new Date();
        const handledPosts = posts.map<PostDAO>(post => ({
            id: post.id,
            date: post.date,
            handledAt: now
        }));

        await this._storageService.savePosts(handledPosts);
    }
}
