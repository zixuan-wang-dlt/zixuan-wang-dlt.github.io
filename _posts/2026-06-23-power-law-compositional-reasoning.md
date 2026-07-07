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

<p class="powerlaw-spoiler"><strong>Spoiler:</strong> <strong>Power-law distribution fixes the landscape for reasoning.</strong> For memorization, a power-law distribution hinders rare facts from getting seen. But for reasoning, the bottleneck changes: uniform distribution can make loss landscape flat near initialization, while power-law breaks this symmetry and creates the useful descent signal.</p>

<p class="powerlaw-links">Links: <a href="https://arxiv.org/abs/2604.22951">paper</a>, <a href="https://arxiv.org/pdf/2604.22951">PDF</a>, and Eric Michaud's <a href="https://ericjmichaud.com/quanta/">quanta essay</a>.</p>

## How to make LLM learn to reason efficiently?

Suppose you are asked to train an LLM to solve reasoning tasks (e.g. grade school math problems) with as few tokens as possible. How will you design your training distribution?

Let's say you are only allowed to change the distribution of the **numbers**, which is the most basic "knowledge" of the arithmetic. One option is the standard uniform distribution, sampling every number with roughly equal probability. Another option is an asymmetric power-law distribution. Then which one will you choose?

<figure class="powerlaw-figure powerlaw-figure--wide">
  <a href="/images/blog/power-law/distribution-comparison.pdf">
    <img src="/images/blog/power-law/distribution-comparison.png" alt="Uniform and power-law skill distributions">
  </a>
  <figcaption>Figure 1: Uniform distribution assigns nearly equal probability mass to each skill. Power-law distribution keeps high-frequency skills and scarce long-tail skills. </figcaption>
</figure>


## Motivation: Why Power Law v.s. Uniform?

The motivation is straightforward: power laws are one of the most natural shapes in language. At the word level, Zipf's law says that a few words appear constantly while most words are rare. More generally, the "items" may not be words at all: they may be latent skills or knowledge pieces whose occurrence frequencies follow a power-law distribution, $p_i\propto i^{-\alpha}$. This viewpoint can also explain why loss may decrease smoothly as a power law: many discrete skill-learning events get averaged together as the model reaches farther into the tail ([Michaud et al.](https://arxiv.org/abs/2303.13506)).

<details class="powerlaw-details" markdown="1">
<summary>Background: quanta and power-law skill frequencies</summary>

One useful support to this concrete viewpoint is the quanta hypothesis from [Michaud et al.](https://arxiv.org/abs/2303.13506), later discussed in Michaud's [quanta essay](https://ericjmichaud.com/quanta/). Imagine pretraining as learning many discrete modules, or quanta. A quantum might retrieve a piece of knowledge, implement a small algorithm, or support a narrow capability. It matters only on the tokens where it improves prediction, so each quantum has a "use frequency." If these use frequencies are power-law distributed, then smooth neural scaling can arise from many discrete learning events being averaged together: as we scale data, parameters, or training time, the model reaches farther into the tail of useful quanta.

<blockquote class="powerlaw-pullquote">
  <p>The "use frequencies" of the quanta naturally follow a power law.</p>
  <cite>Eric Michaud, <a href="https://ericjmichaud.com/quanta/">On neural scaling and the quanta hypothesis</a></cite>
</blockquote>
</details>
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
  <figcaption>Figure 2: Individual skills can appear as sharp learning transitions but forming a smooth pre-training loss curve together. Source: Eric J. Michaud, <a href="https://ericjmichaud.com/quanta/">On neural scaling and the quanta hypothesis</a>.</figcaption>
</figure>

But this picture of power law also exposes a problem: **the long tail effect**. Under a power-law distribution, rare skills are observed only when the dataset becomes very large, while the most frequent skills may be sampled far beyond what is necessary for learning them.

If the goal is to learn atomic knowledge or individual skills faster, the obvious data-curation move is to flatten the distribution: up-weight low-frequency skills, down-weight high-frequency ones, and move closer to a uniform distribution over skills. Given enough knowledge about the data and enough budget for curation, this sounds like the ideal long-tail fix.

That is the intuition we start from. If a power-law distribution creates a long-tail problem, shouldn't a more uniform distribution help?

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

This raises the main question: **what changes when a model has to compose skills rather than recall them one at a time? Why does a power-law distribution help language models learn reasoning?**

## A minimalist model of skill composition

To understand why only a switch of training distribution helps in implicit compositional reasoning tasks, we look for a controlled setting of skill composition. Transformer experiments mix many effects: representation learning, attention, finite samples, and hidden multi-step operations. To isolate the role of the data distribution, consider a toy task called **$k$-multiplicative composition**.

There are $d$ atomic skills. A skill can be read as a relation in multi-hop QA or a basic operation in arithmetic. In the toy task, skill $i$ has a hidden sign $w_i^\star\in\{-1,+1\}$. A training example samples $k$ skill indices $I_1,\ldots,I_k$ from a distribution $p$ and asks the model to predict the product of their hidden signs:

$$
y=f_{w^\star}(X)=\prod_{t=1}^k w^\star_{I_t}.
$$

The model has one learnable parameter $w_i$ for each skill and predicts the same kind of product:

$$
f_w(X)=\prod_{t=1}^k w_{I_t}.
$$

So the task is simple but still compositional: the model must learn the hidden value of each skill and use several learned skills together. The only thing we change is the sampling distribution $p$: uniform over skills, or Zipf / power law with $p_j\propto j^{-\alpha}$.

To analyze gradient descent, we consider the matched learner $f_w(X)=\prod_{t=1}^k w_{I_t}$ and optimize the population square loss $\mathcal L(w)=\frac12\mathbb E_X[(f_w(X)-f_{w^\star}(X))^2]$.

The two quantities that control the dynamics are the weighted inner product and weighted norm

$$
A(t)=\sum_{i=1}^d p_iw_i(t)w_i^\star,\qquad
B(t)=\sum_{i=1}^d p_iw_i(t)^2.
$$

where $A(t)$ is the similarity between the current model and the ground truth under the training distribution, while $B(t)$ is the corresponding weighted norm. The key object is the population gradient. A short calculation gives

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

This equation is the mechanism in miniature. The factor $p_j$ is the local sampling frequency of skill $j$. The factor $A(t)^{k-1}$ is the global composition signal: it is large only when the current model already has some weighted similarity with the hidden target. Near initialization, the key question is whether the signal term $kp_jA(t)^{k-1}w_j^\star$ is large enough for gradient descent to escape the flat initial region.

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

Differentiating gives

$$
\nabla \mathcal L(w(t))
=kD\left(B(t)^{k-1}w(t)-A(t)^{k-1}w^\star\right).
$$

This is the vector form of the coordinate update in the main text.
</details>

## Uniform distribution induces hardness

The intuition behind the failure of uniform distribution is, surprisingly, **symmetry**. Under uniform inputs, the possible hidden targets are too balanced, and correlation-based gradient queries reveal very little about which hidden vector is correct. The specific issue can be seen in the gradient dynamics. If $w_i(0)\sim\mathcal N(0,r^2)$, then

$$
\mathrm{Var}(A(w_0))=r^2\sum_{i=1}^d p_i^2.
$$

Under uniform distribution, every skill has probability $1/d$, so $\sum_i p_i^2=1/d$. The initial similarity is an average over all $d$ random coordinates, and its typical size is about $\lvert A(w_0)\rvert\approx r/\sqrt d$. Composition raises this small quantity to the power $k-1$. The useful initial signal therefore behaves like $(r/\sqrt d)^{k-1}$, **exponentially** slowing down the training.

The results thus indicate that the more complex the task is (with an increasing number $k$), the slower the training is. A larger number of skills (a larger $d$) will make the issue even worse.

<p class="powerlaw-punchline"><strong>Punchline.</strong> Uniform distribution fixes long-tail exposure, but for composition it can also create a symmetric hard instance: the initial alignment is tiny, the useful gradient is tiny, and gradient descent sees an almost flat landscape.</p>

<p class="powerlaw-remark"><strong>Remark.</strong>
The rigorous theoretical result uses another tool called correlational statistical query (CSQ) lower bound. Under a uniform input distribution, learning the compositional task requires either very accurate gradient queries or a large amount of data/compute. <details class="powerlaw-details" markdown="1">
<summary>CSQ lower bound and proof sketch</summary>

**Theorem.** Let the input distribution be uniform, $p_j=1/d$, and let $k\ge 2$. There exists a function class $\mathcal F_k$ and a constant $\epsilon=\Omega(1)$ such that any correlational statistical query learner using $q$ queries requires tolerance

$$
\tau^2\le \left(\frac{\log(dq)}{d}\right)^{k/2}
$$

to achieve loss $\mathcal L(w)\le \epsilon$. Using the standard heuristic $\tau\approx 1/\sqrt n$, this means either the runtime is exponential in $d$, or the sample size must be roughly $\widetilde\Omega(d^{k/2})$.

**Proof sketch.** Consider the base function class $\mathcal F=\{f(w,\cdot):w\in\{\pm1\}^d\}$. Under uniform inputs, the inner product between two target functions factorizes as

$$
\langle f_{w_1},f_{w_2}\rangle
=\mathbb E_X[f(w_1,X)f(w_2,X)]
=\left(\frac{w_1^\top w_2}{d}\right)^k.
$$

Next, choose a large subset of hypercube vectors whose pairwise normalized inner products are small. A standard Hoeffding plus union-bound argument gives a subset of size about $\exp(\Omega(\varepsilon^2d))$ with $\left|w_1^\top w_2/d\right|\le \varepsilon$ for every distinct pair. Therefore the corresponding functions are nearly uncorrelated, and a correlational query reveals very little about which target in the class is the true one. Plugging this packing into the standard CSQ lower-bound argument yields the tolerance bound above.
</details></p>

## Power-law distribution re-enables efficient training

What about the more natural power-law distribution? Can it enable the learning of the simple model? The positive theorem says yes: online minibatch gradient descent can learn the same $k$-multiplicative composition task efficiently under a Zipf distribution.

<details class="powerlaw-details" markdown="1">
<summary>Power-law theorem and proof sketch</summary>

**Theorem.** Let the input distribution be Zipf, $p_j\propto j^{-\alpha}$ with $\alpha>1$. Suppose the target error is $\varepsilon>0$, $w(0)\sim\mathcal N(0,r^2I_d)$ with $r=\Theta(1)$, $k=\Theta(1)$ is even, and the learning rate and minibatch size are in the stable regime. Then with high probability, minibatch gradient descent learns the task with about $\widetilde O(d^{2\alpha}/(\eta\varepsilon))$ samples and $t\le \widetilde O((d^\alpha/\eta)\log(1/\varepsilon))$ iterations. In particular, it recovers the hidden skill vector up to error $\varepsilon$.

When the composition number is large compared with the power-law exponent, this improves over the uniform lower-bound scaling.

**Proof sketch.** The proof first analyzes population gradient descent. Under a power-law distribution, head skills have constant probability, so the initial weighted alignment $\lvert A(0)\rvert$ is not averaged down by all $d$ skills. With small constant initialization scale, $\lvert A(0)\rvert\approx\Theta(r)$ while $B(0)\approx\Theta(r^2)$, so the signal term dominates the first update. This gives a large initial gradient for head skills and a clearer descent direction in the loss landscape.

With this initialization behavior, one can prove a Polyak-Lojasiewicz-type condition along the stable trajectory,

$$
\|\nabla\mathcal L(w(t))\|_2^2
\gtrsim p_{\min}A(0)^{2k-2}\mathcal L(w(t)).
$$

This guarantees convergence of the population dynamics. A finite-sample concentration argument then shows that minibatch SGD tracks this population trajectory.
</details>

Recall the population gradient above. Under a power-law distribution, the frequent skills occur with constant probability. Equivalently, $\sum_i p_i^2$ does not shrink like $1/d$. Therefore the initial weighted similarity is not washed out by averaging over all $d$ skills: $\lvert A(0)\rvert\approx \Theta(r)$. At the same time, for small constant initialization scale, $B(0)\approx \Theta(r^2)$. Thus the signal term dominates the first update:

$$
w_j(1)-w_j(0)
\approx \eta kp_jA(0)^{k-1}w_j^\star.
$$

Or, in vector form near initialization,

$$
\nabla\mathcal L(w_0)
\approx -k\,\mathrm{diag}(p)\,A(0)^{k-1}w^\star.
$$

This is the beneficial asymmetry. For high-frequency skills, $p_j$ is large enough that the initial gradient is no longer tiny. The loss landscape near initialization now has a clearer descent direction toward the lower-loss region. This is **Stage I** of training: power law helps the model escape the flatness. After this, the optimization becomes much easier and goes through two more stages.

**Stage II: high-frequency skills help the tail.** Though the initial gradient signal is large enough to escape the flat region, the hidden scalars behind the skills are not learned simultaneously. Recall the coordinate update:

$$
w_j(t+1)-w_j(t)
=\eta kp_j\left(A(t)^{k-1}w_j^\star-B(t)^{k-1}w_j(t)\right).
$$

The head skills have large sampling probabilities. For a constant-rank skill $i=O(1)$ under a Zipf law with $\alpha>1$, we have $p_i=\Theta(1)$. These skills therefore grow first from the initialization scale $r$ to a large constant. Once enough head skills are aligned, the weighted similarity

$$
A(t)=\sum_{i=1}^d p_iw_i(t)w_i^\star
$$

increases from the initialization scale $O(r)$ to $O(1)$. This matters because every coordinate update contains the same global factor $A(t)^{k-1}$. For a tail skill $j=\Omega(d)$, the local factor $p_j$ is still small, but the signal term

$$
kp_jA(t)^{k-1}w_j^\star
$$

is now much larger than it was near initialization. In this sense, the head skills act as a stepping stone: power law first learns high-frequency skills, and those learned skills increase the gradient signal for scarce long-tail skills.

**Stage III: the long-tail drawback returns.** Once all hidden scalars have non-trivial accuracy, training enters the convergence phase. At this point, the original long-tail intuition finally comes back. Skills with large rank $j=\Omega(d)$ have small sampling probability, roughly $p_j=O(d^{-\alpha})$, so they are updated much less often. Even though the model has already found a useful compositional direction, final convergence on the tail is slowed by the low probability of sampling tail skills.

This is why the result is not "power law makes the tail easy." The tail is still hard at the end. The advantage is that the first two stages let the model start composing before the usual long-tail bottleneck dominates.

<p class="powerlaw-punchline"><strong>Punchline.</strong> Power law helps not by showing the tail more often, but by breaking the symmetry first. The head creates a visible descent direction; only after that can head skills become stepping stones for the tail.</p>


## The transformer check: state tracking

To test the generality of the theory prediction, the next step is to check whether the same mechanism appears in transformers. As a standard testbed, we consider the $S_5$ state tracking task, a synthetic composition task related to Allen-Zhu's [DePO/canon-layer setup](https://ssrn.com/abstract=5240330) and Merrill and Sabharwal's transformer limits work ([parallelism](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00562/116410/The-Parallelism-Tradeoff-Limitations-of-Log), [chain of thought](https://arxiv.org/abs/2310.07923)).

In this task, the input is a sequence of group elements $g_1,g_2,\ldots,g_k\in S_5$, and the target is their composition $g_1\circ g_2\circ\cdots\circ g_k$ without chain-of-thought. The skills are the permutations themselves. The model cannot solve the task by recognizing one update rule in isolation; it has to compose the sequence.

This task is known to be hard under uniform training distribution without intermediate supervision, even though there exists an efficient transformer construction for the computation. Simply switching the skill distribution to power law enables the same model to learn the task efficiently, without curriculum or intermediate thinking traces.

<figure class="powerlaw-figure powerlaw-figure--pair powerlaw-figure--state">
  <div class="powerlaw-panels powerlaw-panels--state">
    <img src="/images/blog/power-law/power-law-composition.png" alt="State tracking accuracy under uniform distribution and power-law distribution">
    <img src="/images/blog/power-law/state-tracking-power-law.png" alt="Illustration of state tracking as multi-hop composition">
  </div>
  <figcaption>Figure 5: State tracking is the controlled transformer version of the theory. Uniform distribution cannot learn the implicit composition task, while power-law distribution makes the same task learnable without curriculum or chain-of-thought.</figcaption>
</figure>

**Stage I: power law enables escaping from the flat region.** To visualize the landscape, take the training trajectories of the $S_5$ state tracking task under both uniform and power-law distributions. Compute the top two PCA directions from consecutive checkpoint differences and plot the loss landscape together with the trajectory. The initial region under uniform distribution is much flatter; the power-law distribution creates a clearer descent direction to the lower-loss region.

<figure class="powerlaw-figure powerlaw-figure--compact">
  <img src="/images/blog/power-law/loss-landscape.png" alt="Uniform distribution and power-law distribution state-tracking loss landscapes">
  <figcaption>Figure 6: Power-law distribution induces a much better initial loss landscape. Uniform training is flatter near initialization and harder to optimize by gradient methods.</figcaption>
</figure>

**Stage II and III: head-to-tail learning, then long-tail convergence.** Figure 7 checks the remaining stages above. The permutations are separated by rank into bins. Once the head bin starts to learn, the expected gradient norm on samples requiring a tail permutation becomes much larger when the other input permutations come from the learned head bin. This is the empirical counterpart of increasing $A(t)$ in Stage II. Later, the tail bins still converge more slowly, matching the Stage III long-tail bottleneck.

<figure class="powerlaw-figure powerlaw-figure--wide">
  <img src="/images/blog/power-law/state-tracking-stages.png" alt="State tracking stage-wise learning mechanism under power-law distribution">
  <figcaption>Figure 7: The transformer dynamics show the same stage-wise mechanism as the minimalist model. Head skills are learned first, then increase the gradient signal for scarce long-tail skills.</figcaption>
</figure>

So the state-tracking experiment mirrors the theory: power-law distribution first improves the initial landscape, then creates an implicit curriculum through high-frequency skills, and finally faces the ordinary long-tail drawback.

## Back to reasoning tasks

Finally, we can ask whether this understanding generalizes beyond the minimalist model and state tracking. Consider two synthetic natural-language reasoning tasks: multi-hop question answering and synthetic grade-school math. Only the training distribution is changed; the test sets are sampled uniformly over skills.

The first setting is multi-hop QA we mentioned earlier. The data is based on synthetic facts over relations between individuals, which can be viewed as a dependency graph:

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

Each relation is treated as an atomic skill, and each hop in the question corresponds to one relation. The model has to answer the multi-hop query directly, without explicit chain-of-thought supervision. We vary the number of people (entity $\lvert E\rvert$) and the number of different kinds of relations ($\lvert R\rvert$) to control the hardness of the task.

The second setting is synthetic GSM-style arithmetic, following the spirit of controlled math-reasoning generators in [Physics of Language Models: Part 2.1](https://arxiv.org/abs/2407.20311) and [GSM-Infinite](https://arxiv.org/abs/2502.05252). These problems are generated from layered dependency graphs and natural-language templates. The answer requires composing several arithmetic operations, so each problem can be seen as a composition of basic operations on the dependency graph.

<div class="powerlaw-example powerlaw-example--grid">
  <div>
    <div class="powerlaw-example__title">Multi-hop QA</div>
    <p><strong>Facts:</strong> Alice's advisor is Bob. Bob's institution is Princeton.</p>
    <p><strong>Question:</strong> What is the institution of Alice's advisor?</p>
    <p><strong>Computation:</strong> Alice -> Bob -> Princeton</p>
  </div>
  <div>
    <div class="powerlaw-example__title">GSM-style arithmetic</div>
    <p><strong>Facts:</strong> A studio has 5 backpacks. A school has 3 more backpacks than twice the studio's backpacks.</p>
    <p><strong>Question:</strong> How many backpacks does the school have?</p>
    <p><strong>Computation:</strong> studio = 5; school = 2 * 5 + 3 = 13</p>
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

## What this suggests in practice

How do we apply the analysis to practice? A natural next step is to tune the shape of the real-world skill distribution, and try to understand if the distribution itself can help the learning of reasoning. One conjecture is that the power law already present in natural language helps LLMs learn essential reasoning circuits. A coarser-grained and more conceptual framework, such as [Skill-Mix](https://arxiv.org/abs/2310.17567), [Instruct-SkillMix](https://arxiv.org/abs/2408.14774), and related work on learning skill composition from examples, can be a starting point for asking this question at the level of real language skills rather than toy coordinates.

This also suggests a different way to think about curricula and synthetic data in agentic tasks. This post only studies the simplest chain-like composition. Agentic tasks often have a richer compositional graph, involving tool calls, branching decisions, memory updates, verification steps, and recovery from failed actions. A useful future direction is to ask whether changing the distribution over these latent skills and subgraphs can make agent training easier: keep enough high-frequency scaffolding skills to create a useful optimization path, while deliberately sampling rare but important tail skills once the model has enough compositional structure to benefit from them.

## Conclusion

The main lesson is not that power-law data is always better, or that uniform data is always worse. It is more specific: when a task requires implicit composition, the training distribution changes not only which skills are seen, but also what gradient descent sees at the beginning of training. Uniform sampling can be better for exposing rare facts, while power-law sampling can make the first useful compositional direction easier to find.

## References

- Zixuan Wang, Xingyu Dang, Jason D. Lee, and Kaifeng Lyu. [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951). arXiv, 2026.
- Eric J. Michaud. [On neural scaling and the quanta hypothesis](https://ericjmichaud.com/quanta/). 2026.
- Eric J. Michaud, Ziming Liu, Uzay Girit, and Max Tegmark. [The Quantization Model of Neural Scaling](https://arxiv.org/abs/2303.13506). NeurIPS, 2023.
- Zeyuan Allen-Zhu. [Physics of Language Models: Part 4.1, Architecture Design and the Magic of Canon Layers](https://ssrn.com/abstract=5240330). SSRN, 2025.
- Tian Ye, Zicheng Xu, Yuanzhi Li, and Zeyuan Allen-Zhu. [Physics of Language Models: Part 2.1, Grade-School Math and the Hidden Reasoning Process](https://arxiv.org/abs/2407.20311). arXiv, 2024.
- Zeyuan Allen-Zhu and Yuanzhi Li. [Physics of Language Models: Part 3.2, Knowledge Manipulation](https://arxiv.org/abs/2309.14402). arXiv, 2023.
- Yang Zhou, Hongyi Liu, Zhuoming Chen, Yuandong Tian, and Beidi Chen. [GSM-Infinite: How Do Your LLMs Behave over Infinitely Increasing Context Length and Reasoning Complexity?](https://arxiv.org/abs/2502.05252). arXiv, 2025.
- Dingli Yu, Simran Kaur, Arushi Gupta, Jonah Brown-Cohen, Anirudh Goyal, and Sanjeev Arora. [Skill-Mix: a Flexible and Expandable Family of Evaluations for AI models](https://arxiv.org/abs/2310.17567). arXiv, 2023.
- Simran Kaur, Simon Park, Anirudh Goyal, and Sanjeev Arora. [Instruct-SkillMix: A Powerful Pipeline for LLM Instruction Tuning](https://arxiv.org/abs/2408.14774). arXiv, 2024.
- Haoyu Zhao, Simran Kaur, Dingli Yu, Anirudh Goyal, and Sanjeev Arora. [Can Models Learn Skill Composition from Examples?](https://arxiv.org/abs/2409.19808). arXiv, 2024.
- William Merrill and Ashish Sabharwal. [The Parallelism Tradeoff: Limitations of Log-Precision Transformers](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00562/116410/The-Parallelism-Tradeoff-Limitations-of-Log). TACL, 2023.
- William Merrill and Ashish Sabharwal. [The Expressive Power of Transformers with Chain of Thought](https://arxiv.org/abs/2310.07923). arXiv, 2023.
- Nouha Dziri et al. [Faith and Fate: Limits of Transformers on Compositionality](https://arxiv.org/abs/2305.18654). arXiv, 2023.
- Yuekun Yao, Yupei Du, Dawei Zhu, Michael Hahn, and Alexander Koller. [Language Models Can Learn Implicit Multi-Hop Reasoning, but Only if They Have Lots of Training Data](https://arxiv.org/abs/2505.17923). arXiv, 2025.
- Sanjeev Arora and Anirudh Goyal. [A Theory for Emergence of Complex Skills in Language Models](https://arxiv.org/abs/2307.15936). arXiv, 2023.
- Michael Kearns. [Efficient noise-tolerant learning from statistical queries](https://doi.org/10.1145/293347.293351). Journal of the ACM, 1998.
- Yoshua Bengio, Jerome Louradour, Ronan Collobert, and Jason Weston. [Curriculum Learning](https://doi.org/10.1145/1553374.1553380). ICML, 2009.
- Aaron Clauset, Cosma Rohilla Shalizi, and M. E. J. Newman. [Power-law distributions in empirical data](https://doi.org/10.1137/070710111). SIAM Review, 2009.
