import express from "express";
import crypto from "crypto";
import { indexRepo } from "./index.js";

const app = express();
app.use(express.json());

app.post("/github-webhook", async (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const hmac = crypto
    .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (`sha256=${hmac}` !== signature) {
    return res.status(401).send("Invalid signature");
  }

  const repo = req.body.repository.full_name;
  console.log("📦 Push detected:", repo);

  await indexRepo(repo);
  res.send("Indexed");
});

app.listen(3000);
