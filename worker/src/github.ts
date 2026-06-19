/**
 * Атомарный коммит в git через Git Data API: blobs → tree → commit → ref.
 * Один коммит = yaml объекта + (опц.) фото. Один push → один билд.
 */
const API = "https://api.github.com";

interface FileBlob { path: string; content: string; encoding: "utf-8" | "base64"; }

export async function commitFiles(opts: {
  token: string; owner: string; repo: string; branch: string;
  message: string; files: FileBlob[];
}): Promise<{ sha: string }> {
  const { token, owner, repo, branch, message, files } = opts;
  const h = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "domcon-worker",
    "Content-Type": "application/json",
  };
  const base = `${API}/repos/${owner}/${repo}`;

  // 1. текущий ref + базовый дерево-коммит
  const ref = await (await fetch(`${base}/git/ref/heads/${branch}`, { headers: h })).json() as any;
  const baseСommitSha = ref.object.sha;
  const baseCommit = await (await fetch(`${base}/git/commits/${baseСommitSha}`, { headers: h })).json() as any;

  // 2. blobs
  const blobs = await Promise.all(files.map(async (f) => {
    const r = await fetch(`${base}/git/blobs`, { method: "POST", headers: h, body: JSON.stringify({ content: f.content, encoding: f.encoding }) });
    const j = await r.json() as any;
    return { path: f.path, mode: "100644", type: "blob", sha: j.sha };
  }));

  // 3. tree поверх базового
  const tree = await (await fetch(`${base}/git/trees`, { method: "POST", headers: h, body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: blobs }) })).json() as any;

  // 4. commit
  const commit = await (await fetch(`${base}/git/commits`, { method: "POST", headers: h, body: JSON.stringify({ message, tree: tree.sha, parents: [baseСommitSha] }) })).json() as any;

  // 5. update ref
  await fetch(`${base}/git/refs/heads/${branch}`, { method: "PATCH", headers: h, body: JSON.stringify({ sha: commit.sha }) });

  return { sha: commit.sha };
}
