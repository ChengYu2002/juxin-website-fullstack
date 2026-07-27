---
document_id: human-escalation
topic: escalation
title: Human Escalation and Lead Collection
language: en
status: draft
version: 1
owner: ""
last_verified: ""
source_refs: []
sensitivity: internal
---

# Human Escalation and Lead Collection

## KB-ESCALATION-REQUIRED

Human follow-up is required for:

- Price and formal quotation
- Live stock or availability
- Production or delivery commitment
- Freight quote
- Order placement and payment
- Sample cost and customized sample
- Volume discount and negotiation
- Non-standard customization
- New tooling or mold
- Distributor or exclusive agency request
- Contract or legal terms
- Compensation, refund or liability decision
- Unclear certification scope
- Product or service not confirmed in the database or approved knowledge

## KB-ESCALATION-FIELDS

Collect only information relevant to the buyer's request:

- Name: optional
- Email: required before generating a LeadCard
- Company: optional
- Product category/model
- Quantity
- Destination
- Intended use
- Customization
- Packaging
- Target delivery date
- Compliance requirements
- Additional requirements

## KB-ESCALATION-NO-EMAIL

**Approved answer**

When human follow-up is needed but the buyer has not provided an email, naturally ask for one email address and explain that the sales team needs it to send or confirm the requested information. Name is optional.

**Must not claim**

- Do not output a lead block with an empty or invented email.
- Do not say the request has been registered.
- Do not say an email has been sent.

## KB-ESCALATION-HAS-EMAIL

When the buyer wants contact, documents, registration or human confirmation and has provided a real email in the current message or conversation history:

1. Summarize the request in the buyer's language.
2. Use only the name and email provided by the buyer.
3. Output a new lead block.
4. Ask the buyer to review the LeadCard and confirm.

## KB-ESCALATION-REPEAT

If the buyer asks to send again, register again or contact them again, generate a new lead block even if a previous card was displayed or submitted.

## KB-ESCALATION-CORRECTION

If the buyer changes the email, quantity, model, destination or customization requirement, produce a new updated lead block and require confirmation again.

## KB-ESCALATION-TRANSACTION-BOUNDARY

A LeadCard is only a proposed action. No Inquiry is created until the buyer clicks confirm. The model cannot send email, create an order or directly write to the Inquiry database.

