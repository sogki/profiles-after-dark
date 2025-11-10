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

To make the confirmation link use your custom domain instead of `zzywottwfffyddnorein.supabase.co`:

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Under **"Site URL"**, set it to your production domain (e.g., `https://www.profilesafterdark.com`)
3. Under **"Redirect URLs"**, add your callback URL: `https://www.profilesafterdark.com/auth/callback`

The confirmation email will now use your custom domain in the redirect URL.

## Notes:

- The email template uses Go template syntax (`{{ .ConfirmationURL }}`)
- You can add HTML styling, images, and custom branding
- The confirmation link will automatically redirect to `/auth/callback` on your site
- After confirmation, users will be redirected to `/profile-settings?tab=account&setup=true` to set their username

