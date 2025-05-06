# Linkuy Connect - Mobile App

A comprehensive mobile application for monitoring and caring for older adults, developed with Expo, React Native, and TypeScript. The app features advanced fall detection, emergency alerts, real-time location tracking, and push notifications, with a strong focus on accessibility and user experience.

## Features

- **Emergency Response System**

  - One-tap emergency alerts to caregivers
  - Direct 911 emergency calling
  - Real-time location sharing during emergencies

- **Fall Detection**

  - Advanced accelerometer-based fall detection
  - Background monitoring
  - Automatic alert system for detected falls
  - Post-fall inactivity monitoring

- **Location Tracking**

  - Real-time location monitoring
  - Background location updates
  - Geofencing capabilities
  - Location history logging

- **Accessibility Features**
  - Full VoiceOver and TalkBack support
  - High contrast mode
  - Dynamic text sizing
  - Screen reader optimizations
  - Keyboard navigation support
  - Gesture-based interactions

## Technical Stack

- **Framework**: Expo (Managed Workflow)
- **Language**: TypeScript
- **UI Components**: React Native
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: React Context + useReducer
- **Navigation**: Expo Router
- **Location Services**: expo-location
- **Background Tasks**: expo-task-manager
- **Notifications**: expo-notifications
- **Storage**: @react-native-async-storage/async-storage
- **Validation**: Zod
- **Icons**: @expo/vector-icons

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- Physical device for testing (recommended)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/nicolasmoreira/linkuy_connect_app.git
   cd linkuy_connect_app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory with the following variables:
   ```
   EXPO_PUBLIC_API_URL=your_api_url
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

## Development

1. **Start the development server:**

   ```bash
   npx expo start
   ```

2. **Run on specific platforms:**
   - iOS: Press `i` in the terminal or run `npx expo run:ios`
   - Android: Press `a` in the terminal or run `npx expo run:android`
   - Web: Press `w` in the terminal or run `npx expo start:web`

## Testing

1. **Unit Tests:**

   ```bash
   npm test
   ```

2. **E2E Tests:**
   ```bash
   npm run e2e
   ```

## Building for Production

1. **Create a production build:**

   ```bash
   # For iOS
   npx expo build:ios

   # For Android
   npx expo build:android
   ```

2. **Publish OTA updates:**
   ```bash
   npx expo publish
   ```

## Accessibility Guidelines

The app follows WCAG 2.1 guidelines and implements the following accessibility features:

- **Screen Reader Support**

  - Descriptive labels for all interactive elements
  - Proper heading hierarchy
  - Meaningful alt text for images
  - Clear navigation structure

- **Visual Accessibility**

  - High contrast mode support
  - Dynamic text sizing
  - Sufficient touch target sizes (minimum 44x44 points)
  - Clear visual feedback for interactions

- **Keyboard Navigation**
  - Full keyboard support
  - Logical tab order
  - Visible focus indicators
  - Keyboard shortcuts for common actions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Expo team for the amazing framework
- React Native community for the extensive ecosystem
- All contributors who have helped shape this project
