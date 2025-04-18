---
title: "Learning Compositional Functions with Transformers from Easy-to-Hard Data"
collection: publications
permalink: /publication/compositional
excerpt: ''
venue: ''
date: 2024-06-11
paperurl: ''
citation: 'Wang, Z., Wei, S., Hsu, D., & Lee, J. D. (2024). Transformers provably learn sparse token selection while fully-connected nets cannot. arXiv preprint arXiv:2406.06893.'
---
Zixuan Wang∗, Eshaan Nichani∗, A. Bietti, A. Damian, Daniel Hsu, Jason Lee, Denny Wu

**Abstract:** Transformer-based language models have demonstrated impressive capabilities across a range of complex reasoning tasks. Prior theoretical work exploring the expressive power of transformers has shown that they can efficiently perform multi-step reasoning tasks involving parallelizable compu- tations. However, the learnability of such constructions, particularly the conditions on the data distribution that enable efficient learning via SGD, remains an open question. Towards answering this question, we study the learnability of a task called the k-fold composition, which requires com- puting an interleaved composition of k input permutations and k hidden permutations, and can be expressed by a transformer with O(log k) layers. On the negative front, we provide a Statistical Query lower bound showing that any learner which is trained on samples from the k-fold com- position task and makes polynomially many queries must have sample size exponential in k, thus establishing a statistical-computational gap. On the other hand, we show that this function class can be efficiently learned, with runtime and sample complexity polynomial in k, by gradient descent on an O(log k)-depth transformer via two different curriculum learning strategies: one in which data consists of k′-fold composition functions with k′ ≤ k presented in increasing order of difficulty, and another in which all data is presented simultaneously. Our work sheds light on the necessity and sufficiency of having both easy and hard examples in the data distribution for transformers to learn complex compositional tasks.