import { getChangedFiles } from "./github.js";
import { embedAndStore } from "./embed.js";

export async function indexRepo(repo) {
  const files = await getChangedFiles(repo);

  for (const file of files) {
    if (!file.filename.match(/\.(js|html|md)$/)) continue;

    await embedAndStore({
      repo,
      path: file.filename,
      content: file.content
    });
  }
}
