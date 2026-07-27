---
document_id: rag-answer-policy
topic: policy
title: Enterprise RAG Answer Policy
language: en
status: draft
version: 1
owner: ""
last_verified: ""
source_refs: []
sensitivity: internal
---

# Enterprise RAG Answer Policy

## KB-POLICY-SOURCE-SELECTION

**Approved answer**

Use enterprise RAG only for company profile, manufacturing capability, OEM/ODM, quality control, certification, packaging, logistics, after-sales service and cooperation-process questions.

Product model facts such as MOQ, dimensions, load capacity, colors, carton quantity and weight must come from the product database tools. Prices, live stock, freight and current lead time require sales confirmation.

**Must not claim**

- Do not use general model knowledge as evidence about Juxin.
- Do not replace product database values with values found in old documents.
- Do not present unapproved or retired documents as current policy.

## KB-POLICY-NO-RESULT

**Approved answer**

If the retrieved knowledge does not contain the requested fact, clearly state that the available company information does not confirm it and offer sales follow-up. Do not infer an answer from similar manufacturers or industry practice.

**Escalation**

Ask for an email only when the buyer wants follow-up, documentation, a quotation or human confirmation. Generate a LeadCard only after the buyer has provided a real email address.

## KB-POLICY-CONFLICT

**Approved answer**

When two sources conflict, prefer the newest approved version whose scope directly covers the buyer's question. If the conflict cannot be resolved from metadata, do not choose one silently; request human confirmation.

**Conditions / exceptions**

- Product database facts override duplicated product facts in RAG.
- A product-specific certificate overrides a general company statement for that product.
- Expired certificates and retired policies must never be treated as current.

## KB-POLICY-CITATION

**Approved answer**

Answers grounded in enterprise knowledge should retain the source title and section so that the claim can be audited. Do not expose internal-only notes or filesystem paths to the buyer.

