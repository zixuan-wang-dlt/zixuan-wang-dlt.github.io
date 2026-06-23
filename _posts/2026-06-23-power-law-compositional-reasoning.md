---
layout: single
title: "When Uniform Data Makes Reasoning Harder"
description: "Flattening a long tail helps memorization. For compositional reasoning, the same symmetry can erase the gradient signal."
date: 2026-06-23
permalink: /posts/2026/06/power-law-reasoning/
categories:
  - research
tags:
  - power-law
  - compositional reasoning
  - multi-hop reasoning
  - optimization
classes: wide
author_profile: false
read_time: true
toc: true
toc_sticky: true
---

> Flattening a long tail helps memorization. But when the task is compositional, making the data too uniform can make the target almost invisible to gradient descent.

**TL;DR.**
- For one-hop memorization, uniform data gives rare skills more examples. Good.
- For $k$-step composition, the useful gradient is gated by a global alignment term $A(w)^{k-1}$. Dangerous.
- Under uniform sampling, the initial alignment is only about $d^{-1/2}$, so the compositional signal is about $d^{-(k-1)/2}$.
- Under a power law with $\alpha>1$, the same alignment can be order one, giving gradient descent a direction near initialization.
- The head does not just learn first; it changes the gradient that the tail receives.

**Paper.** This post is a mathematical walk-through of [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951).

## The Paradox

Natural language is wildly non-uniform. A few words, facts, relations, templates, and skills appear everywhere. Most appear rarely.

The usual instinct is simple: power laws are inefficient. The head is oversampled. The tail is starved. So if we want better coverage, we should flatten the distribution.

That instinct is correct for many memorization problems.

But the paper asks a sharper question:

**What if uniform data is good for memorizing skills, but bad for learning how to compose them?**

The punchline is:

**Uniform sampling removes imbalance, but it also removes asymmetry. For composition, that symmetry can be the problem.**

The post will analyze the smallest model where this can happen: a task where the label is the product of $k$ hidden skills. The model is deliberately tiny. No attention heads, no language, no chain-of-thought. Its job is to isolate one mechanism:

$$
\text{composition turns weak alignment into weak gradients.}
$$

## The Surprising Plot

In the state-tracking experiments, a transformer trained on uniformly sampled compositions can stall, while the same architecture trained under a power-law distribution learns.

![Power-law data can make the compositional task learnable while uniform data remains stuck.](/images/blog/power-law/power-law-composition.png)

*Figure 1: Uniform data looks fairer, but for this compositional task it creates a flatter landscape. Power-law data gives the model an early descent direction.*

This is not the usual long-tail story. The power law does not make rare skills common. The tail is still the tail.

The claim is subtler:

**A power law can turn frequency imbalance into an optimization signal.**

## Memorization Is Not Composition

Start with one-hop memorization.

Suppose a skill $i$ has a hidden sign $w_i^\star\in\{-1,+1\}$, and the model stores a parameter $w_i$. If an example only asks for one skill, learning coordinate $i$ is mostly a coverage problem. Rare coordinates need enough updates.

Flattening helps because it increases the sampling probability of tail skills.

Composition changes the game. If the answer depends on $k$ skills at once, the model does not only need to learn the coordinates. It also needs to discover how the coordinates interact.

That interaction creates a gate.

For one-hop learning, each coordinate can learn from its own examples.

For $k$-hop composition, each coordinate's useful update depends on a global alignment signal shared across the whole model.

The rest of the post is just this sentence in math.

## The Minimal Model

There are $d$ hidden skills. Skill $i$ has a hidden sign

$$
w_i^\star\in\{-1,+1\}.
$$

A training example samples $k$ skill indices

$$
I_1,\ldots,I_k \sim p,
$$

where $p_i$ is the probability of skill $i$. Write each sampled skill as a one-hot vector $x_t=e_{I_t}$.

The label is the product of the hidden signs:

$$
y=f_{w^\star}(X)
  =\prod_{t=1}^k x_t^\top w^\star
  =\prod_{t=1}^k w^\star_{I_t}.
$$

The model predicts

$$
f_w(X)=\prod_{t=1}^k x_t^\top w.
$$

Use the population loss

$$
\mathcal L(w)=\frac12\mathbb E_X\left[\left(f_w(X)-f_{w^\star}(X)\right)^2\right].
$$

The goal is to recover the hidden skill vector $w^\star$, or at least predict products of hidden skills.

The assumptions are:

- each example composes exactly $k$ skills,
- the same distribution $p$ is used at each position,
- hidden skills are scalar signs,
- we first study the population gradient, then use it to interpret finite-sample training,
- the model is a microscope for one mechanism, not a full transformer theory.

## The One Calculation

Define the weighted alignment

$$
A(w)=\sum_{i=1}^d p_i w_i w_i^\star.
$$

This asks: under the training distribution, how much does the current model point toward the true hidden skills?

Also define the weighted norm

$$
B(w)=\sum_{i=1}^d p_i w_i^2.
$$

Let

$$
D=\mathrm{diag}(p_1,\ldots,p_d).
$$

For the multiplicative model above, the population gradient is

$$
\nabla \mathcal L(w)
=kD\left(B(w)^{k-1}w-A(w)^{k-1}w^\star\right).
$$

This equation is the whole story.

The matrix $D$ is the local frequency factor. Frequent skills move faster because their $p_i$'s are larger.

The $B(w)^{k-1}w$ term is the self term. It depends on the current model.

The $A(w)^{k-1}w^\star$ term is the useful signal. It points toward the hidden skills.

And the exponent $k-1$ is where composition bites.

For $k=1$, the useful signal is not gated by global alignment. The gradient is essentially coordinate-wise:

$$
\nabla \mathcal L(w)=D(w-w^\star).
$$

That is the memorization regime. If a rare coordinate is too rare, flattening helps.

For $k>1$, the useful signal for every coordinate is multiplied by $A(w)^{k-1}$. If $A(w)$ is tiny near initialization, every coordinate sees a tiny useful gradient.

This is the paradox in one line:

| Task type | Useful coordinate signal | Main bottleneck |
| --- | ---: | --- |
| One-hop memorization | $p_i$ | tail coverage |
| $k$-hop composition | $p_i A(w)^{k-1}$ | tail coverage plus global alignment |

*Table 1: In memorization, each skill can learn locally. In composition, local learning is gated by a global alignment term.*

## Why Uniform Hides The Signal

Initialize

$$
w_i(0)\sim \mathcal N(0,r^2).
$$

Since $w_i^\star\in\{-1,+1\}$, each product $w_i(0)w_i^\star$ is still zero-mean with variance $r^2$.

The initial alignment is

$$
A(w_0)=\sum_{i=1}^d p_i w_i(0)w_i^\star.
$$

It has mean zero and variance

$$
\mathrm{Var}(A(w_0))
=r^2\sum_{i=1}^d p_i^2.
$$

This is where the data distribution enters.

If $p_i=1/d$, then

$$
\sum_{i=1}^d p_i^2
=d\cdot \frac{1}{d^2}
=\frac1d.
$$

So a typical initialization has

$$
|A(w_0)|\approx \frac{r}{\sqrt d}.
$$

The useful compositional signal scales like

$$
|A(w_0)|^{k-1}
\approx
\left(\frac{r}{\sqrt d}\right)^{k-1}.
$$

Uniform data averages the initial random alignment over all $d$ skills. That averaging makes the alignment small. Composition then raises the small number to a power.

That is why the uniform case can be hard:

**Every skill gets equal coverage, but every direction looks almost equally uninformative.**

The paper formalizes this through a correlational statistical-query lower bound. In the uniform case, a gradient-like learner needs either many queries or very fine tolerance to escape the symmetric region. One informal version from the slides is:

$$
\tau^2 \le \left(\frac{\log(dq)}{d}\right)^{k/2}
$$

for a correlational statistical-query learner using $q$ gradient queries to reach constant loss. If the tolerance behaves like sampling noise, this means the needed sample scale worsens rapidly with $k$.

You do not need the lower bound to remember the mechanism. The variance calculation already shows where the signal disappears.

## Why Power Law Gives A Handle

Now sample skills from a power law:

$$
p_i=\frac{i^{-\alpha}}{\sum_{j=1}^d j^{-\alpha}}.
$$

For fixed $\alpha>1$, the head has constant-scale mass as $d$ grows. The same calculation gives

$$
\mathrm{Var}(A(w_0))
=r^2\sum_{i=1}^d p_i^2
\approx
r^2\frac{\sum_i i^{-2\alpha}}{\left(\sum_i i^{-\alpha}\right)^2}.
$$

Unlike the uniform case, this does not shrink like $1/d$. For fixed $\alpha>1$, it is order one.

So at initialization,

$$
|A(w_0)|\approx \Theta(r),
$$

instead of $r/\sqrt d$.

Now compare the signal:

| Training distribution | Initial alignment $\lvert A(w_0)\rvert$ | Useful signal $\lvert A(w_0)\rvert^{k-1}$ | What gradient descent sees |
| --- | ---: | ---: | --- |
| Uniform, $p_i=1/d$ | $r/\sqrt d$ | $r^{k-1}d^{-(k-1)/2}$ | almost no direction |
| Power law, $p_i\propto i^{-\alpha}$, $\alpha>1$ | $\Theta(r)$ | $\Theta(r^{k-1})$ | a visible early direction |

*Table 2: A power law does not solve the tail at initialization. It makes the global alignment detectable, which turns on the compositional gradient.*

This is the first punchline:

**Power-law data does not start by solving the tail. It starts by making the target visible.**

## The Head Teaches The Tail

The second punchline is more important.

Look at coordinate $i$:

$$
\nabla_i \mathcal L(w)
=kp_i\left(B(w)^{k-1}w_i-A(w)^{k-1}w_i^\star\right).
$$

The useful part of the update is proportional to

$$
p_iA(w)^{k-1}w_i^\star.
$$

There are two factors.

The local factor $p_i$ says frequent skills move faster than rare skills. This is the long-tail bottleneck.

The global factor $A(w)^{k-1}$ says every coordinate benefits when the whole model becomes more aligned with $w^\star$.

This creates a three-stage dynamic.

**Stage I: escape.** Power-law asymmetry makes $A(w_0)$ large enough that the model has a descent direction near initialization.

**Stage II: head-to-tail transfer.** Head skills move first because their $p_i$'s are large. As they align, $A(w)$ increases. As $A(w)$ increases, the multiplier $A(w)^{k-1}$ strengthens the useful gradient for all skills, including rare ones.

**Stage III: tail-limited convergence.** Once alignment is high, the landscape is no longer flat. But the rarest skills still have tiny $p_i$, so final convergence is limited by how often the tail appears.

The slogan is:

**The head does not just learn first; it changes the gradient that the tail receives.**

![Power-law state tracking creates a head-to-tail learning process rather than a flat all-at-once problem.](/images/blog/power-law/state-tracking-power-law.png)

*Figure 2: In the transformer state-tracking experiments, power-law training shows the staged pattern predicted by the toy model: escape, head-to-tail transfer, then tail-limited convergence.*

The long tail is still long. The difference is that the learner no longer has to discover the tail from a perfectly symmetric starting point.

## What The Theorem Says

The simplified theorem has the same shape as the story.

Under uniform inputs, the paper proves an SQ-style lower bound: for $k$-fold composition, gradient-like statistical queries need either many queries or very fine tolerance. In slide form, the obstruction scales like a power of $d$ that worsens with $k$.

Under a power law $p_j\propto j^{-\alpha}$ with $\alpha>1$ and constant $k$, minibatch SGD can learn the hidden skill vector using roughly

$$
\widetilde O(d^{2\alpha})
$$

samples in the simplified model.

Do not overread the exact exponent. The blog-level message is not "Zipf is always optimal." The message is that asymmetry changes the computational problem:

**Uniform creates a symmetric hard instance. Power law creates a learning order.**

## Transformer Evidence

The paper then checks whether the toy mechanism leaves fingerprints in transformer experiments.

It does, at least qualitatively.

In state tracking, the loss landscape around initialization is flatter under uniform data and has a clearer descent direction under power-law data. When skills are grouped by frequency, the learned dynamics move from head bins to tail bins, and gradient norms show the head helping amplify the tail.

In synthetic multi-hop QA, questions are generated by chaining facts:

$$
e_0 \xrightarrow{r_1} e_1
\xrightarrow{r_2} e_2
\cdots
\xrightarrow{r_k} e_k.
$$

The model must compose relations, not merely recall one edge.

![A multi-hop QA task asks the model to compose several relations rather than retrieve one isolated fact.](/images/blog/power-law/multi-hop-qa.png)

*Figure 3: Multi-hop QA turns knowledge into a composition problem. The model must track intermediate entities, not just memorize isolated facts.*

The same broad pattern also appears in synthetic GSM-style arithmetic data, where examples are generated from dependency graphs and the relevant skills are numbers and operations inside the graph.

This evidence is mechanistic, not a complete theorem for language-model pretraining. The toy model explains why the experiments are plausible. It does not prove that all LLM reasoning works this way.

## What Kind Of Asymmetry Matters?

The ablations are useful because they prevent the story from becoming too cute.

Fine-grained asymmetry matters. A power law over coarse bins helps less than a fine-grained power law over skills.

The exponent $\alpha$ is a tradeoff. Larger $\alpha$ gives a stronger head and larger initial alignment, but it also makes the tail lighter. Early learning improves; final tail convergence can slow down.

![The power-law exponent controls a tradeoff: stronger head signal can help early learning, but a lighter tail slows rare skills.](/images/blog/power-law/exponent-tradeoff.png)

*Figure 4: The exponent is a knob, not a free lunch. More skew can strengthen the early signal while making rare skills even rarer.*

Skill order is not the whole story. Random and reverse rank order still learn, so the effect is not merely "easy skills first."

Curriculum is still useful. Uniform plus curriculum can work, but power law plus curriculum can train faster and more smoothly in the experiments.

So the practical lesson is not "make everything skewed." It is:

**The data distribution is not only a coverage choice. It is an optimization choice.**

## An Intuition

Imagine trying to orient yourself on a map where every landmark appears exactly once.

Uniformity feels fair. No landmark gets special treatment. But because nothing repeats, nothing gives you a stable reference frame.

A power law makes some landmarks appear again and again. At first, that seems wasteful. But repeated landmarks give you orientation. Once you know where they are, the rest of the map is easier to place.

In the model:

- the landmarks are head skills,
- the map orientation is $A(w)$,
- the strength of the compositional signal is $A(w)^{k-1}$,
- the remaining difficulty of rare locations is $p_i$.

The analogy is not that head skills contain all the knowledge. They do not.

The analogy is that head skills help define the coordinate system in which tail skills can be learned.

## What This Suggests In Practice

In this simplified model, power-law data helps because it breaks a harmful symmetry in the optimization landscape.

This suggests, but does not prove, several practical lessons:

- Flattening a dataset may improve tail coverage while weakening useful frequency structure.
- For compositional tasks, the best sampling distribution may not be uniform.
- Head examples can help tail evaluation if they build reusable alignment.
- Curriculum and power-law sampling should be studied together, because both change learning order.
- The right question is not only "how often does each skill appear?" but also "which skills create signal for other skills?"

The compact version:

**For compositional reasoning, frequency is not just a fairness variable. It is a gradient variable.**

## What This Does Not Show

This is the part that matters if we want the idea to survive contact with reality.

- Power law does not always beat uniform. For one-hop memorization, uniform can be better because coverage is the bottleneck.
- Power law does not remove the tail bottleneck. Rare skills still receive fewer updates.
- The clean order-one alignment claim uses fixed $\alpha>1$. Other regimes need separate analysis.
- The optimal data distribution is not identified. The theorem explains one helpful asymmetry, not the best possible sampler.
- The simplified model uses scalar sign skills and independent samples from a known distribution.
- The transformer experiments provide mechanistic evidence across synthetic reasoning tasks, not a theorem for full LLM pretraining.
- A large exponent can help the beginning and hurt the end. Skew is a tradeoff, not a miracle.

So the claim is not:

> Power-law data is always better.

The claim is:

> When the task requires composition, power-law asymmetry can create a gradient signal that uniform data removes.

That is smaller, sharper, and more useful.

## References

- Zixuan Wang, Xingyu Dang, Jason D. Lee, and Kaifeng Lyu. [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951). arXiv, 2026.
- Yoshua Bengio, Jerome Louradour, Ronan Collobert, and Jason Weston. [Curriculum Learning](https://doi.org/10.1145/1553374.1553380). ICML, 2009.
- Aaron Clauset, Cosma Rohilla Shalizi, and M. E. J. Newman. [Power-law distributions in empirical data](https://doi.org/10.1137/070710111). SIAM Review, 2009.

## The One Thing To Remember

Uniform data gives equal coverage. Power-law data gives asymmetry.

For single skills, equal coverage can be exactly what we want. For composed skills, symmetry can hide the direction of learning.

The question is not simply whether a data distribution is balanced.

**The question is what learning order it induces.**
