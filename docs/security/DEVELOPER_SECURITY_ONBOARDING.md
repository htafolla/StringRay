# Developer Security Onboarding - StrRay Framework

## Welcome to StrRay Security!

**Congratulations on joining the team!** This guide will help you get started with security practices in the StrRay Framework. Security is everyone's responsibility, and we're committed to the framework's "Security by Design" principle.

**Estimated completion time: 2 hours**

---

## 🎯 Quick Start Overview

By the end of this guide, you'll be able to:

- ✅ Understand StrRay's security architecture
- ✅ Write secure code following framework patterns
- ✅ Use security tools and run security checks
- ✅ Identify and fix common security issues
- ✅ Contribute securely to the codebase

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] StrRay Framework development environment set up
- [ ] Access to the project repository
- [ ] Node.js 18+ and npm installed
- [ ] Basic understanding of TypeScript/JavaScript

---

## 🚀 Step 1: Understand the Security Architecture (30 minutes)

### 1.1 Read Core Security Documentation

**Required Reading (15 minutes):**

1. **[Security Architecture Overview](../security/SECURITY_ARCHITECTURE.md)**
   - Understand the multi-layered security approach
   - Learn about plugin sandboxing and permission systems

2. **[Security Best Practices](./SECURITY_BEST_PRACTICES.md)**
   - Review authentication and authorization patterns
   - Study input validation and data sanitization examples

**Key Takeaways:**

- StrRay uses **defense in depth** with multiple security layers
- **Secure by default** - security features are enabled automatically
- **Zero-tolerance policy** for security issues

### 1.2 Explore the Codebase

**Hands-on Exploration (15 minutes):**

```bash
# Clone and set up the project
git clone <repository-url>
cd strray-project
npm install

# Explore security-related files
find src -name "*security*" -type f
find src -name "*auth*" -type f
```

**What to look for:**

- Security utilities in `src/security/`
- Authentication modules
- Input validation helpers
- Security middleware

---

## 🔧 Step 2: Set Up Your Development Environment (30 minutes)

### 2.1 Configure Security Tools

**Install Security Dependencies:**

```bash
# Install security-focused dev dependencies
npm install --save-dev eslint-plugin-security
npm install --save-dev @typescript-eslint/eslint-plugin

# Install StrRay security tools
npm install --save-dev strray-security-auditor
```

### 2.2 Configure Your IDE

**VS Code Security Extensions:**

- Install "ESLint" extension
- Install "TypeScript Importer" extension
- Install "Security Scanner" extension

**ESLint Configuration (.eslintrc.js):**

```javascript
module.exports = {
  extends: [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:security/recommended",
  ],
  plugins: ["@typescript-eslint", "security"],
  rules: {
    "security/detect-eval-with-expression": "error",
    "security/detect-non-literal-regexp": "error",
    "security/detect-unsafe-regex": "error",
  },
};
```

### 2.3 Run Your First Security Check

**Execute Security Audit:**

```bash
# Run comprehensive security audit
npm run security-audit

# Check for vulnerabilities
npm audit

# Run linting with security rules
npm run lint:security
```

**Expected Output:**

```
🔍 Security Auditor: Scanning 150 files...
✅ No critical security issues found
⚠️  2 medium-severity issues detected
📊 Security Score: 92/100
```

---

## 💻 Step 3: Learn Secure Coding Patterns (45 minutes)

### 3.1 Input Validation

**Practice Exercise 1: Create a Secure User Registration Function**

**Task:** Implement user registration with proper validation

**Starting Code:**

```typescript
// TODO: Implement secure user registration
function registerUser(userData: any) {
  // Add validation and security checks here
}
```

**Solution Pattern:**

```typescript
import { InputValidator } from "./security/input-validator";

class UserService {
  private validator = new InputValidator();

  async registerUser(userData: any) {
    // Step 1: Validate input structure
    const validation = await this.validator.validate(
      userData,
      "userRegistration",
    );

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Step 2: Sanitize input
    const sanitizedData = validation.sanitizedData!;

    // Step 3: Check for duplicates
    const existingUser = await this.checkExistingUser(sanitizedData.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Step 4: Hash password securely
    const hashedPassword = await this.hashPassword(sanitizedData.password);

    // Step 5: Create user with audit logging
    const user = await this.createUser({
      ...sanitizedData,
      password: hashedPassword,
    });

    // Step 6: Log security event
    await this.logSecurityEvent("user_registered", {
      userId: user.id,
      ipAddress: this.getClientIP(),
    });

    return { success: true, userId: user.id };
  }
}
```

**Test Your Implementation:**

```bash
# Run tests
npm test -- --grep "registerUser"

# Run security audit on your changes
npm run security-audit
```

### 3.2 Authentication & Authorization

**Practice Exercise 2: Implement Secure Login**

**Task:** Create a secure login function with proper session management

**Solution Pattern:**

```typescript
import { SessionManager } from "./security/session-manager";
import { SecurityLogger } from "./security/security-logger";

class AuthService {
  private sessionManager = new SessionManager();
  private securityLogger = new SecurityLogger();

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        throw new Error("Email and password required");
      }

      // Find user
      const user = await this.findUserByEmail(credentials.email);
      if (!user) {
        // Log failed attempt (don't reveal if user exists)
        await this.securityLogger.logSecurityEvent("auth_failure", {
          attemptedEmail: credentials.email,
          ipAddress: this.getClientIP(),
          reason: "user_not_found",
        });
        throw new Error("Invalid credentials");
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(
        credentials.password,
        user.passwordHash,
      );
      if (!isValidPassword) {
        await this.securityLogger.logSecurityEvent("auth_failure", {
          userId: user.id,
          ipAddress: this.getClientIP(),
          reason: "invalid_password",
        });
        throw new Error("Invalid credentials");
      }

      // Create session
      const sessionId = await this.sessionManager.createSession(user.id, {
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
      });

      // Log successful authentication
      await this.securityLogger.logSecurityEvent("auth_success", {
        userId: user.id,
        sessionId,
        ipAddress: this.getClientIP(),
      });

      return {
        success: true,
        sessionId,
        user: this.sanitizeUserForResponse(user),
      };
    } catch (error) {
      // Don't log sensitive information
      console.error("Login failed:", error.message);
      throw error;
    }
  }
}
```

### 3.3 Error Handling

**Practice Exercise 3: Secure Error Handling**

**Task:** Implement secure error handling that doesn't leak sensitive information

**Solution Pattern:**

```typescript
class SecureErrorHandler {
  handleError(error: Error, context: any): ApiResponse {
    // Log full error details internally
    console.error("Error occurred:", {
      message: error.message,
      stack: error.stack,
      context: this.sanitizeContext(context),
      timestamp: new Date().toISOString(),
      userId: context?.userId,
      sessionId: context?.sessionId,
    });

    // Determine error type and appropriate response
    if (error.message.includes("database")) {
      return {
        success: false,
        error: "Database temporarily unavailable",
        code: "DATABASE_ERROR",
      };
    }

    if (error.message.includes("permission")) {
      return {
        success: false,
        error: "Access denied",
        code: "ACCESS_DENIED",
      };
    }

    // Generic error for unknown issues
    return {
      success: false,
      error: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    };
  }

  private sanitizeContext(context: any): any {
    if (!context) return {};

    const sanitized = { ...context };
    // Remove sensitive information
    delete sanitized.password;
    delete sanitized.apiKey;
    delete sanitized.creditCard;
    delete sanitized.ssn;

    return sanitized;
  }
}

// Usage in API routes
app.post("/api/user", async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    const errorResponse = errorHandler.handleError(error, {
      userId: req.user?.id,
      sessionId: req.session?.id,
      endpoint: "/api/user",
      method: "POST",
    });
    res
      .status(errorResponse.code === "ACCESS_DENIED" ? 403 : 500)
      .json(errorResponse);
  }
});
```

---

## 🔍 Step 4: Run Security Audits (20 minutes)

### 4.1 Automated Security Scanning

**Run StrRay Security Auditor:**

```bash
# Comprehensive security audit
npm run security-audit

# Focus on specific files
npx strray-security-audit src/components/UserForm.ts

# Generate detailed report
npm run security-audit -- --report security-report.json
```

**Interpret Results:**

```
🔍 Security Auditor: Scanning 150 files...

❌ CRITICAL: Code injection vulnerability in src/utils/helpers.ts:45
   Pattern: eval(userInput)
   Recommendation: Use static code analysis and avoid dynamic code execution

⚠️  HIGH: Hardcoded secret detected in config/dev.json:12
   Pattern: apiKey: "sk-123456789"
   Recommendation: Move to environment variables

📊 Security Score: 78/100
   Issues: Critical: 1, High: 2, Medium: 3, Low: 1
```

### 4.2 Manual Security Review

**Security Checklist:**

- [ ] Input validation on all user inputs
- [ ] Authentication required for sensitive operations
- [ ] Passwords hashed with strong algorithms
- [ ] No sensitive data in logs or error messages
- [ ] HTTPS used for all communications
- [ ] Security headers implemented
- [ ] Dependencies are up to date
- [ ] No hardcoded secrets in code

---

## 🛠️ Step 5: Fix Common Security Issues (30 minutes)

### 5.1 Code Injection Vulnerabilities

**Problem:**

```typescript
// ❌ Vulnerable code
function executeUserCode(code: string) {
  eval(code); // Dangerous!
}
```

**Solution:**

```typescript
// ✅ Secure alternative
function executeUserCode(code: string) {
  // Validate allowed operations
  const allowedPatterns = [
    /^console\.log\(.*\)$/,
    /^const \w+ = \d+$/,
    /^const \w+ = "\w+"$/,
  ];

  const isAllowed = allowedPatterns.some((pattern) => pattern.test(code));
  if (!isAllowed) {
    throw new Error("Invalid code pattern");
  }

  // Use safe evaluation if necessary
  // Consider alternatives like a proper interpreter or restricted execution
}
```

### 5.2 Hardcoded Secrets

**Problem:**

```typescript
// ❌ Hardcoded secret
const API_KEY = "sk-1234567890abcdef";
```

**Solution:**

```typescript
// ✅ Environment variables
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error('API_KEY environment variable is required');
}

// .env file (not committed to git)
API_KEY=sk-1234567890abcdef
```

### 5.3 Insecure Direct Object References

**Problem:**

```typescript
// ❌ Insecure direct reference
app.get("/user/:id", (req, res) => {
  const user = getUserById(req.params.id); // Any user can access any ID
  res.json(user);
});
```

**Solution:**

```typescript
// ✅ Secure access control
app.get("/user/:id", async (req, res) => {
  const requestedUserId = req.params.id;
  const currentUserId = req.user.id;

  // Check if user can access this resource
  if (requestedUserId !== currentUserId && !req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied" });
  }

  const user = await getUserById(requestedUserId);
  res.json(user);
});
```

### 5.4 Cross-Site Scripting (XSS)

**Problem:**

```typescript
// ❌ XSS vulnerability
app.get("/search", (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Search results for: ${query}</h1>`); // Dangerous!
});
```

**Solution:**

```typescript
// ✅ XSS prevention
import { escape } from "html-escaper";

app.get("/search", (req, res) => {
  const query = req.query.q || "";
  const safeQuery = escape(query);
  res.send(`<h1>Search results for: ${safeQuery}</h1>`);
});
```

---

## 📝 Step 6: Create Your First Secure Feature (30 minutes)

### 6.1 Feature Requirements

**Task:** Implement a secure "Update User Profile" feature

**Requirements:**

- User can only update their own profile
- Input validation for all fields
- Secure password change functionality
- Audit logging for changes
- No sensitive data exposure

### 6.2 Implementation

```typescript
import { InputValidator } from "./security/input-validator";
import { AccessControl } from "./security/access-control";
import { SecurityLogger } from "./security/security-logger";

class UserProfileService {
  private validator = new InputValidator();
  private accessControl = new AccessControl();
  private securityLogger = new SecurityLogger();

  async updateProfile(
    userId: string,
    updates: any,
    currentUser: User,
  ): Promise<User> {
    // Step 1: Authorization check
    if (!(await this.accessControl.canUpdateProfile(currentUser, userId))) {
      await this.securityLogger.logSecurityEvent("access_denied", {
        action: "update_profile",
        requestedUserId: userId,
        currentUserId: currentUser.id,
      });
      throw new Error("Access denied");
    }

    // Step 2: Validate input
    const validation = await this.validator.validate(updates, "profileUpdate");
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Step 3: Handle password updates securely
    const sanitizedUpdates = validation.sanitizedData!;
    if (sanitizedUpdates.password) {
      // Verify current password first
      const isCurrentPasswordValid = await this.verifyCurrentPassword(
        currentUser.id,
        sanitizedUpdates.currentPassword,
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      sanitizedUpdates.passwordHash = await this.hashPassword(
        sanitizedUpdates.password,
      );
      delete sanitizedUpdates.password;
      delete sanitizedUpdates.currentPassword;
    }

    // Step 4: Update profile
    const updatedUser = await this.updateUserProfile(userId, sanitizedUpdates);

    // Step 5: Log the change
    await this.securityLogger.logSecurityEvent("profile_updated", {
      userId,
      updatedFields: Object.keys(sanitizedUpdates),
      updatedBy: currentUser.id,
    });

    return updatedUser;
  }

  private async canUpdateProfile(
    currentUser: User,
    targetUserId: string,
  ): Promise<boolean> {
    // Users can update their own profile
    if (currentUser.id === targetUserId) {
      return true;
    }

    // Admins can update any profile
    return currentUser.role === "admin";
  }
}

// API endpoint
app.put("/api/user/:id/profile", async (req, res) => {
  try {
    const result = await userProfileService.updateProfile(
      req.params.id,
      req.body,
      req.user,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    const errorResponse = errorHandler.handleError(error, {
      userId: req.user?.id,
      action: "update_profile",
      targetUserId: req.params.id,
    });
    res.status(403).json(errorResponse);
  }
});
```

### 6.3 Test Your Implementation

**Run Security Tests:**

```bash
# Test the new feature
npm test -- --grep "updateProfile"

# Security audit
npm run security-audit

# Manual testing
curl -X PUT http://localhost:3000/api/user/123/profile \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'
```

---

## 🎓 Step 7: Learn from Code Reviews (20 minutes)

### 7.1 Review the Security Checklist

**Use the [Security Code Review Checklist](./SECURITY_CODE_REVIEW_CHECKLIST.md)** to review your code:

- [ ] All user inputs validated
- [ ] Authentication checks in place
- [ ] Authorization implemented
- [ ] Secure error handling
- [ ] No hardcoded secrets
- [ ] Dependencies updated

### 7.2 Common Review Feedback

**Typical Security Issues Found:**

1. **Missing Input Validation:** "Add validation for email format"
2. **Insecure Direct References:** "Check ownership before allowing access"
3. **Information Disclosure:** "Remove stack traces from error responses"
4. **Weak Password Requirements:** "Enforce minimum password complexity"

### 7.3 Address Review Comments

**Example Fixes:**

```typescript
// Before review
app.get("/user/:id", (req, res) => {
  const user = getUserById(req.params.id);
  res.json(user);
});

// After review
app.get("/user/:id", async (req, res) => {
  // Validate input
  const userId = req.params.id;
  if (!/^\d+$/.test(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  // Check authorization
  if (req.user.id !== userId && !req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied" });
  }

  const user = await getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Sanitize output
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  res.json(safeUser);
});
```

---

## 📚 Step 8: Additional Resources (10 minutes)

### Documentation to Read Next

1. **[Incident Response Procedures](./INCIDENT_RESPONSE_PROCEDURES.md)**
   - Learn how to handle security incidents

2. **[Security Architecture](../security/SECURITY_ARCHITECTURE.md)**
   - Deep dive into framework security components

3. **[StrRay Framework README](../../README.md)**
   - Understand the broader framework context

### Useful Tools & Commands

```bash
# Security scanning
npm run security-audit          # Comprehensive security audit
npm audit                       # Dependency vulnerability check
npm audit fix                   # Fix known vulnerabilities

# Code quality
npm run lint                    # Code linting
npm run type-check             # TypeScript validation
npm test                       # Run test suite

# Development
npm run dev                     # Development server with hot reload
```

### Getting Help

- **Security Questions:** Ask in #security Slack channel
- **Code Reviews:** Request security-focused review for sensitive changes
- **Incidents:** Use incident response procedures for security events
- **Training:** Attend monthly security awareness sessions

---

## ✅ Completion Checklist

After completing this guide, you should be able to:

- [ ] Understand StrRay's security architecture and principles
- [ ] Implement secure authentication and authorization
- [ ] Write input validation and data sanitization code
- [ ] Use security tools and run audits
- [ ] Fix common security vulnerabilities
- [ ] Follow secure coding patterns
- [ ] Handle errors securely
- [ ] Contribute securely to the codebase

**🎉 Congratulations!** You've completed the StrRay Developer Security Onboarding. You now have the knowledge and tools to contribute securely to our framework.

**Remember:** Security is an ongoing process. Stay vigilant, keep learning, and always prioritize security in your development work.

---

## 🚨 Security Contacts

**For Security Issues:**

- **Immediate Threats:** Call security hotline: +1-XXX-XXX-XXXX
- **Non-Urgent:** Email security@company.com
- **Code Reviews:** Tag @security-team in pull requests
- **General Questions:** security Slack channel

**Remember:** When in doubt, ask the security team. It's always better to be safe than sorry!
