# PRODUCT.md — Gabay

## Problem
Filipino workers have specific, high-stakes questions about statutory benefits (13th-month pay,
leave, SSS/PhilHealth/Pag-IBIG contributions and claims). General chatbots get PH figures wrong
and cite nothing. Gabay answers only from official handbooks and shows its sources.

## Corpus
Public PH government documents: the DOLE Handbook on Workers' Statutory Monetary Benefits, the
SSS Citizens Charter, a PhilHealth Konsulta circular, and a Pag-IBIG programs briefer. One focused
domain, so a user can judge correctness.

## Why it's a good RAG demo
The base model is unreliable on PH-specific rules, so retrieval + citations visibly beat a raw LLM.
High stakes make faithfulness (answer only from docs, say when unknown) the central design choice.

## Demo questions
See `evals/datasets/demo-questions.json` — `good` ones showcase accurate cited answers;
the probes test that Gabay refuses to invent figures (e.g. freelancer 13th-month, exact pension).
