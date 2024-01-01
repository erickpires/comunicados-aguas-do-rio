import { IPost } from "./IPost";

export interface ITelegramService {
    sendPost(post: IPost): Promise<void>;
}
