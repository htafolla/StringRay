#!/usr/bin/env node

/**
 * StringRay Framework Monitoring System
 * Real-time monitoring and performance analysis
 * Author: StringRay Enforcer Agent
 * Version: 1.1.1
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MonitoringSystem {
  constructor() {
    this.projectDir = process.cwd();
    this.isMonitoring = false;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📊',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'monitor': '🔍',
      'performance': '⚡'
    }[type] || '📊';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  startMonitoring() {
    this.log('Starting StringRay monitoring system...', 'monitor');
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds
    
    this.log('✅ Monitoring system started', 'success');
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.isMonitoring = false;
      this.log('✅ Monitoring system stopped', 'success');
    }
  }

  async collectMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: await this.getMemoryUsage(),
      processes: await this.getProcessCount(),
      buildSize: await this.getBuildSize(),
      errors: await this.getErrorCount()
    };
    
    // Log metrics
    this.log(`Memory Usage: ${metrics.memory.heapUsed}MB / ${metrics.memory.heapTotal}MB`, 'performance');
    this.log(`Active Processes: ${metrics.processes}`, 'monitor');
    this.log(`Build Size: ${metrics.buildSize}KB`, 'performance');
    this.log(`Error Count: ${metrics.errors.errors}`, metrics.errors.errors > 0 ? 'error' : 'info');
    
    // Check for alerts
    this.checkAlerts(metrics);
    
    // Save metrics to file
    this.saveMetrics(metrics);
  }

  async getMemoryUsage() {
    return new Promise((resolve) => {
      const child = spawn('node', ['-e', `
        const used = process.memoryUsage();
        resolve({
          heapUsed: Math.round(used.heapUsed / 1024 / 1024),
          heapTotal: Math.round(used.heapTotal / 1024 / 1024),
          external: Math.round(used.external / 1024 / 1024)
        });
      `], { stdio: 'pipe' });
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', () => {
        try {
          const memory = JSON.parse(output.trim());
          resolve(memory);
        } catch (error) {
          resolve({ heapUsed: 0, heapTotal: 0 });
        }
      });
    });
  }

  async getProcessCount() {
    return new Promise((resolve) => {
      const child = spawn('ps', ['-axo', 'pid=,comm=', '--no-headers'], { stdio: 'pipe' });
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', () => {
        const lines = output.trim().split('\n');
        const processCount = lines.filter(line => line.trim() !== '').length;
        resolve(processCount);
      });
    });
  }

  async getBuildSize() {
    return new Promise((resolve) => {
      const child = spawn('du', ['-sk', 'dist'], { stdio: 'pipe' });
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', () => {
        const match = output.trim().match(/^(\\d+)\\s+(\\w+)?/);
        const size = match ? match[1] : 0;
        resolve(parseInt(size));
      });
    });
  }

  async getErrorCount() {
    return new Promise((resolve) => {
      const logPath = path.join(this.projectDir, 'activity.log');
      
      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf8');
        const errorLines = logContent.split('\n').filter(line => 
          line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')
        );
        resolve({ errors: errorLines.length });
      } else {
        resolve({ errors: 0 });
      }
    });
  }

  checkAlerts(metrics) {
    // Memory threshold alert
    if (metrics.memory.heapUsed / metrics.memory.heapTotal > 0.9) {
      this.log('⚠️ HIGH MEMORY USAGE: Using 90%+ of available memory', 'warning');
    }
    
    // Build size alert
    if (metrics.buildSize > 5000) { // 5MB
      this.log('⚠️ LARGE BUILD SIZE: Build exceeds 5MB', 'warning');
    }
    
    // Error rate alert
    if (metrics.errors > 10) {
      this.log('⚠️ HIGH ERROR RATE: More than 10 errors in log', 'warning');
    }
  }

  saveMetrics(metrics) {
    const metricsDir = path.join(this.projectDir, 'metrics');
    
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }
    
    const metricsFile = path.join(metricsDir, `metrics-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
  }

  async generateReport() {
    this.log('Generating monitoring report...', 'monitor');
    
    const metricsDir = path.join(this.projectDir, 'metrics');
    if (!fs.existsSync(metricsDir)) {
      this.log('No metrics data available', 'warning');
      return;
    }
    
    const metricsFiles = fs.readdirSync(metricsDir)
      .filter(file => file.startsWith('metrics-') && file.endsWith('.json'))
      .sort();
    
    if (metricsFiles.length === 0) {
      this.log('No metrics files found', 'warning');
      return;
    }
    
    const latestMetrics = JSON.parse(
      fs.readFileSync(path.join(metricsDir, metricsFiles[metricsFiles.length - 1]), 'utf8')
    );
    
    console.log('StringRay Monitoring Report');
    console.log('========================');
    console.log(`Report Period: Latest available metrics`);
    console.log(`Generated At: ${new Date().toISOString()}`);
    console.log('');
    console.log('Key Metrics:');
    console.log(`  Memory Usage: ${latestMetrics.memory.heapUsed}MB / ${latestMetrics.memory.heapTotal}MB`);
    console.log(`  Build Size: ${latestMetrics.buildSize}KB`);
    console.log(`  Error Count: ${latestMetrics.errors}`);
    console.log('');
    console.log('Status: ' + this.getHealthStatus(latestMetrics));
    console.log('Recommendations: ' + this.getRecommendations(latestMetrics));
  }

  getHealthStatus(metrics) {
    if (metrics.memory.heapUsed / metrics.memory.heapTotal < 0.7 &&
        metrics.buildSize < 5000 &&
        metrics.errors < 5) {
      return '🟢 HEALTHY - All systems operating normally';
    } else if (metrics.memory.heapUsed / metrics.memory.heapTotal < 0.9 &&
               metrics.buildSize < 10000 &&
               metrics.errors < 15) {
      return '🟡 CAUTION - Some systems need attention';
    } else {
      return '🔴 CRITICAL - Immediate action required';
    }
  }

  getRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.memory.heapUsed / metrics.memory.heapTotal > 0.8) {
      recommendations.push('Consider memory optimization or increasing available memory');
    }
    
    if (metrics.buildSize > 5000) {
      recommendations.push('Build size exceeds 5MB - consider bundle optimization');
    }
    
    if (metrics.errors > 10) {
      recommendations.push('High error rate detected - review recent changes');
    }
    
    return recommendations.join('; ') || 'No issues detected';
  }
}

// CLI interface
const monitoring = new MonitoringSystem();
const command = process.argv[2];

switch (command) {
  case 'start':
    monitoring.startMonitoring();
    break;
    
  case 'stop':
    monitoring.stopMonitoring();
    break;
    
  case 'report':
    monitoring.generateReport();
    break;
    
  case 'status':
    if (monitoring.isMonitoring) {
      console.log('✅ Monitoring is active');
    } else {
      console.log('⚠️ Monitoring is not active');
    }
    break;
    
  default:
    console.log('StringRay Monitoring System');
    console.log('===============================');
    console.log('Available commands:');
    console.log('  start   - Start real-time monitoring');
    console.log('  stop    - Stop monitoring system');
    console.log('  report  - Generate monitoring report');
    console.log('  status  - Check monitoring status');
    console.log('');
    console.log('Usage: node monitoring/daemon.js <command>');
    process.exit(1);
}