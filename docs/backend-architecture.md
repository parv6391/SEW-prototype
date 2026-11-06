# Backend architecture note

**Revision:** 2  
**Date:** 2026-11-06  
**Status:** Proposed architecture. Implementation and security review pending.

This note describes the proposed backend architecture for SEW. The current prototype is a static browser application. Accounts, centralized run storage, authentication, and Google Drive integration are not yet implemented.

Revision 2 updates the proposed direction to support account-based access, centrally managed run records, session-scoped demo generation, administrative control, and anonymous archival.

The backend must not alter the scientific simulation, its equations, scientific inputs, or outputs.

## Revision history

### Revision 1

Established the original local-first architecture, optional authentication, local run persistence, optional encrypted Google Drive archives, run identity, integrity verification, deletion, recovery, and testing requirements.

### Revision 2

Introduces the following architectural changes:

- Account-based access through supported identity providers.
- Linking Google and GitHub identities to one application account.
- Centralized storage of user-associated run records.
- A hierarchical storage structure organized by user identity.
- Restricted master-key authority with three authorization checks.
- Anonymous archival of run data following account deletion.
- Separate curated and compressed low-priority archive tiers.
- Predefined and randomized session-scoped demo runs.
- Configurable submission and storage quotas.

The original scientific-model boundaries, integrity requirements, and separation of application code from live data remain in force.

---

##  Goals and boundaries

Keep the scientific simulation independent of backend services.

The simulation continues to operate in the browser. Authentication, account management, storage, and archival services must not modify simulation inputs, equations, outputs, or existing scientific behavior.

The revised prototype has two distinct operating paths:

1. **Account-based path:** Authenticated users can access existing runs and their authorized records.
2. **Demo path:** Users can access predefined demo scenarios and generate randomized demo runs using temporary, session-scoped demo seeds.

The prototype does not permit users to generate new permanent scientific seed-based runs. Existing scientific runs remain available as established records.

Keep application code and scientific assets separate from live user data:

- Version-controlled source contains the interface, backend code, migrations, tests, and non-sensitive configuration examples.
- Store user records and archive state outside the source tree.
- Never commit user runs, credentials, tokens, encryption keys, or private configuration.
- Treat imported and archived runs as data. Loading a run must not execute code or alter the scientific model.
- Keep user-associated information private and access-controlled. Personal information must never be exposed through public archive listings.

## Proposed implementation path

1. Preserve the existing static prototype and scientific simulation.
2. Establish versioned local run persistence, export/import, and integrity verification.
3. Implement authentication as a separate service.
4. Support Google and GitHub authentication, with the ability to link both identities to one application account.
5. Introduce centralized account-associated run storage and authorization.
6. Implement the hierarchical storage structure and record retrieval.
7. Introduce submission and storage quotas to limit abuse and unnecessary storage consumption.
8. Implement the master-key authority and its authorization process.
9. Implement anonymous archival and account-deletion workflows.
10. Introduce Google Drive as a storage destination using a dedicated storage account, after encryption, recovery, and integrity procedures are tested.

The simulation must remain usable without depending on authentication availability or Google Drive connectivity.

## Authentication and account identity

Google and GitHub are the initial supported authentication providers.

One application account may have both provider identities linked to it.

Authentication identities and application account identity must remain separate from scientific run identity.

Account linking must be explicit and verified. Matching email addresses alone must not trigger automatic account merging.

If existing records are associated with separate provider identities, the linking process must:

- Verify ownership of both identities.
- Preserve existing run IDs and scientific records.
- Detect duplicate records.
- Preserve ownership and authorization information during migration.
- Record the linking operation.
- Prevent silent overwriting or corruption.

The architecture should permit additional authentication providers in the future without requiring changes to scientific records.

Authentication credentials and provider tokens must remain outside version-controlled source and client-accessible static configuration.

## Run identity and record structure

Assign each saved run a random, opaque ID generated independently of user identity.

Do not place an email, account ID, or other personal information in the run ID. A run ID identifies a record; it does not grant access.

A complete saved run record should contain:

- Unique run ID.
- Creation date and timestamp in UTC.
- Record-format version.
- Model and application version.
- Scientific inputs and parameters.
- Random seed, where applicable.
- Complete simulation outputs.
- Integrity-verification information.
- User-selected labels or classifications.
- Archive and retention status.

Scientific seed values are immutable once generated. Their face value must not be changed through classification or administrative operations.

Classifications may change. Classification changes must not rewrite the original seed or silently modify the scientific record.

Maintain the distinction between permanent scientific runs and demo runs:

**Scientific runs**

- Use their original permanent seed.
- Preserve their scientific parameters and outputs.
- Remain identifiable as established simulation records.

**Demo runs**

- May use predefined scenarios.
- May also be generated through randomized demo options.
- Use temporary demo seeds or variables scoped to the active session.
- Must not be represented as permanent scientific seed-based runs.
- Must not overwrite or alter established scientific records.

## Storage hierarchy

Use a hierarchical storage structure rather than treating storage branches as scientific or research lineages.

The main storage root is associated with the user's application account or user ID.

Subsections may include:

- Main Runs.
- Detailed Runs.
- Demo Runs.
- Saved Records.
- Metadata.
- Archive.

These are illustrative functional categories, not a finalized folder schema.

The hierarchy describes where records are stored and how they are organized. It does not imply scientific parent-child relationships, research branches, or changes to simulation lineage.

Personal data and account associations must remain access-controlled. Internal storage organization must not become a public directory of user records.

## Master-key authority and administrative access

The system includes a dedicated master-key authority with full control over administrative features and stored data.

This authority is reserved exclusively for the owner.

Access to master-key-controlled information and operations must pass through three separate authorization checks.

The exact design and implementation of these three checks remain unresolved and must be documented before deployment.

The security design must distinguish:

- Application authentication.
- Ordinary user authorization.
- Master-key authorization.
- Physical or infrastructure-level access.

The master key must not be exposed to ordinary application code, public interfaces, or routine server logs.

Key custody for the current design:

- Owner-held master key.
- Encrypted offline recovery copy.

The recovery copy must not become an independently accessible ordinary credential. Recovery procedures must be documented and tested.

Master-key operations should produce a minimal, protected audit record without exposing the key or sensitive user content.

## Privacy and access control

User-associated data is private by default.

Users must only access records authorized for their account. One user's account must not permit access to another account's private records.

Public availability of the SEW application or demo scenarios does not imply public access to account information or private run records.

Separate identity information from scientific run data wherever possible.

The master-key authority has exclusive administrative access under the three-check authorization process. Ordinary application services must not acquire unrestricted access merely because they manage storage.

Minimize personal information in:

- Run IDs.
- Filenames.
- Metadata.
- Logs.
- Exported records.
- Archive listings.

## Offline behavior and synchronization

Network availability must not determine whether the scientific simulation can continue.

When offline:

- The simulation continues independently.
- The user may save a partial response locally.
- Alternatively, the user may abandon the partial response.
- Local records must not be silently lost because synchronization is unavailable.

Where synchronization is supported, locally saved changes should be queued for later synchronization.

Interrupted synchronization must not create silent overwrites or duplicate scientific records.

Local-save results and remote-storage results must be reported separately.

## Submission and storage quotas

Introduce two separate quota categories:

**Submission quota**

- Limits repeated submissions and unnecessary requests.
- Helps prevent spam and excessive backend activity.

**Storage quota**

- Limits the amount of stored data associated with an account.
- Helps control archive growth and infrastructure requirements.

Quota values should be reasonable and configurable for the prototype.

The system should remain lightweight. A complex billing, token-trading, or credit-economy mechanism is outside the current scope.

## Google Drive storage

Google Drive is a storage destination, not the authentication authority, master-key authority, or primary authorization system.

Use a dedicated Drive account for storage, separate from the account responsible for application administration.

Encrypt each run on the client before uploading it to Drive.

Use a vetted authenticated-encryption library with unique nonces. Do not create custom cryptography.

Keep encryption keys separate from ciphertext and ordinary run metadata.

Document key recovery and the consequences of key loss. Do not describe the archive as end-to-end confidential until key handling, backup, and recovery are implemented and reviewed.

Request only the Google permissions needed for the application's archive operations.

Store access credentials securely, support disconnect and token revocation, and never place tokens or keys in exports, URLs, logs, or committed files.

Drive connectivity must never be required to execute the simulation or access locally available records.

## Account deletion and anonymous archival

Account deletion must separate personal identity information from scientific run data.

The intended workflow is:

1. Verify the account-deletion request.
2. Separate the user's scientific run records from their personal identity information.
3. Remove or irreversibly protect the personal identity information.
4. Transfer the scientific records into an anonymous storage branch.
5. Verify the transferred records and their integrity.
6. Classify and organize the anonymous records.
7. Preserve useful runs in the curated archive.
8. Preserve runs not currently considered useful in a compressed, low-priority archive.

### Anonymous archive tiers

**Curated archive**

Contains runs considered useful for future research, comparison, analysis, or reference.

These records should remain retrievable for authorized purposes.

**Low-priority archive**

Contains runs that are not currently considered useful.

These records remain preserved in compressed storage rather than being immediately discarded.

A run's classification is not permanent. New research requirements or classification criteria may make a previously low-priority run useful.

Changing classification must not change the original seed or scientific record.

### Identity separation

Anonymous archival must remove account associations and identifying metadata.

Removing a username alone is insufficient. Indirect identifiers and metadata that could reconnect a record to an individual must also be considered.

The system must distinguish between actual anonymization and encryption of retained identity information.

Retention and deletion behavior must be documented before deployment, including any copies, backups, and external storage limitations.

## Integrity failures and recovery

Verify every saved, transferred, or downloaded archive before treating it as a valid run.

If an integrity check is missing, malformed, or mismatched:

- Do not load the record into the simulation.
- Do not overwrite a known-good local record.
- Do not repair it silently.
- Preserve suspect bytes for user-directed export or diagnosis.
- Offer recovery from another verified copy.

During account linking, migration, deletion, and archival transfer, verify record integrity before and after each operation.

A failed transfer must not silently remove the source record.

Provide user-controlled backups and document where local data is stored, how to export and restore it, and what deletion affects.

Verify integrity before restoring over an existing record.

## Testing

Before exposing backend features, test:

**Scientific isolation**

- Replay from the same versioned inputs and seed without changing existing scientific behavior.
- Confirm backend services cannot modify scientific equations or simulation outputs.
- Confirm demo seeds cannot be mistaken for permanent scientific seeds.

**Authentication and authorization**

- Google and GitHub authentication.
- Linking multiple provider identities to one application account.
- Prevention of unauthorized account merging.
- Access checks preventing one account from reading, filtering, changing, or deleting another account's records.
- Master-key authorization and all three separate checks.

**Storage and quotas**

- Hierarchical storage organization.
- Submission and storage quota enforcement.
- Duplicate handling and synchronization.
- Local and remote storage consistency.

**Privacy and archival**

- Removal of personal identity information during account deletion.
- Anonymous archival verification.
- Curated and low-priority archive handling.
- Compression and retrieval of low-priority records.
- Classification changes without seed modification.

**Encryption and recovery**

- Encryption/decryption.
- Nonce uniqueness.
- Key separation.
- Missing or incorrect keys.
- Encrypted offline recovery copy.
- Interrupted transfers and revoked Drive access.

**Integrity**

- Corrupted, truncated, or mismatched records failing closed without replacing good data.
- Export/import and restore from verified backups.
- Integrity verification during account linking and anonymous archival.

Keep backend tests separate from scientific-model validation. Passing storage or security tests does not validate scientific equations or assumptions.

Keep authentication, centralized archival, master-key operations, and Drive integration disabled until their relevant tests and user-facing privacy, retention, and recovery documentation are complete.

## Unresolved implementation decisions

The following decisions require explicit resolution before the corresponding features are implemented:

1. Exact design of the three master-key authorization checks.
2. Technical separation and recovery procedure for the owner-held key and encrypted offline copy.
3. Database and indexing technology for centralized records.
4. Exact hierarchy and subsection schema for account storage.
5. Account-linking conflict resolution and duplicate detection.
6. Anonymous archive re-identification risk assessment.
7. Retention and backup policy for deleted-account records.
8. Compression format and retrieval strategy for the low-priority archive.
9. Submission and storage quota values.
10. Synchronization conflict handling for offline records.
11. Exact Google Drive account and permission configuration.
12. Whether identity information is permanently deleted or irreversibly encrypted in each deletion scenario, subject to applicable retention requirements.

No unresolved decision should be silently converted into an implementation assumption.

## Change-management requirements

All architectural changes must be documented in version control.

Preserve previous decisions and record revisions explicitly. Do not silently replace established requirements, formulas, parameters, or configurations.

Changes to storage, authentication, access control, archival, or data retention must include:

- The reason for the change.
- The affected components.
- Compatibility implications.
- Migration requirements.
- Integrity and recovery considerations.
- Relevant test coverage.
- Unresolved questions.

The scientific model remains independently versioned and validated. Backend architecture revisions must not silently modify the scientific foundation of SEW.
