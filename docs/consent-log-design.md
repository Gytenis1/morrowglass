# Morrowglass Consent Log Design

**Purpose:** Record separate, granular, auditable consent for the optional face-reading feature and support one-tap revocation with deletion of face-derived data.

## 1. Design Principles

- Face-reading consent is separate from terms acceptance, privacy policy acknowledgement, cookies, analytics, marketing, and payment consent.
- Consent is required before any face image capture/upload or descriptor extraction.
- Consent text is versioned so Morrowglass can prove what the user saw.
- Users can revoke consent at any time with one tap.
- Revocation stops future processing and triggers deletion of face-derived descriptors/results.
- A minimal revocation audit record may remain, but it must not retain raw images or descriptors.

## 2. Proposed Collection: `face_consents`

One record per consent grant. A user may have multiple records over time if they revoke and later consent again.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | system ID | Yes | Unique consent record ID. |
| `user_id` | relation/string | Yes | App user/account ID. |
| `consent_scope` | string | Yes | Fixed value such as `face_reading_entertainment`. |
| `consent_text_version` | string | Yes | Version of exact consent copy shown, e.g. `face-v1.0-2025-01-15`. |
| `consent_text_hash` | string | Yes | Hash of full consent text for audit integrity. |
| `privacy_policy_version` | string | Recommended | Privacy policy version linked at time of consent. |
| `model_card_version` | string | Recommended | Face-reading/model-card version active at consent. |
| `status` | enum | Yes | `active`, `revoked`, `superseded`, `expired`. |
| `granted_at` | datetime | Yes | Timestamp of explicit consent. |
| `revoked_at` | datetime | No | Timestamp of revocation. |
| `revocation_source` | enum | No | `user_settings`, `support_request`, `account_deletion`, `retention_expiry`, `admin`. |
| `deletion_requested_at` | datetime | No | When deletion workflow started. |
| `deletion_completed_at` | datetime | No | When descriptors/results deletion completed. |
| `deletion_status` | enum | Yes | `not_required`, `pending`, `completed`, `failed`. |
| `locale` | string | Recommended | Consent language shown, e.g. `en`, `lt`. |
| `country_region` | string | Optional | User-declared or coarse region for compliance analytics; avoid precise location. |
| `ip_hash` | string | Optional | Salted hash only if legal review approves; avoid raw IP where possible. |
| `user_agent_hash` | string | Optional | Salted hash only if needed for audit/security; avoid fingerprinting. |
| `created` / `updated` | datetime | Yes | System timestamps. |

## 3. Consent Text Requirements

The consent screen should state, in plain language:

- The feature is optional.
- It uses automated/AI analysis of a face image to generate entertainment content.
- Raw images are not stored and are deleted immediately after processing.
- Non-identifying descriptors and results may be saved to show the reading.
- The feature does not identify or verify the user.
- The feature does not infer race, ethnicity, political opinions, religious beliefs, trade union membership, sex life, sexual orientation, health, or other sensitive traits.
- Consent can be revoked at any time, which deletes face-derived descriptors/results.
- The user can continue without the face-reading feature.

Example grant button copy:

> I consent to optional AI face-reading for entertainment and understand I can revoke this consent at any time.

Secondary action:

> Skip face-reading

## 4. State Model

```text
none -> active -> revoked
             -> superseded
             -> expired
revoked -> active (only after a new explicit consent grant)
```

Rules:

- Only one `active` face consent should exist per user and scope.
- Granting a new consent should mark older active records as `superseded` if the consent text version materially changed.
- Revoked consent cannot be reactivated; a new record is required.
- Processing is allowed only when an active consent exists for the exact scope and current acceptable text version.

## 5. One-Tap Revocation Semantics

User-facing control:

> Revoke face-reading consent and delete my face-reading data

On tap:

1. Disable additional face-reading requests immediately.
2. Update active `face_consents` record:
   - `status = revoked`
   - `revoked_at = now()`
   - `revocation_source = user_settings`
   - `deletion_requested_at = now()`
   - `deletion_status = pending`
3. Delete or anonymize all face-derived descriptors for the user.
4. Delete or detach face-derived reading outputs.
5. Clear any cached face-processing state.
6. Set `deletion_completed_at = now()` and `deletion_status = completed`.
7. Show confirmation:

> Face-reading consent has been revoked. We have deleted your face-reading descriptors and results. You can still use Morrowglass without face-reading.

If deletion fails:

- Keep processing disabled.
- Set `deletion_status = failed`.
- Show a support message.
- Alert an operator for manual remediation.

## 6. Access Control

- Users may read their own consent records and current consent status.
- Users may create a consent grant for themselves only through the approved consent endpoint/UI.
- Users may revoke their own active consent.
- Users must not edit audit fields directly.
- Support/admin access should be limited, logged, and used only for privacy support.

## 7. Audit Events

Recommended audit events, separate from raw consent data:

| Event | Trigger |
| --- | --- |
| `face_consent_viewed` | Consent screen displayed. |
| `face_consent_granted` | User grants explicit consent. |
| `face_processing_started` | Image processing begins after consent check. |
| `face_processing_completed` | Descriptors generated; no raw image retained. |
| `face_consent_revoked` | User/support/admin revokes consent. |
| `face_data_deletion_completed` | Deletion workflow completes. |
| `face_data_deletion_failed` | Deletion workflow fails and requires remediation. |

Audit logs must not include raw images, face embeddings, sensitive categories, or unnecessary descriptors.

## 8. Suggested Validation Queries

- Is there exactly one active face consent for this user and scope?
- Does the active consent use an accepted consent text version?
- Is `revoked_at` empty when `status = active`?
- Is deletion completed for every revoked consent?
- Are there any face descriptors for users without active consent? If yes, delete/remediate.

## 9. Launch Checklist

- [ ] Exact consent copy stored and hashed by version.
- [ ] Consent grant blocked unless user actively selects the consent action.
- [ ] Face processing endpoint verifies active consent before processing.
- [ ] One-tap revocation deletes descriptors/results and disables future processing.
- [ ] Revocation tested for success and failure paths.
- [ ] Admin/support deletion process documented.
