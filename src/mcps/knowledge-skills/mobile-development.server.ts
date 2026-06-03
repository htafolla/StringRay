/**
 * 0xRay Mobile Development MCP Server
 *
 * Knowledge skill for mobile app development including iOS, Android,
 * React Native, Flutter, and mobile performance optimization
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as path from "path";
import { fileURLToPath } from "url";

interface IOSBlueprint {
  projectName: string;
  swiftVersion: string;
  architecture: "mvvm" | "mvi" | "vip";
  frameworks: string[];
  dependencies: string[];
  files: { path: string; content: string }[];
}

interface AndroidBlueprint {
  projectName: string;
  kotlinVersion: string;
  composeVersion: string;
  architecture: "mvvm" | "mvi" | "clean";
  dependencies: string[];
  buildFiles: { path: string; content: string }[];
}

interface ReactNativeBlueprint {
  projectName: string;
  expo: boolean;
  navigation: string;
  stateManagement: string;
  typescript: boolean;
  files: { path: string; content: string }[];
}

interface FlutterBlueprint {
  projectName: string;
  flutterVersion: string;
  stateManagement: string;
  architecture: string;
  packages: string[];
  files: { path: string; content: string }[];
}

interface MobilePerformanceProfile {
  appLaunchTime: number;
  memoryUsage: number;
  batteryImpact: "low" | "medium" | "high";
  networkEfficiency: number;
  uiFrameRate: number;
  recommendations: string[];
}

interface MobilePerformanceMetrics {
  appLaunchTime?: number;
  memoryUsage?: number;
  batteryDrain?: number;
  networkRequests?: number;
  uiFrameRate?: number;
}

interface IOSBlueprintArgs {
  projectName: string;
  language?: string;
  architecture?: string;
  features?: string[];
}

interface AndroidBlueprintArgs {
  projectName: string;
  uiFramework?: string;
  architecture?: string;
  features?: string[];
}

interface ReactNativeBlueprintArgs {
  projectName: string;
  expo?: boolean;
  navigation?: string;
  stateManagement?: string;
  typescript?: boolean;
}

interface FlutterBlueprintArgs {
  projectName: string;
  stateManagement?: string;
  architecture?: string;
}

interface MobilePerformanceArgs {
  platform: string;
  metrics?: MobilePerformanceMetrics;
}

interface AppStoreMetadataArgs {
  appName: string;
  platform: string;
  category?: string;
  features?: string[];
}

class StringRayMobileDevelopmentServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "mobile-development", version: "1.22.61",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "ios_blueprint",
            description:
              "Generate iOS project structure with Swift/SwiftUI or UIKit",
            inputSchema: {
              type: "object",
              properties: {
                projectName: {
                  type: "string",
                  description: "Name of the iOS project",
                },
                language: {
                  type: "string",
                  enum: ["swift", "swiftui", "uikit"],
                  description: "Programming language/framework",
                },
                architecture: {
                  type: "string",
                  enum: ["mvvm", "mvi", "vip", "clean"],
                  description: "Architecture pattern",
                },
                features: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Features to include (auth, database, notifications, etc.)",
                },
              },
              required: ["projectName", "language"],
            },
          },
          {
            name: "android_blueprint",
            description:
              "Generate Android project structure with Kotlin/Jetpack Compose",
            inputSchema: {
              type: "object",
              properties: {
                projectName: {
                  type: "string",
                  description: "Name of the Android project",
                },
                uiFramework: {
                  type: "string",
                  enum: ["compose", "xml", "hybrid"],
                  description: "UI framework to use",
                },
                architecture: {
                  type: "string",
                  enum: ["mvvm", "mvi", "clean"],
                  description: "Architecture pattern",
                },
                features: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Features to include (auth, database, notifications, etc.)",
                },
              },
              required: ["projectName", "uiFramework"],
            },
          },
          {
            name: "react_native_boilerplate",
            description: "Generate React Native project with Expo or CLI setup",
            inputSchema: {
              type: "object",
              properties: {
                projectName: {
                  type: "string",
                  description: "Name of the React Native project",
                },
                expo: {
                  type: "boolean",
                  description: "Use Expo for development",
                  default: true,
                },
                navigation: {
                  type: "string",
                  enum: ["react-navigation", "wix", "native-stack"],
                  description: "Navigation library",
                },
                stateManagement: {
                  type: "string",
                  enum: ["redux", "zustand", "context", "recoil", "mobx"],
                  description: "State management solution",
                },
                typescript: {
                  type: "boolean",
                  description: "Use TypeScript",
                  default: true,
                },
              },
              required: ["projectName"],
            },
          },
          {
            name: "flutter_boilerplate",
            description: "Generate Flutter project with best practices",
            inputSchema: {
              type: "object",
              properties: {
                projectName: {
                  type: "string",
                  description: "Name of the Flutter project",
                },
                stateManagement: {
                  type: "string",
                  enum: ["provider", "riverpod", "bloc", "getx", "setstate"],
                  description: "State management solution",
                },
                architecture: {
                  type: "string",
                  enum: ["clean", "feature-first", "layered"],
                  description: "Project architecture",
                },
              },
              required: ["projectName"],
            },
          },
          {
            name: "mobile_performance_profile",
            description:
              "Analyze mobile app performance and provide optimization recommendations",
            inputSchema: {
              type: "object",
              properties: {
                platform: {
                  type: "string",
                  enum: ["ios", "android", "react-native", "flutter"],
                  description: "Mobile platform",
                },
                metrics: {
                  type: "object",
                  properties: {
                    appLaunchTime: { type: "number" },
                    memoryUsage: { type: "number" },
                    batteryDrain: { type: "number" },
                    networkRequests: { type: "number" },
                    uiFrameRate: { type: "number" },
                  },
                  description: "Current performance metrics",
                },
              },
              required: ["platform"],
            },
          },
          {
            name: "app_store_metadata",
            description:
              "Generate app store listing metadata for iOS and Android",
            inputSchema: {
              type: "object",
              properties: {
                appName: {
                  type: "string",
                  description: "Name of the app",
                },
                platform: {
                  type: "string",
                  enum: ["ios", "android", "both"],
                  description: "Target platform(s)",
                },
                category: {
                  type: "string",
                  description: "App category",
                },
                features: {
                  type: "array",
                  items: { type: "string" },
                  description: "Key features to highlight",
                },
              },
              required: ["appName", "platform"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "ios_blueprint":
          return await this.generateIOSBlueprint(args ?? {});
        case "android_blueprint":
          return await this.generateAndroidBlueprint(args ?? {});
        case "react_native_boilerplate":
          return await this.generateReactNativeBlueprint(args ?? {});
        case "flutter_boilerplate":
          return await this.generateFlutterBlueprint(args ?? {});
        case "mobile_performance_profile":
          return await this.analyzeMobilePerformance(args ?? {});
        case "app_store_metadata":
          return await this.generateAppStoreMetadata(args ?? {});
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async generateIOSBlueprint(args: Record<string, unknown>) {
    const { projectName, language = "swiftui", architecture = "mvvm", features = [] } = args as unknown as IOSBlueprintArgs;

    const blueprint: IOSBlueprint = {
      projectName,
      swiftVersion: "5.9",
      architecture: architecture as IOSBlueprint["architecture"],
      frameworks: ["Foundation", "SwiftUI", "Combine"],
      dependencies: [],
      files: [
        {
          path: `${projectName}/App/${projectName}App.swift`,
          content: `@import SwiftUI

@main
struct ${projectName}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}`,
        },
        {
          path: `${projectName}/Views/ContentView.swift`,
          content: `import SwiftUI

struct ContentView: View {
    var body: some View {
        Text("Hello, ${projectName}!")
            .padding()
    }
}

#Preview {
    ContentView()
}`,
        },
      ],
    };

    // Add features
    if (features.includes("auth")) {
      blueprint.dependencies.push("Firebase/Auth");
      blueprint.files.push({
        path: `${projectName}/Services/AuthService.swift`,
        content: `import Foundation
import FirebaseAuth

class AuthService: ObservableObject {
    @Published var isAuthenticated = false
    
    func signIn(email: String, password: String) async throws {
        // Implementation
    }
}`,
      });
    }

    if (features.includes("database")) {
      blueprint.dependencies.push("Firebase/Firestore");
    }

    if (features.includes("notifications")) {
      blueprint.dependencies.push("UserNotifications");
    }

    return {
      content: [
        {
          type: "text",
          text: `iOS Blueprint generated for ${projectName}`,
        },
        {
          type: "text",
          text: JSON.stringify(blueprint, null, 2),
        },
      ],
    };
  }

  private async generateAndroidBlueprint(args: Record<string, unknown>) {
    const { projectName, uiFramework = "compose", architecture = "mvvm", features = [] } = args as unknown as AndroidBlueprintArgs;

    const blueprint: AndroidBlueprint = {
      projectName,
      kotlinVersion: "1.9.22",
      composeVersion: "1.5.8",
      architecture: architecture as AndroidBlueprint["architecture"],
      dependencies: [
        "androidx.core:core-ktx",
        "androidx.lifecycle:lifecycle-runtime-ktx",
        "androidx.activity:activity-compose",
      ],
      buildFiles: [
        {
          path: "app/build.gradle.kts",
          content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android") id("org.jetbrains.kotlin.plugin.compose") version "2.0.0"
}

android {
    namespace = "${projectName.toLowerCase()}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${projectName.toLowerCase()}"
        minSdk = 24
        targetSdk = 34
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
}`,
        },
      ],
    };

    return {
      content: [
        {
          type: "text",
          text: `Android Blueprint generated for ${projectName}`,
        },
        {
          type: "text",
          text: JSON.stringify(blueprint, null, 2),
        },
      ],
    };
  }

  private async generateReactNativeBlueprint(args: Record<string, unknown>) {
    const { projectName, expo = true, navigation = "react-navigation", stateManagement = "zustand", typescript = true } = args as unknown as ReactNativeBlueprintArgs;

    const blueprint: ReactNativeBlueprint = {
      projectName,
      expo,
      navigation,
      stateManagement,
      typescript,
      files: [
        {
          path: "App.tsx",
          content: `import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Welcome to ${projectName}!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});`,
        },
      ],
    };

    return {
      content: [
        {
          type: "text",
          text: `React Native Blueprint generated for ${projectName}`,
        },
        {
          type: "text",
          text: JSON.stringify(blueprint, null, 2),
        },
      ],
    };
  }

  private async generateFlutterBlueprint(args: Record<string, unknown>) {
    const { projectName, stateManagement = "provider", architecture = "clean" } = args as unknown as FlutterBlueprintArgs;

    const blueprint: FlutterBlueprint = {
      projectName,
      flutterVersion: "3.16.0",
      stateManagement,
      architecture,
      packages: ["flutter", "provider"],
      files: [
        {
          path: "lib/main.dart",
          content: `import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${projectName}',
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${projectName}')),
      body: const Center(child: Text('Welcome!')),
    );
  }
}`,
        },
      ],
    };

    return {
      content: [
        {
          type: "text",
          text: `Flutter Blueprint generated for ${projectName}`,
        },
        {
          type: "text",
          text: JSON.stringify(blueprint, null, 2),
        },
      ],
    };
  }

  private async analyzeMobilePerformance(args: Record<string, unknown>) {
    const { platform, metrics = {} } = args as unknown as MobilePerformanceArgs;

    const profile: MobilePerformanceProfile = {
      appLaunchTime: metrics.appLaunchTime || 2000,
      memoryUsage: metrics.memoryUsage || 120,
      batteryImpact: "medium",
      networkEfficiency: 0.8,
      uiFrameRate: metrics.uiFrameRate || 60,
      recommendations: [],
    };

    // Generate recommendations based on metrics
    if (profile.appLaunchTime > 2000) {
      profile.recommendations.push(
        "App launch time exceeds 2 seconds. Consider lazy loading resources and optimizing initialization.",
      );
    }

    if (profile.memoryUsage > 150) {
      profile.recommendations.push(
        "Memory usage is high. Review memory leaks and implement image caching.",
      );
    }

    if (profile.uiFrameRate < 55) {
      profile.recommendations.push(
        "UI frame rate below 60fps. Check for heavy computations on main thread.",
      );
    }

    return {
      content: [
        {
          type: "text",
          text: `Mobile Performance Profile for ${platform}`,
        },
        {
          type: "text",
          text: JSON.stringify(profile, null, 2),
        },
      ],
    };
  }

  private async generateAppStoreMetadata(args: Record<string, unknown>) {
    const { appName, platform, category, features = [] } = args as unknown as AppStoreMetadataArgs;

    const metadata = {
      appName,
      platforms:
        platform === "both" ? ["iOS", "Android"] : [platform.toUpperCase()],
      category: category || "Utilities",
      title: appName,
      description:
        features.length > 0
          ? `Features include: ${features.slice(0, 5).join(", ")}. Download now!`
          : "A mobile app built with 0xRay.",
      keywords: features.join(", "),
      screenshots: {
        ios: ["screenshot1.png", "screenshot2.png"],
        android: ["screenshot1.png", "screenshot2.png"],
      },
    };

    return {
      content: [
        {
          type: "text",
          text: `App Store Metadata generated for ${appName}`,
        },
        {
          type: "text",
          text: JSON.stringify(metadata, null, 2),
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const entryPoint = path.resolve(process.argv[1] ?? "");
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  const server = new StringRayMobileDevelopmentServer();
  server.start().catch(() => {});
}

export { StringRayMobileDevelopmentServer };
