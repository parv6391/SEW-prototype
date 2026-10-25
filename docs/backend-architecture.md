# Backend architecture note

This note describes a proposed direction. The current prototype is a static browser application with no accounts, backend database, or Google Drive integration. The plan below does not change the simulation or its scientific data.

## Goals and boundaries

Keep the prototype local-first. The simulation continues to run in the browser; results stay on the user's device unless they choose to archive them. Backend services may manage identity and archive metadata, but must not change simulation inputs, equations, outputs, or existing browser behavior.

Keep application code and scientific assets separate from live user data:

- Version-controlled source contains the interface, backend code, migrations, tests, and non-sensitive configuration examples.
- Store local run records and archive state outside the source tree. Never commit user runs, credentials, tokens, encryption keys, or private configuration.
- Treat imported and archived runs as data. Loading a run must not execute code or alter the scientific model.

## Proposed path

1. Keep the current static prototype as the no-account path.
2. Add local persistence for runs the user chooses to save, with a versioned record format and export/import for backup.
3. If accounts are needed, add authentication as a separate service. Give the browser only the short-lived access it needs. Keep secrets in server-side configuration or a secret store, not in source control or static assets.
4. Add Google Drive as an optional encrypted archive after local save, export, and recovery work reliably. Let users connect Drive and choose which runs to archive. Running the simulation must not depend on Drive.

## Run identity and metadata

Assign each saved run a random, opaque ID generated independently of user identity. Do not put an email, account ID, timestamp, or other personal information in the ID. Keep the owner-to-run association separate and use it for authorization. A run ID identifies a record; it does not grant access.

Store metadata needed to find and reproduce a run without changing its scientific content:

- creation time in UTC and record-format version;
- model and application version, input parameters, and random seed when applicable;
- user-selected labels or notes;
- archive state and integrity-check status.

Filter using documented metadata such as creation date, model/version, and user labels. Do not infer sensitive traits or use scientific result values as a proxy for identity. Keep metadata minimal and avoid exposing private content in Drive filenames or listing views.

## Optional encrypted Drive archive

Encrypt each run on the client before uploading it to Drive. Use a vetted authenticated-encryption library with unique nonces; do not create custom cryptography. Keep encryption keys separate from ciphertext and ordinary run metadata. Document key recovery and the consequences of key loss. Do not describe the archive as end-to-end confidential until key handling, backup, and recovery are implemented and reviewed.

Request only the Google permissions needed to create, list, read, and delete this app's archive files. Store access credentials securely, support disconnect and token revocation, and never put tokens or keys in exports, URLs, logs, or committed files. Make archive operations explicit and report local-save and remote-copy results separately.

## Deletion and retention

Provide two separate actions:

- **Soft-delete a run:** hide it from normal lists and filters, record a deletion marker, and retain the recoverable record for a documented period. This does not delete the owner's archive.
- **Delete an owner's archive:** remove that owner's archived copy from Drive, subject to Drive's deletion behavior. Explain recovery limits before the user confirms.

Make clear that deleting a local reference does not remove a Drive file, and deleting a Drive copy does not remove local data or backups. Define retention and purge behavior before enabling either action. Keep audit events to the minimum metadata needed.

## Integrity failures and recovery

Verify a saved or downloaded archive before treating it as a valid run. If an integrity check is missing, malformed, or mismatched, do not load the run into the simulation, overwrite a known-good local record, or repair it silently. Show an error, preserve the suspect bytes for user-directed export or diagnosis, and offer recovery from another verified copy.

Provide a user-controlled backup, such as a downloadable export, before enabling remote-only storage. Document where local data is stored, how to export and restore it, what Drive deletion affects, and recovery limits. Encrypt backups containing sensitive data. Verify integrity before restoring over an existing record.

## Testing

Before exposing backend features, test:

- replay from the same versioned inputs and seed without changing existing scientific behavior;
- run-ID unpredictability and absence of identity data in IDs;
- access checks preventing one account from reading, filtering, changing, or deleting another owner's runs;
- filtering correctness and metadata minimization;
- encryption/decryption, nonce uniqueness, key separation, and missing or incorrect keys;
- soft-delete recovery separately from owner-archive deletion;
- interrupted transfers, duplicate retries, revoked Drive access, and offline operation;
- corrupted, truncated, or mismatched records failing closed without replacing good data;
- export/import and restore from a verified backup.

Keep backend tests separate from scientific-model validation. Passing storage or security tests does not validate scientific equations or assumptions. Keep authentication and Drive archive features disabled until these tests and user-facing privacy and retention documentation are in place.
