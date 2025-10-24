import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const BUNDLE_SIZE_THRESHOLD = 250 * 1024; // 250KB
const MAIN_BUNDLE_PATTERN = /main\.[a-f0-9]+\.js$/;

function getBundleStats() {
  const distPath = path.join(process.cwd(), 'dist', 'assets');
  const files = fs.readdirSync(distPath);
  
  // Find main bundle
  const mainBundle = files.find(f => MAIN_BUNDLE_PATTERN.test(f));
  if (!mainBundle) {
    throw new Error('Main bundle not found');
  }

  const stats = {
    size: fs.statSync(path.join(distPath, mainBundle)).size,
    gzipSize: getGzipSize(path.join(distPath, mainBundle)),
  };

  // Get git commit info
  const commitHash = execSync('git rev-parse HEAD').toString().trim();
  const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

  return {
    ...stats,
    commit: commitHash,
    branch: branchName,
    timestamp: new Date().toISOString(),
  };
}

function getGzipSize(filePath) {
  const gzip = execSync(`gzip -c "${filePath}" | wc -c`).toString();
  return parseInt(gzip.trim(), 10);
}

function checkBundleSize(stats) {
  if (stats.size > BUNDLE_SIZE_THRESHOLD) {
    console.warn(`⚠️ Bundle size (${formatBytes(stats.size)}) exceeds threshold (${formatBytes(BUNDLE_SIZE_THRESHOLD)})`);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)}KB`;
}

function saveBundleStats(stats) {
  const statsFile = path.join(process.cwd(), '.bundle-stats.json');
  let history = [];
  
  if (fs.existsSync(statsFile)) {
    history = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
  }
  
  history.push(stats);
  
  // Keep last 10 entries
  if (history.length > 10) {
    history = history.slice(-10);
  }
  
  fs.writeFileSync(statsFile, JSON.stringify(history, null, 2));
}

// Main execution
try {
  console.log('📦 Analyzing bundle size...');
  const stats = getBundleStats();
  
  console.log(`
Bundle Statistics:
-----------------
Size:       ${formatBytes(stats.size)}
Gzip Size:  ${formatBytes(stats.gzipSize)}
Branch:     ${stats.branch}
Commit:     ${stats.commit.slice(0, 7)}
  `);
  
  checkBundleSize(stats);
  saveBundleStats(stats);
  
  console.log('✅ Bundle size is within acceptable limits');
} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
}