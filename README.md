# Linkuy Connect - Mobile App

Mobile application for monitoring and caring for older adults, developed with Expo, React Native, and TypeScript. Features include fall detection, emergency alerts, activity logging, and push notifications.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Available Scripts](#available-scripts)
- [Dependencies](#dependencies)
- [Testing](#testing)
- [OTA Deployment](#ota-deployment)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/nicolasmoreira/linkuy_connect_app.git
   cd linkuy_connect_app
   ```

2. **Install dependencies:**

   ```bash
   npm install -g expo-cli
   npm install
   ```

## Usage

Start the development server:

```bash
expo start
```

Run on a physical device or emulator:

- **iOS:** Press `i` to open in the iOS simulator (macOS only).
- **Android:** Press `a` to open in the Android emulator, or scan the QR code with Expo Go.

## Available Scripts

- `expo start`: Starts the development server.
- `expo build`: Builds the project for production.
- `expo eject`: Ejects to a bare React Native project.
- `npm test`: Runs unit tests with Jest.

## Dependencies

- **expo**: Framework for cross-platform mobile development.
- **react-navigation**: App navigation and routing.
- **expo-location**: Access to device location.
- **expo-notifications**: Push and local notifications.
- **nativewind**: Tailwind CSS utilities for React Native.
- **@expo/vector-icons**: Vector icons.
- **react-native-safe-area-context**: Safe area handling.
- **expo-sensors**: Access to device sensors like accelerometer.
- **expo-task-manager**: Background tasks.
- **expo-image**: Image optimization and loading.
- **zod**: Data validation and schemas.
- **jest**: Unit testing.

## Testing

Run unit tests:

```bash
npm test
```

For integration and end-to-end tests, consider using Detox or Expo E2E tools.

## OTA Deployment (Over-the-Air)

To publish OTA updates with Expo:

```bash
expo publish
```

For production builds:

```bash
expo build:android
expo build:ios
```

See the [official Expo documentation](https://docs.expo.dev/distribution/introduction/) for deployment and publishing details.

## Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to your branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

Contributions are welcome!

## License

This project is licensed under the Apache License, Version 2.0. See the LICENSE file for details.
