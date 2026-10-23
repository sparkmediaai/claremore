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

## Contact form → GoHighLevel
1. In GHL, create a Workflow with the **Inbound Webhook** trigger and copy its URL.
2. Paste it into `contact_webhook` in `_config.yml` and push.
3. Submit a test from the live contact page, then in GHL click **Fetch sample requests** and map the fields
   to the contact (Create/Update Contact action).

Fields sent: `first_name`, `last_name`, `full_name`, `email`, `phone`, `company_name`, `annual_revenue`,
`services` (comma-separated), `package` (when chosen from the pricing page), `executive_seat` (when coming from an Executive Team page), `message`, `sms_consent` (yes/no), `source`, `page_url`, `referrer`,
`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `submitted_at`.

The form sends JSON. If the browser blocks that (CORS), it automatically resends the same fields as a
standard form post. Until a webhook URL is set, the form opens the visitor's email app instead.
