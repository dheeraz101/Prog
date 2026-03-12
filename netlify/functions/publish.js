const { Octokit } = require("@octokit/rest");

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body);
    const { user, text, link } = body;

    if (!text || text.trim().length < 1) {
        return { statusCode: 400, body: "Post text required" };
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH;
    const filePath = process.env.POSTS_FILE_PATH;

    try {
        // 1. Get the current posts.json
        const { data: fileData } = await octokit.repos.getContent({
            owner: repo.split("/")[0],
            repo: repo.split("/")[1],
            path: filePath,
            ref: branch
        });

        const content = Buffer.from(fileData.content, "base64").toString("utf-8");
        const posts = JSON.parse(content);

        // 2. Add new post at the beginning
        const newPost = {
            user,
            text,
            link: link || "",
            time: Date.now()
        };
        posts.unshift(newPost);

        // 3. Commit updated posts.json
        await octokit.repos.createOrUpdateFileContents({
            owner: repo.split("/")[0],
            repo: repo.split("/")[1],
            path: filePath,
            message: `New post by ${user}`,
            content: Buffer.from(JSON.stringify(posts, null, 2)).toString("base64"),
            sha: fileData.sha,
            branch: branch
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, post: newPost })
        };

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: "Internal Server Error" };
    }
};