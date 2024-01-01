import { IPost } from './IPost';

export interface IPostProviderService {
    getPosts(): Promise<IPost[]>
}
