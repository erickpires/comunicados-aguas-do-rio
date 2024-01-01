import { IPost } from "./IPost";

export interface IPostService {
    getCurrentPosts(): Promise<IPost[]>;
    filterUnhandledPosts(posts: IPost[]): Promise<IPost[]>;
    saveHandledPosts(posts: IPost[]): Promise<void>;
}
