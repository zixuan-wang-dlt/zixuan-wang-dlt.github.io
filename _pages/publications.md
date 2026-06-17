---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: false
---

{% if site.author.googlescholar %}
  You can also find my articles on <u><a href="{{ site.author.googlescholar }}">my Google Scholar profile</a>.</u>
{% endif %}

{% include base_path %}

{% assign publications_by_date = site.publications | sort: "date" | reverse %}
{% for post in publications_by_date %}
  {% include archive-single.html %}
{% endfor %}
