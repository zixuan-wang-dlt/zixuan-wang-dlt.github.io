---
title: "Learning and Transferring Sparse Contextual Bigrams with Linear Transformers"
collection: publications
permalink: /publication/Learning_Sparse
excerpt: ''
venue: 'arXiv:2410.23438'
date: 2024-06-11
paperurl: 'https://arxiv.org/pdf/2410.23438'
citation: 'Ren, Y., Wang, Z., & Lee, J. D. (2024). Learning and Transferring Sparse Contextual Bigrams with Linear Transformers. arXiv preprint arXiv:2410.23438.'
---
Yunwei Ren, Zixuan Wang, Jason D Lee

**Abstract:** Transformers have excelled in natural language modeling and one reason behind this success is their exceptional ability to combine contextual informal and global knowledge. However, the theoretical basis remains unclear. In this paper, first we introduce the Sparse Contextual Bigram (SCB), a natural extension of the classical bigram model, where the next token's generation depends on a sparse set of earlier positions determined by the last token. We then analyze the training dynamics and sample complexity of learning SCB using a one-layer linear transformer with a gradient-based algorithm. We show that when trained from scratch, the training process can be split into an initial sample-intensive stage where the correlation is boosted from zero to a nontrivial value, followed by a more sample-efficient stage of further improvement. Additionally, we prove that, provided a nontrivial correlation between the downstream and pretraining tasks, finetuning from a pretrained model allows us to bypass the initial sample-intensive stage. We also empirically demonstrate that our algorithm can outperform SGD in this setting and discuss its relationship with the usual softmax-based transformers.