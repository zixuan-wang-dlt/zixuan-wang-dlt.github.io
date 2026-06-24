---
layout: single
title: "The Hidden Alignment Signal in Power-Law Data"
description: "A toy model shows why flattening skill frequencies helps memorization but can erase the gradient signal needed for composition."
date: 2026-06-23
permalink: /posts/2026/06/power-law-reasoning/
categories:
  - research
tags:
  - power-law
  - long-tail learning
  - compositional reasoning
  - multi-hop reasoning
  - optimization
classes: wide
author_profile: false
read_time: true
toc: true
toc_sticky: true
---

*Flattening a long-tailed training distribution sounds like the fair way to teach rare skills. For one-hop memorization, it often is. But for compositional reasoning, the asymmetry of a power law can create the first usable alignment signal that gradient descent needs.*

**TL;DR.**

- If language data is viewed as many atomic skills or pieces of knowledge, those skills are naturally long-tailed.
- Uniform sampling improves coverage of rare skills, so it helps in a one-hop memorization task.
- In a $k$-hop composition task, the useful gradient is proportional to $p_i A(w)^{k-1}$, where $p_i$ is local skill frequency and $A(w)$ is global alignment with the target.
- Uniform sampling can make $A(w)\approx r/\sqrt d$ at initialization, so the compositional signal shrinks like $d^{-(k-1)/2}$.
- Power-law sampling gives the head constant mass, making $A(w)=\Theta(r)$ and giving gradient descent a visible direction before the tail is learned.

Links: [paper](https://arxiv.org/abs/2604.22951), [PDF](https://arxiv.org/pdf/2604.22951), and Eric Michaud's [quanta essay](https://ericjmichaud.com/quanta/) that motivates the "many atomic skills" view of language modeling.

## The question

What should a training distribution do when the world is made of many skills?

Think of a language model as needing many small pieces of competence: remembering that a person has an advisor, applying "+3" inside an arithmetic expression, copying a repeated pattern, composing two relations in a knowledge graph, or tracking a state through several operations. This is the "quanta" picture of language modeling: pretraining loss is reduced by learning many discrete pieces of knowledge or computation, and some of those pieces are useful far more often than others.

That view makes a natural data question sharp. If the useful pieces are long-tailed, should we flatten the distribution so rare skills appear more often?

The simple answer is: **yes for isolated memorization, not necessarily for composition.** Our paper, [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951), studies this split. In synthetic state tracking, multi-hop QA, and grade-school-style arithmetic, training on a power-law distribution can beat training on a uniform distribution, even when test examples are evaluated uniformly.

The reason is not that the tail stops being rare. It is that composition introduces a second bottleneck: before rare skills can be learned efficiently, the model needs a global alignment signal telling it which direction is useful. Uniform sampling improves local coverage but can erase that signal near initialization. Power-law sampling repeats the head often enough to create a handle.

[![Uniform and power-law skill distributions.](/images/blog/power-law/distribution-comparison.png)](/images/blog/power-law/distribution-comparison.pdf)

*Figure 1: Uniform sampling flattens skill frequencies. Power-law sampling keeps a heavy head and a long tail. The puzzle is why this asymmetry can help once examples must be composed.*

## Why uniform looks right

Start with the easiest case: one-hop memorization. A fact might be "Anya's father is Loid," and the query is "Who is the father of Anya?" If a relation or entity appears rarely, the model needs more direct exposure to it. In this setting, uniform sampling is the natural fix because the bottleneck is coverage.

That intuition shows up cleanly in a one-hop QA experiment. We randomly rank relations, train under either a uniform or power-law distribution, and evaluate exact match. Uniform wins the early race.

![Uniform learns a one-hop memorization task faster than power-law sampling.](/images/blog/power-law/single-hop-memorization.png)

*Figure 2: For one-hop memorization, the usual long-tail intuition is correct. Uniform sampling gives rare relations more exposure and reaches high exact match faster.*

If the task were only to store isolated facts, "use a power law" would be a strange recommendation. The head is already frequent; the tail needs data. Flattening the distribution gives every skill a fairer chance.

Now make the problem compositional. Instead of asking for one relation, ask for a chain: Alice's advisor is Bob, Bob's institution is Princeton, so what is the institution of Alice's advisor? The model must apply one relation, use the intermediate entity, and then apply another relation. If the task composes $k$ facts, the naive long-tail argument seems even stronger: if rare facts are hard to memorize, rare combinations should be worse.

But the experiment goes the other way.

![Power-law sampling learns the multi-hop QA task much earlier than uniform sampling.](/images/blog/power-law/multi-hop-qa-accuracy.png)

*Figure 3: In a three-hop QA task, the conclusion flips. The power-law run reaches high accuracy much earlier, even though the final task requires composing facts rather than memorizing one edge.*

So the question is not "is uniform good or bad?" The question is: **what changes when we move from memorization to composition?**

## The minimal model

To isolate the mechanism, strip the task down to a tiny mathematical world.

There are $d$ hidden skills. Skill $i$ has a hidden sign

$$
w_i^\star\in\{-1,+1\}.
$$

A training example samples $k$ skill indices $I_1,\ldots,I_k$ independently from a distribution $p$ on $[d]$. The label is the product of the hidden signs:

$$
y=f_{w^\star}(X)=\prod_{t=1}^k w^\star_{I_t}.
$$

The model stores one parameter $w_i$ per skill and predicts

$$
f_w(X)=\prod_{t=1}^k w_{I_t}.
$$

We train with population squared loss

$$
\mathcal L(w)=\frac12\mathbb E_X\left[\left(f_w(X)-f_{w^\star}(X)\right)^2\right].
$$

This is deliberately not a transformer. It is the smallest model we need to separate memorization from composition. When $k=1$, each example touches one skill, and learning is coordinate-wise. When $k>1$, the label is a product, so each coordinate is only useful when it aligns with the rest of the product.

The assumptions are:

- Skills are fixed and indexed by $i\in[d]$.
- Each example samples $k$ skills independently from the same distribution $p$.
- Queries are implicit: the learner only sees the composed label, not intermediate labels or chain-of-thought.
- Success means recovering the hidden skill vector $w^\star$, up to the sign ambiguity in the even-$k$ theorem.
- We analyze population gradients first, then use the paper's finite-sample theorem for minibatch gradient descent.
- The main positive theorem assumes a Zipf distribution $p_i\propto i^{-\alpha}$ with $\alpha>1$, constant even $k$, and Gaussian initialization.

## The baseline mechanism

Define the weighted alignment

$$
A(w)=\sum_{i=1}^d p_i w_iw_i^\star
$$

and the weighted norm

$$
B(w)=\sum_{i=1}^d p_iw_i^2.
$$

The alignment $A(w)$ measures whether the current model agrees with the target on frequently sampled skills. The norm $B(w)$ measures the model's weighted scale.

Because the $k$ sampled indices are independent, the three pieces of the loss are

$$
\mathbb E[f_w(X)^2]=B(w)^k,\qquad
\mathbb E[f_w(X)f_{w^\star}(X)]=A(w)^k,\qquad
\mathbb E[f_{w^\star}(X)^2]=1.
$$

Therefore

$$
\mathcal L(w)
=\frac12\left(B(w)^k-2A(w)^k+1\right).
$$

This is the equation that makes the model analyzable. The first term is the model's own scale. The second term is the useful agreement with the target. The third term is constant because the target signs have unit magnitude.

Let $D=\mathrm{diag}(p_1,\ldots,p_d)$. Differentiating gives

$$
\nabla \mathcal L(w)
=kD\left(B(w)^{k-1}w-A(w)^{k-1}w^\star\right).
$$

The negative gradient has two parts. The $B(w)^{k-1}w$ term pulls down the model's current scale. The $A(w)^{k-1}w^\star$ term is the signal pointing toward the hidden skill vector. The diagonal matrix $D$ is the local frequency factor: frequent skills move faster because they appear more often.

For $k=1$, the global alignment issue disappears:

$$
\nabla \mathcal L(w)=D(w-w^\star).
$$

This is memorization. Rare skills move slowly because $p_i$ is small, so uniform sampling helps by increasing their exposure.

For $k>1$, the useful part of the negative gradient for coordinate $i$ is proportional to

$$
p_iA(w)^{k-1}w_i^\star.
$$

Now there are two bottlenecks. The local factor $p_i$ controls how often skill $i$ appears. The global factor $A(w)^{k-1}$ controls whether any compositional signal is visible at all.

| Task | Useful coordinate signal | Main bottleneck |
| --- | ---: | --- |
| One-hop memorization | $p_i$ | tail coverage |
| $k$-hop composition | $p_iA(w)^{k-1}$ | coverage plus global alignment |

*Table 1: Uniform sampling helps the local coverage term. Composition also depends on the global alignment term $A(w)^{k-1}$, which can be tiny under uniform data.*

## The error term

Initialize $w_i(0)\sim\mathcal N(0,r^2)$. Since multiplying by $w_i^\star$ only flips signs, the initial alignment

$$
A(w_0)=\sum_{i=1}^d p_iw_i(0)w_i^\star
$$

has variance

$$
\mathrm{Var}(A(w_0))=r^2\sum_{i=1}^d p_i^2.
$$

Under uniform sampling, $p_i=1/d$, so

$$
\sum_{i=1}^d p_i^2=\frac1d.
$$

A typical initialization has

$$
|A(w_0)|\approx \frac{r}{\sqrt d}.
$$

The useful compositional signal is therefore

$$
|A(w_0)|^{k-1}
\approx
\left(\frac{r}{\sqrt d}\right)^{k-1}.
$$

This is the hidden cost of fairness. Uniform sampling gives every skill equal probability, but it also averages the random initial alignment over all $d$ skills. That average is small, and composition raises it to a power.

The paper formalizes this with a correlational statistical-query lower bound. Under uniform inputs, a learner using $q$ gradient-like queries must use very fine tolerance to reach constant loss. One informal form is

$$
\tau^2 \le \left(\frac{\log(dq)}{d}\right)^{k/2}.
$$

Using the usual heuristic $\tau\approx 1/\sqrt n$, this corresponds to a sample requirement on the order of $\widetilde\Omega(d^{k/2})$ when $q$ is not already enormous. The theorem is not saying that every possible algorithm fails. It is saying that the symmetric uniform distribution makes gradient-like statistical queries nearly uninformative.

## The main calculation

Now sample skills from a power law:

$$
p_i=\frac{i^{-\alpha}}{\sum_{j=1}^d j^{-\alpha}}.
$$

For fixed $\alpha>1$, the head carries constant-scale probability mass as $d$ grows. The same variance calculation gives

$$
\mathrm{Var}(A(w_0))
=r^2\sum_{i=1}^d p_i^2
\approx
r^2\frac{\sum_i i^{-2\alpha}}{\left(\sum_i i^{-\alpha}\right)^2},
$$

which no longer shrinks like $1/d$. At initialization,

$$
|A(w_0)|\approx \Theta(r)
$$

instead of $r/\sqrt d$. The head skills create a detectable projection onto the target, so the compositional gradient has a direction to follow.

| Sampling rule | Initial alignment $\lvert A(w_0)\rvert$ | Useful signal $\lvert A(w_0)\rvert^{k-1}$ | What gradient descent sees |
| --- | ---: | ---: | --- |
| Uniform, $p_i=1/d$ | $r/\sqrt d$ | $r^{k-1}d^{-(k-1)/2}$ | nearly flat |
| Power law, $p_i\propto i^{-\alpha}$ | $\Theta(r)$ | $\Theta(r^{k-1})$ | a visible descent direction |

*Table 2: The head of the power law makes the initial alignment signal much larger. That is why skew can help composition even though it hurts tail coverage.*

The formal positive result is a separation. Under uniform inputs, the paper gives a $d^{\Omega(k)}$-type obstruction for gradient-like learning of $k$-fold composition. Under a Zipf law $p_j\propto j^{-\alpha}$ with $\alpha>1$ and constant even $k$, minibatch gradient descent learns the hidden skill vector with roughly

$$
\widetilde O\left(\frac{d^{2\alpha}}{\eta\varepsilon}\right)
$$

samples, suppressing polylogarithmic factors and theorem conditions on batch size, step size, and confidence.

The exponent is not the whole story. The mechanism is the story: the distribution changes the loss landscape.

![Uniform training is nearly flat near initialization, while power-law training has a clearer descent direction.](/images/blog/power-law/loss-landscape.png)

*Figure 4: Loss over the top two PCA directions of checkpoint trajectories. The zoomed region shows the key difference: uniform training starts in a flat patch, while power-law training sees a descent direction.*

## The punchline

Uniform sampling fixes the wrong bottleneck first.

For memorization, the bottleneck is local coverage, so uniform helps. For composition, the first bottleneck can be global alignment, and a power law gives gradient descent a head of frequent skills to grab onto.

The mechanism is not storing better memories. It is making the first compositional direction visible.

## The head is a handle for the tail

After the model escapes the flat region, the head plays a second role. The coordinate-wise gradient is

$$
\nabla_i \mathcal L(w)
=kp_i\left(B(w)^{k-1}w_i-A(w)^{k-1}w_i^\star\right).
$$

For a tail coordinate $j$, the useful part still scales like $p_jA(w)^{k-1}$. The tail still has small $p_j$, so power law has not erased the long-tail cost. But as the head skills learn, they increase

$$
A(w)=\sum_i p_iw_iw_i^\star.
$$

That larger $A(w)$ amplifies the useful gradient for every coordinate, including rare ones. In the simplified proof and the state-tracking experiments, learning has three stages:

- Escape: power-law asymmetry makes the initial landscape less flat.
- Head-to-tail transfer: frequent skills learn first and raise the global alignment.
- Tail-limited convergence: once alignment is high, rare skills are again limited by low sampling probability.

![Power-law state tracking creates a staged head-to-tail learning process.](/images/blog/power-law/state-tracking-power-law.png)

*Figure 5: In state tracking, the learning order follows the theory: escape, head-to-tail transfer, and then tail-limited convergence. The head does not merely learn first; it changes the gradient seen by the tail.*

## Back to multi-hop QA and math

The multi-hop QA experiment is the language-like version of the same story. We generate a synthetic knowledge graph with facts of the form

$$
e_i \xrightarrow{r} e_j,
$$

and ask questions by chaining relations:

$$
e_0 \xrightarrow{r_1} e_1
\xrightarrow{r_2} e_2
\cdots
\xrightarrow{r_k} e_k.
$$

For example: Alice's advisor is Bob; Bob's institution is Princeton; what is the institution of Alice's advisor? Each relation is an atomic skill, but the answer requires using several of them in order. The model cannot solve the task by memorizing one edge.

This is why the opening two plots should be read together. In one-hop QA, uniform wins because the bottleneck is coverage. In multi-hop QA, power law wins because the bottleneck is first finding a compositional direction. The same long tail is bad for direct memorization and useful for breaking symmetry in reasoning.

The same pattern appears in arithmetic data generated from dependency graphs, closer in spirit to GSM-style reasoning. Here the model must compose operations and numbers through a latent computation graph. In both non-modular and modular versions, power-law training reaches high test accuracy earlier than uniform training.

![Power-law training reaches high test accuracy earlier on non-modular GSM-style arithmetic.](/images/blog/power-law/gsm-nonmod.png)

*Figure 6: Non-modular GSM-style arithmetic. Power-law training learns the compositional dependency-graph task earlier than uniform training.*

![Power-law training is much faster on modular GSM-style arithmetic.](/images/blog/power-law/gsm-modular.png)

*Figure 7: Modular GSM-style arithmetic. Uniform sampling remains much slower, while power-law training quickly reaches near-perfect accuracy.*

## An intuition

Uniform sampling is like giving every landmark on a map the same font size. That is fair if the goal is to inspect every landmark one by one.

Power-law sampling is like drawing a few major landmarks very large. That looks unfair if all you care about is coverage, but it gives you a coordinate system. Once you know where the large landmarks are, smaller locations become easier to place.

In the model, the coordinate system is the alignment $A(w)$. The strength of the compositional signal is $A(w)^{k-1}$.

## What this suggests in practice

The practical lesson is not "make all training data more skewed." It is narrower and more useful.

First, evaluate memorization and composition separately. A distribution that improves one-hop recall can hurt implicit multi-hop learning, because the two tasks have different bottlenecks.

Second, do not treat repeated head examples as automatically wasted. In a compositional task, frequent skills can serve as anchors that make the loss landscape navigable.

Third, the exponent matters. The paper's ablations show the expected tradeoff: larger $\alpha$ can speed early head learning, but too much skew slows the final tail stage because rare skills become too rare.

Finally, the result suggests a different way to think about data curation. Instead of asking only "does the tail get enough examples?", also ask "what learning order does this distribution induce?"

## What this does not show

- The result does not say that power law is always better. In the one-hop experiment, uniform sampling learns faster.
- The theorem is for a minimalist $k$-multiplicative composition model, not a full transformer theory.
- The positive theorem assumes a Zipf distribution with $\alpha>1$, constant even $k$, Gaussian initialization, and a learner matched to the compositional structure.
- The lower bound is for uniform or symmetric input distributions and correlational statistical-query learners, which include gradient-like methods but not every possible algorithm.
- The experiments are synthetic: state tracking, synthetic multi-hop QA, and synthetic GSM-style arithmetic.
- Power law does not remove the tail. In the final stage, rare skills are still slow because they are sampled rarely.
- Other asymmetric distributions might also help. The paper treats power law as a natural and fine-grained source of asymmetry, not as the only possible solution.

## References

- Zixuan Wang, Xingyu Dang, Jason D. Lee, and Kaifeng Lyu. [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951). arXiv, 2026.
- Eric J. Michaud. [On neural scaling and the quanta hypothesis](https://ericjmichaud.com/quanta/). 2026.
- Eric J. Michaud, Ziming Liu, Uzay Girit, and Max Tegmark. [The Quantization Model of Neural Scaling](https://arxiv.org/abs/2303.13506). NeurIPS, 2023.
- Sanjeev Arora and Anirudh Goyal. [A Theory for Emergence of Complex Skills in Language Models](https://arxiv.org/abs/2307.15936). arXiv, 2023.
- Yoshua Bengio, Jerome Louradour, Ronan Collobert, and Jason Weston. [Curriculum Learning](https://doi.org/10.1145/1553374.1553380). ICML, 2009.
- Aaron Clauset, Cosma Rohilla Shalizi, and M. E. J. Newman. [Power-law distributions in empirical data](https://doi.org/10.1137/070710111). SIAM Review, 2009.
