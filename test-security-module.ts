// WARNING: This file contains intentional security vulnerabilities for testing
export class SecurityTest {
  private hardcodedPassword = "admin123"; // Security vulnerability
  
  async authenticate(username: string, password: string): Promise<boolean> {
    // SQL injection vulnerability (simulated)
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    console.log("Executing query:", query); // Information disclosure
    
    // Hardcoded credentials check
    if (username === "admin" && password === this.hardcodedPassword) {
      return true;
    }
    
    return false;
  }
  
  // XSS vulnerability
  generateWelcomeMessage(username: string): string {
    return `<div>Welcome ${username}!</div>`; // XSS vulnerability
  }
  
  // Insecure random number generation
  generateSessionId(): string {
    return Math.random().toString(36); // Not cryptographically secure
  }
}
