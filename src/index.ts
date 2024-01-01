import axios from "axios";
import { AguasDoRioService } from "./services/AguasDoRioService";
import { PostService } from "./services/PostService";
import { TelegramService } from "./services/TelegramService";

const axiosInstance = axios.create();
const postService = new PostService([
    // TODO: Add CEDAE and Rio+Saneammento
    new AguasDoRioService(axiosInstance)
]);

const telegramService = new TelegramService();

const main = async () => {
    const posts = await postService.getCurrentPosts();
    const filteredPosts = await postService.filterUnhandledPosts(posts);

    for (const post of posts) {
        console.log(post);
        await telegramService.sendPost(post);
    }

    await postService.saveHandledPosts(filteredPosts);
};



main();
