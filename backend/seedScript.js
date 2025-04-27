const { exec } = require('child_process');

console.log('Starting database seeding process...');
console.log('This may take several minutes to complete.');

exec('node SeedDatabase.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }

  console.log(`${stdout}`);
}); 