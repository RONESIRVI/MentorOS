const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pagesToTest = [
  'index.html',
  'Mentor/mentor-dashboard.html',
  'Aspirant/aspirant-dashboard.html',
  'Admin/admin-dashboard.html'
];

let overallFailed = false;

console.log('🚀 Starting UI Verification Suite...');

for (const page of pagesToTest) {
  try {
    console.log(`\n----------------------------------------`);
    execSync(`node tests/test_ui.js ${page}`, { stdio: 'inherit' });
  } catch (error) {
    overallFailed = true;
  }
}

console.log(`\n----------------------------------------`);
if (overallFailed) {
  console.error('❌ UI Verification Failed! There are errors on one or more pages.');
  process.exit(1);
} else {
  console.log('✅ UI Verification Passed! No syntax or loading errors detected.');
  process.exit(0);
}
