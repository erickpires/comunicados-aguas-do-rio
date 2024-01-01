import axios from "axios";
import { AguasDoRioService } from "./services/AguasDoRioService";
import { PostService } from "./services/PostService";

const axiosInstance = axios.create();
const postService = new PostService([
    // TODO: Add CEDAE and Rio+Saneammento
    new AguasDoRioService(axiosInstance)
]);

const main = async () => {
    const posts = await postService.getCurrentPosts();
    const filteredPosts = await postService.filterUnhandledPosts(posts);

    for (const post of posts) {
        console.log(post);
    }

    await postService.saveHandledPosts(filteredPosts);
};



main();
