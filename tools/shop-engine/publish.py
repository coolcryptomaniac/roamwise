#!/usr/bin/env python3
"""Upload shop-engine designs from build/shop-engine/* to R2 (roamwise-media) and register them in D1.
QC-passed designs enter as 'review' (the Worker cron makes them live when SHOP_ENGINE_AUTOPUBLISH=true);
QC-failed designs are recorded as 'rejected' so the history is complete. Needs wrangler 4 and the
CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID environment. Usage: publish.py build/shop-engine"""
import json, pathlib, subprocess, sys

BUCKET, DB = 'roamwise-media', 'roamwise-db'
COLS = ['id', 'product_type', 'title', 'tagline', 'collection', 'print_url', 'mockup_url', 'placement',
        'print_w_in', 'print_h_in', 'status', 'source', 'qc_json']


def q(v):
    return str(v) if isinstance(v, (int, float)) else "'" + str(v).replace("'", "''") + "'"


def run(*a):
    print('+', ' '.join(a[:6]))
    subprocess.run(a, check=True)


def main(root):
    n = 0
    for d in sorted(pathlib.Path(root).glob('auto-*')):
        row = json.loads((d / 'design.json').read_text())
        if json.loads(row['qc_json']).get('passed') is not True:
            row['status'] = 'rejected'
        for name, ctype in (('print.png', 'image/png'), ('mockup.jpg', 'image/jpeg')):
            run('wrangler', 'r2', 'object', 'put', f"{BUCKET}/shop/designs/{row['id']}/{name}", '--remote',
                '--file', str(d / name), '--content-type', ctype, '--cache-control', 'public, max-age=31536000, immutable')
        sql = d / 'insert.sql'
        sql.write_text('INSERT OR IGNORE INTO shop_designs (' + ', '.join(COLS) + ') VALUES (' + ', '.join(q(row[c]) for c in COLS) + ');\n')
        run('wrangler', 'd1', 'execute', DB, '--remote', '--file', str(sql), '-y')
        print('registered', row['id'], row['status'])
        n += 1
    print('designs published:', n)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'build/shop-engine')
