# Restoring a RoamWise backup

Backups are made every Sunday by **Actions → Weekly encrypted backup** and kept 90 days.

1. Open the latest successful run, download the artifact `roamwise-backup-YYYY-MM-DD`, and unzip it.
2. Decrypt (needs the `BACKUP_PASSPHRASE` you saved offline):
   ```
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in roamwise-backup-YYYY-MM-DD.tgz.enc -out rw.tgz
   tar -xzf rw.tgz
   ```
3. You get `rw-backup/`:
   - `firestore-<collection>.ndjson`: one Firestore REST document per line (`name`, `fields`).
   - `kv-durable.ndjson`: `{key, value}` per line for every KV record that does not expire (wallets, orders, credit, group pots).
   - `MANIFEST.json`: date and document counts.
4. To put data back, ask Claude/ChatGPT to write a one-off restore for the specific collection or keys. Never restore everything blindly over live data.

**Keep the passphrase somewhere safe outside GitHub** (password manager or paper). Without it the backups cannot be opened, by anyone.
