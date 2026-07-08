# Morrowglass Face-Reading Feature — Model Card

**Status:** Draft for launch review  
**Product:** Morrowglass, a mobile-first astrology and optional face-reading entertainment web app  
**Market context:** EU-based operator (Lithuania); consumer entertainment use only

## 1. Feature Summary

The optional face-reading feature converts a user-submitted selfie into non-identifying facial feature descriptors and maps those descriptors to playful, astrology-adjacent entertainment categories (for example, “lunar calm,” “spark archetype,” or “mirror twin energy”). The output is not a factual assessment of a person and must not be presented as scientific, diagnostic, predictive, or identity-based.

## 2. Intended Use

- Provide an optional entertainment layer in an astrology reading.
- Generate playful categories, prompts, and shareable copy.
- Allow users to compare “cosmic twin” style archetypes without claiming accuracy.
- Operate only after a separate, explicit face-reading consent step.

## 3. Out-of-Scope and Prohibited Uses

The feature must not be used for:

- Biometric identification or verification.
- Matching a person to an identity, account, watchlist, or government/customer record.
- Security, access control, authentication, age verification, law enforcement, employment, credit, insurance, education, health, housing, or eligibility decisions.
- Inferring sensitive personal attributes or protected characteristics.
- Making factual predictions about health, finance, relationships, fertility, safety, or life outcomes.

## 4. Processing Location and Data Flow

- Image analysis should run **in the browser where technically feasible**.
- The raw image must not be stored by default.
- If temporary processing is needed, the image is used only for the requested reading and deleted immediately after descriptor extraction.
- Stored outputs, if any, are limited to non-identifying feature descriptors and generated entertainment results.
- Descriptors must not be designed or combined to uniquely identify a person.

## 5. Input and Output

### Inputs

- Optional selfie or face image provided by the user.
- Existing astrology inputs, such as birth date/time/place, where separately provided.
- Consent state and consent text version.

### Outputs

- Entertainment-only categorical labels.
- Non-identifying descriptors, such as broad face-shape or expression-neutral geometry categories.
- Generated reading text with an entertainment disclaimer.
- No identity match, confidence of identity, or sensitive-trait classification.

## 6. Entertainment-Only Categorization

Outputs are fictionalized, symbolic, and experience-oriented. They should use language such as:

- “Your result suggests a playful archetype…”
- “For entertainment, this reading maps your visible features to…”
- “This is not a factual assessment of who you are.”

Outputs must avoid language such as:

- “The model detects your ethnicity/religion/sexuality…”
- “Your face proves…”
- “You are likely to have…”
- “This predicts…”

## 7. EU AI Act Article 5(1)(g) Exclusion Taxonomy

The system is explicitly designed **not** to perform biometric categorization that individually categorizes people to infer or deduce sensitive attributes. The following categories and proxies are excluded from model labels, prompts, outputs, analytics, testing targets, and marketing copy:

| Excluded category | Exclusion rule |
| --- | --- |
| Race | Do not infer, label, score, group, or proxy race. |
| Ethnic origin | Do not infer, label, score, group, or proxy ethnicity or national/ancestral origin. |
| Political opinions | Do not infer, label, score, group, or proxy political views or affiliations. |
| Religious or philosophical beliefs | Do not infer, label, score, group, or proxy religion, spirituality as identity, or belief systems. |
| Trade union membership | Do not infer, label, score, group, or proxy union affiliation. |
| Sex life | Do not infer, label, score, group, or proxy sexual history or intimate behavior. |
| Sexual orientation | Do not infer, label, score, group, or proxy sexual orientation. |
| Health or disability proxies | Do not infer, label, score, group, or proxy health, disability, mental state, neurotype, or diagnosis. |
| Socioeconomic or legal proxies | Do not infer, label, score, group, or proxy income, immigration status, criminality, or trustworthiness. |

Design rule: if a descriptor or generated label could reasonably function as a proxy for an excluded category, it must not be collected, stored, displayed, targeted, or used for personalization.

## 8. No Biometric Identification or Verification

The feature must not:

- Create face embeddings for identity matching.
- Compare a user against reference databases or other users.
- Verify that a user is the same person across sessions.
- Use face data for login, account recovery, fraud detection, or duplicate-account detection.
- Store raw images for future recognition.

## 9. AI Transparency Obligations

Morrowglass should clearly inform users before and during use that:

- The face-reading feature uses automated analysis/AI to generate entertainment content.
- The reading is optional and requires explicit consent.
- The result is not a factual, scientific, medical, financial, relationship, or legal assessment.
- The user can skip the feature and still use the astrology app where applicable.
- The user can revoke consent and request deletion of face-related descriptors/results.

Recommended notice placement:

- Before image upload/camera access.
- On the result screen near the reading.
- In account/privacy settings next to revocation controls.
- In paid reading and marketing flows.

## 10. Quality, Monitoring, and Human Review

- Review generated copy for sensitive-trait leakage and prohibited claims before launch.
- Maintain a blocklist for excluded categories and obvious proxies.
- Log consent state and feature version, not raw images.
- Provide a user support channel for deletion and complaint requests.
- Re-run compliance review when model prompts, descriptor schema, vendors, or retention practices change.

## 11. Known Limitations

- Entertainment categories may be arbitrary and should not be interpreted as accurate personal judgments.
- Lighting, pose, device camera quality, makeup, accessories, and image quality may affect descriptors.
- The feature is unsuitable for children unless a separate age-appropriate legal review and parental consent flow is implemented.

## 12. Launch Gate Checklist

- [ ] Separate explicit consent screen implemented for face-reading.
- [ ] Raw image storage disabled.
- [ ] Immediate deletion confirmed for any temporary image handling.
- [ ] Descriptor schema reviewed for identity and sensitive-trait proxies.
- [ ] Disclaimers visible in onboarding, results, paid flows, and marketing.
- [ ] Revocation and deletion flow tested.
- [ ] DPIA reviewed by controller/DPO or privacy counsel before production launch.
