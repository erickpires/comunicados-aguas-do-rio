import axios from "axios";
import { AguasDoRioService } from "./services/AguasDoRioService";
import { PostService } from "./services/PostService";
import { TelegramService } from "./services/TelegramService";
import { StorageService } from "./services/StorageService";

const main = async () => {
    const storageService = await StorageService.create();

    const axiosInstance = axios.create();
    const postService = new PostService([
        // TODO: Add CEDAE and Rio+Saneammento
        new AguasDoRioService(axiosInstance)
    ], storageService);

    const telegramService = new TelegramService();

    const posts = await postService.getCurrentPosts();
    const filteredPosts = await postService.filterUnhandledPosts(posts);

    if (filteredPosts.length === 0) {
        console.log("No unhandled posts");
    }

    for (const post of filteredPosts) {
        await telegramService.sendPost(post);
    }

    await postService.saveHandledPosts(filteredPosts);

    await storageService.close();
};

main();
