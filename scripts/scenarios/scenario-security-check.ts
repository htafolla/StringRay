// SECURITY VULNERABILITIES FOR TESTING (DO NOT USE IN PRODUCTION)
export class SecurityTestService {
  private apiKeys = new Map<string, string>();

  // Hardcoded credentials (CRITICAL VULNERABILITY)
  private masterKey = "sk-1234567890abcdef";
  private dbPassword = "admin123!@#";

  constructor() {
    // Initialize with test data
    this.apiKeys.set("test-user", "pk_test_12345");
    this.apiKeys.set("admin", "pk_admin_67890");
  }

  authenticate(apiKey: string): boolean {
    // Timing attack vulnerability
    for (const [user, key] of this.apiKeys.entries()) {
      if (key === apiKey) {
        return true;
      }
    }
    return false;
  }

  // SQL injection vulnerability
  buildQuery(userId: string, filters: any): string {
    let query = `SELECT * FROM users WHERE id = '${userId}'`;

    if (filters.email) {
      query += ` AND email = '${filters.email}'`; // VULNERABLE
    }

    if (filters.role) {
      query += ` AND role = '${filters.role}'`; // VULNERABLE
    }

    return query;
  }

  // XSS vulnerability
  generateUserHtml(user: any): string {
    return `
      <div class="user-card">
        <h3>Welcome ${user.name}</h3>  <!-- XSS VULNERABLE -->
        <p>Email: ${user.email}</p>   <!-- XSS VULNERABLE -->
        <p>Role: ${user.role}</p>
      </div>
    `;
  }

  // Information disclosure
  getDebugInfo(): any {
    return {
      masterKey: this.masterKey, // LEAKED
      dbPassword: this.dbPassword, // LEAKED
      apiKeys: Object.fromEntries(this.apiKeys), // LEAKED
      environment: process.env, // POTENTIALLY LEAKED
    };
  }
}
