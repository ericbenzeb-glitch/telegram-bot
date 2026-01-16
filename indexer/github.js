import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export async function getChangedFiles(repo) {
  const [owner, name] = repo.split("/");

  const commits = await octokit.rest.repos.listCommits({
    owner,
    repo: name,
    per_page: 1
  });

  const sha = commits.data[0].sha;

  const commit = await octokit.rest.repos.getCommit({
    owner,
    repo: name,
    ref: sha
  });

  return commit.data.files.map(f => ({
    filename: f.filename,
    content: f.patch || ""
  }));
}
