---
layout: single
title: "Why Power Laws Teach the Long Tail to Reason"
description: "A small composition model explains why skewed data can help reasoning: the head creates the gradient signal that later reaches the tail."
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

Natural language data follows power-law frequency patterns, where many skills and facts appear rarely. This is usually treated as a nuisance: the head is repeated too often, the tail is starved, and the obvious fix is to flatten the distribution. That story is right for many memorization problems. But for compositional reasoning, it misses something important. The frequency distribution is not only deciding how many examples each skill receives. It is also shaping the loss landscape that gradient descent sees.

This post is about that second effect. In our paper, [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951), we found that power-law training distributions outperform uniform ones across state-tracking and multi-step arithmetic tasks. The surprising part is not that the head skills learn first. Of course they do. The surprising part is that head skills can make the tail easier to learn later, by creating a useful asymmetry in the loss landscape. Put differently: power law can first make the target visible, then let the model transfer progress from frequent compositions to rare long-tail skills.

![Power-law data can make a compositional task learnable while uniform data remains stuck.](/images/blog/power-law/power-law-composition.png)

*Figure 1: Uniform data gives equal coverage, but equal coverage is not the same as an easy optimization problem. In this compositional task, the power-law run finds a direction while the uniform run stalls.*

Here is the question I want to answer: why can a skewed distribution help a model learn a task that will eventually be evaluated on rare combinations? The answer comes from a tiny model where labels are products of hidden skills. The model is intentionally too simple to be a language model. It is useful because it exposes the one mechanism that matters here: in a composition problem, the useful gradient for every skill is gated by a global alignment term.

## A Minimal Composition Task

Suppose there are $d$ hidden skills. Skill $i$ has a hidden sign $w_i^\star\in\lbrace -1,+1\rbrace$. A training example samples $k$ skill indices $I_1,\ldots,I_k$ from a distribution $p$, and the label is the product of the hidden signs:

$$
y=f_{w^\star}(X)=\prod_{t=1}^k w^\star_{I_t}.
$$

The model stores one parameter $w_i$ per skill and predicts the analogous product

$$
f_w(X)=\prod_{t=1}^k w_{I_t}.
$$

We use the population squared loss

$$
\mathcal L(w)=\frac12\mathbb E_X\left[\left(f_w(X)-f_{w^\star}(X)\right)^2\right].
$$

This setup strips away attention, tokenization, and chain-of-thought. Each example just asks the model to compose $k$ skills. When $k=1$, this is memorization: see skill $i$, move $w_i$ toward $w_i^\star$. When $k>1$, the coordinates interact. A skill is not learned in isolation; it is learned through products with other skills.

To see the interaction, define the weighted alignment

$$
A(w)=\sum_{i=1}^d p_i w_i w_i^\star
$$

and the weighted norm

$$
B(w)=\sum_{i=1}^d p_i w_i^2.
$$

Let $D=\mathrm{diag}(p_1,\ldots,p_d)$. A direct calculation gives

$$
\nabla \mathcal L(w)
=kD\left(B(w)^{k-1}w-A(w)^{k-1}w^\star\right).
$$

This is the main equation. The diagonal matrix $D$ is the local frequency effect: frequent skills move faster because they appear more often. The term $A(w)^{k-1}w^\star$ is the useful direction. It points toward the hidden skill vector. The exponent $k-1$ is the cost of composition: if the current model has almost no global alignment with the truth, then every useful coordinate update is tiny.

For $k=1$, the gate disappears and the gradient becomes

$$
\nabla \mathcal L(w)=D(w-w^\star).
$$

This is the usual long-tail story. Rare coordinates have small $p_i$, so they need more exposure. Flattening helps. For $k>1$, coordinate $i$ instead receives a useful signal proportional to

$$
p_i A(w)^{k-1}w_i^\star.
$$

Now the tail has two problems. The local factor $p_i$ is small, as before. But the global factor $A(w)^{k-1}$ can also be small for everyone. A uniform distribution can improve the first factor while hurting the second.

| Task | Useful coordinate signal | Main bottleneck |
| --- | ---: | --- |
| One-hop memorization | $p_i$ | tail coverage |
| $k$-hop composition | $p_i A(w)^{k-1}$ | coverage plus global alignment |

*Table 1: The difference between memorization and composition is the global gate $A(w)^{k-1}$. Uniform sampling helps coverage, but it can make the gate almost shut at initialization.*

## Why Uniform Can Look Fair But Feel Flat

Initialize $w_i(0)\sim \mathcal N(0,r^2)$. Since multiplying by the hidden sign $w_i^\star$ does not change the variance, the initial alignment

$$
A(w_0)=\sum_{i=1}^d p_i w_i(0)w_i^\star
$$

has variance

$$
\mathrm{Var}(A(w_0))=r^2\sum_{i=1}^d p_i^2.
$$

This is where the sampling distribution enters. Under uniform sampling, $p_i=1/d$, so $\sum_i p_i^2=1/d$. A typical initialization therefore has

$$
\lvert A(w_0)\rvert\approx \frac{r}{\sqrt d}.
$$

For a $k$-fold composition, the useful signal scales like

$$
\lvert A(w_0)\rvert^{k-1}
\approx
\left(\frac{r}{\sqrt d}\right)^{k-1}.
$$

This is the quiet failure mode. Uniform sampling averages the random initial correlation across all $d$ skills. The average becomes small, and composition raises that small number to a power. Every skill receives fair coverage, but gradient descent still sees almost no useful direction near initialization.

The formal lower bound in the paper makes this intuition precise. Under uniform inputs, a correlational statistical-query learner using $q$ gradient-like queries must use very fine tolerance to reach constant loss. One slide-level form is

$$
\tau^2 \le \left(\frac{\log(dq)}{d}\right)^{k/2}.
$$

The details of the SQ model are less important here than the message: under uniform sampling, symmetry hides the target composition from gradient-based learners, and the obstruction worsens quickly with $k$.

## What The Power Law Buys

Now replace the uniform distribution with a power law:

$$
p_i=\frac{i^{-\alpha}}{\sum_{j=1}^d j^{-\alpha}}.
$$

For fixed $\alpha>1$, the head carries constant-scale mass as $d$ grows. The same variance calculation gives

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

instead of $r/\sqrt d$. This is the first concrete benefit of the long tail: the repeated head skills give the random initialization a detectable projection onto the target. The model has a foothold.

| Sampling rule | Initial alignment $\lvert A(w_0)\rvert$ | Useful signal $\lvert A(w_0)\rvert^{k-1}$ | What gradient descent sees |
| --- | ---: | ---: | --- |
| Uniform, $p_i=1/d$ | $r/\sqrt d$ | $r^{k-1}d^{-(k-1)/2}$ | nearly flat |
| Power law, $p_i\propto i^{-\alpha}$ | $\Theta(r)$ | $\Theta(r^{k-1})$ | a visible descent direction |

*Table 2: Power law does not make tail skills common. It makes the global alignment large enough for the compositional gradient to turn on.*

The transformer loss landscape shows the same fingerprint. Around initialization, the uniform run is almost flat in the plotted subspace, while the power-law run has a clearer direction of descent.

![Uniform training is nearly flat near initialization, while power-law training has a clearer descent direction.](/images/blog/power-law/loss-landscape.png)

*Figure 2: Loss over the top two PCA directions of checkpoint trajectories. The zoomed region is the important part: uniform training starts in a flat patch, while power-law training gets a usable descent direction.*

This is why I would not summarize the result as "power law helps because the head is easier." That is true but incomplete. The better summary is: power law breaks a harmful symmetry. It changes the geometry of the early optimization problem.

## How The Head Helps The Tail

After the model escapes the initial flat region, the story becomes more interesting. Look again at the coordinate-wise gradient:

$$
\nabla_i \mathcal L(w)
=kp_i\left(B(w)^{k-1}w_i-A(w)^{k-1}w_i^\star\right).
$$

For a tail coordinate $j$, the useful update is proportional to $p_jA(w)^{k-1}$. The factor $p_j$ is still small. Power law has not erased the long-tail cost. But as the head skills learn, they increase the global alignment $A(w)=\sum_i p_iw_iw_i^\star$. Once $A(w)$ becomes larger, the multiplier $A(w)^{k-1}$ becomes larger for every coordinate, including the rare ones.

So the learning order is not merely "head first, tail later." It is closer to: the head creates the signal that lets the tail move. In the simplified proof, this appears as three stages. First, power-law asymmetry makes $A(0)$ large enough to escape. Second, head skills raise $A(t)$, so gradients for rare compositional factors are amplified. Third, once $A(t)=\Theta(1)$, the original long-tail cost returns because the rarest skills are still sampled rarely.

![Power-law state tracking creates a staged head-to-tail learning process.](/images/blog/power-law/state-tracking-power-law.png)

*Figure 3: The state-tracking experiments show the same three-stage pattern: escape, head-to-tail transfer, then tail-limited convergence. Head-bin loss drops first, and learned head skills increase gradient signal for tail compositions.*

This is the part I find most useful conceptually. The tail is not saved by making it frequent. The tail is helped because the head makes the problem less symmetric. That distinction matters if we are thinking about data mixture design, curriculum, or post-training tasks where rare skills only make sense when composed with common ones.

## The Theorem And The Experiments

The theorem in the minimalist model matches the story above. Under uniform inputs, the SQ lower bound gives a $d^{\Omega(k)}$-type obstruction for gradient-like learning of $k$-fold composition. Under a power law $p_j\propto j^{-\alpha}$ with $\alpha>1$ and constant $k$, minibatch SGD learns the hidden skill vector using roughly

$$
\widetilde O(d^{2\alpha})
$$

samples. The exact exponent is not the main thing to remember. The main thing is that the distribution changes the computational problem: uniform data creates a symmetric hard instance, while power-law data induces a learning order.

The transformer experiments are there to check whether this toy mechanism leaves visible traces in more realistic training. In state tracking, it does: the power-law run has a steeper landscape near initialization, and learning progresses from head bins to tail bins. In multi-hop QA, examples are generated by chaining facts,

$$
e_0 \xrightarrow{r_1} e_1
\xrightarrow{r_2} e_2
\cdots
\xrightarrow{r_k} e_k,
$$

so the model has to compose relations rather than recall one edge.

![A multi-hop QA task asks the model to compose several relations rather than retrieve one isolated fact.](/images/blog/power-law/multi-hop-qa.png)

*Figure 4: Multi-hop QA makes the difference between recall and composition concrete. The model must track intermediate entities through a chain of relations.*

The same qualitative behavior also appears in synthetic GSM-style arithmetic data, where examples come from dependency graphs over numbers and operations. I would read these experiments as mechanistic evidence rather than a theorem about all language-model pretraining. The toy model explains why the phenomenon is plausible; the transformer experiments show that the same signatures can appear outside the toy setting.

## The Exponent Is Not Free

There is one obvious danger with the story: if power law helps, should we just make the distribution as skewed as possible? No. The exponent $\alpha$ is a real knob. Larger $\alpha$ gives a stronger head signal and can improve early learning, but it also makes the tail lighter. At some point the tail cost dominates again.

![The power-law exponent controls a tradeoff: stronger head signal can help early learning, but a lighter tail slows rare skills.](/images/blog/power-law/exponent-tradeoff.png)

*Figure 5: More skew strengthens the early signal but can slow final tail convergence. The exponent controls a tradeoff, not a miracle.*

The ablations are useful for this reason. Fine-grained asymmetry matters more than a coarse bin-level skew. Random and reverse orderings can still learn, so the effect is not simply "easy examples first." Curriculum remains useful too: uniform plus curriculum can work, and power law plus curriculum can train faster and more smoothly. The practical lesson is not to worship skew. It is to stop treating the data distribution as only a coverage variable. It is also an optimization variable.

## A Way To Remember It

Here is the analogy I keep coming back to. Imagine trying to orient yourself in a new city from a map where every landmark appears exactly once. The map is fair, but it gives you no anchor. Now imagine a few landmarks appear again and again: the central station, the river, the main square. The repetition looks wasteful if you only count coverage, but it gives you a coordinate system. Once you know those anchors, the smaller streets become easier to place.

In the model, the head skills are the repeated landmarks. The coordinate system is $A(w)$. The strength of the compositional signal is $A(w)^{k-1}$. The remaining long-tail cost is $p_i$. The head does not contain all the knowledge, but it can define the frame in which the tail becomes learnable.

## What This Does Not Say

Power law does not always beat uniform. For one-hop memorization, uniform can be better because coverage is the bottleneck. Power law also does not remove the tail: rare skills still receive fewer updates, and a large exponent can help the beginning while hurting the end. The clean order-one alignment calculation assumes fixed $\alpha>1$, and other regimes need their own analysis.

The broader claim is narrower and, I think, more interesting: when the task requires composition, power-law asymmetry can create a gradient signal that uniform data removes. The next time we look at a long-tail dataset, we should ask two questions rather than one. Not only, "does the tail get enough examples?" but also, "what learning order does this distribution create?"

## References

- Zixuan Wang, Xingyu Dang, Jason D. Lee, and Kaifeng Lyu. [The Power of Power Law: Asymmetry Enables Compositional Reasoning](https://arxiv.org/abs/2604.22951). arXiv, 2026.
- Yoshua Bengio, Jerome Louradour, Ronan Collobert, and Jason Weston. [Curriculum Learning](https://doi.org/10.1145/1553374.1553380). ICML, 2009.
- Aaron Clauset, Cosma Rohilla Shalizi, and M. E. J. Newman. [Power-law distributions in empirical data](https://doi.org/10.1137/070710111). SIAM Review, 2009.
