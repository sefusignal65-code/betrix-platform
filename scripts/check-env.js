require('dotenv').config();

const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'OPENAI_API_KEY',
    'TELEGRAM_WEBHOOK_SECRET'
];

console.log('\n🔍 Checking environment variables...\n');

let missingVars = false;

for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
        console.log(`❌ ${varName} is not set`);
        missingVars = true;
    } else {
        // Show first few characters of the value for verification
        const masked = value.substring(0, 4) + '...' + value.substring(value.length - 4);
        console.log(`✅ ${varName} is set (${masked})`);
    }
}

if (missingVars) {
    console.log('\n⚠️ Some required environment variables are missing!');
    console.log('Please check your .env file and ensure all variables are set correctly.');
    process.exit(1);
} else {
    console.log('\n✅ All required environment variables are set!');
}