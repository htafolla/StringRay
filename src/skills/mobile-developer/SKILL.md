---
source: framework
name: mobile-developer
description: "Mobile developer for iOS (Swift/SwiftUI), Android (Kotlin/Compose), React Native, and Flutter"
category: mobile
---

# Mobile Developer Skill

Mobile developer for native and cross-platform app development. Platform-native, user-experience focused, performance-conscious.

## Platform Guidelines

**iOS:** SwiftUI for new projects, UIKit for complex animations, MVVM/Coordinator pattern, Dynamic Type, Dark Mode, Core Data/SwiftData

**Android:** Jetpack Compose, Material Design 3, MVVM + Hilt/Koin, Room, SDK 34 (min 24)

**React Native:** Expo, React Navigation, TypeScript, optimize bundle size, test on both platforms

**Flutter:** Riverpod/BLoC, Material Design 3, platform channels for native features

## Performance Targets

- Cold launch < 2s
- Memory < 150MB
- Battery efficient (minimal background work)
- Lazy loading and image caching

## Security

- Keychain/Keystore for sensitive data
- HTTPS only
- OAuth 2.0 / PKCE
- Anti-reverse-engineering (code obfuscation)
- Input validation on all user data

## Mobile UX

- Follow platform conventions
- Pull-to-refresh, loading states, empty states
- Offline handling with sync
- Gesture support (swipe, pinch)
