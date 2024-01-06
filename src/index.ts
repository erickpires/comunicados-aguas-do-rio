import axios from "axios";
import { AguasDoRioService } from "./services/AguasDoRioService";
import { PostService } from "./services/PostService";
import { TelegramService } from "./services/TelegramService";
import { StorageService } from "./services/StorageService";
import { CedaeService } from "./services/CedaeService";

const main = async () => {
    const storageService = await StorageService.create();

    const axiosInstance = axios.create();
    const postService = new PostService([
        // TODO: Add Rio+Saneammento
        new AguasDoRioService(axiosInstance),
        new CedaeService(axiosInstance),
    ], storageService);

    const telegramService = new TelegramService();

    const posts = await postService.getCurrentPosts();
    const filteredPosts = await postService.filterUnhandledPosts(posts);

    if (filteredPosts.length === 0) {
        console.log("No unhandled posts");
    }

    const sortedPosts = filteredPosts.sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const post of sortedPosts) {
        await telegramService.sendPost(post);
    }

    await postService.saveHandledPosts(sortedPosts);

    await storageService.close();
};

main();
