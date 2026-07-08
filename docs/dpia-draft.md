# Morrowglass GDPR DPIA Draft

**Status:** Draft for controller/DPO/legal review  
**Product:** Morrowglass mobile-first astrology and optional face-reading entertainment web app  
**Controller:** `[Controller legal name, address, company code]`  
**EU establishment:** Lithuania  
**DPO/privacy contact:** `[DPO or privacy contact name/email]`  
**Review date:** `[YYYY-MM-DD]`

## 1. Processing Overview

Morrowglass provides entertainment astrology readings and an optional face-reading feature. Users may provide birth data for astrology content and may separately choose to upload or capture a face image for automated entertainment categorization.

### Data categories

| Category | Examples | Notes |
| --- | --- | --- |
| Account/contact data | Email, user ID, payment entitlement status | Used for account access and paid content. |
| Birth data | Date of birth, time of birth, place of birth, zodiac placements derived from those inputs | May reveal age and location-related information. |
| Optional face image | Selfie/camera image | Treated as highly sensitive; raw image is not stored. |
| Optional facial descriptors | Non-identifying broad feature descriptors extracted from the image | Treated as biometric data under GDPR Article 9 where processed for face-related analysis, even though not used for identification. |
| Consent records | Consent text version, timestamps, revocation state | Needed to demonstrate explicit consent and deletion actions. |
| Reading outputs | Entertainment archetypes and generated text | Must include entertainment disclaimer and avoid sensitive inferences. |
| Technical logs | Request IDs, error logs, security events | Must not contain raw images or unnecessary face descriptors. |

## 2. Purpose of Processing

- Generate astrology entertainment readings from user-provided birth data.
- Generate optional face-reading entertainment content after explicit consent.
- Maintain consent and revocation records.
- Provide account, purchase, support, fraud-prevention, and security functions where necessary.
- Improve safety and quality only using minimized, non-identifying data where possible.

The service must not use face data for biometric identification, verification, authentication, sensitive-trait inference, eligibility decisions, or profiling with legal/similarly significant effects.

## 3. Lawful Basis

### Birth data and astrology reading

- **GDPR Article 6 lawful basis:** Consent or contract, depending on final product flow and legal review.
- If birth data is required to deliver a purchased reading, contract may apply for that specific reading. Optional personalization should rely on consent.

### Optional face-reading feature

- **GDPR Article 6 lawful basis:** Explicit user consent for optional entertainment processing.
- **GDPR Article 9 condition:** Explicit consent under **Article 9(2)(a)** for processing facial features/biometric data for the specific face-reading purpose.

Consent must be:

- Separate from general terms and marketing consent.
- Granular to the face-reading feature.
- Freely given, specific, informed, and unambiguous.
- Recorded with consent text version and timestamp.
- Revocable at any time with deletion of face-related descriptors/results unless a narrowly defined legal retention obligation applies.

## 4. Necessity and Proportionality

The face-reading feature is optional and not necessary for core account access. It is proportionate only if implemented with strong minimization controls:

- No raw image storage.
- No face identity embedding or matching.
- In-browser processing where technically feasible.
- Immediate deletion of any temporary image data.
- Storage limited to non-identifying descriptors and entertainment results only where needed for the user experience.
- Clear skip path that does not penalize the user.
- Plain-language notice explaining entertainment-only use.

## 5. Data Minimization Controls

- Raw images are never stored in persistent storage.
- Camera/image input is processed only for the requested reading.
- Any temporary image object is deleted immediately after descriptor extraction or failed processing.
- Descriptors must be broad, non-identifying, and reviewed for sensitive-trait proxies.
- Do not store face embeddings suitable for recognition.
- Do not store model prompts or logs containing raw image content.
- Do not use face data for advertising targeting, lookalike audiences, or external enrichment.
- Collect birth place/time only when needed for the selected reading type.

## 6. Retention Schedule

| Data | Proposed retention | Deletion trigger |
| --- | --- | --- |
| Raw face image | Not stored; temporary memory/session only | Immediate deletion after processing or failure. |
| Facial descriptors | Until user deletes reading/account or revokes face consent; consider default expiry such as 30-90 days | Revocation, account deletion, support deletion request, retention expiry. |
| Face-reading output | Same as descriptors unless user saves it separately with informed notice | Revocation, account deletion, deletion request, retention expiry. |
| Consent record | Retain as long as needed to demonstrate consent and revocation, then delete/anonymize per legal schedule | End of limitation period or account deletion, subject to legal review. |
| Birth data | Until account deletion or user removes birth profile; consider deleting unused birth profiles after inactivity | Account/profile deletion, revocation where consent-based. |
| Payment/legal records | As required by tax/accounting law | Statutory retention expiry. |
| Security logs | Short operational period, e.g. 30-90 days | Log retention expiry. |

Final retention periods should be confirmed by Lithuanian/EU privacy counsel.

## 7. Revocation and Deletion Flow

Users must have a one-tap control to revoke face-reading consent.

On revocation:

1. Mark the active face consent as revoked with timestamp and source.
2. Stop all further face-reading processing unless the user gives new explicit consent.
3. Delete raw image references if any exist; raw images should normally not exist.
4. Delete or irreversibly anonymize stored facial descriptors.
5. Delete or detach face-derived reading outputs unless the user separately saved non-face content and legal review permits retention.
6. Confirm completion in the UI and provide support contact for issues.
7. Preserve a minimal revocation audit record where legally necessary, without retaining descriptors.

## 8. Data Subject Rights

Morrowglass must support:

- Access to stored profile, birth data, readings, and consent status.
- Rectification of account and birth data.
- Erasure of account, birth data, descriptors, and readings where applicable.
- Restriction/objection where applicable.
- Portability for user-provided data where applicable.
- Withdrawal of consent without detriment to non-face features.
- Complaint route to the Lithuanian State Data Protection Inspectorate or relevant supervisory authority.

## 9. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigations |
| --- | --- | --- | --- |
| Users misunderstand entertainment output as factual assessment | Emotional distress, unfair self-perception | Medium | Prominent disclaimers, careful copy, no deterministic claims, result-screen AI notice. |
| Processing special category biometric data without valid explicit consent | Legal non-compliance | Medium | Separate granular consent, versioned consent log, no pre-ticked boxes, clear skip path. |
| Raw image leakage | High privacy harm | Low-Medium | In-browser processing, no persistent storage, temporary memory only, logging filters, security testing. |
| Sensitive-trait inference or proxy labels | EU AI Act/GDPR risk and user harm | Medium | Exclusion taxonomy, prompt/output blocklist, descriptor review, QA sampling. |
| Function creep into identity verification or profiling | High legal and trust risk | Low | Product policy prohibition, technical absence of face embeddings, change-review gate. |
| Excessive retention of descriptors/results | Privacy harm | Medium | Short retention, revocation deletion, scheduled cleanup job, account deletion flow. |
| Children or vulnerable users use the feature | Enhanced privacy/consumer risk | Medium | Age gate/legal review, age-appropriate copy, avoid manipulative claims, support escalation. |
| Third-party vendor transfers outside EEA | Transfer and processor risk | Unknown | Vendor DPA, SCCs/TIA where required, EEA processing preference, vendor subprocessors review. |
| Marketing overclaims predictions | Consumer protection risk | Medium | Approved disclaimer library, copy review, no health/finance/relationship factual claims. |

## 10. Security Measures

- HTTPS/TLS for all traffic.
- Access controls for admin and support users.
- Least-privilege database rules.
- Encryption at rest where available for stored data.
- No raw images in logs, analytics, crash reports, or backups.
- Rate limiting and abuse monitoring for upload endpoints.
- Vendor due diligence and data processing agreements.
- Incident response process with GDPR breach notification assessment.

## 11. Processor and Transfer Review

Before launch, list all processors and confirm:

- Processing purpose and data categories.
- Whether face images/descriptors are processed.
- Data location and international transfer mechanism.
- Retention/deletion commitments.
- Subprocessor list.
- DPA signed and security documentation reviewed.

Processor table:

| Processor | Purpose | Data shared | Location | DPA/SCC status | Owner |
| --- | --- | --- | --- | --- | --- |
| `[Vendor]` | `[Purpose]` | `[Data]` | `[Region]` | `[Status]` | `[Owner]` |

## 12. Residual Risk and Sign-Off

Residual risk is acceptable only if explicit consent, no raw image storage, revocation deletion, sensitive-trait exclusion, and AI transparency controls are implemented and tested before launch.

Sign-off placeholders:

- Product owner: `[Name / date]`
- Engineering owner: `[Name / date]`
- Controller representative: `[Name / date]`
- DPO/privacy counsel: `[Name / date]`

## 13. Open Legal/Operational Questions

- Confirm final Article 6 basis for birth data and paid readings.
- Confirm whether any age gate or minor exclusion is required.
- Confirm exact retention periods under Lithuanian/EU requirements.
- Confirm processor list and transfer mechanisms.
- Confirm whether a prior consultation with a supervisory authority is required after final risk assessment.
