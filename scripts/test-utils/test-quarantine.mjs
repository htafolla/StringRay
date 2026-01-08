#!/usr/bin/env node

/**
 * Test Quarantine System - Surgical isolation for problematic tests
 * 
 * Addresses key challenge: disable problematic tests in a suite, validate others, 
 * then isolate and fix problematic tests
 */

import fs from 'fs';
import path from 'path';

class TestQuarantine {
  constructor() {
    this.quarantineDir = 'src/__tests__/quarantine';
    this.quarantineList = 'scripts/test-utils/quarantined-tests.json';
  }

  /**
   * Initialize quarantine system
   */
  init() {
    if (!fs.existsSync(this.quarantineDir)) {
      fs.mkdirSync(this.quarantineDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.quarantineList)) {
      this.saveQuarantineList([]);
    }
  }

  /**
   * Quarantine a problematic test file
   */
  quarantine(testFile, reason = 'Unknown issue') {
    this.init();
    
    const fileName = path.basename(testFile);
    const quarantinedPath = path.join(this.quarantineDir, fileName);
    
    // Move file to quarantine
    if (fs.existsSync(testFile)) {
      fs.renameSync(testFile, quarantinedPath);
      console.log(`🚨 Quarantined: ${fileName} (${reason})`);
    }
    
    // Update quarantine list
    const list = this.loadQuarantineList();
    list.push({
      originalPath: testFile,
      quarantinedPath,
      fileName,
      reason,
      quarantinedAt: new Date().toISOString()
    });
    
    this.saveQuarantineList(list);
  }

  /**
   * Release a test from quarantine
   */
  release(fileName) {
    const list = this.loadQuarantineList();
    const entry = list.find(item => item.fileName === fileName);
    
    if (!entry) {
      console.error(`❌ Test ${fileName} not found in quarantine`);
      return false;
    }
    
    // Move file back
    if (fs.existsSync(entry.quarantinedPath)) {
      fs.renameSync(entry.quarantinedPath, entry.originalPath);
      console.log(`✅ Released: ${fileName}`);
    }
    
    // Remove from list
    const newList = list.filter(item => item.fileName !== fileName);
    this.saveQuarantineList(newList);
    
    return true;
  }

  /**
   * List quarantined tests
   */
  list() {
    const list = this.loadQuarantineList();
    
    if (list.length === 0) {
      console.log('✅ No tests in quarantine');
      return;
    }
    
    console.log('🚨 Quarantined Tests:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    list.forEach((item, index) => {
      console.log(`${index + 1}. ${item.fileName}`);
      console.log(`   Reason: ${item.reason}`);
      console.log(`   Original: ${item.originalPath}`);
      console.log(`   Quarantined: ${item.quarantinedAt}`);
      console.log('');
    });
  }

  /**
   * Check if a test is quarantined
   */
  isQuarantined(fileName) {
    const list = this.loadQuarantineList();
    return list.some(item => item.fileName === fileName);
  }

  /**
   * Get quarantine statistics
   */
  stats() {
    const list = this.loadQuarantineList();
    
    console.log('📊 Quarantine Statistics:');
    console.log(`   Total quarantined: ${list.length}`);
    
    if (list.length > 0) {
      const reasons = {};
      list.forEach(item => {
        reasons[item.reason] = (reasons[item.reason] || 0) + 1;
      });
      
      console.log('   Reasons:');
      Object.entries(reasons).forEach(([reason, count]) => {
        console.log(`     ${reason}: ${count}`);
      });
    }
  }

  /**
   * Load quarantine list from file
   */
  loadQuarantineList() {
    try {
      if (fs.existsSync(this.quarantineList)) {
        const data = fs.readFileSync(this.quarantineList, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️  Could not load quarantine list:', error.message);
    }
    return [];
  }

  /**
   * Save quarantine list to file
   */
  saveQuarantineList(list) {
    try {
      fs.writeFileSync(this.quarantineList, JSON.stringify(list, null, 2));
    } catch (error) {
      console.error('❌ Could not save quarantine list:', error.message);
    }
  }

  /**
   * Auto-quarantine failing tests from test results
   */
  autoQuarantineFromResults(testResults) {
    if (!testResults.testResults) return;
    
    let quarantinedCount = 0;
    
    testResults.testResults.forEach(testFile => {
      if (!testFile.status || testFile.status === 'failed') {
        const fileName = path.basename(testFile.name);
        this.quarantine(testFile.name, 'Auto-quarantined due to test failures');
        quarantinedCount++;
      }
    });
    
    if (quarantinedCount > 0) {
      console.log(`🚨 Auto-quarantined ${quarantinedCount} failing test files`);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  const quarantine = new TestQuarantine();
  
  switch (command) {
    case 'list':
      quarantine.list();
      break;
      
    case 'stats':
      quarantine.stats();
      break;
      
    case 'quarantine':
      if (args.length < 3) {
        console.error('Usage: node test-quarantine.js quarantine <file-path> <reason>');
        process.exit(1);
      }
      quarantine.quarantine(args[1], args[2]);
      break;
      
    case 'release':
      if (args.length < 2) {
        console.error('Usage: node test-quarantine.js release <file-name>');
        process.exit(1);
      }
      const success = quarantine.release(args[1]);
      process.exit(success ? 0 : 1);
      break;
      
    case 'auto':
      // Auto-quarantine from test results file
      if (args.length < 2) {
        console.error('Usage: node test-quarantine.js auto <results-file>');
        process.exit(1);
      }
      try {
        const results = JSON.parse(fs.readFileSync(args[1], 'utf8'));
        quarantine.autoQuarantineFromResults(results);
      } catch (error) {
        console.error('❌ Could not process results file:', error.message);
        process.exit(1);
      }
      break;
      
    default:
      console.log('Test Quarantine System');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Commands:');
      console.log('  list                    - List quarantined tests');
      console.log('  stats                   - Show quarantine statistics');
      console.log('  quarantine <file> <reason> - Quarantine a test file');
      console.log('  release <filename>      - Release a test from quarantine');
      console.log('  auto <results-file>     - Auto-quarantine from test results');
      break;
  }
}

export default TestQuarantine;
