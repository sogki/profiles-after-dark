# Email Template Customization

To customize the email confirmation template in Supabase:

## Steps:

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select **"Confirm signup"** template
3. Copy and paste the improved template below
4. Save the template

## Subject Lines:

Use these subject lines for each template type in Supabase:

1. **Confirm signup**: `Confirm your Profiles After Dark account`
2. **Magic Link**: `Your magic link to Profiles After Dark`
3. **Change Email**: `Confirm your new email address - Profiles After Dark`
4. **Reset Password**: `Reset your password - Profiles After Dark`
5. **Confirm Authentication**: `Confirm your authentication - Profiles After Dark`

## Improved Email Body Templates:

Copy the entire template from each file into Supabase's corresponding email template editor:

1. **Confirm signup** → `email_template_confirm_signup.html`
2. **Magic Link** → `email_template_magic_link.html`
3. **Change Email** → `email_template_change_email.html`
4. **Reset Password** → `email_template_reset_password.html`
5. **Confirm Authentication** → `email_template_confirm_auth.html`

### Key Improvements:
- ✨ Modern gradient header matching your brand colors
- 🎨 Enhanced visual hierarchy with better spacing
- 📱 Improved mobile responsiveness
- 🔒 Better security messaging
- 💜 Consistent purple/pink gradient theme
- 🌙 Dark mode optimized design
- ✉️ Professional typography and layout
- 🔗 Better alternative link presentation
- 🎯 Context-specific messaging for each template type

## Custom Domain for Email Links:

To make the confirmation link use your custom domain instead of `zzywottwfffyddnorein.supabase.co`, you need to configure Supabase to use your custom domain:

### Option 1: Configure Site URL (Recommended)

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Under **"Site URL"**, set it to your production domain:
   ```
   https://www.profilesafterdark.com
   ```
3. Under **"Redirect URLs"**, add your callback URL:
   ```
   https://www.profilesafterdark.com/auth/callback
   ```
4. Save the settings

**Note:** This will make the `redirect_to` parameter use your custom domain, but the base URL will still be Supabase's domain. The full link will look like:
```
https://zzywottwfffyddnorein.supabase.co/auth/v1/verify?token=...&redirect_to=https://www.profilesafterdark.com/auth/callback
```

### Option 2: Set Up Custom Domain (Full Custom Domain)

For the email links to use your custom domain completely (e.g., `https://www.profilesafterdark.com/auth/v1/verify?...`), you need to:

1. **Set up a custom domain in Supabase:**
   - Go to **Supabase Dashboard** → **Settings** → **Custom Domains**
   - Add your custom domain (e.g., `api.profilesafterdark.com`)
   - Follow Supabase's DNS configuration instructions
   - Wait for DNS propagation (can take up to 48 hours)

2. **Update Site URL:**
   - Go to **Settings** → **API**
   - Set **"Site URL"** to your custom domain:
     ```
     https://api.profilesafterdark.com
     ```

3. **Update Redirect URLs:**
   - Add your callback URL:
     ```
     https://www.profilesafterdark.com/auth/callback
     ```

4. **Update your frontend configuration:**
   - In your `.env` file, set:
     ```
     VITE_SUPABASE_CUSTOM_DOMAIN=api.profilesafterdark.com
     ```

**Important:** Custom domains in Supabase require:
- A Pro plan or higher
- Proper DNS configuration (CNAME or A record)
- SSL certificate (handled by Supabase)

### Option 3: Reverse Proxy (Advanced)

If you can't use Supabase's custom domain feature, you can set up a reverse proxy on your server to forward requests from your custom domain to Supabase. This requires server configuration and is more complex.

### Current Configuration Check:

Check your current Supabase settings:
- **Site URL:** Should be your production domain
- **Redirect URLs:** Should include your callback URL
- **Custom Domain:** Check if you have one configured

The `{{ .ConfirmationURL }}` variable in email templates will automatically use whatever domain is configured in Supabase's settings.

## Notes:

- The email template uses Go template syntax (`{{ .ConfirmationURL }}`)
- You can add HTML styling, images, and custom branding
- The confirmation link will automatically redirect to `/auth/callback` on your site
- After confirmation, users will be redirected to `/profile-settings?tab=account&setup=true` to set their username

