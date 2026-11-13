require('reflect-metadata');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
if (fs.existsSync(path.join(root, '.env')))
  process.loadEnvFile(path.join(root, '.env'));
require('ts-node').register({
  project: path.join(root, 'tsconfig.json'),
  transpileOnly: true,
});
const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
const { databaseOptions } = require('../src/database/database.options');
const { User } = require('../src/auth/entities/user.entity');

async function main() {
  const command = process.argv[2] || 'init';
  if (!['init', 'seed'].includes(command)) throw new Error('Use init or seed');
  if (command === 'seed' && process.env.NODE_ENV === 'production')
    throw new Error('Local seed is disabled in production');
  const filename =
    process.env.DATABASE_PATH || path.join(root, 'data/toolhub.sqlite');
  const source = new DataSource(databaseOptions(filename));
  await source.initialize();
  try {
    await source.runMigrations();
    if (command === 'seed') {
      const email = (process.argv[3] || 'dat.local@example.test')
        .trim()
        .toLowerCase();
      if (!require('class-validator').isEmail(email))
        throw new Error('Invalid local test email');
      const users = source.getRepository(User);
      if (!(await users.findOneBy({ email }))) {
        const password =
          'Local#A1' + crypto.randomBytes(18).toString('base64url');
        await users.save(
          users.create({
            email,
            passwordHash: await bcrypt.hash(password, 10),
            isEmailVerified: true,
            locale: 'vi',
          }),
        );
        const credentials = path.join(
          path.dirname(path.resolve(filename)),
          email === 'dat.local@example.test'
            ? 'local-test-account.json'
            : 'local-gmail-test-account.json',
        );
        fs.writeFileSync(
          credentials,
          JSON.stringify(
            { email, password, purpose: 'Local development only' },
            null,
            2,
          ),
          { mode: 0o600 },
        );
        console.log(JSON.stringify({ email, credentialsFile: credentials }));
      } else {
        console.log(
          'Local test account already exists; its password was not changed.',
        );
      }
    }
    console.log(
      JSON.stringify({
        database: path.resolve(filename),
        users: await source.getRepository(User).count(),
      }),
    );
  } finally {
    await source.destroy();
  }
}
main().catch(() => {
  console.error(
    'Database setup failed; check configuration and database access.',
  );
  process.exitCode = 1;
});
