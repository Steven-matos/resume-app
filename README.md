# Resume Job Matcher

A modern React Native mobile application that allows users to upload their resumes and get matched with relevant job opportunities. The app provides job recommendations and resume improvement suggestions based on uploaded resumes.

## Features

### 🚀 Core Functionality
- **Resume Upload**: Upload PDF, DOC, or DOCX files (max 5MB)
- **Job Matching**: AI-powered job matching based on resume content
- **Job Search**: Browse and search for specific job opportunities
- **Job Details**: Detailed job information with application functionality
- **Profile Management**: User profile and application tracking

### 📱 Modern UI/UX
- Clean, modern design with iOS-style components
- Smooth navigation with bottom tabs and stack navigation
- Responsive design that works on all screen sizes
- Intuitive file upload interface with drag & drop support

### 🎯 Key Screens
1. **Home Screen**: Welcome dashboard with quick actions
2. **Upload Resume**: Main upload interface with job title input
3. **Jobs Screen**: Browse matched job opportunities
4. **Search Screen**: Advanced job search with filters
5. **Profile Screen**: User profile and settings
6. **Job Details**: Comprehensive job information and application

## Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation between screens
- **Expo Document Picker**: File upload functionality
- **React Native Safe Area Context**: Safe area handling
- **Expo Vector Icons**: Icon library
- **JSearch API**: Real-time job data integration
- **Axios**: HTTP client for API calls

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd resume-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key (Optional)**
   
   For real job data, add your JSearch API key to environment variables:
   
   ```bash
   # Create .env file
   echo "EXPO_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key" > .env
   ```
   
   **JSearch API**: Get key from [RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/)
   
   *Note: If no API key is provided, the app will use mock data for development*

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
resume-app/
├── src/
│   ├── screens/           # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── UploadResumeScreen.tsx
│   │   ├── JobsScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── JobDetailsScreen.tsx
│   ├── components/        # Reusable components
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── assets/               # Images and static assets
├── App.tsx              # Main app component
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## Key Components

### UploadResumeScreen
- Handles resume file upload with validation
- Supports PDF, DOC, DOCX formats
- File size validation (5MB limit)
- Job title input for better matching
- Modern upload interface with visual feedback

### JobsScreen
- Displays matched job opportunities
- Filter options (All, Recent, High Match)
- Job cards with match percentage
- Quick access to job details

### SearchScreen
- Advanced job search functionality
- Category filters
- Recent searches
- Popular search suggestions

## API Integration

The app integrates with JSearch API for real-time job data:

### **RapidAPI JSearch** (Primary)
- **Coverage**: Global job listings from multiple sources
- **Features**: Comprehensive job data, real-time updates, salary info
- **Setup**: Get API key from [RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/)

### **Smart Caching System**
- **Purpose**: Optimize API usage and reduce request count
- **Features**: 24-hour cache, request tracking, automatic cleanup
- **Usage**: Caches job searches to minimize API calls

### **Mock Data** (Development)
- **Purpose**: Development and testing without API keys
- **Features**: Realistic job data for app testing
- **Usage**: Automatically used when no API key is configured

### **Resume Analysis**
- **Skills Extraction**: Identifies key skills from uploaded resumes
- **Job Matching**: Calculates match percentages based on skills
- **Recommendations**: Provides resume improvement suggestions

## API Optimization

The app is designed to maximize your 200 monthly API requests:

### **Smart Caching**
- Job searches are cached for 24 hours
- Automatic cache cleanup prevents storage overflow
- Cache hit rate tracking and statistics

### **Request Management**
- App-wide monthly request limit tracking (200 requests/month)
- Automatic fallback to mock data when limit reached
- Admin-only monitoring in development mode

### **Optimization Tips**
- Use specific job titles for better cache efficiency
- Add location parameters to reduce duplicate searches
- Cache automatically handles repeated searches
- Smart fallback ensures app always works

## Admin Monitoring

### **Development Mode Only**
- Admin debug panel accessible via 🔧 button (development only)
- Shows app-wide API usage statistics
- Cache management tools
- Request limit monitoring

### **Production Mode**
- No user-facing API statistics
- Transparent caching and fallback
- Users see consistent experience regardless of API limits

## Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add comprehensive JSDoc comments
- Follow DRY principles

### Navigation
- Use React Navigation for all navigation
- Implement proper type safety for navigation
- Handle deep linking for job details

### State Management
- Use React hooks for local state
- Consider Context API for global state
- Implement proper loading states

## Testing

### Running Tests
```bash
npm test
```

### Testing Strategy
- Unit tests for utility functions
- Component testing with React Native Testing Library
- Integration tests for navigation flows
- E2E tests for critical user journeys

## Deployment

### Expo Build
```bash
expo build:ios
expo build:android
```

### App Store Deployment
1. Configure app.json with proper metadata
2. Build production version
3. Submit to App Store/Google Play

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

Built with ❤️ using React Native and Expo 