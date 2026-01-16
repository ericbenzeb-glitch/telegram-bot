import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function embedAndStore({ repo, path, content }) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content
  });

  await supabase.from("code_embeddings").upsert({
    repo,
    path,
    content,
    embedding: embedding.data[0].embedding
  });
}
