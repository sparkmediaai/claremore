# Claremore Advisors website

Rebuild of claremoreadvisors.com as a fast static site, built with Jekyll and hosted on GitHub Pages.

- **Preview:** https://sparkmedia.ai/claremore/
- **Services** (menu, footer and cards) are managed in `_data/services.yml`.
- **Contact details** (phone, email, address, portal link) live in `_config.yml`.
- **Blog posts** are Markdown files in `_posts/`.

## Going live on claremoreadvisors.com
1. In `_config.yml` set `baseurl: ""`, `url: https://www.claremoreadvisors.com` and `noindex: false`.
2. In the repo's Settings → Pages, add the custom domain and point the domain's DNS at GitHub Pages.

## Preview locally
```
gem install jekyll
jekyll serve
```
