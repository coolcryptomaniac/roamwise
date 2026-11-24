/* Writes a local config only for the dedicated preview Worker. Never edits the
 * production Worker, routes, DNS, payment or identity settings. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export function previewConfig(databaseId){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(databaseId||''))throw Error('Dedicated D1 UUID required');
 return [
 'name = "roamwise-public-knowledge-preview"','main = "approved-reader.mjs"','compatibility_date = "2026-11-23"','workers_dev = true',
 '[vars]','PUBLIC_MEDIA_ORIGIN = ""','PUBLIC_ALLOWED_ORIGINS = "https://roamwise-web.pages.dev,https://roamwise.co.in,https://www.roamwise.co.in,https://roamwise.tech"',
 '[[d1_databases]]','binding = "PUBLIC_KNOWLEDGE_DB"','database_name = "roamwise-knowledge-dev"','database_id = "'+databaseId+'"',
 '[[r2_buckets]]','binding = "PUBLIC_MEDIA_BUCKET"','bucket_name = "roamwise-public-media-dev"',''
 ].join('\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 fs.writeFileSync('cloudflare/knowledge/wrangler.preview.generated.toml',previewConfig(process.env.RW_PREVIEW_D1_ID),{flag:'wx'});
}
