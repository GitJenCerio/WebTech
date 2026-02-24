const fs = require('fs');
const { execSync } = require('child_process');

const dir = '.next';

function clean() {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log('Cleaned .next');
      return;
    }
    console.log('.next not found (already clean)');
  } catch (err) {
    if (process.platform === 'win32') {
      try {
        execSync(`rd /s /q "${dir}"`, { stdio: 'inherit' });
        console.log('Cleaned .next (Windows rd)');
        return;
      } catch (e) {
        // fall through
      }
    }
    console.error('Could not remove .next. Do this:');
    console.error('  1. Stop the dev server (Ctrl+C)');
    console.error('  2. Close Cursor/VS Code and any terminals');
    console.error('  3. In File Explorer, delete the folder: F:\\WebTech\\.next');
    console.error('  4. Reopen and run: npm run dev');
    process.exit(1);
  }
}

clean();
