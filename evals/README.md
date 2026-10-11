# Evals

Demo questions used to sanity-check Gabay during local iteration.

- `datasets/demo-questions.json` — `good` questions should retrieve relevant passages and
  answer with citations; `hard_or_hallucination_probes` should either answer strictly from the
  handbooks or clearly say the handbooks don't cover it (never invent figures).

ponytail: a JSON list + manual review is enough for a one-week project. Add a scored runner
(faithfulness / context-relevance) only if you take the evaluation-harness stretch goal.
