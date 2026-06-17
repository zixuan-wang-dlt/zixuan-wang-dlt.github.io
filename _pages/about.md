---
permalink: /
title: "Zixuan Wang"
excerpt: "About me"
author_profile: false
hide_title: true
redirect_from: 
  - /about/
  - /about.html
---

<div class="home-hero">
<div class="home-hero__text">
<h1 class="home-name">Zixuan Wang</h1>

<p class="home-intro">Hi! I am <strong>Zixuan Wang</strong>, a second-year Ph.D. student in <a href="https://ece.princeton.edu/">Electrical and Computer Engineering</a> at Princeton University. I am fortunate to be advised by <a href="https://jasondlee88.github.io/">Prof. Jason D. Lee</a>.</p>

My research interests broadly lie in understanding **the foundations of LLMs and deep learning**, as well as leveraging both theoretical and empirical explorations to advance the frontiers of deep learning and language modeling.

I did my undergraduate study at the Institute for Interdisciplinary Information Sciences (IIIS), Tsinghua University, also known as **Yao Class**.

You can contact me at wangzx (at) princeton (dot) edu. My <a href="https://drive.google.com/file/d/1rqGAPJGkswxo4RWdz4DN4GxnNItJiIE4/view?usp=sharing">CV</a> is here.
</div>
<img class="home-hero__photo" src="/images/WZX2.jpg" alt="Zixuan Wang">
</div>

<hr>

<div class="home-social" aria-label="profile links">
  <a href="mailto:wangzx@princeton.edu" aria-label="Email" title="Email"><i class="fas fa-envelope" aria-hidden="true"></i></a>
  <a href="https://scholar.google.com/citations?user=vNJDZyEAAAAJ" aria-label="Google Scholar" title="Google Scholar"><i class="ai ai-google-scholar" aria-hidden="true"></i></a>
  <a href="https://github.com/zixuan-wang-dlt" aria-label="GitHub" title="GitHub"><i class="fab fa-github" aria-hidden="true"></i></a>
  <a href="https://twitter.com/zzZixuanWang" aria-label="Twitter" title="Twitter"><i class="fab fa-twitter" aria-hidden="true"></i></a>
  <a href="https://drive.google.com/file/d/1rqGAPJGkswxo4RWdz4DN4GxnNItJiIE4/view?usp=sharing" aria-label="CV" title="CV"><i class="fas fa-file-alt" aria-hidden="true"></i></a>
</div>

## <a class="section-link" href="/blog/">latest posts</a>

<ul class="post-list">
{% assign shown_posts = 0 %}
{% for post in site.posts %}
  {% unless post.title contains "Blog Post number" or post.title contains "Future Blog Post" %}
    {% assign shown_posts = shown_posts | plus: 1 %}
    {% if shown_posts <= 3 %}
  <li><span class="post-date">{{ post.date | date: "%b %-d, %Y" }}</span><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
    {% endif %}
  {% endunless %}
{% endfor %}
{% if shown_posts == 0 %}
  <li><span class="post-date">soon</span><span>New posts will appear here.</span></li>
{% endif %}
</ul>

## <a class="section-link" href="/publications/">selected publications</a>

<ol class="publication-list">
  <li>
    <span class="pub-title"><a href="https://arxiv.org/abs/2510.25741">Scaling Latent Reasoning via Looped Language Models</a></span>
    <div class="pub-authors">Rui-Jie Zhu*, <strong>Zixuan Wang*</strong>, Kai Hua*, Tianyu Zhang*, et al.</div>
  </li>
  <li>
    <span class="pub-title"><a href="https://arxiv.org/abs/2505.23683">Learning Compositional Functions with Transformers from Easy-to-Hard Data</a></span>
    <div class="pub-authors"><strong>Zixuan Wang*</strong>, Eshaan Nichani*, A. Bietti, A. Damian, Daniel Hsu, Jason Lee, Denny Wu</div>
    <div class="pub-meta">COLT, 2025</div>
  </li>
  <li>
    <span class="pub-title"><a href="https://arxiv.org/abs/2503.15477">What Makes a Reward Model a Good Teacher? An Optimization Perspective</a></span>
    <div class="pub-authors">Noam Razin, <strong>Zixuan Wang</strong>, Hubert Strauss, Stanley Wei, Jason D. Lee, Sanjeev Arora</div>
    <div class="pub-meta">NeurIPS, 2025 Spotlight</div>
  </li>
  <li>
    <span class="pub-title"><a href="https://arxiv.org/abs/2502.21212">Transformers Learn to Implement Multi-step Gradient Descent with Chain of Thought</a></span>
    <div class="pub-authors">Jianhao Huang*, <strong>Zixuan Wang*</strong>, Jason D. Lee</div>
    <div class="pub-meta">ICLR, 2025 Spotlight</div>
  </li>
  <li>
    <span class="pub-title"><a href="https://arxiv.org/abs/2406.06893">Transformers Provably Learn Sparse Token Selection While Fully-Connected Nets Cannot</a></span>
    <div class="pub-authors"><strong>Zixuan Wang</strong>, Ruocheng Wei, Daniel Hsu, Jason D. Lee</div>
    <div class="pub-meta">ICML, 2024</div>
  </li>
  <li>
    <span class="pub-title"><a href="https://arxiv.org/abs/2210.03294">Understanding Edge-of-Stability Training Dynamics With a Minimalist Example</a></span>
    <div class="pub-authors">Xingyu Zhu*, <strong>Zixuan Wang*</strong>, Xiang Wang, Mo Zhou, Rong Ge</div>
    <div class="pub-meta">ICLR, 2023</div>
  </li>
  <li>
    <span class="pub-title"><a href="https://arxiv.org/abs/2207.12678">Analyzing Sharpness along GD Trajectory: Progressive Sharpening and Edge of Stability</a></span>
    <div class="pub-authors">Zhouzi Li*, <strong>Zixuan Wang*</strong>, Jian Li</div>
    <div class="pub-meta">NeurIPS, 2022</div>
  </li>
</ol>
