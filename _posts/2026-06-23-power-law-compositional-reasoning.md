---
layout: single
title: "Why Asymmetric Power Laws Help Reasoning?"
description: "Uniform distribution improves long-tail coverage, but power-law distribution can improve the loss landscape for compositional reasoning by breaking symmetry."
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
classes:
  - power-law-post
author_profile: false
read_time: true
toc: true
toc_sticky: true
---

<p class="powerlaw-spoiler"><strong>Spoiler:</strong> <strong>Power-law distribution fixes the landscape for reasoning.</strong> For memorizing facts, an asymmetric power-law distribution hinders rare facts from getting seen. But for compositional reasoning, the bottleneck changes: uniform distribution can make the loss landscape symmetric and nearly flat near initialization, while power-law distribution breaks this symmetry and creates the first useful descent signal.</p>

<p class="powerlaw-links">Links: <a href="https://arxiv.org/abs/2604.22951">paper</a>, <a href="https://arxiv.org/pdf/2604.22951">PDF</a>, and Eric Michaud's <a href="https://ericjmichaud.com/quanta/">quanta essay</a>.</p>

## Why power law?

Power laws are one of the most natural shapes in language. At the word level, Zipf's law says that a few words appear constantly while most words are rare. At a more abstract level, the "items" may not be words at all: they may be latent skills or knowledge pieces whose occurrence frequencies follow a power-law distribution, $p_i\propto i^{-\alpha}$.

Michaud's quanta view makes this abstraction more concrete. Think of pretraining as learning many discrete modules, or quanta: one module might retrieve a piece of knowledge, while another might implement a small algorithm. Each quantum matters only on the tokens where it improves prediction. If their use frequencies follow a power law, then smooth neural scaling can arise from a long sequence of discrete learning events: as we scale data, parameters, or training time, the model keeps reaching farther into the tail of useful modules.

<blockquote class="powerlaw-pullquote">
  <p>The "use frequencies" of the quanta naturally follow a power law.</p>
  <cite>Eric Michaud, <a href="https://ericjmichaud.com/quanta/">On neural scaling and the quanta hypothesis</a></cite>
</blockquote>

<figure class="powerlaw-figure powerlaw-figure--pair">
  <div class="powerlaw-panels powerlaw-panels--middle">
    <a href="https://ericjmichaud.com/quanta/">
      <video autoplay loop muted playsinline aria-label="Animated sparse parity learning plot from Eric Michaud's quanta essay">
        <source src="https://ericjmichaud.com/quanta/assets/parity-X-website.mp4" type="video/mp4">
      </video>
    </a>
    <a href="https://ericjmichaud.com/quanta/">
      <img src="https://ericjmichaud.com/quanta/assets/quanta-sequence.png" alt="Eric Michaud's quanta sequence power-law schematic">
    </a>
  </div>
  <figcaption>Figure 1: Michaud's quanta picture has two parts: individual skills can appear as sharp learning transitions, and their use frequencies form a long-tailed sequence. Our question is what changes when the task requires composition of several skills. Source: Eric J. Michaud, <a href="https://ericjmichaud.com/quanta/">On neural scaling and the quanta hypothesis</a>.</figcaption>
</figure>

But the same story also exposes a problem. Under a power-law distribution, rare skills are observed only when the dataset becomes very large, while the most frequent skills may be sampled far beyond what is necessary for learning them.

If the goal is to learn atomic knowledge or individual skills faster, the obvious data-curation move is to flatten the distribution: up-weight low-frequency skills, down-weight high-frequency ones, and move closer to a uniform distribution over skills. Given enough knowledge about the data and enough budget for curation, this sounds like the ideal long-tail fix.

That is the intuition we start from. If a power-law distribution creates a long-tail problem, shouldn't a more uniform distribution help?

<figure class="powerlaw-figure powerlaw-figure--wide">
  <a href="/images/blog/power-law/distribution-comparison.pdf">
    <img src="/images/blog/power-law/distribution-comparison.png" alt="Uniform and power-law skill distributions">
  </a>
  <figcaption>Figure 2: Uniform distribution assigns nearly equal probability mass to each skill. Power-law distribution keeps high-frequency skills and scarce long-tail skills. The puzzle is why this asymmetry improves the loss landscape for compositional reasoning tasks.</figcaption>
</figure>

## Sanity check: memorization on one-hops

We start with a task where memorizing atomic knowledge is required, one-hop Question Answering (QA). Each example contains a single fact of the form "entity -- relation --> answer." The question asks for that answer directly. There is no intermediate entity to carry, no second relation to apply, and no hidden chain to execute. This is memorization in the cleanest sense.

In this setting, if a relation is rare under a power-law distribution, the model simply sees fewer direct examples of that relation. Since the test set asks one-hop questions across all relations, the bottleneck is coverage of long-tail relation skills. Therefore, uniform distribution should help on this task.

<div class="powerlaw-example">
  <div class="powerlaw-example__title">One-hop memorization example</div>
  <div class="powerlaw-example__body">
    <p><strong>Fact:</strong> Anya <span>-- father --></span> Loid</p>
    <p><strong>Question:</strong> Who is the father of Anya?</p>
    <p><strong>Answer:</strong> Loid</p>
  </div>
</div>

The experiment behaves exactly this way. We randomly rank relations, train one model with uniformly sampled relations and another with power-law sampled relations, and evaluate exact match on one-hop questions. Uniform distribution wins this race.

<figure class="powerlaw-figure">
  <img src="/images/blog/power-law/single-hop-memorization.png" alt="Uniform distribution learns a one-hop memorization task faster than power-law distribution">
  <figcaption>Figure 3: For one-hop memorization, the usual long-tail intuition is correct. Uniform distribution gives rare relations more exposure and reaches high exact match faster.</figcaption>
</figure>

In all, if the task were only to store isolated facts, "use a power-law distribution" would be a strange recommendation. High-frequency skills are already frequent; scarce long-tail skills need data. Shifting towards a uniform distribution gives every skill a fairer chance.

## What if the task is multi-hop?

Our paper, [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951), asks what happens when the goal is not to recall one atomic fact, but to compose several skills to solve a problem.

Here, "reasoning" means multi-step knowledge manipulation or multi-step function composition: apply one relation, carry the intermediate result, then apply another relation; update an internal state through several steps; or compose arithmetic operations without an explicit chain-of-thought trace.

<p class="powerlaw-remark"><strong>Remark.</strong> This framing is close to work on <a href="https://arxiv.org/abs/2309.14402">knowledge manipulation</a>, <a href="https://arxiv.org/abs/2505.17923">implicit multi-hop reasoning</a>, state tracking, and transformer limits on composition (<a href="https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00562/116410/The-Parallelism-Tradeoff-Limitations-of-Log">parallelism</a>, <a href="https://arxiv.org/abs/2310.07923">chain of thought</a>).</p>

Now change only the task. Instead of asking for one relation, ask for a chain. The model must apply one relation, keep the intermediate entity around, and then apply another relation.

<div class="powerlaw-example">
  <div class="powerlaw-example__title">Two-hop example</div>
  <div class="powerlaw-example__body">
    <p><strong>Fact 1:</strong> Alice <span>-- advisor --></span> Bob</p>
    <p><strong>Fact 2:</strong> Bob <span>-- institution --></span> Princeton</p>
    <p><strong>Question:</strong> What is the institution of Alice's advisor?</p>
    <p><strong>Answer:</strong> Princeton</p>
  </div>
</div>

This is a small change in surface form, but a large change in the learning problem. In one-hop QA, each relation can be learned almost independently: see enough examples of the relation, store the mapping, retrieve it later. In two-hop QA, the model has to retrieve the first fact, use its answer as the input to the second fact, and only then produce the final answer.

This makes the uniform intuition even more tempting. If a chain uses $k$ skills with frequencies roughly $p_1,\ldots,p_k$, the full combination is much rarer than any one skill alone. From a pure coverage view, power-law distribution should look especially bad here: it undersamples scarce long-tail skills, and rare chains involve rare pieces.

So the naive prediction is: uniform distribution should help more for multi-hop reasoning than for memorization.

But the experiment goes the other way.

<figure class="powerlaw-figure powerlaw-figure--compact">
  <img src="/images/blog/power-law/multi-hop-qa-accuracy.png" alt="Power-law distribution learns the multi-hop QA task earlier than uniform distribution">
  <figcaption>Figure 4: The one-hop result says uniform distribution helps coverage. The multi-hop result says coverage is not enough for compositional reasoning tasks.</figcaption>
</figure>

So the puzzle is not "is uniform distribution good or bad?" For isolated facts, uniform distribution is good for the expected reason: it improves exposure. The real question is: **what changes when a model has to compose skills rather than recall them one at a time?**

Our answer is that composition changes the optimization geometry. Uniform distribution removes imbalance, but it can also make the loss landscape too symmetric near initialization. Power-law distribution breaks this symmetry and creates the first useful descent signal.

To see this without all the moving parts of a transformer, we need a toy task where the only thing left is skill composition under a training distribution.

## A minimalist model of skill composition

To understand why only a switch of training distribution can flip the result, we want the simplest model that still contains skill composition.

Real transformer experiments are too entangled for this purpose. In multi-hop QA, state tracking, or arithmetic, the model is learning representations, using attention, dealing with finite samples, and composing several hidden operations at the same time. If power-law distribution helps there, it is hard to tell which part of the system is responsible.

So the paper strips the problem down to a minimalist task. The toy task keeps only three ingredients: there are $d$ fixed skills, each example asks for a composition of $k$ sampled skills, and the training distribution over skills can be either uniform or power-law. Everything else is removed.

This leads to **$k$-multiplicative composition**. It is similar in spirit to state tracking: a sequence of input functions has to be composed before the answer is known. The difference is that each skill is now only a hidden scalar sign, and the composition operation is multiplication. That makes the landscape analyzable while preserving the core difficulty: a skill is not useful alone; it is useful only through composition with other skills.

There are $d$ skills. Skill $i$ has a hidden sign $w_i^\star$, equal to either $-1$ or $+1$. A training example samples $k$ skills from a distribution $p$, and the label is the product of their hidden signs:

$$
y=\prod_{t=1}^k w^\star_{I_t}.
$$

The model stores one parameter $w_i$ per skill and predicts the same kind of product:

$$
f_w(X)=\prod_{t=1}^k w_{I_t}.
$$

You can think of this as a parity-like task with hidden knowledge behind each input skill. In ordinary parity, the input already gives the signs. Here the input only gives the skill names; the model has to uncover the hidden scalar behind each skill and compose those hidden scalars correctly.

This model is not meant to be realistic. The simplification is intentional: the hidden skills are fixed, the sampled skills are independent, and all transformer machinery is stripped away. What remains is the part we want to isolate: composition under a training distribution.

Its job is to separate the two forces that were mixed together in the experiments:

- For $k=1$, learning is local. Each example updates one skill.
- For $k>1$, learning is global. A skill is useful only when it agrees with the other skills in the product.

To analyze gradient descent, the paper considers the matched learner

$$
f_w(X)=\prod_{t=1}^k w_{I_t},\qquad w\in\mathbb R^d,
$$

and optimizes the population square loss

$$
\mathcal L(w)=\frac12\mathbb E_X\left[\left(f_w(X)-f_{w^\star}(X)\right)^2\right].
$$

The two quantities that control the dynamics are the weighted inner product and weighted norm

$$
A(t)=\sum_{i=1}^d p_iw_i(t)w_i^\star,\qquad
B(t)=\sum_{i=1}^d p_iw_i(t)^2.
$$

Because the $k$ input skills are sampled independently,

$$
\mathbb E[f_w(X)^2]=B(t)^k,\qquad
\mathbb E[f_w(X)f_{w^\star}(X)]=A(t)^k.
$$

So the population loss simplifies to

$$
\mathcal L(w)=\frac12\left(B(t)^k-2A(t)^k+1\right).
$$

Differentiating gives the population gradient

$$
\nabla \mathcal L(w(t))
=kD\left(B(t)^{k-1}w(t)-A(t)^{k-1}w^\star\right),
\qquad D=\mathrm{diag}(p_1,\ldots,p_d).
$$

Equivalently, the expected gradient descent update for coordinate $j$ is

$$
w_j(t+1)-w_j(t)
=\eta kp_j\left(A(t)^{k-1}w_j^\star-B(t)^{k-1}w_j(t)\right).
$$

This equation is the theory in miniature. The factor $p_j$ is the local sampling frequency of skill $j$. The factor $A(t)^{k-1}$ is the global composition signal: it is large only when the current model has some weighted alignment with the hidden target. The second term, involving $B(t)$, controls the model's own scale. For early learning, the key question is whether the signal term

$$
kp_jA(t)^{k-1}w_j^\star
$$

is large enough for gradient descent to move.

## Uniform distribution fails: lower bound

Can a gradient-based algorithm learn this task efficiently under uniform data? The paper's answer is no, at least for a broad correlational statistical query class that includes online SGD on square loss.

Informally, when the input distribution is uniform, any CSQ learner using $q$ gradient-style queries needs tolerance

$$
\tau^2\le \left(\frac{\log(dq)}{d}\right)^{k/2}
$$

to reach constant loss. Using the usual sampling heuristic $\tau\approx 1/\sqrt n$, this means that when $q\lesssim d^{k/2}$, the learner needs about

$$
n\gtrsim d^{k/2}
$$

samples. In other words, under a uniform distribution, learning the composition task suffers from a computational gap when $d$ is large and the hop number $k$ is not tiny.

The intuition is symmetry. Under uniform inputs, the function class is too balanced: many possible hidden vectors have tiny pairwise correlations, so correlation-based queries reveal very little about which hidden vector is correct. The same problem appears in the gradient dynamics. If $w_i(0)\sim\mathcal N(0,r^2)$, then

$$
\mathrm{Var}(A(w_0))=r^2\sum_{i=1}^d p_i^2.
$$

Under uniform distribution, every skill has probability $1/d$, so $\sum_i p_i^2=1/d$. The initial similarity is an average over all $d$ random coordinates, and its typical size is about

$$
\lvert A(w_0)\rvert\approx \frac{r}{\sqrt d}.
$$

Composition raises this small quantity to the power $k-1$. The useful initial signal therefore behaves like

$$
\left(\frac{r}{\sqrt d}\right)^{k-1}.
$$

This is the hidden cost of uniform distribution. It removes imbalance, but it also makes the initial gradient tiny. The lower bound is distributional: it relies on the uniform or symmetric training distribution. That is exactly why the next question is natural: can the asymmetry in a power-law distribution break this hardness?

## Power-law distribution enables composition

The positive result says yes. In contrast to uniform distribution, online minibatch gradient descent can learn the matched $k$-multiplicative model efficiently under a Zipf distribution, under the theorem's assumptions.

Informally, let $p_j\propto j^{-\alpha}$ with $\alpha>1$. Suppose $k=\Theta(1)$ is even, $w(0)\sim\mathcal N(0,r^2I_d)$ with $r=\Theta(1)$, and the learning rate and batch size are in the stable regime. Then with high probability, minibatch gradient descent recovers the hidden skill vector up to error $\varepsilon$ with about

$$
\widetilde O\left(\frac{d^{2\alpha}}{\eta\varepsilon}\right)
$$

samples, and within roughly

$$
\widetilde O\left(\frac{d^\alpha}{\eta}\log\frac1\varepsilon\right)
$$

iterations. When the composition number is large enough compared with the exponent, this beats the uniform lower-bound scaling.

The proof idea follows the population gradient above. Under a power-law distribution, the head skills have constant-scale probability mass. Equivalently, $\sum_i p_i^2$ does not shrink like $1/d$. Therefore the initial weighted similarity is no longer washed out:

$$
|A(0)|\approx \Theta(r).
$$

At the same time, for small constant initialization scale, $B(0)\approx \Theta(r^2)$. Thus the signal term dominates the first update:

$$
w_j(1)-w_j(0)
\approx \eta kp_jA(0)^{k-1}w_j^\star.
$$

Or, in vector form near initialization,

$$
\nabla\mathcal L(w_0)
\approx -k\,\mathrm{diag}(p)\,A(0)^{k-1}w^\star.
$$

This is the benign asymmetry. For head skills with constant rank, $p_j=\Theta(1)$, so the initial gradient is large enough to create a real descent direction. The paper then proves a Polyak-Lojasiewicz-style inequality along the stable population trajectory:

$$
\|\nabla\mathcal L(w(t))\|_2^2
\gtrsim p_{\min}A(0)^{2k-2}\mathcal L(w(t)).
$$

This guarantees convergence of the population GD dynamics; a finite-sample concentration argument then shows that minibatch SGD tracks the population trajectory. The same proof technique also explains why uniform distribution is hard: under uniform sampling, $p_j=1/d$ and $A(0)\approx O(1/\sqrt d)$, so the initial gradient becomes $d^{-\Omega(k)}$ and gradient descent takes polynomially or exponentially longer to escape initialization.

Notice what this does and does not say. Power law is not making the tail frequent. It is making the landscape less symmetric at the start. The long-tail drawback is still real; it just becomes a later-stage bottleneck rather than the first thing that kills training.

The theory therefore predicts three stages:

1. **Escape.** Power-law distribution improves the initial landscape and helps GD leave the flat region.
2. **Head first.** High-frequency skills learn faster because their $p_i$ is larger.
3. **Tail later.** Once head skills are learned, they increase $A(t)$ and strengthen gradients for tail skills, but final convergence is still slowed by rare sampling.

## The transformer check: state tracking

The paper then asks whether these signatures appear in an actual transformer. The cleanest place to look is state tracking, a synthetic composition task related to Allen-Zhu's [DePO/canon-layer setup](https://ssrn.com/abstract=5240330), Merrill and Sabharwal's transformer limits work ([parallelism](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00562/116410/The-Parallelism-Tradeoff-Limitations-of-Log), [chain of thought](https://arxiv.org/abs/2310.07923)), and our [curriculum study](https://arxiv.org/abs/2505.23683).

In the paper's $S_5$ state tracking task, the skills are permutations. The input is a sequence of permutations, and the target is their composition. The model cannot solve the task by recognizing one update rule in isolation; it has to carry an internal state through several composition steps.

This task is the bridge between the theorem and the language experiments. It is still controlled enough to inspect, but it is already a transformer learning a nontrivial composition problem. And here the paper sees the same first-order phenomenon: only changing the skill distribution can turn an apparently unlearnable implicit composition task into a learnable one.

<figure class="powerlaw-figure powerlaw-figure--pair powerlaw-figure--state">
  <div class="powerlaw-panels powerlaw-panels--state">
    <img src="/images/blog/power-law/power-law-composition.png" alt="State tracking accuracy under uniform distribution and power-law distribution">
    <img src="/images/blog/power-law/state-tracking-power-law.png" alt="Illustration of state tracking as multi-hop composition">
  </div>
  <figcaption>Figure 5: State tracking is the controlled transformer version of the toy model. Uniform distribution fails to escape; power-law distribution makes the same task learnable.</figcaption>
</figure>

The point of these plots is not to prove a transformer theorem. It is to check whether the toy model's predicted signatures - flat uniform landscape, power-law escape, head-to-tail learning - show up in a real training run.

**Stage I: power law enables escaping from the flat region.** To visualize the landscape, the paper takes training trajectories from the $S_5$ state tracking task, computes the top two PCA directions from checkpoint differences, and plots the loss in that plane. Under uniform distribution, the initialization region is much flatter. Under power-law distribution, there is a visibly steeper descent direction.

<figure class="powerlaw-figure powerlaw-figure--compact">
  <img src="/images/blog/power-law/loss-landscape.png" alt="Uniform distribution and power-law distribution state-tracking loss landscapes">
  <figcaption>Figure 6: Uniform distribution fails to escape from the initial flat region. Power-law distribution induces a beneficial asymmetry and creates a steeper descent direction.</figcaption>
</figure>

This is the theory's first stage in picture form. The training distribution does not merely change which examples are sampled. It changes the shape of the loss the model has to descend.

**Stage II: head skills help the tail.** After the model escapes, the head skills are learned first. In the toy model, this increases $A(t)$, and the tail-skill signal term $p_jA(t)^{k-1}w_j^\star$ becomes larger. In words: once the model has learned useful head compositions, examples involving tail skills become easier to learn because the other pieces in the composition are no longer noise.

The state tracking experiment checks this directly. The permutations are grouped by rank into bins. The high-frequency bin learns first. Then the gradient norm on samples that require tail permutations becomes larger when the other input permutations come from the learned head bin. This is the empirical counterpart of increasing $A(t)$ in the toy model.

<figure class="powerlaw-figure powerlaw-figure--wide">
  <img src="/images/blog/power-law/state-tracking-stages.png" alt="State tracking stage-wise learning mechanism under power-law distribution">
  <figcaption>Figure 7: The transformer dynamics show the same stage-wise learning mechanism as the minimalist model: high-frequency skills are learned first, then raise the signal for scarce long-tail skills, while long-tail convergence remains the final bottleneck.</figcaption>
</figure>

**Stage III: the long-tail drawback returns.** The paper does not claim that the tail magically becomes easy. In the final stage, tail skills still appear with small probability, so their convergence is slower. This is exactly the tradeoff: power law wins early because it improves the landscape and creates head-to-tail acceleration; it pays later because the tail remains rare.

So the mechanistic story is not "asymmetry is always good." It is more specific: enough asymmetry is needed to break the hard symmetric landscape, but too much asymmetry can slow the final long-tail phase.

## Back to reasoning tasks

State tracking isolates the mechanism, but it is still an algorithmic task. The paper then tests whether the same advantage appears in more language-like reasoning settings, while keeping the evaluation distribution uniform. This matters: the power-law model is not being tested only on the head. It has to solve uniformly sampled test examples.

The first setting is multi-hop QA. The data comes from a synthetic knowledge graph with facts of the form

$$
e_i \xrightarrow{r} e_j,
$$

and questions formed by chaining relations:

$$
e_0 \xrightarrow{r_1} e_1
\xrightarrow{r_2} e_2
\cdots
\xrightarrow{r_k} e_k.
$$

Each relation is treated as an atomic skill, but the answer requires several hops in order. The model cannot solve the task by memorizing one edge. It must perform the intermediate hops internally, without explicit chain-of-thought supervision.

The second setting is synthetic GSM-style arithmetic. These problems are generated from dependency graphs and natural-language templates. The skills are numbers or arithmetic components, and the answer requires composing several operations. This is a different surface form from relation chaining, which makes it a useful robustness check.

<div class="powerlaw-example powerlaw-example--grid">
  <div>
    <div class="powerlaw-example__title">Multi-hop QA</div>
    <p><strong>Facts:</strong> Alice's advisor is Bob. Bob's institution is Princeton.</p>
    <p><strong>Question:</strong> What is the institution of Alice's advisor?</p>
    <p><strong>Computation:</strong> Alice -> Bob -> Princeton</p>
  </div>
  <div>
    <div class="powerlaw-example__title">GSM-style arithmetic</div>
    <p><strong>Facts:</strong> Start with 4. Add 3. Then double it.</p>
    <p><strong>Question:</strong> What number do we get?</p>
    <p><strong>Computation:</strong> 4 -> 7 -> 14</p>
  </div>
</div>

Across these tasks, the pattern is consistent with the theory. Power-law training learns faster than uniform training even though evaluation is uniform. Multi-hop QA also shows the same kind of landscape and stage-wise behavior observed in state tracking. GSM-style arithmetic shows that the effect is not limited to relation composition.

<figure class="powerlaw-figure powerlaw-figure--wide powerlaw-figure--pair">
  <div class="powerlaw-panels powerlaw-panels--two-one">
    <img src="/images/blog/power-law/multi-hop-qa-mechanism.png" alt="Multi-hop QA stage-wise learning mechanism and loss landscapes">
    <img src="/images/blog/power-law/gsm-modular.png" alt="Power-law distribution is much faster on modular GSM-style arithmetic">
  </div>
  <figcaption>Figure 8: The same mechanism appears beyond state tracking. Multi-hop QA shows the stage-wise learning mechanism and a steeper power-law loss landscape; GSM-style arithmetic shows that the advantage of power-law distribution is not limited to relation chaining.</figcaption>
</figure>

## The intuition to keep

Uniform distribution is balanced for coverage, but balance can make a compositional task too symmetric. In the minimalist model, this symmetry makes $A(0)$ small, which makes the useful gradient scale like $A(0)^{k-1}$. In the transformer experiments, the same idea appears as a flatter loss landscape near initialization.

Power-law distribution is imbalanced, but the imbalance is useful for optimization. It induces a beneficial asymmetry, gives high-frequency skills a larger initial learning signal, and improves the pathological loss landscape. After the model escapes the initial flat region, high-frequency skills are learned first and then accelerate the learning of scarce long-tail skills.

The takeaway is not "the tail is easier under power law." It is: power law first changes the landscape, then creates an implicit head-to-tail learning order.

## What this suggests in practice

The practical lesson is not "make all training distributions more asymmetric." It is narrower and closer to the paper:

- Evaluate memorization and composition separately. A distribution that improves one-hop recall can hurt implicit multi-hop learning.
- Do not treat repeated high-frequency skills as automatically wasted. In a compositional reasoning task, they can break symmetry and create a descent direction.
- Tune the exponent. Larger $\alpha$ can improve the initial landscape and speed up head learning, but too much asymmetry slows the final tail phase.
- Ask not only "do scarce long-tail skills get enough examples?", but also "does this training distribution improve the pathological loss landscape?"

## What this does not show

- The result does not say power-law distribution is always better. In one-hop memorization, uniform distribution learns faster.
- The theorem is for a minimalist $k$-multiplicative composition model, not a full transformer theory.
- The positive theorem assumes a Zipf distribution with $\alpha>1$, constant even $k$, Gaussian initialization, stable step size, sufficient batch size, and a learner matched to the compositional structure.
- The lower bound is for uniform or symmetric input distributions and correlational statistical-query learners, which include gradient-like methods but not every possible algorithm.
- The experiments are synthetic: state tracking, synthetic multi-hop QA, and synthetic GSM-style arithmetic.
- Other asymmetric distributions might also help. The paper treats power-law distribution as a natural, fine-grained source of asymmetry, not the only possible one.

The surprising lesson is that shifting towards uniform distribution can induce hardness for composition tasks. Power-law distribution helps not because scarce long-tail skills become common, but because it induces a beneficial asymmetry that improves the pathological loss landscape. The model first escapes the initial flat region, then learns high-frequency skills, and then uses those learned high-frequency skills as a stepping stone to learn scarce long-tail skills.

The thing to remember is simple: <strong>power-law distribution helps reasoning by improving the loss landscape for compositional reasoning tasks.</strong>

## References

- Zixuan Wang, Xingyu Dang, Jason D. Lee, and Kaifeng Lyu. [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951). arXiv, 2026.
- Eric J. Michaud. [On neural scaling and the quanta hypothesis](https://ericjmichaud.com/quanta/). 2026.
- Eric J. Michaud, Ziming Liu, Uzay Girit, and Max Tegmark. [The Quantization Model of Neural Scaling](https://arxiv.org/abs/2303.13506). NeurIPS, 2023.
- Zeyuan Allen-Zhu. [Physics of Language Models: Part 4.1, Architecture Design and the Magic of Canon Layers](https://ssrn.com/abstract=5240330). SSRN, 2025.
- Zeyuan Allen-Zhu and Yuanzhi Li. [Physics of Language Models: Part 3.2, Knowledge Manipulation](https://arxiv.org/abs/2309.14402). arXiv, 2023.
- William Merrill and Ashish Sabharwal. [The Parallelism Tradeoff: Limitations of Log-Precision Transformers](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00562/116410/The-Parallelism-Tradeoff-Limitations-of-Log). TACL, 2023.
- William Merrill and Ashish Sabharwal. [The Expressive Power of Transformers with Chain of Thought](https://arxiv.org/abs/2310.07923). arXiv, 2023.
- Zixuan Wang, Eshaan Nichani, Alberto Bietti, Alex Damian, Daniel Hsu, Jason D. Lee, and Denny Wu. [Learning Compositional Functions with Transformers from Easy-to-Hard Data](https://arxiv.org/abs/2505.23683). arXiv, 2025.
- Nouha Dziri et al. [Faith and Fate: Limits of Transformers on Compositionality](https://arxiv.org/abs/2305.18654). arXiv, 2023.
- Yuekun Yao, Yupei Du, Dawei Zhu, Michael Hahn, and Alexander Koller. [Language Models Can Learn Implicit Multi-Hop Reasoning, but Only if They Have Lots of Training Data](https://arxiv.org/abs/2505.17923). arXiv, 2025.
- Sanjeev Arora and Anirudh Goyal. [A Theory for Emergence of Complex Skills in Language Models](https://arxiv.org/abs/2307.15936). arXiv, 2023.
- Michael Kearns. [Efficient noise-tolerant learning from statistical queries](https://doi.org/10.1145/293347.293351). Journal of the ACM, 1998.
- Yoshua Bengio, Jerome Louradour, Ronan Collobert, and Jason Weston. [Curriculum Learning](https://doi.org/10.1145/1553374.1553380). ICML, 2009.
- Aaron Clauset, Cosma Rohilla Shalizi, and M. E. J. Newman. [Power-law distributions in empirical data](https://doi.org/10.1137/070710111). SIAM Review, 2009.
