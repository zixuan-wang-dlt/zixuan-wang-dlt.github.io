---
layout: single
title: 'Why are "Asymmetric" Power Laws Necessary for Reasoning?'
description: "Uniform sampling looks like the right fix for long-tail memorization, but compositional reasoning can need the very asymmetry that uniform removes."
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

*Uniform sampling looks like the right fix for long-tail memorization. Power-law sampling looks unfair and wasteful. But for compositional reasoning, the asymmetry that hurts coverage can be exactly what makes gradient descent move.*

**The old intuition.** Natural language has a brutal long tail: a few skills and facts appear constantly, while most appear rarely. The usual data-centric instinct is therefore to reweight or curate toward a more uniform distribution. This sounds especially compelling for rare skills. If a model almost never sees a fact, a relation, or a small reasoning primitive, why would repeating the head help? The head already has enough examples; the tail needs coverage.

**The conflict.** Our paper, [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951), starts from the opposite empirical surprise. Across compositional reasoning tasks such as state tracking, multi-hop QA, and multi-step arithmetic, training under a power-law distribution can outperform training under a uniform distribution. The point is not that the tail stops being rare. The point is that power-law sampling creates an asymmetry in the loss landscape, letting the model first acquire high-frequency compositions and then use that progress as a stepping stone toward rare long-tail skills.

## Why Uniform Looks Right

**Single-hop memorization.** Start with the simplest case: memorization. Think of facts like "Anya's father is Loid" and queries like "Who is the father of Anya?" There are entities, relations, and answers. If the relation "father" or some entity appears rarely, the model needs more direct exposure to memorize it. In this setting, uniform sampling is the natural answer because the bottleneck is coverage.

**The sanity check.** That intuition shows up cleanly in a toy one-hop QA experiment. We randomly rank relations, train under either a uniform or power-law distribution, and evaluate exact match. Uniform wins the early race.

![Uniform learns a one-hop memorization task faster than power-law sampling.](/images/blog/power-law/single-hop-memorization.png)

*Figure 1: For one-hop memorization, the usual long-tail intuition is correct. Uniform sampling gives rare relations more exposure and reaches high exact match faster.*

**Why the intuition is reasonable.** This is why "just use a power law" would be a strange story if the task were only memorization. The head is over-sampled; the tail is under-sampled. Uniform data gives every skill a fairer chance. If a model only has to store isolated facts, flattening the distribution is a very reasonable thing to try.

**The compositional twist.** Now make the problem compositional. Instead of asking for one relation, ask for a chain: Alice's advisor is Bob, Bob's institution is Princeton, so what is the institution of Alice's advisor? The model must apply one relation, use the intermediate entity, and then apply another relation. If the task composes $k$ facts, the naive long-tail argument becomes even stronger: if rare facts are already hard to memorize, rare combinations should be worse. It seems uniform should help even more.

**But the experiment goes the other way.**

![Power-law sampling learns the multi-hop QA task much earlier than uniform sampling.](/images/blog/power-law/multi-hop-qa-accuracy.png)

*Figure 2: In a three-hop QA task, the conclusion flips. The power-law run reaches high accuracy much earlier, even though the final task requires composing facts rather than memorizing one edge.*

**The real question.** So the question is not "is uniform good or bad?" The question is: what changes when we move from memorization to composition?

## Composition Adds A Gate

**The toy world.** To isolate the mechanism, strip the task down to a tiny mathematical model. There are $d$ hidden skills. Skill $i$ has a hidden sign $w_i^\star\in\lbrace -1,+1\rbrace$. A training example samples $k$ skill indices $I_1,\ldots,I_k$ from a distribution $p$, and the label is the product of the corresponding hidden signs:

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

**Why this model.** This model is deliberately small. It does not try to be a transformer. Its job is to separate memorization from composition. When $k=1$, an example touches one skill, and learning is coordinate-wise. When $k>1$, the label is a product, so each coordinate is only useful when it aligns with the rest of the product.

**The alignment variable.** Define the weighted alignment

$$
A(w)=\sum_{i=1}^d p_i w_iw_i^\star
$$

and the weighted norm

$$
B(w)=\sum_{i=1}^d p_iw_i^2.
$$

Let $D=\mathrm{diag}(p_1,\ldots,p_d)$. A direct calculation gives

$$
\nabla \mathcal L(w)
=kD\left(B(w)^{k-1}w-A(w)^{k-1}w^\star\right).
$$

**The gradient.** This equation is the whole story. The diagonal matrix $D$ is the local frequency factor: frequent skills move faster because they appear more often. The term $A(w)^{k-1}w^\star$ is the useful signal pointing toward the hidden skill vector. The exponent $k-1$ is the new difficulty caused by composition. If the current model has tiny global alignment with the target, then the useful gradient is tiny for every coordinate.

For $k=1$, the gate disappears:

$$
\nabla \mathcal L(w)=D(w-w^\star).
$$

**Where composition bites.** This is memorization. The bottleneck is the local factor $p_i$. Rare skills move slowly, and uniform helps by increasing their exposure. For $k>1$, the useful update for coordinate $i$ is proportional to

$$
p_iA(w)^{k-1}w_i^\star.
$$

**Two bottlenecks.** Now there are two bottlenecks. The local factor $p_i$ still controls how often skill $i$ appears. But the global factor $A(w)^{k-1}$ controls whether the model sees a useful compositional direction at all.

| Task | Useful coordinate signal | Main bottleneck |
| --- | ---: | --- |
| One-hop memorization | $p_i$ | tail coverage |
| $k$-hop composition | $p_iA(w)^{k-1}$ | coverage plus global alignment |

*Table 1: Uniform sampling helps the local coverage term. Composition adds a global alignment gate, and that gate can be almost closed under uniform data.*

## Why Uniform Can Make Reasoning Flat

**What happens at initialization.** Initialize $w_i(0)\sim\mathcal N(0,r^2)$. Since multiplying by $w_i^\star$ only flips signs, the initial alignment

$$
A(w_0)=\sum_{i=1}^d p_iw_i(0)w_i^\star
$$

has variance

$$
\mathrm{Var}(A(w_0))=r^2\sum_{i=1}^d p_i^2.
$$

Under uniform sampling, $p_i=1/d$, so $\sum_i p_i^2=1/d$. A typical initialization has

$$
\lvert A(w_0)\rvert\approx \frac{r}{\sqrt d}.
$$

The useful compositional signal is therefore

$$
\lvert A(w_0)\rvert^{k-1}
\approx
\left(\frac{r}{\sqrt d}\right)^{k-1}.
$$

**The hidden cost of fairness.** This is the part uniform sampling hides. It gives every skill equal probability, but it also averages the random initial alignment over all $d$ skills. That average is small, and composition raises it to a power. Near initialization, every direction looks almost equally uninformative.

**The lower-bound version.** The paper formalizes this with a correlational statistical-query lower bound. Under uniform inputs, a learner using $q$ gradient-like queries must use very fine tolerance to reach constant loss. One slide-level form is

$$
\tau^2 \le \left(\frac{\log(dq)}{d}\right)^{k/2}.
$$

**The lesson.** The takeaway is simpler than the theorem statement: uniform data creates a symmetric hard instance. That symmetry is harmless for one-hop memorization, but it can hide the target composition from gradient descent.

## What The Power Law Changes

**Break the symmetry.** Now sample skills from a power law:

$$
p_i=\frac{i^{-\alpha}}{\sum_{j=1}^d j^{-\alpha}}.
$$

**A larger initial signal.** For fixed $\alpha>1$, the head carries constant-scale probability mass as $d$ grows. The same variance calculation gives

$$
\mathrm{Var}(A(w_0))
=r^2\sum_{i=1}^d p_i^2
\approx
r^2\frac{\sum_i i^{-2\alpha}}{\left(\sum_i i^{-\alpha}\right)^2},
$$

which no longer shrinks like $1/d$. At initialization,

$$
\lvert A(w_0)\rvert\approx \Theta(r)
$$

instead of $r/\sqrt d$. Power law does not make the tail common. It does something more subtle: the repeated head skills create a detectable projection onto the target, so the compositional gradient has a direction to follow.

| Sampling rule | Initial alignment $\lvert A(w_0)\rvert$ | Useful signal $\lvert A(w_0)\rvert^{k-1}$ | What gradient descent sees |
| --- | ---: | ---: | --- |
| Uniform, $p_i=1/d$ | $r/\sqrt d$ | $r^{k-1}d^{-(k-1)/2}$ | nearly flat |
| Power law, $p_i\propto i^{-\alpha}$ | $\Theta(r)$ | $\Theta(r^{k-1})$ | a visible descent direction |

*Table 2: The head of the power law turns on the global alignment gate. That is why skew can help composition even though it hurts tail coverage.*

**The landscape view.** The loss landscape plot shows the same mechanism in a transformer state-tracking experiment. Around initialization, the uniform run sits in a flat region. The power-law run has a clearer direction of descent.

![Uniform training is nearly flat near initialization, while power-law training has a clearer descent direction.](/images/blog/power-law/loss-landscape.png)

*Figure 3: Loss over the top two PCA directions of checkpoint trajectories. The zoomed region shows the key difference: uniform training starts in a flat patch, while power-law training sees a descent direction.*

**Why "asymmetric" matters.** This is the sense in which the power law is "necessary" in the toy model: not because Zipf's law is magically optimal, but because some asymmetry is needed to break the flat symmetric landscape. Uniform removes imbalance, but for composition it can also remove the signal.

## The Head Is A Handle For The Tail

**After escape.** Once the model escapes the flat region, the head plays a second role. The coordinate-wise gradient is

$$
\nabla_i \mathcal L(w)
=kp_i\left(B(w)^{k-1}w_i-A(w)^{k-1}w_i^\star\right).
$$

**The tail still needs help.** For a tail coordinate $j$, the useful part scales like $p_jA(w)^{k-1}$. The tail still has small $p_j$, so power law has not erased the long-tail cost. But as the head skills learn, they increase

$$
A(w)=\sum_i p_iw_iw_i^\star.
$$

**Head-to-tail transfer.** That larger $A(w)$ amplifies the useful gradient for every coordinate, including rare ones. In the simplified proof, learning therefore has three stages: power-law asymmetry helps the model escape; head skills raise the global alignment and amplify tail gradients; then the original tail bottleneck returns once the alignment is already high.

![Power-law state tracking creates a staged head-to-tail learning process.](/images/blog/power-law/state-tracking-power-law.png)

*Figure 4: In state tracking, the learning order follows the theory: escape, head-to-tail transfer, and then tail-limited convergence. The head does not merely learn first; it changes the gradient seen by the tail.*

**The theorem.** The theorem says this more formally. Under uniform inputs, the SQ lower bound gives a $d^{\Omega(k)}$-type obstruction for gradient-like learning of $k$-fold composition. Under a power law $p_j\propto j^{-\alpha}$ with $\alpha>1$ and constant $k$, minibatch SGD learns the hidden skill vector using roughly

$$
\widetilde O(d^{2\alpha})
$$

samples in the minimalist model. The exponent is not the main message. The main message is that the distribution changes the optimization problem: uniform data creates a symmetric hard instance, while power-law data induces a learning order.

## Back To Multi-Hop QA

**A language-like test.** The multi-hop QA experiment is the clean language-like version of the same story. We generate a synthetic knowledge graph with facts of the form

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

**Why it is compositional.** For example: Alice's advisor is Bob; Bob's institution is Princeton; what is the institution of Alice's advisor? The model must compose facts internally. It cannot solve the task by memorizing one edge.

**Reading the plots together.** This is why the opening two plots should be read together. In one-hop QA, uniform wins because the bottleneck is coverage. In multi-hop QA, power law wins because the bottleneck is first finding a compositional direction. The same long tail is bad for direct memorization and useful for breaking symmetry in reasoning.

**GSM-style arithmetic.** The same pattern also appears in arithmetic data generated from dependency graphs, closer in spirit to GSM-style reasoning. Here the model is not just choosing among relations. It has to compose operations and numbers through a latent computation graph. In both non-modular and modular versions, power-law training reaches high test accuracy earlier than uniform training.

![Power-law training reaches high test accuracy earlier on non-modular GSM-style arithmetic.](/images/blog/power-law/gsm-nonmod.png)

*Figure 5: Non-modular GSM-style arithmetic. Power-law training learns the compositional dependency-graph task earlier than uniform training.*

![Power-law training is much faster on modular GSM-style arithmetic.](/images/blog/power-law/gsm-modular.png)

*Figure 6: Modular GSM-style arithmetic. Uniform sampling remains much slower, while power-law training quickly reaches near-perfect accuracy.*

## What This Does Not Say

**The boundary.** The claim is not that more skew is always better. Power law does not remove the tail; rare skills still receive fewer updates. It also does not mean uniform is bad in general. For one-hop memorization, the plot at the top shows the opposite. The claim is narrower: when the task requires composition, asymmetry can create the gradient signal that uniform data removes.

**The analogy.** A useful way to remember the result is to think about landmarks. A perfectly uniform map gives every landmark equal space, but it may not give you an anchor. A power law repeats a few landmarks again and again. That repetition looks wasteful if all you care about is coverage, but it gives you a coordinate system. In the model, the coordinate system is $A(w)$, and the strength of the compositional signal is $A(w)^{k-1}$.

**The practical question.** So the question is not only: does the tail get enough examples? It is also: what learning order does this distribution create?

## References

- Zixuan Wang, Xingyu Dang, Jason D. Lee, and Kaifeng Lyu. [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951). arXiv, 2026.
- Yoshua Bengio, Jerome Louradour, Ronan Collobert, and Jason Weston. [Curriculum Learning](https://doi.org/10.1145/1553374.1553380). ICML, 2009.
- Aaron Clauset, Cosma Rohilla Shalizi, and M. E. J. Newman. [Power-law distributions in empirical data](https://doi.org/10.1137/070710111). SIAM Review, 2009.
