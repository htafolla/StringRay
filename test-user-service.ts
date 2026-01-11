export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'moderator';
}

export class UserService {
  private users: Map<string, User> = new Map();

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = { id, ...userData };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const existing = this.users.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

// Add authentication logic (should trigger security-auditor)
export interface AuthToken {
  userId: string;
  token: string;
  expiresAt: Date;
  permissions: string[];
}

export class AuthService {
  private tokens: Map<string, AuthToken> = new Map();
  
  async generateToken(userId: string, permissions: string[]): Promise<AuthToken> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const authToken: AuthToken = {
      userId,
      token,
      expiresAt,
      permissions
    };
    
    this.tokens.set(token, authToken);
    return authToken;
  }
  
  async validateToken(token: string): Promise<AuthToken | null> {
    const authToken = this.tokens.get(token);
    if (!authToken) return null;
    
    if (authToken.expiresAt < new Date()) {
      this.tokens.delete(token);
      return null;
    }
    
    return authToken;
  }
  
  async revokeToken(token: string): Promise<boolean> {
    return this.tokens.delete(token);
  }
  
  // Add some complex business logic to trigger architect interest
  async authorizeAction(userId: string, action: string, resource: string): Promise<boolean> {
    // Complex permission checking logic
    const user = await userService.getUser(userId);
    if (!user) return false;
    
    // Role-based access control
    const rolePermissions = {
      'admin': ['*'],
      'moderator': ['read', 'write', 'moderate'],
      'user': ['read', 'write']
    };
    
    const userPermissions = rolePermissions[user.role] || [];
    
    // Resource-specific permissions
    if (resource.startsWith('/admin/') && !userPermissions.includes('*')) {
      return false;
    }
    
    return userPermissions.includes(action) || userPermissions.includes('*');
  }
}
