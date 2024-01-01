import { IPost } from "../interfaces/IPost";
import { IPostProviderService } from "../interfaces/IPostProviderService";
import { IPostService } from "../interfaces/IPostService";

export class PostService implements IPostService {

    constructor(
        private _postProviders: IPostProviderService[]
    ){}

    async getCurrentPosts(): Promise<IPost[]> {
        const result: IPost[] = [];
        for (const provider of this._postProviders) {
            result.push(... (await provider.getPosts()));
        }

        return result;
    }

    async filterUnhandledPosts(posts: IPost[]): Promise<IPost[]> {
        // TODO: Load handled ids from persistent storage and filter out handled posts.
        return posts;
    }

    async saveHandledPosts(posts: IPost[]): Promise<void> {
        // TODO: Save handled posts ids in persistent storage.
    }
}
