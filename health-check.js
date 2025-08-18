#!/usr/bin/env node

// The Steward Health Monitor
// Performs comprehensive health checks and diagnostics

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

class StewardHealthMonitor {
  constructor() {
    this.checks = [];
    this.results = [];
    this.setupChecks();
  }

  setupChecks() {
    this.checks = [
      { name: 'Process Check', fn: this.checkProcess.bind(this) },
      { name: 'Memory Module', fn: this.checkMemoryModule.bind(this) },
      { name: 'Backend API', fn: this.checkBackendAPI.bind(this) },
      { name: 'Frontend Build', fn: this.checkFrontend.bind(this) },
      { name: 'Database Access', fn: this.checkDatabase.bind(this) },
      { name: 'File Permissions', fn: this.checkPermissions.bind(this) },
      { name: 'Dependencies', fn: this.checkDependencies.bind(this) },
      { name: 'Environment', fn: this.checkEnvironment.bind(this) }
    ];
  }

  async runAllChecks() {
    console.log('🔍 The Steward Health Check Starting...\n');
    
    for (const check of this.checks) {
      try {
        const result = await check.fn();
        this.results.push({
          name: check.name,
          status: result.status,
          message: result.message,
          details: result.details || null
        });
        
        const statusEmoji = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
        console.log(`${statusEmoji} ${check.name}: ${result.message}`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
      } catch (error) {
        this.results.push({
          name: check.name,
          status: 'fail',
          message: error.message,
          details: error.stack
        });
        console.log(`❌ ${check.name}: ${error.message}`);
      }
    }
    
    this.generateReport();
  }

  async checkProcess() {
    return new Promise((resolve) => {
      const pidFile = path.join(__dirname, 'logs', 'steward.pid');
      
      if (!fs.existsSync(pidFile)) {
        resolve({ status: 'fail', message: 'No PID file found - service not running' });
        return;
      }
      
      const pid = fs.readFileSync(pidFile, 'utf8').trim();
      
      // Check if process is running
      const ps = spawn('ps', ['-p', pid]);
      ps.on('close', (code) => {
        if (code === 0) {
          resolve({ status: 'pass', message: `Service running (PID: ${pid})` });
        } else {
          resolve({ status: 'fail', message: 'PID file exists but process not running' });
        }
      });
    });
  }

  async checkMemoryModule() {
    try {
      const memoryPath = path.join(__dirname, 'models', 'memory.js');
      delete require.cache[require.resolve(memoryPath)];
      const memory = require(memoryPath);
      
      // Test all exported functions exist
      const requiredFunctions = ['loadMemory', 'writeMemory', 'writeProjectMemory', 'readMemory'];
      const missing = requiredFunctions.filter(fn => typeof memory[fn] !== 'function');
      
      if (missing.length > 0) {
        return { 
          status: 'fail', 
          message: 'Memory module missing functions',
          details: `Missing: ${missing.join(', ')}`
        };
      }
      
      return { status: 'pass', message: 'Memory module exports complete' };
    } catch (error) {
      return { status: 'fail', message: 'Memory module import failed', details: error.message };
    }
  }

  async checkBackendAPI() {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3002/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            if (health.status === 'healthy') {
              resolve({ status: 'pass', message: 'Backend API responding' });
            } else {
              resolve({ status: 'warn', message: 'Backend API unhealthy', details: data });
            }
          } catch (e) {
            resolve({ status: 'fail', message: 'Backend API invalid response', details: data });
          }
        });
      });
      
      req.on('error', () => {
        resolve({ status: 'fail', message: 'Backend API not responding on port 3002' });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ status: 'fail', message: 'Backend API timeout' });
      });
    });
  }

  async checkFrontend() {
    const frontendPath = path.join(__dirname, 'web-interface', 'frontend');
    const buildPath = path.join(frontendPath, 'build');
    const packagePath = path.join(frontendPath, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      return { status: 'fail', message: 'Frontend package.json missing' };
    }
    
    if (!fs.existsSync(buildPath)) {
      return { status: 'warn', message: 'Frontend not built - run npm run build' };
    }
    
    return { status: 'pass', message: 'Frontend files present' };
  }

  async checkDatabase() {
    const dbPath = path.join(__dirname, 'database');
    
    if (!fs.existsSync(dbPath)) {
      return { status: 'warn', message: 'Database directory missing' };
    }
    
    // Check for database files
    const dbFiles = fs.readdirSync(dbPath).filter(f => f.endsWith('.db') || f.endsWith('.sqlite'));
    
    if (dbFiles.length === 0) {
      return { status: 'warn', message: 'No database files found', details: 'Run npm run db:migrate' };
    }
    
    return { status: 'pass', message: `Database files present: ${dbFiles.join(', ')}` };
  }

  async checkPermissions() {
    const criticalPaths = [
      path.join(__dirname, 'logs'),
      path.join(__dirname, 'service-manager.sh'),
      path.join(__dirname, 'steward.js')
    ];
    
    for (const p of criticalPaths) {
      try {
        if (fs.existsSync(p)) {
          fs.accessSync(p, fs.constants.R_OK | fs.constants.W_OK);
        }
      } catch (error) {
        return { 
          status: 'fail', 
          message: 'Permission error',
          details: `Cannot access ${p}: ${error.message}`
        };
      }
    }
    
    return { status: 'pass', message: 'File permissions OK' };
  }

  async checkDependencies() {
    const packageJson = require('./package.json');
    const nodeModules = path.join(__dirname, 'node_modules');
    
    if (!fs.existsSync(nodeModules)) {
      return { status: 'fail', message: 'node_modules missing - run npm install' };
    }
    
    // Check for critical dependencies
    const critical = ['dotenv', 'js-yaml', 'ws'];
    const missing = critical.filter(dep => {
      return !fs.existsSync(path.join(nodeModules, dep));
    });
    
    if (missing.length > 0) {
      return { 
        status: 'fail', 
        message: 'Critical dependencies missing',
        details: `Missing: ${missing.join(', ')}`
      };
    }
    
    return { status: 'pass', message: 'Dependencies installed' };
  }

  async checkEnvironment() {
    const envFile = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envFile)) {
      return { status: 'warn', message: '.env file missing', details: 'Some features may not work' };
    }
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
    
    if (majorVersion < 16) {
      return { 
        status: 'fail', 
        message: 'Node.js version too old',
        details: `Found ${nodeVersion}, requires >=16.0.0`
      };
    }
    
    return { status: 'pass', message: `Environment OK (Node ${nodeVersion})` };
  }

  generateReport() {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const warned = this.results.filter(r => r.status === 'warn').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    
    console.log('\n📊 Health Check Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warned}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n🚨 Critical Issues Found:');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => console.log(`  • ${r.name}: ${r.message}`));
    }
    
    if (warned > 0) {
      console.log('\n⚠️  Warnings:');
      this.results
        .filter(r => r.status === 'warn')
        .forEach(r => console.log(`  • ${r.name}: ${r.message}`));
    }
    
    const overallHealth = failed === 0 ? (warned === 0 ? 'HEALTHY' : 'DEGRADED') : 'UNHEALTHY';
    console.log(`\n🎯 Overall Status: ${overallHealth}`);
    
    // Write detailed report to file
    const reportPath = path.join(__dirname, 'logs', 'health-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      overallHealth,
      summary: { passed, warned, failed },
      details: this.results
    }, null, 2));
    
    console.log(`\n📋 Detailed report saved to: ${reportPath}`);
  }
}

// Run health check if called directly
if (require.main === module) {
  const monitor = new StewardHealthMonitor();
  monitor.runAllChecks().catch(console.error);
}

module.exports = StewardHealthMonitor;
