# Profiles After Dark 🌙

> **Your aesthetic lives here** — A comprehensive platform for discovering and sharing aesthetic profile pictures, banners, wallpapers, and emoji combinations.

![Profiles After Dark Logo](https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets/profiles_after_dark_logo.png)

## ✨ Features

### 🎨 Content Gallery
- **Profile Pictures** - Curated collection of aesthetic PFPs
- **Banners** - Stunning profile banners for all platforms
- **Wallpapers** - High-quality wallpapers for desktop and mobile (In development)
- **Emotes** - Custom emotes and reactions (In development)
- **Emoji Combos** - Creative emoji combinations (In development)
- **Trending** - Discover what's popular in the community

### 👥 User Management
- **User Profiles** - Personalized user pages with collections
- **Profile Settings** - Customize your experience
- **User Search** - Find and connect with other users
- **Community Features** - Join the vibrant community

### 🛡️ Advanced Moderation System
- **AI-Powered Content Analysis** - Automated content moderation using OpenAI
- **Enhanced Reporting System** - Comprehensive reporting with detailed categorization
- **Moderation Dashboard** - Real-time overview with key metrics
- **Appeals System** - User appeal management and resolution
- **Audit Logs** - Complete moderation history and tracking
- **Staff Messaging** - Internal communication system for moderators

### 🔧 Technical Features
- **Real-time Updates** - Live statistics and notifications
- **Responsive Design** - Optimized for all devices
- **Dark Theme** - Beautiful dark aesthetic throughout
- **Search & Filter** - Advanced content discovery
- **Upload System** - Easy content submission
- **Authentication** - Secure user management with Supabase

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI Integration**: OpenAI API for content moderation
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Icons**: Lucide React + React Icons
- **Notifications**: React Hot Toast

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/profiles-after-dark.git
   cd profiles-after-dark
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. **Database Setup**
   Run the database migrations:
   ```bash
   npx supabase db push
   ```

5. **Generate TypeScript types**
   ```bash
   npm run gen-db-types
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with the following key tables:

- **user_profiles** - User account information
- **profiles** - Profile pictures and metadata
- **profile_pairs** - Profile picture pairs
- **banners** - Profile banners
- **wallpapers** - Wallpaper collection
- **emotes** - Custom emotes
- **emoji_combos** - Emoji combinations
- **moderation_logs** - Moderation actions and history
- **reports** - User reports and content flags
- **appeals** - User appeal submissions
- **announcements** - Site-wide announcements

## 🎯 Key Components

### Gallery System
- `ProfilesGallery` - Main profile pictures gallery
- `PfpGallery` - Profile picture specific gallery
- `BannersGallery` - Banner collection
- `WallpaperGallery` - Wallpaper showcase
- `EmotesGallery` - Emote collection
- `EmojiCombosGallery` - Emoji combo gallery

### Moderation System
- `EnhancedModerationPage` - Main moderation dashboard
- `EnhancedReportModal` - Advanced reporting interface
- `ModerationPanel` - Core moderation tools
- `AppealsForm` - User appeal system

### User Management
- `UserProfile` - Individual user pages
- `UserList` - User directory
- `ProfileSettings` - User preferences

## 🚀 Deployment

The application is configured for deployment on Vercel with the following setup:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure environment variables** in your deployment platform

## 📱 Screenshots

<!-- Add your screenshots here -->
![Hero Section](https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets/pad-v1-img.png)
![Gallery View](https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets/pad-v1-img-profiles.png)
![User Profile](https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets/pad-v1-userprofile.png)
![Moderation Dashboard](https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets/pad-v1-moderation.png)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Site**: [profilesafterdark.com](https://profilesafterdark.com)

## 🙏 Acknowledgments

- OpenAI for AI-powered moderation
- Supabase for backend infrastructure
- The React and TypeScript communities
- All contributors and users who make this project possible

---

**Made with ❤️ by the Profiles After Dark team**
