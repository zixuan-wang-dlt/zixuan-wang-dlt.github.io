---
layout: single
title: "Why Do Asymmetric Power Laws Help Reasoning?"
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
related: false
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

## Sanity check: one-hop memorization

We start with a task that mainly requires memorizing atomic knowledge: one-hop question answering (QA). Each example contains a single fact of the form "entity -- relation --> answer." The question asks for that answer directly. There is no intermediate entity to carry, no second relation to apply, and no hidden chain to execute. This is memorization in the cleanest sense.

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

Overall, if the task were only to store isolated facts, "use a power-law distribution" would be a strange recommendation. High-frequency skills are already frequent; scarce long-tail skills need data. Shifting towards a uniform distribution gives every skill a fairer chance.

## What if the task is multi-hop?

However, natural language tasks are not just about single-hop memorization. <strong>Reasoning</strong> tasks, for example, often require combining multiple thinking steps or pieces of atomic knowledge to solve a problem. What happens when the task becomes more reasoning-heavy?

<p class="powerlaw-remark"><strong>Remark.</strong> This framing is close to work on <a href="https://arxiv.org/abs/2309.14402">knowledge manipulation</a>, <a href="https://arxiv.org/abs/2505.17923">implicit multi-hop reasoning</a>, state tracking, <a href="https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00562/116410/The-Parallelism-Tradeoff-Limitations-of-Log">parallelism</a>, and <a href="https://arxiv.org/abs/2310.07923">chain of thought</a>.</p>

Now we change only the task to a more reasoning-like, <strong>multi-hop QA</strong> task. Instead of asking for one relation, the questions ask for a chain of relations. The model must apply the relations one by one and compose all of them. For example:

<div class="powerlaw-example">
  <div class="powerlaw-example__title">Two-hop example</div>
  <div class="powerlaw-example__body">
    <p><strong>Fact 1:</strong> Alice <span>-- advisor --></span> Bob</p>
    <p><strong>Fact 2:</strong> Bob <span>-- institution --></span> Princeton</p>
    <p><strong>Question:</strong> What is the institution of Alice's advisor?</p>
    <p><strong>Answer:</strong> Princeton</p>
  </div>
</div>

When memorizing atomic facts, each relation can be learned almost <strong>independently</strong>. In contrast, in a two-hop QA problem, the model has to retrieve the first fact, use its answer as the input to the second fact, and only then produce the final answer.

Intuitively, if a chain uses $k$ skills with frequencies roughly $p_1,\ldots,p_k$, the full combination is much rarer than any one skill alone. From a pure coverage view, power-law distribution should look especially bad here: it undersamples scarce long-tail skills, and rare chains involve rare pieces. The naive prediction makes the uniform distribution even more tempting. Surprisingly, the experiment goes the other way instead: power-law distribution exhibits a clear gain in training speed.

<figure class="powerlaw-figure powerlaw-figure--compact">
  <img src="/images/blog/power-law/multi-hop-qa-accuracy.png" alt="Power-law distribution learns the multi-hop QA task earlier than uniform distribution">
  <figcaption>Figure 4: The one-hop result says uniform distribution helps coverage. The multi-hop result says coverage is not enough for compositional reasoning tasks.</figcaption>
</figure>

This raises our research question: **what changes when a model has to compose skills rather than recall them one at a time? Why does a power-law distribution help language models learn reasoning?**

## A minimalist model of skill composition

To understand why only a switch of training distribution helps in implicit compositional reasoning tasks, the paper looks for the simplest model of skill composition.

Transformer experiments mix many effects: representation learning, attention, finite samples, and hidden multi-step operations. To isolate the effect of the data distribution, the paper strips away everything except skill composition.

The resulting task is called **$k$-multiplicative composition**. It keeps three ingredients: there are $d$ fixed skills, each example asks for a composition of $k$ sampled skills, and the sampling distribution over skills can be either uniform or power-law.

Each skill is represented by a hidden scalar sign, and composition is represented by multiplication. The task is not meant to be realistic; it is meant to preserve the core difficulty that a skill is useful only through composition with other skills.

There are $d$ skills. Skill $i$ has a hidden sign $w_i^\star$, equal to either $-1$ or $+1$. A training example samples $k$ skills from a distribution $p$, and the label is the product of their hidden signs:

$$
y=\prod_{t=1}^k w^\star_{I_t}.
$$

The model stores one parameter $w_i$ per skill and predicts the same kind of product:

$$
f_w(X)=\prod_{t=1}^k w_{I_t}.
$$

You can think of this as a parity-like task with hidden knowledge behind each input skill. The input gives the skill names; the model has to uncover the hidden scalar behind each skill and compose those hidden scalars correctly.

For $k=1$, this is just one-hop learning: each example updates one skill. For $k>1$, the signal for one skill depends on whether the model is already aligned with the other skills in the product.

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

Here $A(t)$ is the similarity between the current model and the ground truth under the training distribution, while $B(t)$ is the corresponding weighted norm. Because the $k$ input skills are sampled independently,

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

This equation is the mechanism in miniature. The factor $p_j$ is the local sampling frequency of skill $j$. The factor $A(t)^{k-1}$ is the global composition signal: it is large only when the current model already has some weighted similarity with the hidden target. Near initialization, the key question is whether the signal term

$$
kp_jA(t)^{k-1}w_j^\star
$$

is large enough for gradient descent to escape the flat initial region.

<details class="powerlaw-details" markdown="1">
<summary>Where the gradient formula comes from</summary>

Because the inputs are sampled independently, the two expectations factor:

$$
\mathbb E[f_w(X)^2]=B(t)^k,\qquad
\mathbb E[f_w(X)f_{w^\star}(X)]=A(t)^k.
$$

So the population loss becomes

$$
\mathcal L(w)=\frac12\left(B(t)^k-2A(t)^k+1\right).
$$

Differentiating $B(t)$ and $A(t)$ with respect to $w_j$ gives the coordinate update above.
</details>

## Uniform distribution induces hardness

The first theoretical result says that uniform data can make this composition task hard for gradient-based learning. Formally, it proves a correlational statistical query lower bound. Informally, if the input distribution is uniform, then a broad class of gradient-style learners needs either very accurate queries or many samples. With $q$ queries, the required tolerance satisfies

$$
\tau^2\le \left(\frac{\log(dq)}{d}\right)^{k/2}
$$

to reach constant loss. Using the heuristic $\tau\approx 1/\sqrt n$, this corresponds to about

$$
n\gtrsim d^{k/2}
$$

samples in the relevant regime. Under uniform distribution, learning the task requires $d^{\Omega(k)}$ samples or runtime.

The intuition is symmetry. Under uniform inputs, the possible hidden targets are too balanced, and correlation-based queries reveal very little about which hidden vector is correct. The same issue appears in the gradient dynamics. If $w_i(0)\sim\mathcal N(0,r^2)$, then

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

This is the hidden cost of uniform distribution. It removes imbalance, but it also makes the initial learning signal vanish with dimension and composition length. The lower bound is distributional: it relies on a uniform or symmetric training distribution. This is why the next question is natural: can the asymmetry in a power-law distribution re-enable efficient training?

## Power-law distribution re-enables efficient training

The positive theorem says yes: online minibatch gradient descent can learn the same $k$-multiplicative composition task efficiently under a Zipf distribution.

Informally, let $p_j\propto j^{-\alpha}$ with $\alpha>1$. Suppose $k=\Theta(1)$ is even, $w(0)\sim\mathcal N(0,r^2I_d)$ with $r=\Theta(1)$, and the learning rate and batch size are in the stable regime. Then with high probability, minibatch gradient descent recovers the hidden skill vector up to error $\varepsilon$ with about

$$
\widetilde O\left(\frac{d^{2\alpha}}{\eta\varepsilon}\right)
$$

samples, and within roughly

$$
\widetilde O\left(\frac{d^\alpha}{\eta}\log\frac1\varepsilon\right)
$$

iterations. When the composition number is large enough compared with the exponent, this beats the uniform lower-bound scaling.

The proof follows the population gradient above. Under a power-law distribution, the frequent skills occur with constant probability. Equivalently, $\sum_i p_i^2$ does not shrink like $1/d$. Therefore the initial weighted similarity is not washed out by averaging over all $d$ skills:

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

This is the beneficial asymmetry. For high-frequency skills, $p_j$ is large enough that the initial gradient is no longer tiny. The loss landscape near initialization now has a clearer descent direction toward the lower-loss region. The paper then proves a PL-condition-like inequality along the stable population trajectory:

$$
\|\nabla\mathcal L(w(t))\|_2^2
\gtrsim p_{\min}A(0)^{2k-2}\mathcal L(w(t)).
$$

This proves convergence for the population dynamics. A finite-sample concentration argument then shows that minibatch SGD closely tracks the population trajectory.

The same calculation explains why uniform distribution is hard: under uniform sampling, $p_j=1/d$ and $A(0)\approx O(1/\sqrt d)$, so the initial gradient is much smaller. Power law does not make the tail frequent. It improves the pathological initial landscape by inducing an asymmetry.

<details class="powerlaw-details" markdown="1">
<summary>The theorem assumptions, without the proof details</summary>

The statement assumes a Zipf law $p_j\propto j^{-\alpha}$ with $\alpha>1$, even constant $k$, Gaussian initialization, a stable learning rate, and a sufficiently large minibatch. Under those assumptions, the model recovers $w^\star$ up to error $\varepsilon$ with polynomial sample complexity in $d$.

The proof has two parts: first show fast convergence for population gradient descent, then show that online minibatch SGD tracks this population trajectory by concentration.
</details>

The theory therefore predicts the same stage-wise mechanism emphasized in the paper:

1. **Stage I: escaping from the flat region.** Power-law distribution improves the pathological loss landscape near initialization and strengthens the initial learning signal of composition.
2. **Stage II: high-frequency skills help the tail.** Head skills are learned first, which increases $A(t)$ and strengthens the useful gradient for scarce long-tail skills.
3. **Stage III: the long-tail drawback returns.** Tail skills still appear rarely, so final convergence is slowed by the usual long-tail effect.

## The transformer check: state tracking

The paper then checks whether the same mechanism appears in transformers. The cleanest testbed is the $S_5$ state tracking task, a synthetic composition task related to Allen-Zhu's [DePO/canon-layer setup](https://ssrn.com/abstract=5240330), Merrill and Sabharwal's transformer limits work ([parallelism](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00562/116410/The-Parallelism-Tradeoff-Limitations-of-Log), [chain of thought](https://arxiv.org/abs/2310.07923)), and our [curriculum study](https://arxiv.org/abs/2505.23683).

In this task, the input is a sequence of group elements $g_1,g_2,\ldots,g_k\in S_5$, and the target is their composition $g_1\circ g_2\circ\cdots\circ g_k$ without chain-of-thought. The skills are the permutations themselves. The model cannot solve the task by recognizing one update rule in isolation; it has to compose the sequence.

This task is known to be hard under uniform training distribution without intermediate supervision, even though there exists an efficient transformer construction for the computation. The paper finds that simply switching the skill distribution to power law enables the same model to learn the task efficiently, without curriculum or intermediate thinking traces.

<figure class="powerlaw-figure powerlaw-figure--pair powerlaw-figure--state">
  <div class="powerlaw-panels powerlaw-panels--state">
    <img src="/images/blog/power-law/power-law-composition.png" alt="State tracking accuracy under uniform distribution and power-law distribution">
    <img src="/images/blog/power-law/state-tracking-power-law.png" alt="Illustration of state tracking as multi-hop composition">
  </div>
  <figcaption>Figure 5: State tracking is the controlled transformer version of the theory. Uniform distribution cannot learn the implicit composition task, while power-law distribution makes the same task learnable without curriculum or chain-of-thought.</figcaption>
</figure>

**Stage I: power law enables escaping from the flat region.** To visualize the landscape, the paper takes the training trajectories of the $S_5$ state tracking task under both uniform and power-law distributions. It computes the top two PCA directions from consecutive checkpoint differences and plots the loss landscape together with the trajectory. The initial region under uniform distribution is much flatter; the power-law distribution creates a clearer descent direction to the lower-loss region.

<figure class="powerlaw-figure powerlaw-figure--compact">
  <img src="/images/blog/power-law/loss-landscape.png" alt="Uniform distribution and power-law distribution state-tracking loss landscapes">
  <figcaption>Figure 6: Power-law distribution induces a much better initial loss landscape. Uniform training is flatter near initialization and harder to optimize by gradient methods.</figcaption>
</figure>

**Stage II: head skills help the tail.** After the initial escape, the hidden scalars behind the skills are not learned simultaneously. The head skills are learned first. In the toy model, this raises the weighted similarity $A(t)$ from initialization scale to a larger value, which significantly increases the signal term $kp_jA(t)^{k-1}w_j^\star$ in the gradient.

The state tracking experiment checks this acceleration effect directly. The permutations are separated by rank into bins. Once the head bin starts to learn, the expected gradient norm on samples requiring a tail permutation becomes much larger when the other input permutations come from the learned head bin. This is the empirical counterpart of increasing $A(t)$ in the theory.

<figure class="powerlaw-figure powerlaw-figure--wide">
  <img src="/images/blog/power-law/state-tracking-stages.png" alt="State tracking stage-wise learning mechanism under power-law distribution">
  <figcaption>Figure 7: The transformer dynamics show the same stage-wise mechanism as the minimalist model. Head skills are learned first, then increase the gradient signal for scarce long-tail skills.</figcaption>
</figure>

**Stage III: the long-tail drawback returns.** The paper does not claim that the tail becomes easy. In the final stage, the scarce long-tail skills still appear with small probability, so convergence on the tail is slower. This is the intuitive drawback of power-law distribution, but it appears after the model has already escaped the flat region and learned useful head compositions.

So the story is not "asymmetry is always good." It is more specific: power-law distribution first improves the pathological landscape, then creates an implicit curriculum through high-frequency skills, and finally faces the ordinary long-tail drawback.

## Back to reasoning tasks

Finally, the paper tests whether this understanding generalizes beyond the minimalist model and state tracking. It considers two synthetic natural-language reasoning tasks: multi-hop question answering and synthetic grade-school math. Only the training distribution is changed; the test sets are sampled uniformly over skills.

The first setting is multi-hop QA. The data is based on synthetic facts over relations between individuals, which can be viewed as a dependency graph:

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

Each relation is treated as an atomic skill, and each hop in the question corresponds to one relation. The model has to answer the multi-hop query directly, without explicit chain-of-thought supervision.

The second setting is synthetic GSM-style arithmetic. These problems are generated from layered dependency graphs and natural-language templates. The answer requires composing several arithmetic operations, so each problem can be seen as a composition of basic operations on the dependency graph.

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

Across these tasks, the pattern is consistent with the theory. Power-law training learns faster than uniform training even though evaluation is uniform. Multi-hop QA also shows a similar stage-wise mechanism and a steeper loss landscape, which generalizes the mechanistic findings from the $S_5$ setting. Synthetic GSM-style arithmetic shows that the advantage is not limited to relation chaining.

<figure class="powerlaw-figure powerlaw-figure--wide powerlaw-figure--pair">
  <div class="powerlaw-panels powerlaw-panels--two-one">
    <img src="/images/blog/power-law/multi-hop-qa-mechanism.png" alt="Multi-hop QA stage-wise learning mechanism and loss landscapes">
    <img src="/images/blog/power-law/gsm-modular.png" alt="Power-law distribution is much faster on modular GSM-style arithmetic">
  </div>
  <figcaption>Figure 8: The same mechanism appears beyond state tracking. Multi-hop QA shows stage-wise learning and a steeper power-law loss landscape; synthetic GSM-style arithmetic shows that the advantage is not limited to relation chaining.</figcaption>
</figure>

## The intuition to keep

Uniform distribution is balanced for coverage, but in compositional tasks it can induce hardness by making the initial learning signal too small. In the minimalist model, this appears through $A(0)$: under uniform distribution, $A(0)$ is washed out by averaging over many skills, and the useful gradient scales like $A(0)^{k-1}$. In the transformer experiments, the same idea appears as a flatter loss landscape near initialization.

Power-law distribution is imbalanced, but this imbalance is useful for optimization. It induces a beneficial asymmetry, strengthens the initial learning signal of composition, and improves the pathological loss landscape. After the model escapes the flat region, high-frequency skill compositions are learned first and then serve as a stepping stone for scarce long-tail skills.

The takeaway is not "the tail is easier under power law." It is: power law first improves the landscape, then creates an implicit head-to-tail learning order.

## What this suggests in practice

The practical lesson is not "make all training distributions more asymmetric." It is narrower and closer to the paper:

- Evaluate memorization and composition separately. A distribution that improves one-hop recall can induce hardness for implicit composition.
- Do not treat repeated high-frequency skills as automatically wasted. In a compositional reasoning task, they can induce the asymmetry needed for a useful initial learning signal.
- Tune the exponent. Stronger asymmetry can improve the initial landscape and speed up head learning, but too much asymmetry slows the final long-tail phase.
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
