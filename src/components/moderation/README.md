# Enhanced Moderation System

A comprehensive, AI-powered moderation system with advanced features for content management, user management, and automated moderation.

## 📁 Folder Structure

```
src/components/moderation/
├── views/                    # Main view components for each tab
│   ├── ContentManagementView.tsx    # Content management with AI analysis
│   ├── LogsView.tsx                # Moderation logs and audit trail
│   ├── AutomationView.tsx          # AI automation and rules
│   ├── MonitoringView.tsx          # System performance monitoring
│   └── AppealsView.tsx             # User appeals management
├── modals/                   # Modal components
│   ├── EnhancedReportModal.tsx     # Enhanced reporting system
│   ├── ModerationMessaging.tsx    # Real-time messaging
│   ├── EnhancedNotificationSystem.tsx  # Notification system
│   └── ModerationAnalytics.tsx    # Analytics and insights
├── hooks/                    # Custom hooks
│   └── useModerationSystem.ts     # Main moderation system hook
├── utils/                    # Utility functions
├── EnhancedModerationPage.tsx      # Main page component
├── EnhancedModerationPanel.tsx    # Core moderation panel
└── README.md                # This file
```

## 🚀 Features

### Core Features
- **Dashboard**: Real-time overview with key metrics
- **Reports**: Enhanced reporting system with AI analysis
- **Content Management**: AI-powered content moderation
- **Logs**: Comprehensive audit trail
- **Analytics**: Performance insights and trends
- **Users**: User management and permissions
- **Automation**: AI-powered moderation rules
- **Settings**: System configuration
- **Monitoring**: System health and performance
- **Appeals**: User appeal management
- **Messaging**: Real-time communication
- **Notifications**: Multi-channel alerts

### AI Integration
- **Content Analysis**: Automatic content scanning and tagging
- **Spam Detection**: Advanced pattern recognition
- **Risk Assessment**: User behavior analysis
- **Auto-moderation**: Automated rule enforcement
- **Insights**: AI-generated recommendations

### Performance Features
- **Real-time Updates**: Live data synchronization
- **Intelligent Caching**: Optimized data loading
- **Background Processing**: Non-blocking operations
- **Error Handling**: Graceful failure management

## 🛠️ Setup

### Prerequisites
- React 18+
- TypeScript
- Supabase
- OpenAI API key
- Framer Motion
- Lucide React

### Installation
1. Ensure all dependencies are installed
2. Configure Supabase connection
3. Set up OpenAI API key
4. Import the main component

### Usage
```tsx
import EnhancedModerationPage from './components/moderation/EnhancedModerationPage';

// Use in your routing
<Route path="/moderation/enhanced" element={<EnhancedModerationPage />} />
```

## 📊 Components

### Views
- **ContentManagementView**: Manage uploaded content with AI analysis
- **LogsView**: View moderation actions and system events
- **AutomationView**: Configure AI rules and automation
- **MonitoringView**: Monitor system performance
- **AppealsView**: Handle user appeals

### Modals
- **EnhancedReportModal**: Report inappropriate content
- **ModerationMessaging**: Real-time communication
- **EnhancedNotificationSystem**: Notification management
- **ModerationAnalytics**: Analytics dashboard

### Hooks
- **useModerationSystem**: Main system state management

## 🔧 Configuration

### Database Tables Required
- `reports` - User reports
- `user_uploads` - Content uploads
- `moderation_logs` - Audit trail
- `moderation_rules` - Automation rules
- `appeals` - User appeals
- `notifications` - System notifications

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_OPENAI_API_KEY=your_openai_key
```

## 🎨 Styling

The system uses Tailwind CSS with a dark theme:
- **Primary**: Purple (#8B5CF6)
- **Background**: Slate (#0F172A)
- **Surface**: Slate-800 (#1E293B)
- **Text**: White/Slate-400
- **Accent**: Blue, Green, Red, Yellow

## 🔐 Access Control

The system includes role-based access control:
- **Admin**: Full access to all features
- **Moderator**: Access to moderation features
- **Staff**: Limited access to specific features

## 📈 Performance

- **Lazy Loading**: Components load on demand
- **Memoization**: Optimized re-renders
- **Caching**: Intelligent data caching
- **Real-time**: Live updates via Supabase

## 🐛 Troubleshooting

### Common Issues
1. **Missing Tables**: Ensure all required database tables exist
2. **Permission Errors**: Check user roles and permissions
3. **API Errors**: Verify API keys and endpoints
4. **Performance**: Check for memory leaks and optimize queries

### Debug Mode
Enable debug logging by setting `VITE_DEBUG=true` in your environment.

## 🔄 Updates

### Version History
- **v1.0.0**: Initial release with basic moderation
- **v2.0.0**: Enhanced with AI integration
- **v3.0.0**: Full feature migration and organization

### Migration Guide
When updating from the old moderation system:
1. Update import paths
2. Migrate database schema
3. Update user roles
4. Test all features

## 📝 Contributing

1. Follow the established folder structure
2. Use TypeScript for all components
3. Include proper error handling
4. Add comprehensive documentation
5. Test all features thoroughly

## 📄 License

This project is part of the Profiles After Dark application.