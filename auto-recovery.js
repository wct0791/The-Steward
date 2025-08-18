#!/usr/bin/env node

// The Steward Auto-Recovery System
// Detects and fixes common issues automatically

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const StewardHealthMonitor = require('./health-check.js');

class StewardRecovery {
  constructor() {
    this.monitor = new StewardHealthMonitor();
  }

  async diagnoseAndFix() {
    console.log('🔧 The Steward Auto-Recovery Starting...\n');
    
    // Run health checks first
    await this.monitor.runAllChecks();
    
    const issues = this.monitor.results.filter(r => r.status === 'fail');
    
    if (issues.length === 0) {
      console.log('\n✅ No critical issues found. System appears healthy.');
      return true;
    }
    
    console.log('\n🚨 Attempting to fix critical issues...');
    
    let fixedCount = 0;
    for (const issue of issues) {
      console.log(`\n🔧 Fixing: ${issue.name}`);
      const fixed = await this.fixIssue(issue);
      if (fixed) {
        console.log(`✅ Fixed: ${issue.name}`);
        fixedCount++;
      } else {
        console.log(`❌ Could not fix: ${issue.name}`);
      }
    }
    
    console.log(`\n📊 Recovery Summary: ${fixedCount}/${issues.length} issues fixed`);
    
    if (fixedCount === issues.length) {
      console.log('✅ All issues resolved. Restarting service...');
      await this.restartService();
      return true;
    } else {
      console.log('⚠️  Some issues remain. Manual intervention may be required.');
      return false;
    }
  }

  async fixIssue(issue) {
    switch (issue.name) {
      case 'Process Check':
        return await this.fixProcessIssue();
      case 'Memory Module':
        return await this.fixMemoryModule();
      case 'Dependencies':
        return await this.fixDependencies();
      case 'File Permissions':
        return await this.fixPermissions();
      case 'Database Access':
        return await this.fixDatabase();
      default:
        console.log(`  No automatic fix available for ${issue.name}`);
        return false;
    }
  }

  async fixProcessIssue() {
    // Clean up stale PID files
    const pidFile = path.join(__dirname, 'logs', 'steward.pid');
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
      console.log('  Removed stale PID file');
    }
    
    // Kill any hanging processes
    try {
      await this.runCommand('pkill', ['-f', 'steward.*node']);
      console.log('  Cleaned up hanging processes');
    } catch (e) {
      // This is expected if no processes are running
    }
    
    return true;
  }

  async fixMemoryModule() {
    const memoryPath = path.join(__dirname, 'models', 'memory.js');
    
    // Check if the file exists and has the required structure
    if (!fs.existsSync(memoryPath)) {
      console.log('  Memory module missing - creating placeholder...');
      await this.createMemoryModule();
      return true;
    }
    
    // Try to fix common export issues
    try {
      const content = fs.readFileSync(memoryPath, 'utf8');
      
      // Check for missing readMemory function
      if (!content.includes('function readMemory')) {
        console.log('  Adding missing readMemory function...');
        const fixedContent = content.replace(
          '// #endregion end: Placeholder memory module',
          `
/**
 * Placeholder for reading memory.
 * Currently returns empty array. Replace with real implementation.
 *
 * @param {string} projectName - The name of the project.
 * @param {number} limit - Number of entries to return.
 * @returns {Array} Empty array (placeholder)
 */
function readMemory(projectName, limit = 5) {
  // TODO: Implement persistent memory reading
  return [];
}

// #endregion end: Placeholder memory module`
        );
        
        // Fix exports
        const finalContent = fixedContent.replace(
          /module\.exports = \{[^}]+\};/,
          `module.exports = {
  loadMemory,
  writeMemory,
  writeProjectMemory,
  writeLoadoutMemory,
  readLoadoutMemory,
  readMemory
};`
        );
        
        fs.writeFileSync(memoryPath, finalContent);
        console.log('  Fixed memory module exports');
        return true;
      }
    } catch (error) {
      console.log('  Error fixing memory module:', error.message);
      return false;
    }
    
    return true;
  }

  async createMemoryModule() {
    const memoryPath = path.join(__dirname, 'models', 'memory.js');
    const memoryContent = `// #region start: Placeholder memory module

/**
 * Placeholder for loading project memory.
 * Currently returns an empty string. Replace with real implementation.
 */
function loadMemory(projectName) {
  return '';
}

/**
 * Placeholder for writing a memory entry.
 */
function writeMemory(projectName, entry) {
  console.log(\`[Memory][\${projectName}]\`, entry);
}

/**
 * Placeholder for writing project-specific memory.
 */
function writeProjectMemory(projectName, entry) {
  return writeMemory(projectName, entry);
}

/**
 * Placeholder for writing loadout-specific memory.
 */
function writeLoadoutMemory(loadoutName, entry) {
  console.log(\`[LoadoutMemory][\${loadoutName}]\`, entry);
}

/**
 * Placeholder for reading loadout-specific memory.
 */
function readLoadoutMemory(loadoutName) {
  return '';
}

/**
 * Placeholder for reading memory.
 */
function readMemory(projectName, limit = 5) {
  return [];
}

// #endregion end: Placeholder memory module

module.exports = {
  loadMemory,
  writeMemory,
  writeProjectMemory,
  writeLoadoutMemory,
  readLoadoutMemory,
  readMemory
};
`;
    
    fs.mkdirSync(path.dirname(memoryPath), { recursive: true });
    fs.writeFileSync(memoryPath, memoryContent);
    
    return true;
  }

  async fixDependencies() {
    console.log('  Running npm install...');
    try {
      await this.runCommand('npm', ['install'], { cwd: __dirname });
      
      // Also install dependencies for backend and frontend
      const backendPath = path.join(__dirname, 'web-interface', 'backend');
      const frontendPath = path.join(__dirname, 'web-interface', 'frontend');
      
      if (fs.existsSync(path.join(backendPath, 'package.json'))) {
        console.log('  Installing backend dependencies...');
        await this.runCommand('npm', ['install'], { cwd: backendPath });
      }
      
      if (fs.existsSync(path.join(frontendPath, 'package.json'))) {
        console.log('  Installing frontend dependencies...');
        await this.runCommand('npm', ['install'], { cwd: frontendPath });
      }
      
      return true;
    } catch (error) {
      console.log('  Failed to install dependencies:', error.message);
      return false;
    }
  }

  async fixPermissions() {
    const paths = [
      path.join(__dirname, 'logs'),
      path.join(__dirname, 'service-manager.sh'),
      path.join(__dirname, 'health-check.js')
    ];
    
    try {
      for (const p of paths) {
        if (fs.existsSync(p)) {
          if (p.endsWith('.sh') || p.endsWith('.js')) {
            await this.runCommand('chmod', ['+x', p]);
          } else {
            await this.runCommand('chmod', ['755', p]);
          }
        } else if (p.endsWith('logs')) {
          fs.mkdirSync(p, { recursive: true });
        }
      }
      
      console.log('  Fixed file permissions');
      return true;
    } catch (error) {
      console.log('  Failed to fix permissions:', error.message);
      return false;
    }
  }

  async fixDatabase() {
    const dbPath = path.join(__dirname, 'database');
    
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
      console.log('  Created database directory');
    }
    
    // Run database migration if available
    const migratePath = path.join(__dirname, 'migrate.js');
    if (fs.existsSync(migratePath)) {
      try {
        console.log('  Running database migration...');
        await this.runCommand('node', ['migrate.js'], { cwd: __dirname });
        return true;
      } catch (error) {
        console.log('  Database migration failed:', error.message);
        return false;
      }
    }
    
    return true;
  }

  async restartService() {
    const serviceManager = path.join(__dirname, 'service-manager.sh');
    
    if (fs.existsSync(serviceManager)) {
      try {
        console.log('Stopping service...');
        await this.runCommand(serviceManager, ['stop']);
        
        console.log('Starting service...');
        await this.runCommand(serviceManager, ['start']);
        
        return true;
      } catch (error) {
        console.log('Service restart failed:', error.message);
        return false;
      }
    } else {
      console.log('Service manager not found, trying npm commands...');
      try {
        await this.runCommand('npm', ['run', 'stop-all']);
        await this.runCommand('npm', ['run', 'start-daemon']);
        return true;
      } catch (error) {
        console.log('npm restart failed:', error.message);
        return false;
      }
    }
  }

  runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });
      
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', (data) => stdout += data);
      proc.stderr.on('data', (data) => stderr += data);
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(\`Command failed with code \${code}: \${stderr}\`));
        }
      });
      
      proc.on('error', reject);
    });
  }
}

// Run recovery if called directly
if (require.main === module) {
  const recovery = new StewardRecovery();
  recovery.diagnoseAndFix().catch(console.error);
}

module.exports = StewardRecovery;
