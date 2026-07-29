const { requireSession } = require('./_auth');

// Only these two repos can ever be touched, and only under these path
// prefixes — the GitHub token itself grants far more than that, so this
// allowlist is what actually keeps a logged-in colleague scoped to
// "restaurant content and images" instead of "the entire GitHub account".
const REPOS = {
  legrandpan: 'amandineglucoz-hash/Le-Grand-Pan',
  piennolo: 'amandineglucoz-hash/Piennolo',
};

const SAFE_PATH = /^(content\/[^/]+\.json|content\/preview\/[^/]+\.json|le-grand-pan-assets\/[^/]+|piennolo-assets\/[^/]+)$/;

function resolveRepo(site) {
  return REPOS[site] || null;
}

function isSafePath(path) {
  return typeof path === 'string' && !path.includes('..') && SAFE_PATH.test(path);
}

async function githubFetch(path, opts = {}) {
  const token = (process.env.GITHUB_TOKEN || '').trim();
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  if (!/^[\x21-\x7e]+$/.test(token)) throw new Error('GITHUB_TOKEN contains an invalid character — re-copy it from GitHub, it may have been pasted from a masked display');
  const r = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  return r;
}

module.exports = async function handler(req, res) {
  try {
    await handleRequest(req, res);
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: e.message });
  }
};

async function handleRequest(req, res) {
  const login = requireSession(req, res);
  if (!login) return;

  if (req.method === 'GET') {
    const { site, path } = req.query;
    const repo = resolveRepo(site);
    if (!repo || !isSafePath(path)) {
      res.status(400).json({ error: 'Invalid site or path' });
      return;
    }
    const r = await githubFetch(`/repos/${repo}/contents/${path}`);
    if (!r.ok) {
      res.status(r.status).json({ error: `GitHub ${r.status}` });
      return;
    }
    const data = await r.json();
    const raw = Buffer.from(data.content, 'base64').toString('utf8');
    let content;
    try {
      content = JSON.parse(raw);
    } catch {
      res.status(500).json({ error: 'File is not valid JSON' });
      return;
    }
    res.status(200).json({ content, sha: data.sha });
    return;
  }

  if (req.method === 'PUT') {
    const { site, path, content, base64, message } = req.body || {};
    const repo = resolveRepo(site);
    if (!repo || !isSafePath(path)) {
      res.status(400).json({ error: 'Invalid site or path' });
      return;
    }
    if (content === undefined && !base64) {
      res.status(400).json({ error: 'Missing content' });
      return;
    }

    const encoded = base64 || Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    let sha;
    const existing = await githubFetch(`/repos/${repo}/contents/${path}`);
    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }

    const putRes = await githubFetch(`/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: message || `Update ${path} (via BO, ${login})`,
        content: encoded,
        branch: 'main',
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const errBody = await putRes.text();
      res.status(putRes.status).json({ error: `GitHub ${putRes.status}`, detail: errBody });
      return;
    }
    const putData = await putRes.json();
    res.status(200).json({ ok: true, sha: putData.content && putData.content.sha });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
