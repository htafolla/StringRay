// Complex user management service with authentication
export interface UserProfile {
  id: string;
  email: string;
  profile: {
    name: string;
    avatar?: string;
    preferences: Record<string, any>;
  };
  security: {
    passwordHash: string;
    twoFactorEnabled: boolean;
    lastLogin: Date;
    failedAttempts: number;
  };
  permissions: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
  };
}

export class UserManagementService {
  private users = new Map<string, UserProfile>();
  private sessions = new Map<string, { userId: string; expires: Date }>();

  async createUser(email: string, password: string, profile: any): Promise<UserProfile> {
    // Complex validation and creation logic
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    const existing = Array.from(this.users.values()).find(u => u.email === email);
    if (existing) {
      throw new Error('User already exists');
    }

    const user: UserProfile = {
      id: this.generateId(),
      email,
      profile: {
        ...profile,
        preferences: profile.preferences || {}
      },
      security: {
        passwordHash: await this.hashPassword(password),
        twoFactorEnabled: false,
        lastLogin: new Date(),
        failedAttempts: 0
      },
      permissions: ['user'],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      }
    };

    this.users.set(user.id, user);
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<{ user: UserProfile; token: string } | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) return null;

    const isValid = await this.verifyPassword(password, user.security.passwordHash);
    if (!isValid) {
      user.security.failedAttempts++;
      return null;
    }

    // Reset failed attempts on successful login
    user.security.failedAttempts = 0;
    user.security.lastLogin = new Date();

    const token = this.generateSessionToken();
    this.sessions.set(token, { 
      userId: user.id, 
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) 
    });

    return { user, token };
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private async hashPassword(password: string): Promise<string> {
    // Simulate password hashing
    return `hashed_${password}_salt`;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return hash === `hashed_${password}_salt`;
  }

  private generateSessionToken(): string {
    return crypto.randomUUID();
  }
}
