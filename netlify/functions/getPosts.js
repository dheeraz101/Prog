const { Octokit } = require("@octokit/rest");

exports.handler = async function() {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH;
    const filePath = process.env.POSTS_FILE_PATH;

    const { data: fileData } = await octokit.repos.getContent({
      owner: repo.split("/")[0],
      repo: repo.split("/")[1],
      path: filePath,
      ref: branch
    });

    const content = Buffer.from(fileData.content, "base64").toString("utf-8");
    const posts = JSON.parse(content);

    return {
      statusCode: 200,
      body: JSON.stringify(posts.reverse()) // newest first
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Failed to fetch posts" };
  }
};