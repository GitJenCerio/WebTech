# Email Deliverability — Avoiding Spam Folder

Booking confirmation and other transactional emails often land in spam. Here’s why and what to do about it.

## Common Causes

### 1. **Domain authentication (SPF, DKIM, DMARC)**
- Emails from `admin@glammednailsbyjhen.com` or `noreply@glammednailsbyjhen.com` must be authenticated.
- **Resend** requires verifying your domain and configuring DNS (SPF, DKIM) so inbox providers trust the sender.
- If `glammednailsbyjhen.com` isn’t verified in Resend, or DNS records are wrong/missing, spam filters will be more aggressive.

### 2. **“From” address and display name**
- Generic senders like `noreply@` or `no-reply@` are often treated as low-trust.
- Using a friendly name such as `Glammed Nails by Jhen <hello@glammednailsbyjhen.com>` can help.
- `EMAIL_FROM` in `.env` should use your real domain, e.g. `"Glammed Nails <hello@glammednailsbyjhen.com>"`.

### 3. **Subject line and content**
- Words like “Deposit Required”, “Payment”, “PHP”, “Amount Due”, “Upload proof” can trigger spam rules.
- Avoid excessive caps, repeated punctuation, or “URGENT”/“ACT NOW” type phrasing.
- Keep subjects clear and professional, e.g. `Booking Confirmed - GN-20260209001`.

### 4. **Sender reputation**
- New domains or sending patterns that change suddenly can look risky.
- Start with low volume and increase gradually.
- Avoid sending to invalid or inactive addresses.

### 5. **HTML and links**
- Too many links or images can trigger spam filters.
- Use simple HTML, valid structure, and consistent styling.
- Prefer your own domain for links instead of third‑party hosts where possible.

## Recommendations

1. **Verify domain in Resend**
   - Add the DNS records Resend provides for your domain.
   - Ensure SPF, DKIM, and optionally DMARC are correctly set.

2. **Update `EMAIL_FROM`**
   - Use a friendly, recognizable sender and your verified domain:
   - Example: `"Glammed Nails by Jhen <hello@glammednailsbyjhen.com>"`.

3. **Warm up the domain**
   - Start with a small number of recipients and gradually increase.

4. **Use a DMARC record**
   - Add a DMARC DNS record to define policy for failed SPF/DKIM checks.
   - Start with `p=none` for monitoring, then move to `p=quarantine` or `p=reject` as needed.

5. **Check Resend analytics**
   - Use Resend’s dashboard to monitor bounces, spam complaints, and delivery rates.
   - Adjust sending patterns and content if issues appear.

6. **Avoid shared hosting IPs**
   - Resend sends through their infrastructure, which is usually fine. If you add a custom SMTP or another provider, prefer a dedicated IP for your domain.
