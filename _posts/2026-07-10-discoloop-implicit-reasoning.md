---
layout: single
title: "Why Can't Language Models Compose What They Know?"
description: "Why implicit in-weight composition fails in standard Transformers, what looping fixes, and why DiscoLoop carries both discrete embeddings and continuous hidden states."
date: 2026-07-10
permalink: /posts/2026/07/discoloop-implicit-reasoning/
categories:
  - research
tags:
  - implicit reasoning
  - multi-hop reasoning
  - looped transformers
  - mechanistic interpretability
  - pretraining
classes:
  - discoloop-post
author_profile: false
read_time: true
toc: true
toc_sticky: true
related: false
---

*A language model can know every fact needed to answer a question and still fail to put them together.*

<p class="discoloop-links">Links: <a href="https://arxiv.org/abs/2607.00341">paper</a>, <a href="https://arxiv.org/pdf/2607.00341">PDF</a>, and the earlier <a href="https://arxiv.org/abs/2405.15071">Grokked Transformers</a> study.</p>

Suppose a model has learned the following two sentences in two different documents:

> Alice's spouse is Bob.<br>
> Bob works in San Francisco.

Now ask: **Where does Alice's spouse work?**

The model has seen every fact it needs. The answer is not hidden in a database it cannot access, and no new world knowledge is required. It only needs to retrieve Bob, treat Bob as the input to the second fact, and return San Francisco.

This looks almost too easy to call reasoning. Yet it captures a basic operation that appears everywhere: use one piece of knowledge to decide which other piece of knowledge becomes relevant. In other words, reasoning is often not the acquisition of new facts, but the **manipulation and composition of facts already stored in memory**.

This is close to the knowledge-manipulation viewpoint developed in [Physics of Language Models](https://arxiv.org/abs/2309.14402): extracting a memorized fact and manipulating several memorized facts are different capabilities, and success on the first does not imply success on the second.

<discoloop-fact-composition></discoloop-fact-composition>
<p class="discoloop-caption">The bridge entity, Bob, is never part of the visible answer. It has to exist only long enough inside the model to make the second retrieval possible.</p>

This post follows that failure from a standard Transformer to a looped one. The standard model cannot reliably reuse parametric knowledge across depth. Weight tying fixes much of that problem, but not all of it: the intermediate answer may be decodable without being represented in a form that the next loop can reliably use.

That distinction leads to [DiscoLoop](https://arxiv.org/abs/2607.00341), a looping architecture that carries both continuous hidden states and decoded discrete embeddings across recurrent computation.

## I. Reasoning as knowledge manipulation

### Why care about implicit reasoning during pretraining?

Reasoning is often discussed through chain-of-thought (CoT): let the model generate intermediate steps, put those steps back into the context, and continue from there. This is an effective way to spend more computation at inference time. The generated tokens also act as an external scratchpad. Once the model writes down “Bob,” the next step receives a clean token embedding for Bob in its input.

But not every setting comes with a reasoning trace. During pretraining, a model mostly sees ordinary text and receives next-token supervision. A sentence can state a conclusion without spelling out all the latent deductions that made it true. Even when a trace could in principle be generated, repeatedly verbalizing every intermediate fact consumes context and changes the interface of the model.

For pretraining, this leaves us with a stricter question:

> Can a model compose knowledge stored in its parameters, within a single answer-producing forward computation, without first writing the bridge entity into the visible context?

We call this **implicit in-weight reasoning**. “In-weight” means that the atomic facts are stored in the parameters rather than supplied in the prompt. “Implicit” means that the model directly predicts the final answer rather than emitting the bridge entity as an intermediate target.

The two-hop example is the smallest nontrivial version. Let the atomic facts be

$$
(a,r_1,b), \qquad (b,r_2,c),
$$

where $b$ is the bridge entity. The model receives $(a,r_1,r_2)$ and must predict $c$. It is trained on the two atomic facts separately, but the exact composition from $a$ to $c$ may never appear in training.

This setup distinguishes knowing from using. If the model fails because it never learned one of the atomic edges, the problem is memory. If it knows both edges but still cannot answer the composed query, the problem is reasoning over memory.

### Can the model generalize the composition rule?

To separate memorization from systematic composition, it helps to use two entity-disjoint knowledge graphs, $\mathcal G_A$ and $\mathcal G_B$, with the same relation vocabulary.

- For $\mathcal G_A$, training contains all atomic facts and some two-hop questions. Held-out two-hop questions form the **ID test set**.
- For $\mathcal G_B$, training contains all atomic facts but no two-hop questions. Every two-hop question forms the **OOD test set**.

The OOD split is deliberately unforgiving. The model has seen every edge in $\mathcal G_B$, so failure cannot be blamed on missing factual knowledge. But it has never been rewarded for composing facts involving those entities. Success therefore requires transferring a learned rule of composition to a new set of entities.

Can an ordinary Transformer do this?

## II. Why vanilla Transformers fail to generalize

A useful starting point is [Grokked Transformers are Implicit Reasoners](https://arxiv.org/abs/2405.15071), which studied almost exactly this question in a controlled setting. The paper trained decoder-only Transformers on a mixture of atomic facts and inferred facts. The model quickly fit its training set. Generalization came much later, after extended optimization far beyond overfitting: the familiar grokking phenomenon.

For two-hop composition, the eventual result was asymmetric:

- ID accuracy could approach perfection after grokking.
- OOD composition stayed at essentially zero, even after training was extended to one million optimization steps.

So longer training did teach the model a more general circuit, but not a systematic one. It learned to compose familiar kinds of examples without learning a procedure that transferred to atomic facts seen only in isolation.

### What changes during grokking?

The useful part is what happens inside the model. Using logit lens and causal tracing across checkpoints, the authors found two qualitatively different solutions.

Early in training, the model relies on a **memorizing circuit**. It directly associates the visible query pattern with an answer. This circuit fits the observed inferred facts quickly, but it does not implement the two hops.

During grokking, a **generalizing circuit** gradually becomes stronger:

1. Lower layers retrieve the first-hop fact and place the bridge entity into an intermediate state.
2. The model delays the second relation until the bridge is ready.
3. Upper layers combine the bridge with the second relation and retrieve the final answer.

This is real implicit composition. The model is no longer merely memorizing each two-hop query. It has organized the computation into a first retrieval followed by a second retrieval.

Yet the location of the two retrievals matters.

### Why does ID generalization stop at OOD?

A standard Transformer has different parameters at different depths. The lower layers and upper layers are not two applications of the same memory; they are different modules with different weights.

During training, atomic facts used as first hops are useful in lower layers. Facts used as second hops are useful in upper layers. For ID examples, optimization can therefore store one collection of facts low in the network and another collection high in the network.

The model has no reason to copy an OOD atomic fact into the upper layers if that fact never appears as a second hop during training. At test time, the first hop may correctly recover an OOD bridge entity, but the corresponding second-hop fact is not available where the second retrieval takes place.

<discoloop-depth-memory></discoloop-depth-memory>
<p class="discoloop-caption">The failure is not that the OOD fact was never learned. It was learned in the part of the network used for atomic recall, but not in the part used for second-hop retrieval.</p>

This is a **depth-local storage problem**. The model's parametric memory is fragmented across layers, while sequential composition asks later computation to reuse knowledge that may have been stored earlier.

The comparison task in the Grokked Transformers paper provides a useful control. Comparison can be solved by retrieving two facts in parallel in the lower layers and comparing them later. Because both facts are accessed from the same region of the network, the circuit generalizes systematically to OOD entities. The failure is therefore not a blanket inability to reason. It is tied to the sequential structure of composition and to where parametric knowledge is available.

The diagnosis points to a natural architectural fix: **reuse the same weights across reasoning steps**.

## III. Looping shares memory, but not representation

### What weight tying changes

Let $f_\theta$ denote a Transformer block or stack. A standard depth-$K$ Transformer applies different parameters at different depths. A looped Transformer instead applies the same $f_\theta$ repeatedly:

$$
\mathbf H^{(k+1)} = f_\theta\!\left(\mathbf H^{(k)}\right),
\qquad k=0,\ldots,K-1.
$$

For a two-hop problem, we can use two loops. The first pass retrieves $b$ from $(a,r_1)$. The second pass takes the resulting hidden states and uses $b$ with $r_2$ to retrieve $c$.

The key difference is memory sharing. The same parameters that know how to answer an atomic query in the first loop are available again in the second loop. There is no separate upper-layer memory that must independently relearn every possible second-hop fact.

This is exactly what the Grokked Transformers diagnosis asks for. Weight tying turns depth-local modules into a reusable computational step. In principle, any fact recallable in loop one should also be recallable in loop two.

### Looping helps, but the OOD gap remains

In our symbolic two-graph experiment, looping does unlock behavior that the non-looped baseline almost never discovers. The non-looped Transformer stays below roughly $20\%$ ID accuracy and near zero OOD accuracy. A vanilla looped Transformer reaches about $71.1\%$ ID accuracy.

But its OOD accuracy is only $8.3\%$.

That is better than zero, and it supports the memory-sharing story. It is also far from the systematic generalization we hoped recurrence would provide.

What is still going wrong?

### The bridge is present, but not usable

The first possibility is that the looped model still fails to recover the bridge. We can test this directly by reading the LM head from the hidden state after the first loop.

The result is surprisingly clean. On both ID and OOD examples, the correct bridge receives probability essentially $1.000$ at the expected position. The first loop has found Bob.

This rules out the original depth-local storage explanation as the remaining bottleneck. The shared block can recover the bridge, and the same shared block contains all atomic facts needed for the second hop.

The problem appears when we ask a slightly different question: not *which token can be decoded from the hidden state?*, but *where does that hidden state lie relative to the token's input embedding?*

For the bridge position, the cosine similarity between the post-first-loop state $\mathbf H^{(1)}_1$ and the clean embedding $\mathbf W[b]$ is only $0.327$ on ID examples and $0.266$ on OOD examples.

The state is decodable as Bob, but it is not shaped like the representation the model receives when Bob appears as an actual input token.

<discoloop-loop-handoff></discoloop-loop-handoff>
<p class="discoloop-caption">Loop one speaks in continuous residual states. Loop two was originally trained to consume clean token embeddings. The predicted identity is correct, but the handoff distribution is different.</p>

This distinction is easy to miss. A linear readout can assign Bob the largest logit even when the hidden vector also contains many other directions. Those extra directions may be harmless for decoding but harmful for the next computation. The second loop does not only need to *recognize* Bob. It needs a representation that triggers the same atomic retrieval behavior as the clean embedding of Bob.

### A training-free test of the hypothesis

To test whether alignment is causal, we intervene only at the bridge position between the two loops. Let $b_{\max}$ be the top token decoded from the first-loop state. We replace that state by

$$
\mathbf H^{(1)}_1
\leftarrow
(1-\alpha)\mathbf H^{(1)}_1
+
\alpha\,\mathrm{Norm}(\mathbf W[b_{\max}]).
$$

No weights are updated. The rest of the forward pass is unchanged.

At $\alpha=0.1$, OOD accuracy rises from $8.3\%$ to $25.9\%$. Around $\alpha=0.5$, both ID and OOD accuracy approach $100\%$.

<discoloop-alignment></discoloop-alignment>
<p class="discoloop-caption">Move the slider to mix the decoded bridge embedding into the continuous state. A moderate intervention nearly closes the generalization gap.</p>

This experiment is hard to explain away as more capacity or more training. We do not add layers, reveal the ground-truth bridge, retrain the network, or change the second-hop memory. We only move the intermediate state toward the embedding of the token the model has already decoded.

Looping solves the order and memory-sharing problem. The intervention exposes a second bottleneck: **representation alignment across loops**.

## IV. DiscoLoop: carry both kinds of state

### A discrete channel alongside the continuous one

The intervention uses a hard $\arg\max$ at one known bridge position. A general architecture should be differentiable, should not assume which position contains the useful intermediate result, and should work at every loop.

DiscoLoop does this by maintaining two recurrent channels:

1. A **continuous channel**, which preserves the rich contextual hidden state produced by the Transformer.
2. A **discrete embedding channel**, obtained by decoding the hidden state through the LM head and softly encoding the resulting token distribution back into embedding space.

Given the hidden state $h$, define the decode-then-encode operator

$$
\Phi(h)=\sum_{v=1}^{V} p_v(h)\,\mathbf W[v],
\qquad
p_v(h)=\frac{\exp((\mathbf W h)_v/\tau)}{\sum_{v'}\exp((\mathbf W h)_{v'}/\tau)}.
$$

Rather than selecting one token, $\Phi(h)$ takes a probability-weighted average of token embeddings. It is the differentiable version of “decode the intermediate answer, then feed its embedding back in.”

The recurrent update becomes

$$
\begin{aligned}
\mathbf H^{(k+1)}
&=f_\theta\!\left(\widetilde{\mathbf H}^{(k)}\right),\\
\widetilde{\mathbf H}^{(k+1)}
&=\mathbf H^{(k+1)}
+\alpha^{(k)}\odot
\mathrm{RMSNorm}\!\left(\Phi(\mathbf H^{(k+1)})\right).
\end{aligned}
$$

The token-wise gate $\alpha^{(k)}$ controls how strongly the discrete signal is injected at each position. It can be fixed or learned. In the learned version, a single shared vector and bias add only $d+1$ parameters.

<discoloop-architecture></discoloop-architecture>
<p class="discoloop-caption">The continuous channel keeps context and superposed information. The discrete channel supplies a cleaner identity-like direction for the next loop.</p>

Why keep both channels? An embedding-only recurrence throws away information that may not be captured by the token distribution. A hidden-state-only recurrence keeps that information but also keeps the representation mismatch. DiscoLoop treats the decoded embedding as an additional signal rather than a replacement for the continuous state.

The intermediate token is still not added to the visible context and is never supervised as a chain-of-thought target. The final answer remains the only target. DiscoLoop therefore provides a CoT-like computational handoff while keeping the reasoning latent.

### What changes during training?

The symbolic experiment shows more than a final accuracy difference. It shows a change in how the model uses its loops.

Early in training, Stage-1 two-hop training accuracy quickly rises toward $100\%$. In other words, one application of the shared block memorizes the observed two-hop answers directly. At this point, ID and OOD test accuracy remain near zero.

Later, a phase transition occurs. Stage-1 training accuracy collapses while final two-loop test accuracy rises. The model is giving up the one-loop shortcut and moving the composition into the recurrence: first retrieve the bridge, then use it in the next loop.

DiscoLoop makes this transition earlier and sharper than a vanilla looped Transformer. The discrete channel does not merely repair a representation at inference time. It strengthens the architectural bias toward using loops as compositional steps.

<figure class="discoloop-figure discoloop-figure--wide">
  <img src="/images/blog/discoloop/symbolic-results.png" alt="Symbolic two-hop accuracy and Stage-1 training accuracy for DiscoLoop, vanilla loop, and non-looped Transformers">
  <figcaption>On the symbolic task, DiscoLoop reaches near-perfect ID and OOD accuracy. The simultaneous collapse of Stage-1 training accuracy and rise of test accuracy marks the shift from one-loop memorization to two-loop composition.</figcaption>
</figure>

### Does the mechanism survive language and more hops?

The same pattern appears when facts and questions are rendered as synthetic English. We test both a direct form—“Finley's teacher's wife is Charlie”—and a reverse question form—“Who is the wife of the teacher of Finley?”

DiscoLoop reaches nearly $100\%$ ID accuracy and around $95\%$ OOD accuracy in both formats. The vanilla looped model reaches roughly $90\%$ ID accuracy but largely fails OOD, especially when the relation order in the sentence is reversed. The non-looped model performs worse still.

<figure class="discoloop-figure discoloop-figure--wide">
  <img src="/images/blog/discoloop/natural-language-results.png" alt="Two-hop accuracy on direct and reverse synthetic natural-language datasets">
  <figcaption>The gain is not specific to dedicated symbolic tokens. The same discrete-continuous handoff improves composition when facts and queries are expressed in English.</figcaption>
</figure>

The gap becomes larger with more hops. On a three-hop symbolic task, DiscoLoop reaches nearly perfect ID accuracy and roughly $65\%$ OOD accuracy. Both the vanilla looped Transformer and the non-looped baseline stay near zero on three-hop OOD.

Each additional hop creates another representation handoff. If the handoff is slightly misaligned, the error compounds with depth. The discrete channel repeatedly pulls the recurrent state back toward a token-aligned direction.

<figure class="discoloop-figure discoloop-figure--wide">
  <img src="/images/blog/discoloop/three-hop-results.png" alt="Two-hop and three-hop accuracy for DiscoLoop and baseline models">
  <figcaption>The architectural gap widens at three hops, where every additional bridge must survive another recurrent handoff.</figcaption>
</figure>

### Does this matter for ordinary pretraining?

Controlled graph tasks make the mechanism visible, but they leave open the practical question: does the mixed recurrent channel help a language model trained on real text?

We pretrain three $440$M-parameter models for $20$B tokens on a $6{:}4$ mixture of FineWeb-Edu and FineMath. All models use the same looped backbone, tokenizer, optimizer, data mixture, and four total backbone applications. They differ only in how information is carried between applications:

- Vanilla loop carries the continuous hidden state.
- PonderLM carries recurrence through embedding space.
- DiscoLoop carries the continuous state plus the decoded embedding channel.

The differences are modest compared with the synthetic tasks, but consistent. DiscoLoop obtains the best average zero-shot score: $50.5$, compared with $49.3$ for vanilla loop and $49.8$ for PonderLM. It is best or tied on six of seven reported benchmarks.

The training loss tells an interesting story. Vanilla loop is better early. DiscoLoop overtakes it after roughly $13$B tokens and maintains the advantage through the end of training.

<figure class="discoloop-figure discoloop-figure--wide">
  <img src="/images/blog/discoloop/pretraining-loss.png" alt="Pretraining loss for DiscoLoop, vanilla loop, and PonderLM across a 20 billion token run">
  <figcaption>Vanilla loop leads early, but DiscoLoop reaches the lowest loss in the later stage of the 20B-token pretraining run.</figcaption>
</figure>

For the large vocabulary used in pretraining, the full sum in $\Phi$ would be expensive. We therefore keep only the top $128$ token probabilities before forming the weighted embedding average. This retains essentially all nontrivial probability mass in our runs while reducing compute and memory overhead.

These experiments do not prove that every pretrained language model should be recurrent. They do suggest that the representation problem diagnosed on a tiny graph task survives at a scale where the model is learning ordinary language and mathematical text.

### What does this tell us about implicit reasoning?

The path from the vanilla Transformer to DiscoLoop separates three questions that are easy to collapse into one.

**Does the model know the facts?**

Atomic accuracy can be perfect while compositional accuracy is poor. Knowledge storage is necessary but not sufficient.

**Is the knowledge available at the right computational step?**

In a standard Transformer, facts useful for different hops may be stored at different depths. This enables ID composition but prevents systematic OOD transfer. Weight tying gives every loop access to the same parametric memory.

**Is the intermediate state represented in a reusable form?**

A hidden state can linearly decode to the correct bridge while remaining geometrically far from its clean embedding. The next loop needs more than the right label under a probe; it needs a state that drives the right downstream computation.

This last point is broader than multi-hop QA. Neural networks often contain information that a probe can recover but the model itself does not use. Decodability is evidence that information exists somewhere in the representation. It is not evidence that the representation is in the right format for the next algorithmic step.

### What remains open?

The current evidence has clear boundaries.

First, the cleanest mechanistic results come from controlled symbolic and synthetic-language tasks. The pretraining experiment is encouraging, but $440$M parameters and $20$B tokens are still moderate by modern standards.

Second, we match the number of loops to the maximum reasoning depth during synthetic training. A stronger test would train on at most $k$ hops and evaluate on more than $k$ hops. That would distinguish a reusable composition procedure from a depth-specific strategy.

Third, the present models are trained with recurrence from scratch. It remains open whether a large pretrained non-looped model can acquire the discrete-continuous recurrence through continual pretraining without losing its existing capabilities.

Finally, DiscoLoop improves the handoff between latent steps; it does not by itself decide how many steps a question needs, which positions should carry a discrete signal, or when recurrence should stop. Adaptive computation remains an important complementary problem.

## Conclusion

The original puzzle was simple: why can a model know “Alice's spouse is Bob” and “Bob works in San Francisco,” yet fail to answer where Alice's spouse works?

The answer is not one failure but two.

A standard Transformer can store the two hops in different depth-local memories, so OOD facts are unavailable where the second hop occurs. Looping reuses the same memory and largely resolves this problem. But the first loop then passes a continuous hidden state to the second loop. That state may say “Bob” to the LM head without behaving like Bob's embedding inside the next computation.

DiscoLoop addresses both issues: recurrence makes atomic knowledge reusable across steps, and the discrete embedding channel makes intermediate identities easier to reuse across recurrent states.

Reasoning over parametric knowledge is not only about storing the right facts or allocating more computation. The representation passed from one computational step to the next matters just as much.

## References

- Fu, H., Guo, T., Wang, Z., et al. (2026). [DiscoLoop: Looping Discrete Embeddings and Continuous Hidden States for Multi-hop Reasoning](https://arxiv.org/abs/2607.00341).
- Wang, B., Yue, X., Su, Y., & Sun, H. (2024). [Grokked Transformers are Implicit Reasoners: A Mechanistic Journey to the Edge of Generalization](https://arxiv.org/abs/2405.15071).
- Ye, J., Yao, Z., Huang, Z., et al. (2025). [How do Transformers Learn Implicit Reasoning?](https://arxiv.org/abs/2505.23653).
- Allen-Zhu, Z., & Li, Y. (2023). [Physics of Language Models: Part 3.2, Knowledge Manipulation](https://arxiv.org/abs/2309.14402).
- Biran, E., Gottesman, D., Yang, S., et al. (2024). [Hopping Too Late: Exploring the Limitations of Large Language Models on Multi-Hop Queries](https://arxiv.org/abs/2406.12775).

<script type="module" src="/assets/js/discoloop-animations.js"></script>
