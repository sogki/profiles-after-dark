import { useState } from "react"
import { BookOpen, Search, ChevronRight, HelpCircle, MessageSquare, Users, FileText, Settings, Shield, Upload, User, Mail, Lock, Bell, Image, Download, Heart, Star, Eye, EyeOff, Globe, AlertCircle, CheckCircle, XCircle, Info } from "lucide-react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Footer from "../Footer"

interface HelpArticle {
  id: string
  title: string
  category: string
  content: string
  tags: string[]
}

const helpCategories = [
  { id: "getting-started", name: "Getting Started", icon: User, color: "text-blue-400" },
  { id: "uploading", name: "Uploading Content", icon: Upload, color: "text-green-400" },
  { id: "profile", name: "Profile Settings", icon: Settings, color: "text-purple-400" },
  { id: "community", name: "Community", icon: Users, color: "text-pink-400" },
  { id: "safety", name: "Safety & Privacy", icon: Shield, color: "text-red-400" },
  { id: "troubleshooting", name: "Troubleshooting", icon: HelpCircle, color: "text-yellow-400" },
]

const helpArticles: HelpArticle[] = [
  // Getting Started
  {
    id: "1",
    title: "How to Create Your Profile",
    category: "getting-started",
    content: `Creating your profile on Profiles After Dark is quick and easy!

**Step 1: Sign Up**
- Click the "Sign Up" button in the top right corner
- Enter your email address and create a secure password
- Verify your email address through the confirmation link sent to your inbox

**Step 2: Choose Your Username**
- Select a unique username that represents you
- Usernames can contain letters, numbers, and underscores
- Your username will be visible to other users

**Step 3: Customize Your Profile**
- Upload a profile picture (recommended: 512x512 pixels)
- Add a banner image (recommended: 1920x600 pixels)
- Write a bio to tell others about yourself
- Set your privacy preferences

**Tips:**
- Use high-quality images for best results
- Keep your bio concise but informative
- Review your privacy settings before making your profile public`,
    tags: ["profile", "signup", "basics", "setup"]
  },
  {
    id: "9",
    title: "Understanding the Dashboard",
    category: "getting-started",
    content: `The dashboard is your central hub for navigating Profiles After Dark.

**Main Navigation:**
- **Home**: Browse featured content and recent uploads
- **Galleries**: Explore profile pictures, banners, emotes, and wallpapers
- **Discover**: Find new users and trending content
- **Profile**: View and manage your profile

**Quick Actions:**
- Upload new content from the top navigation bar
- Access your settings via your profile menu
- Check notifications for updates and interactions

**Features:**
- Search bar for finding specific content or users
- Filter options to refine your browsing experience
- Sort by popularity, date, or relevance`,
    tags: ["dashboard", "navigation", "basics"]
  },
  {
    id: "10",
    title: "First Steps After Signing Up",
    category: "getting-started",
    content: `Welcome to Profiles After Dark! Here's what to do next:

**1. Complete Your Profile**
- Add a profile picture and banner
- Write a bio introducing yourself
- Set your display name

**2. Explore Content**
- Browse the galleries to see what's available
- Follow users whose content you enjoy
- Like and save content you want to use later

**3. Upload Your First Content**
- Share your own profile pictures, banners, or emotes
- Make sure your content follows our community guidelines
- Add appropriate tags to help others find your content

**4. Connect with the Community**
- Follow other creators
- Engage with content through likes and comments
- Join discussions and share your creations

**5. Customize Your Experience**
- Adjust your privacy settings
- Set notification preferences
- Explore account settings`,
    tags: ["getting-started", "tutorial", "basics"]
  },

  // Uploading Content
  {
    id: "2",
    title: "Uploading Profile Pictures",
    category: "uploading",
    content: `Uploading a profile picture is simple and straightforward.

**How to Upload:**
1. Go to your Profile Settings
2. Click on your current avatar (or the placeholder if you don't have one)
3. Select an image from your device
4. Crop or adjust the image if needed
5. Click "Save" to apply your new profile picture

**File Requirements:**
- **Formats**: JPG, PNG, or GIF
- **Recommended Size**: 512x512 pixels (square)
- **Maximum File Size**: 10MB
- **Aspect Ratio**: 1:1 (square) works best

**Tips for Best Results:**
- Use high-resolution images for crisp quality
- Ensure good lighting in your image
- Center your subject in the frame
- Avoid text or watermarks that might be cut off
- Consider using transparent backgrounds for PNG files

**Troubleshooting:**
- If upload fails, check file size and format
- Clear your browser cache and try again
- Ensure you have a stable internet connection
- Contact support if issues persist`,
    tags: ["upload", "pfp", "images", "profile-picture"]
  },
  {
    id: "3",
    title: "Uploading Banners",
    category: "uploading",
    content: `Banners add personality to your profile and are displayed at the top of your profile page.

**How to Upload:**
1. Navigate to Profile Settings
2. Click on the banner area (or "Add Banner" if you don't have one)
3. Select an image from your device
4. Adjust the crop area to frame your image correctly
5. Click "Save" to set your banner

**File Requirements:**
- **Formats**: JPG, PNG, or GIF
- **Recommended Size**: 1920x600 pixels
- **Aspect Ratio**: 16:5 (3.2:1)
- **Maximum File Size**: 10MB

**Design Tips:**
- Use high-resolution images for sharp display
- Keep important elements in the center (they won't be cut off on mobile)
- Consider how your banner looks on different screen sizes
- Match your banner style with your profile picture
- Use colors that complement your overall profile theme

**Best Practices:**
- Avoid placing important text near the edges
- Test how your banner looks on mobile devices
- Update your banner seasonally or for special occasions
- Ensure your banner follows community guidelines`,
    tags: ["upload", "banner", "images", "customization"]
  },
  {
    id: "11",
    title: "Uploading Emotes",
    category: "uploading",
    content: `Share your custom emotes with the community!

**How to Upload:**
1. Go to the Emotes gallery
2. Click "Upload Emote" button
3. Select your emote image file
4. Add a title and description
5. Choose appropriate tags
6. Submit for review

**File Requirements:**
- **Formats**: PNG (with transparency) or GIF (animated)
- **Recommended Size**: 128x128 pixels or 256x256 pixels
- **Aspect Ratio**: 1:1 (square)
- **Maximum File Size**: 5MB for static, 10MB for animated

**Guidelines:**
- Emotes must be original or properly licensed
- No copyrighted characters without permission
- Keep content appropriate for all audiences
- Animated emotes should loop smoothly
- Use transparent backgrounds for best results

**Tips:**
- Create emotes that are recognizable at small sizes
- Use bold colors and clear shapes
- Test your emote at different sizes before uploading
- Consider creating sets of related emotes`,
    tags: ["upload", "emotes", "custom", "animated"]
  },
  {
    id: "12",
    title: "Uploading Wallpapers",
    category: "uploading",
    content: `Share beautiful wallpapers for desktop and mobile devices.

**How to Upload:**
1. Navigate to the Wallpapers gallery
2. Click "Upload Wallpaper"
3. Select your wallpaper image
4. Add title, description, and tags
5. Specify resolution and category
6. Submit your wallpaper

**File Requirements:**
- **Formats**: JPG or PNG
- **Common Resolutions**: 
  - Desktop: 1920x1080, 2560x1440, 3840x2160
  - Mobile: 1080x1920, 1440x2560
- **Maximum File Size**: 20MB
- **Aspect Ratios**: 16:9 (desktop) or 9:16 (mobile)

**Quality Guidelines:**
- Use high-resolution source images
- Avoid compression artifacts
- Ensure proper color grading
- Test on actual devices if possible
- Provide multiple resolutions when possible

**Categories:**
- Abstract
- Nature
- Minimalist
- Dark Mode
- Anime/Art
- Gaming
- Technology`,
    tags: ["upload", "wallpapers", "desktop", "mobile"]
  },
  {
    id: "13",
    title: "File Size and Format Guidelines",
    category: "uploading",
    content: `Understanding file requirements helps ensure successful uploads.

**Supported Formats:**
- **Images**: JPG, PNG, GIF, WebP
- **Animated**: GIF, APNG
- **Transparency**: PNG, GIF, WebP

**Size Limits:**
- Profile Pictures: 10MB max
- Banners: 10MB max
- Emotes: 5MB (static), 10MB (animated)
- Wallpapers: 20MB max

**Optimization Tips:**
- Compress images before uploading to reduce file size
- Use appropriate formats (PNG for transparency, JPG for photos)
- Resize images to recommended dimensions
- Remove unnecessary metadata
- Use online tools like TinyPNG or ImageOptim

**Common Issues:**
- **Upload fails**: Check file size and format
- **Poor quality**: Ensure source image is high resolution
- **Slow upload**: Compress file or check internet connection
- **Format not supported**: Convert to supported format

**Tools for Optimization:**
- Image editing: Photoshop, GIMP, Canva
- Compression: TinyPNG, Squoosh, ImageOptim
- Format conversion: Online converters or image editors`,
    tags: ["upload", "formats", "file-size", "optimization"]
  },

  // Profile Settings
  {
    id: "4",
    title: "Privacy Settings Explained",
    category: "profile",
    content: `Control who can see your profile and content with privacy settings.

**Profile Visibility Options:**

**Public (Default)**
- Anyone can view your profile
- Your content appears in search results
- Best for creators and public figures
- Maximum discoverability

**Friends Only**
- Only users you follow (and who follow you back) can view
- Your profile won't appear in public searches
- More privacy while staying connected
- Mutual follows required

**Private**
- Only you can view your profile
- Complete privacy
- Useful for personal accounts
- Others cannot see your content

**Online Status:**
- Toggle to show/hide when you're online
- Green indicator appears when active
- Respects your privacy preferences
- Can be changed anytime

**Best Practices:**
- Review privacy settings regularly
- Consider your content type when choosing visibility
- Remember: public profiles are more discoverable
- You can change settings at any time`,
    tags: ["privacy", "settings", "visibility", "online-status"]
  },
  {
    id: "14",
    title: "Customizing Your Profile",
    category: "profile",
    content: `Make your profile unique with customization options.

**Profile Elements:**
- **Profile Picture**: Your main avatar (512x512px recommended)
- **Banner**: Header image (1920x600px recommended)
- **Display Name**: How your name appears (different from username)
- **Bio**: Short description about yourself
- **Badges**: Earned achievements and status indicators

**Customization Tips:**
- Create a cohesive theme across all elements
- Use consistent color schemes
- Ensure readability of text overlays
- Test how your profile looks on different devices
- Update regularly to keep it fresh

**Profile Sections:**
- **About**: Your bio and basic information
- **Content**: Your uploaded images and creations
- **Favorites**: Content you've saved
- **Activity**: Your recent actions and updates

**Display Preferences:**
- Choose what information to show publicly
- Control which sections are visible
- Set default sorting for your content
- Customize your profile layout`,
    tags: ["profile", "customization", "settings", "appearance"]
  },
  {
    id: "15",
    title: "Account Settings Overview",
    category: "profile",
    content: `Manage your account preferences and settings.

**General Settings:**
- **Email**: Update your email address
- **Password**: Change your password
- **Language**: Select your preferred language
- **Timezone**: Set your timezone for accurate timestamps

**Notification Settings:**
- **Email Notifications**: Control email alerts
- **Push Notifications**: Browser notification preferences
- **Activity Alerts**: New followers, likes, comments
- **System Updates**: Platform announcements

**Content Settings:**
- **Default Privacy**: Set default visibility for new uploads
- **Auto-approve**: Automatically approve certain content types
- **Content Filters**: Filter sensitive content
- **Download Settings**: Control who can download your content

**Security Settings:**
- **Two-Factor Authentication**: Add extra security (if available)
- **Active Sessions**: View and manage logged-in devices
- **Login History**: Review recent account access
- **Account Recovery**: Set up recovery options

**Data & Privacy:**
- **Data Export**: Download your account data
- **Account Deletion**: Permanently delete your account
- **Privacy Policy**: Review how we handle your data
- **Cookie Preferences**: Manage cookie settings`,
    tags: ["settings", "account", "preferences", "security"]
  },

  // Community
  {
    id: "5",
    title: "Following Other Users",
    category: "community",
    content: `Build your network by following other users.

**How to Follow:**
1. Visit a user's profile
2. Click the "Follow" button
3. You'll see their updates in your feed
4. Get notified of their new content

**Following Benefits:**
- See their latest uploads in your feed
- Get notifications about their activity
- Support creators you enjoy
- Build your network

**Managing Follows:**
- View all users you follow in your profile
- Unfollow anytime by clicking "Following"
- Organize follows into lists (if available)
- See mutual follows with other users

**Best Practices:**
- Follow users whose content you genuinely enjoy
- Engage with content from users you follow
- Don't follow just to get follows back
- Respect other users' privacy settings`,
    tags: ["follow", "community", "social", "network"]
  },
  {
    id: "16",
    title: "Interacting with Content",
    category: "community",
    content: `Engage with the community through various interactions.

**Like Content:**
- Click the heart icon to like content
- Show appreciation for creators
- Liked content is saved to your favorites
- Helps content gain visibility

**Save Content:**
- Click the bookmark icon to save
- Access saved content from your profile
- Organize into collections (if available)
- Keep content for later use

**Share Content:**
- Share links to content you enjoy
- Help others discover great content
- Respect creator preferences
- Give credit when sharing

**Comments:**
- Leave thoughtful comments
- Provide constructive feedback
- Ask questions respectfully
- Follow community guidelines

**Reporting:**
- Report inappropriate content
- Flag violations of guidelines
- Help maintain a safe community
- Reports are reviewed by moderators`,
    tags: ["interaction", "community", "engagement", "social"]
  },
  {
    id: "17",
    title: "Community Guidelines",
    category: "community",
    content: `Help maintain a positive community environment.

**Be Respectful:**
- Treat all users with kindness
- No harassment, bullying, or hate speech
- Respect different opinions and perspectives
- Keep discussions civil

**Content Standards:**
- No explicit or inappropriate content
- Respect copyright and intellectual property
- No spam or repetitive content
- Follow age-appropriate guidelines

**Prohibited Behavior:**
- Impersonation of other users
- Sharing personal information without consent
- Spam, scams, or misleading content
- Automated accounts or bots

**Consequences:**
- Warnings for minor violations
- Temporary restrictions for repeated issues
- Permanent bans for severe violations
- Appeals process available

**Reporting:**
- Report violations using the report button
- Provide context when reporting
- False reports may result in action
- All reports are reviewed by moderators

Read the full Community Guidelines for complete details.`,
    tags: ["guidelines", "community", "rules", "safety"]
  },

  // Safety & Privacy
  {
    id: "6",
    title: "Reporting Inappropriate Content",
    category: "safety",
    content: `Help keep Profiles After Dark safe by reporting violations.

**What to Report:**
- Harassment or bullying
- Inappropriate or explicit content
- Copyright violations
- Spam or scams
- Impersonation
- Hate speech or discrimination

**How to Report:**
1. Click the "Report" button on the content or profile
2. Select the reason for reporting
3. Provide additional context if needed
4. Submit your report

**Report Types:**
- **Content Reports**: For specific posts or images
- **User Reports**: For user behavior or profiles
- **Comment Reports**: For inappropriate comments
- **Spam Reports**: For spam or automated content

**What Happens Next:**
- Reports are reviewed by our moderation team
- Action is taken within 24-48 hours typically
- You may receive updates on the report status
- False reports may result in action against the reporter

**Important:**
- Only report genuine violations
- Provide accurate information
- Don't abuse the reporting system
- Reports are confidential`,
    tags: ["report", "safety", "moderation", "violations"]
  },
  {
    id: "7",
    title: "Account Security",
    category: "safety",
    content: `Protect your account with these security best practices.

**Password Security:**
- Use a strong, unique password
- Include uppercase, lowercase, numbers, and symbols
- Don't reuse passwords from other sites
- Change your password regularly
- Never share your password with anyone

**Two-Factor Authentication:**
- Enable 2FA if available for extra security
- Use an authenticator app when possible
- Keep backup codes in a safe place
- Update recovery methods regularly

**Account Monitoring:**
- Review your login history regularly
- Check active sessions and log out unused devices
- Monitor for suspicious activity
- Enable email notifications for security events

**Phishing Protection:**
- Never click suspicious links
- Verify emails are from official sources
- Don't enter credentials on untrusted sites
- Report phishing attempts

**If Compromised:**
- Change your password immediately
- Review and revoke active sessions
- Check for unauthorized changes
- Contact support if needed
- Enable additional security measures`,
    tags: ["security", "password", "safety", "2fa"]
  },
  {
    id: "18",
    title: "Privacy Best Practices",
    category: "safety",
    content: `Protect your privacy while using Profiles After Dark.

**Information Sharing:**
- Be mindful of what you share publicly
- Don't share personal contact information
- Consider using a display name instead of real name
- Review what information is visible on your profile

**Privacy Settings:**
- Set your profile visibility appropriately
- Control who can see your activity
- Manage online status visibility
- Adjust notification preferences

**Content Privacy:**
- Set default privacy for new uploads
- Review privacy of existing content
- Understand who can download your content
- Consider watermarking important content

**Third-Party Access:**
- Review connected applications
- Revoke access to unused apps
- Be cautious with third-party integrations
- Read privacy policies before connecting

**Data Protection:**
- Understand how your data is used
- Review privacy policy regularly
- Use data export to backup your information
- Know your rights regarding data deletion`,
    tags: ["privacy", "safety", "data", "protection"]
  },
  {
    id: "19",
    title: "Blocking and Muting Users",
    category: "safety",
    content: `Control your interactions with other users.

**Blocking Users:**
- Prevents users from viewing your profile
- Blocks all communication attempts
- Hides your content from blocked users
- Can be done from user profiles or messages

**Muting Users:**
- Hides their content from your feed
- User can still see your content
- No notification sent to muted user
- Useful for reducing unwanted content

**When to Block:**
- Harassment or bullying
- Inappropriate behavior
- Spam or unwanted contact
- Personal safety concerns

**When to Mute:**
- Content you don't want to see
- Reducing feed clutter
- Temporary break from a user
- Without severing connection

**Managing Blocks/Mutes:**
- View list in account settings
- Unblock or unmute anytime
- Blocked users cannot follow you
- Muted users remain in your network`,
    tags: ["block", "mute", "safety", "privacy"]
  },

  // Troubleshooting
  {
    id: "8",
    title: "Troubleshooting Upload Issues",
    category: "troubleshooting",
    content: `Common solutions for upload problems.

**Upload Fails:**
- Check file size (must be under limit)
- Verify file format is supported
- Ensure stable internet connection
- Try a different browser
- Clear browser cache and cookies

**Image Quality Issues:**
- Use high-resolution source images
- Avoid excessive compression
- Check recommended dimensions
- Use appropriate file format
- Test image before uploading

**Slow Uploads:**
- Check internet connection speed
- Compress large files before uploading
- Try uploading during off-peak hours
- Close other bandwidth-intensive apps
- Use wired connection if possible

**Format Not Supported:**
- Convert to JPG, PNG, or GIF
- Use online converters if needed
- Check file extension is correct
- Verify file isn't corrupted
- Try re-saving the image

**Still Having Issues?**
- Contact support with error details
- Include file information (size, format)
- Describe what happens when you try to upload
- Provide screenshots if possible
- Check status page for known issues`,
    tags: ["upload", "troubleshooting", "issues", "problems"]
  },
  {
    id: "20",
    title: "Login and Account Issues",
    category: "troubleshooting",
    content: `Solutions for common login and account problems.

**Can't Log In:**
- Verify email and password are correct
- Check for typos (passwords are case-sensitive)
- Try password reset if forgotten
- Clear browser cache and cookies
- Try incognito/private browsing mode

**Password Reset:**
- Click "Forgot Password" on login page
- Check email (including spam folder)
- Reset link expires after 1 hour
- Create new strong password
- Update password in account settings

**Account Locked:**
- May occur after multiple failed login attempts
- Wait 15-30 minutes before trying again
- Contact support if locked for extended period
- Verify you're using correct account
- Check for email notifications about account status

**Email Not Received:**
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes (delays can occur)
- Try resending the email
- Contact support if issue persists

**Two-Factor Authentication Issues:**
- Ensure device time is correct
- Use backup codes if available
- Try authenticator app instead of SMS
- Contact support to disable 2FA if needed
- Re-enable 2FA after resolving issue`,
    tags: ["login", "password", "account", "troubleshooting"]
  },
  {
    id: "21",
    title: "Browser and Performance Issues",
    category: "troubleshooting",
    content: `Fix browser-related problems and improve performance.

**Page Won't Load:**
- Check internet connection
- Try refreshing the page
- Clear browser cache
- Disable browser extensions
- Try different browser

**Slow Performance:**
- Close unnecessary browser tabs
- Clear cache and cookies
- Disable heavy extensions
- Update browser to latest version
- Check available system memory

**Display Issues:**
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache
- Update browser
- Check browser zoom level (should be 100%)
- Try different browser

**JavaScript Errors:**
- Enable JavaScript in browser settings
- Update browser to latest version
- Disable conflicting extensions
- Try incognito/private mode
- Contact support with error details

**Mobile Issues:**
- Update mobile browser app
- Clear app cache
- Restart device
- Check available storage space
- Try mobile website instead of app

**Recommended Browsers:**
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (latest version)`,
    tags: ["browser", "performance", "technical", "troubleshooting"]
  },
  {
    id: "22",
    title: "Notifications Not Working",
    category: "troubleshooting",
    content: `Fix notification issues and ensure you stay updated.

**Browser Notifications:**
- Check browser notification permissions
- Allow notifications in browser settings
- Ensure site has notification permission
- Check "Do Not Disturb" mode is off
- Verify browser supports notifications

**Email Notifications:**
- Check spam/junk folder
- Verify email address is correct
- Review notification settings in account
- Ensure email notifications are enabled
- Whitelist our email address

**In-App Notifications:**
- Check notification settings in account
- Verify notification types are enabled
- Refresh the page to load new notifications
- Clear browser cache
- Check if notifications are being filtered

**Missing Notifications:**
- Review notification preferences
- Check if specific types are disabled
- Verify account activity settings
- Ensure you're logged into correct account
- Contact support if consistently missing

**Too Many Notifications:**
- Adjust notification frequency
- Disable specific notification types
- Use notification filters
- Set quiet hours if available
- Customize notification preferences`,
    tags: ["notifications", "alerts", "settings", "troubleshooting"]
  },
  {
    id: "23",
    title: "Content Not Appearing",
    category: "troubleshooting",
    content: `Why your content might not be visible and how to fix it.

**Content Under Review:**
- New uploads may require moderation
- Wait 24-48 hours for review
- Check your email for status updates
- Ensure content follows guidelines
- Contact support if review takes longer

**Privacy Settings:**
- Check content visibility settings
- Verify profile privacy settings
- Ensure content isn't set to private
- Review default privacy preferences
- Make content public if needed

**Search Visibility:**
- Content may take time to index
- Add appropriate tags and descriptions
- Ensure content is public
- Wait a few hours for search indexing
- Try searching with different terms

**Deleted or Removed:**
- Check if content violated guidelines
- Review email for removal notices
- Content may have been reported
- Check moderation status
- Contact support for clarification

**Technical Issues:**
- Refresh the page
- Clear browser cache
- Check if content uploaded successfully
- Verify file wasn't corrupted
- Try re-uploading if needed`,
    tags: ["content", "visibility", "moderation", "troubleshooting"]
  },
]

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categoryArticles = selectedCategory
    ? helpArticles.filter(a => a.category === selectedCategory)
    : helpArticles

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sticky Header - Discord-like design */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                <BookOpen className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Help Center</h1>
                <p className="text-sm text-slate-400">Find answers to common questions and learn how to use Profiles After Dark</p>
              </div>
            </div>

            {/* Search Bar - Always visible */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help articles..."
                className="w-full bg-slate-800/80 border border-slate-700/50 pl-12 pr-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Clear search"
                >
                  <XCircle className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Categories - Sticky */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/30 p-4 sticky top-[180px] lg:top-[200px]">
              <h2 className="text-lg font-semibold text-white mb-4">Categories</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    !selectedCategory
                      ? "bg-purple-600/20 text-white border border-purple-500/50"
                      : "text-slate-300 hover:bg-slate-700/50"
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span>All Articles</span>
                </button>
                {helpCategories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        selectedCategory === category.id
                          ? "bg-purple-600/20 text-white border border-purple-500/50"
                          : "text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${category.color}`} />
                      <span>{category.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {selectedArticle ? (
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/30 p-6">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Back to articles
                </button>
                <h2 className="text-2xl font-bold text-white mb-4">{selectedArticle.title}</h2>
                <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline prose-ul:text-slate-300 prose-ol:text-slate-300 prose-li:text-slate-300 prose-code:text-purple-300 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline" />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong {...props} className="font-semibold text-white" />
                      ),
                      h1: ({ node, ...props }) => (
                        <h1 {...props} className="text-2xl font-bold text-white mt-6 mb-4" />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 {...props} className="text-xl font-bold text-white mt-5 mb-3" />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 {...props} className="text-lg font-semibold text-white mt-4 mb-2" />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul {...props} className="list-disc list-inside text-slate-300 my-4 space-y-2" />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol {...props} className="list-decimal list-inside text-slate-300 my-4 space-y-2" />
                      ),
                      li: ({ node, ...props }) => (
                        <li {...props} className="text-slate-300" />
                      ),
                      p: ({ node, ...props }) => (
                        <p {...props} className="text-slate-300 leading-relaxed my-3" />
                      ),
                      code: ({ node, inline, ...props }: any) => {
                        if (inline) {
                          return <code {...props} className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-sm" />
                        }
                        return <code {...props} className="block bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto my-4" />
                      },
                    }}
                  >
                    {selectedArticle.content}
                  </ReactMarkdown>
                </div>
                {/* Related Articles */}
                <div className="mt-8 pt-6 border-t border-slate-700/50">
                  <p className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Related Articles</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {helpArticles
                      .filter(a => a.id !== selectedArticle.id && a.category === selectedArticle.category)
                      .slice(0, 4)
                      .map((article) => (
                        <button
                          key={article.id}
                          onClick={() => {
                            setSelectedArticle(article)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className="text-left p-4 bg-slate-700/30 rounded-lg border border-slate-700/30 hover:border-purple-500/50 hover:bg-slate-700/50 transition-all group"
                        >
                          <h4 className="font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">{article.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2">{article.content.substring(0, 100)}...</p>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <p className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSearchQuery(tag)
                          setSelectedArticle(null)
                        }}
                        className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-full text-xs text-slate-300 hover:text-white transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Results Count */}
                {filteredArticles.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-400">
                      {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
                      {selectedCategory && ` in ${helpCategories.find(c => c.id === selectedCategory)?.name}`}
                    </p>
                  </div>
                )}

                {filteredArticles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredArticles.map((article) => {
                      const category = helpCategories.find(c => c.id === article.category)
                      const CategoryIcon = category?.icon || FileText
                      return (
                        <button
                          key={article.id}
                          onClick={() => {
                            setSelectedArticle(article)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className="w-full text-left bg-slate-800/50 rounded-lg border border-slate-700/30 p-5 hover:border-purple-500/50 hover:bg-slate-800/70 cursor-pointer transition-all group"
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-lg bg-slate-700/50 ${category?.color || "text-slate-400"} group-hover:scale-110 transition-transform`}>
                              <CategoryIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">{article.title}</h3>
                                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                              </div>
                              <p className="text-slate-400 text-sm line-clamp-2 mb-3">{article.content.split('\n')[0]}</p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs px-2.5 py-1 bg-slate-700/50 rounded-full text-slate-300 capitalize">
                                  {category?.name || article.category}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {article.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="text-xs text-slate-500">#{tag}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-800/50 rounded-lg border border-slate-700/30 p-12 text-center">
                    <HelpCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
                    <p className="text-slate-400 mb-4">Try adjusting your search or category filter</p>
                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedCategory(null)
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Support CTA */}
        <div className="mt-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Still need help?</h3>
              <p className="text-slate-300">Can't find what you're looking for? Contact our support team for personalized assistance.</p>
            </div>
            <Link
              to="/profile-settings?tab=support"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors whitespace-nowrap"
            >
              <MessageSquare className="h-5 w-5" />
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

