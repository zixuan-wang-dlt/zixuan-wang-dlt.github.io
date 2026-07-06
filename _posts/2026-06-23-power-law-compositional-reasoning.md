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
---

<p class="powerlaw-spoiler"><strong>Spoiler:</strong> <strong>Power-law distribution fixes the landscape for reasoning.</strong> For memorizing facts, an asymmetric power-law distribution hinders rare facts from getting seen. But for compositional reasoning, the bottleneck changes: uniform distribution can make the loss landscape symmetric and nearly flat near initialization, while power-law distribution breaks this symmetry and creates the first useful descent signal.</p>

<p class="powerlaw-links">Links: <a href="https://arxiv.org/abs/2604.22951">paper</a>, <a href="https://arxiv.org/pdf/2604.22951">PDF</a>, and Eric Michaud's <a href="https://ericjmichaud.com/quanta/">quanta essay</a>.</p>

## The question

If language data consists of many latent skills and knowledge pieces, should we make their training frequencies uniform?

The tempting answer is yes. Natural language follows a power-law distribution: a few skills and knowledge pieces appear frequently, while most long-tail skills appear at very low frequency. Under this view, rare skills are observed only when the dataset becomes very large, while the most frequent skills may be repeatedly sampled far beyond what is necessary for learning them.

If we knew the underlying skill distribution and had the budget to curate data, a natural move would be to shift the training data towards a uniform distribution over skills: up-weight low-frequency skills, down-weight high-frequency ones, and give every skill a fairer chance.

Michaud's quanta view is one way to make this setup concrete: pretraining may involve many discrete modules, some retrieving knowledge and some implementing small algorithms, with very different use frequencies. One of the assumptions is:

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

Our paper, [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951), asks when this uniform-distribution intuition breaks. We focus on compositional reasoning tasks, where the model must combine multiple skills before answering.

**But if the task is multi-hop?** This is where the long-tail intuition starts to wobble. A multi-hop example is not just a rare item; it requires composition of several skills.

The answer is not merely that high-frequency skills benefit scarce long-tail skills. The paper's point is sharper: uniform distribution induces hardness for composition tasks because of symmetry and a pathological loss landscape. Power-law distribution induces a beneficial asymmetry, improves the initial loss landscape, and gives gradient descent a clearer descent direction before the model has learned the skills. Only after this escape do learned high-frequency skills become useful stepping stones for scarce long-tail skills.

<figure class="powerlaw-figure powerlaw-figure--wide">
  <a href="/images/blog/power-law/distribution-comparison.pdf">
    <img src="/images/blog/power-law/distribution-comparison.png" alt="Uniform and power-law skill distributions">
  </a>
  <figcaption>Figure 2: Uniform distribution assigns nearly equal probability mass to each skill. Power-law distribution keeps high-frequency skills and scarce long-tail skills. The puzzle is why this asymmetry improves the loss landscape for compositional reasoning tasks.</figcaption>
</figure>

## Why uniform distribution looks right

Start with memorization. If a relation or entity appears rarely, the model needs more direct exposure to it. In this setting, uniform distribution is the natural fix because the bottleneck is coverage of long-tail skills.

<div class="powerlaw-example">
  <div class="powerlaw-example__title">One-hop example</div>
  <div class="powerlaw-example__body">
    <p><strong>Fact:</strong> Anya <span>-- father --></span> Loid</p>
    <p><strong>Question:</strong> Who is the father of Anya?</p>
    <p><strong>Answer:</strong> Loid</p>
  </div>
</div>

That intuition shows up cleanly in a one-hop QA experiment. We randomly rank relations, train under either a uniform distribution or a power-law distribution, and evaluate exact match. Uniform distribution wins the early race.

<figure class="powerlaw-figure">
  <img src="/images/blog/power-law/single-hop-memorization.png" alt="Uniform distribution learns a one-hop memorization task faster than power-law distribution">
  <figcaption>Figure 3: For one-hop memorization, the usual long-tail intuition is correct. Uniform distribution gives rare relations more exposure and reaches high exact match faster.</figcaption>
</figure>

If the task were only to store isolated facts, "use a power-law distribution" would be a strange recommendation. High-frequency skills are already frequent; scarce long-tail skills need data. Shifting towards a uniform distribution gives every skill a fairer chance.

**Now change only the task.** Instead of asking for one relation, ask for a chain. The model must apply one relation, keep the intermediate entity around, and then apply another relation.

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

The question is no longer "is uniform distribution good or bad?" The question is: **what changes when a model has to compose skills rather than recall them one at a time?**

## A minimalist model of skill composition

Analyzing transformers trained on compositional reasoning tasks is hard: attention, layers, finite samples, and representation learning are all entangled. To isolate the landscape mechanism, the paper introduces a minimalist skill-composition task: **$k$-multiplicative composition**.

There are $d$ skills. Skill $i$ has a hidden sign $w_i^\star$, equal to either $-1$ or $+1$. A training example samples $k$ skills from a distribution $p$, and the label is the product of their hidden signs:

$$
y=\prod_{t=1}^k w^\star_{I_t}.
$$

The model stores one parameter $w_i$ per skill and predicts the same kind of product:

$$
f_w(X)=\prod_{t=1}^k w_{I_t}.
$$

This model is not meant to be realistic. The simplification is intentional: the hidden skills are fixed, the sampled skills are independent, and all transformer machinery is stripped away. What remains is the part we want to isolate: composition under a training distribution.

Its job is to separate two effects:

- For $k=1$, learning is local. Each example updates one skill.
- For $k>1$, learning is global. A skill is useful only when it agrees with the other skills in the product.

**The mechanism.** The important quantity is the weighted similarity between the model and the ground truth:

$$
A(w)=\sum_{i=1}^d p_i w_iw_i^\star.
$$

Think of $A(w)$ as the quantity that controls the initial learning signal of composition. If $A(w)$ is large, the model has a useful similarity with the ground truth. If $A(w)$ is tiny, the loss landscape is close to an initial flat region.

To see where this comes from, train with population squared loss

$$
\mathcal L(w)=\frac12\mathbb E_X\left[\left(f_w(X)-f_{w^\star}(X)\right)^2\right].
$$

Also define the weighted norm

$$
B(w)=\sum_{i=1}^d p_iw_i^2.
$$

Because the sampled skills are independent,

$$
\mathbb E[f_w(X)^2]=B(w)^k,\qquad
\mathbb E[f_w(X)f_{w^\star}(X)]=A(w)^k.
$$

So the loss becomes

$$
\mathcal L(w)=\frac12\left(B(w)^k-2A(w)^k+1\right).
$$

The first term is the model's own scale. The second term is agreement with the hidden target. The third term is constant.

Differentiating gives

$$
\nabla \mathcal L(w)
=kD\left(B(w)^{k-1}w-A(w)^{k-1}w^\star\right),
\qquad D=\mathrm{diag}(p_1,\ldots,p_d).
$$

The useful part of the negative gradient for skill $i$ therefore scales like

$$
p_iA(w)^{k-1}.
$$

This is the landscape mechanism in one line.

The factor $p_i$ is local coverage: how often skill $i$ appears. Uniform distribution helps this term for scarce long-tail skills. The factor $A(w)^{k-1}$ is the initial learning signal of composition. Uniform distribution can make this signal vanish with dimension because the function class is too symmetric.

## Why the landscape changes

**Symmetry hides the signal.** At random initialization, the model has a small accidental similarity with the ground truth. The question is whether the training distribution turns this similarity into a useful initial gradient or averages it away.

If $w_i(0)\sim \mathcal N(0,r^2)$, then

$$
\mathrm{Var}(A(w_0))=r^2\sum_{i=1}^d p_i^2.
$$

Under uniform distribution, every skill has probability $1/d$, so $\sum_i p_i^2=1/d$. The initial similarity is an average over all $d$ random coordinates, and its typical size is about

$$
\lvert A(w_0)\rvert\approx \frac{r}{\sqrt d}.
$$

Composition raises this similarity to the power $k-1$. So the initial learning signal behaves like

$$
\left(\frac{r}{\sqrt d}\right)^{k-1}.
$$

This is the hidden cost of uniform distribution. It gives every skill equal coverage, but near initialization it also washes out the asymmetry gradient descent needs to escape the initial flat region.

**Power-law distribution breaks the symmetry.** Under a power-law distribution, high-frequency skills carry constant-scale probability mass. For $p_i\propto i^{-\alpha}$ with $\alpha>1$, the quantity $\sum_i p_i^2$ no longer shrinks like $1/d$; in the large-$d$ limit it behaves like a constant such as $\zeta(2\alpha)/\zeta(\alpha)^2$. The same random initialization now has

$$
\lvert A(w_0)\rvert\approx \Theta(r).
$$

Scarce long-tail skills are still rare. But high-frequency skills are frequent enough to induce a beneficial asymmetry.

The formal results in the paper sharpen this picture. Under uniform distribution, a correlational statistical query (CSQ) lower bound shows that learning requires $d^{\Omega(k)}$ samples or runtime. This is the theorem-level version of the initial-flat-region story: gradient-based training suffers from a computational gap. Under a Zipf distribution with $\alpha>1$, minibatch gradient descent learns the minimalist skill-composition task with about $\widetilde O(d^{2\alpha})$ samples, up to theorem conditions on step size, batch size, and accuracy.

In other words, the first step is not the learning of scarce long-tail skills. It is escaping the initial flat region.

**Uniform distribution removes imbalance. Compositional reasoning sometimes needs beneficial asymmetry to improve the pathological loss landscape.**

## Does the toy mechanism show up in transformers?

The toy model predicts two things. First, near initialization, uniform distribution should create a flatter loss landscape because the compositional signal is hidden by symmetry. Second, after the model escapes this region, learned high-frequency skills should strengthen the gradient signal for scarce long-tail skills.

To check this in a transformer, the paper uses state tracking as a clean synthetic testbed for implicit composition. The task is related to Allen-Zhu's [DePO/canon-layer setup](https://ssrn.com/abstract=5240330), Merrill and Sabharwal's transformer limits work ([parallelism](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00562/116410/The-Parallelism-Tradeoff-Limitations-of-Log), [chain of thought](https://arxiv.org/abs/2310.07923)), and our [curriculum study](https://arxiv.org/abs/2505.23683). The model observes a sequence of updates and must output the final state. Knowing one update rule is not enough; the model has to carry state through several steps.

In this controlled setting, only changing the training distribution can turn an apparently unlearnable implicit composition task into a learnable one. Under uniform distribution, the transformer stays near zero accuracy. Under power-law distribution, it escapes the initial flat region and solves the task.

<figure class="powerlaw-figure powerlaw-figure--pair powerlaw-figure--state">
  <div class="powerlaw-panels powerlaw-panels--state">
    <img src="/images/blog/power-law/power-law-composition.png" alt="State tracking accuracy under uniform distribution and power-law distribution">
    <img src="/images/blog/power-law/state-tracking-power-law.png" alt="Illustration of state tracking as multi-hop composition">
  </div>
  <figcaption>Figure 5: Uniform distribution fails to escape; power-law distribution learns the task. State tracking is the controlled transformer version of implicit multi-hop composition.</figcaption>
</figure>

This makes state tracking a useful place to look inside the optimization process. The goal is not to prove a transformer theorem from a plot. The goal is to check whether the signatures predicted by the minimalist model appear in a real transformer training run.

**Stage I: escaping the flat region.** We visualize the loss over the top two PCA directions of checkpoint trajectories. Under uniform distribution, the initialization region is nearly flat in this subspace. Under power-law distribution, the loss landscape has a steeper slope as the descent direction.

<figure class="powerlaw-figure powerlaw-figure--compact">
  <img src="/images/blog/power-law/loss-landscape.png" alt="Uniform distribution and power-law distribution state-tracking loss landscapes">
  <figcaption>Figure 6: Uniform distribution fails to escape from the initial flat region. Power-law distribution induces a beneficial asymmetry and creates a steeper descent direction.</figcaption>
</figure>

This is the paper's main mechanism in picture form. The training distribution does not merely change which examples are sampled. It improves the pathological loss landscape near initialization.

## Then high-frequency skills help the tail

**Stage II: high-frequency skills first, scarce long-tail skills later.** Once the model has escaped the initial flat region, high-frequency skills play a second role. They are learned first. As they align with the ground truth, they increase $A(w)$. That larger weighted similarity strengthens the useful gradient for every skill, including scarce long-tail skills.

To check this stage-wise learning mechanism in the transformer, we group the hidden permutations by rank and track loss, accuracy, and gradient norm. The high-frequency group learns first. As it aligns, the gradient norm for later groups grows, and learning moves from high-frequency skills to scarce long-tail skills.

<figure class="powerlaw-figure powerlaw-figure--wide">
  <img src="/images/blog/power-law/state-tracking-stages.png" alt="State tracking stage-wise learning mechanism under power-law distribution">
  <figcaption>Figure 7: The transformer dynamics show the same stage-wise learning mechanism as the minimalist model: high-frequency skills are learned first, then raise the signal for scarce long-tail skills, while long-tail convergence remains the final bottleneck.</figcaption>
</figure>

So the power-law distribution creates a stage-wise learning mechanism: first it improves the initial loss landscape and helps escape the initial flat region, then learned high-frequency skills accelerate the learning of scarce long-tail skills, and finally the ordinary long-tail drawback appears because scarce long-tail skills are still sampled rarely. These plots are not a theorem for transformers, but they are a mechanistic sanity check: the same signatures predicted by the minimalist model appear in a real transformer training run.

This is why the result is not "asymmetry is always good." It is a tradeoff. Too little asymmetry leaves the landscape too flat. Too much asymmetry slows long-tail convergence. The advantage comes from the stage-wise learning mechanism: escape first, high-frequency skills first, scarce long-tail skills later.

## Back to reasoning tasks

**Why these two tasks?** State tracking isolates the mechanism, but it is still an algorithmic task. We also want to know whether the same advantage of power-law distribution appears in more natural-language reasoning tasks. That is why the paper uses two additional settings.

Multi-hop QA tests relation composition in natural-language form. We generate a synthetic knowledge graph with facts of the form

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

Each relation is an atomic skill, but the answer requires several hops in order. The model cannot solve the task by memorizing one edge.

This is close in spirit to work on knowledge manipulation and implicit multi-hop reasoning in language models: the question is whether the model can perform the intermediate hops internally, without curriculum or chain-of-thought supervision.

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

GSM-style arithmetic is a complementary check. It is not about graph relations between entities; it is about composing arithmetic operations through a dependency graph. If power-law distribution only helped because of some artifact of relation chaining, this task would be a weaker place to see it. But the same pattern appears.

<figure class="powerlaw-figure powerlaw-figure--wide powerlaw-figure--pair">
  <div class="powerlaw-panels powerlaw-panels--two-one">
    <img src="/images/blog/power-law/multi-hop-qa-mechanism.png" alt="Multi-hop QA stage-wise learning mechanism and loss landscapes">
    <img src="/images/blog/power-law/gsm-modular.png" alt="Power-law distribution is much faster on modular GSM-style arithmetic">
  </div>
  <figcaption>Figure 8: The same mechanism appears beyond state tracking. Multi-hop QA shows the stage-wise learning mechanism and a steeper power-law loss landscape; GSM-style arithmetic shows that the advantage of power-law distribution is not limited to relation chaining.</figcaption>
</figure>

## The intuition

Uniform distribution is balanced for coverage, but balance can also make the compositional task too symmetric. Under uniform distribution, the initial weighted similarity is small, the initial gradient is small, and training can stay in the initial flat region.

Power-law distribution is imbalanced, but the imbalance is useful for optimization. It induces a beneficial asymmetry, gives high-frequency skills a larger initial learning signal, and improves the pathological loss landscape. After the model escapes the initial flat region, high-frequency skills are learned first and then accelerate the learning of scarce long-tail skills.

In the minimalist model, this effect is captured by the weighted similarity $A(w)$. The strength of the initial learning signal is controlled by $A(w)^{k-1}$.

## What this suggests in practice

The practical lesson is not "make all training distributions more asymmetric." It is narrower:

- Evaluate memorization and composition separately. A distribution that improves one-hop recall can hurt implicit multi-hop learning.
- Do not treat repeated high-frequency skills as automatically wasted. In a compositional reasoning task, high-frequency skills can improve the pathological loss landscape.
- Tune the exponent. Larger $\alpha$ can accelerate the initial descent and the learning of high-frequency skills, but too much asymmetry slows long-tail convergence.
- Ask not only "do scarce long-tail skills get enough examples?", but also "does this training distribution improve the initial loss landscape?"

## What this does not show

- The result does not say power-law distribution is always better. In one-hop memorization, uniform distribution learns faster.
- The theorem is for a minimalist $k$-multiplicative composition model, not a full transformer theory.
- The positive theorem assumes a Zipf distribution with $\alpha>1$, constant even $k$, Gaussian initialization, and a learner matched to the compositional structure.
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
