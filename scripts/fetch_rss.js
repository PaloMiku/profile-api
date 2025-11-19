import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import fs from 'fs-extra';
import path from 'path';

const feedUrl = process.env.ATOM_URL || process.argv[2] || 'https://blog.sotkg.com/atom.xml';
const out = process.env.RSS_FILE || 'data/blog.json';

async function fetchRss() {
  const res = await fetch(feedUrl, { headers: { 'User-Agent': 'rss-to-json' } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  const parsed = await parseStringPromise(text, { explicitArray: false });

  // Atom format: feed.entry can be array or single object
  const feed = parsed.feed || {};
  const allEntries = (Array.isArray(feed.entry) ? feed.entry : (feed.entry ? [feed.entry] : [])).map(e => {
    const link = (e.link && (e.link.href || (Array.isArray(e.link) ? e.link[0].$.href : e.link.$.href))) || null;
    return {
      id: e.id || null,
      title: e.title && e.title._ ? e.title._ : e.title,
      link: link,
      published: e.published || e.updated || null,
      updated: e.updated || e.published || null,
      summary: e.summary || e.content || null
    };
  });
  
  // 按发布时间排序，取所有文章
  const entries = allEntries
    .sort((a, b) => new Date(b.published) - new Date(a.published));

  await fs.ensureDir(path.dirname(out));
  const obj = { feedUrl, updatedAt: new Date().toISOString(), entries };
  await fs.writeJSON(out, obj, { spaces: 2 });
  console.log(`Saved ${entries.length} entries to ${out}`);
}

fetchRss().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
