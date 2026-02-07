import bcrypt from 'bcryptjs';
import { query } from '../src/db/pool.js';

function arg(name, fallback = null) {
  const flag = `--${name}`;
  const idx = process.argv.indexOf(flag);
  return idx >= 0 ? process.argv[idx + 1] : fallback;
}

async function run() {
  const email = arg('email');
  const name = arg('name', 'Super Admin');
  const password = arg('password');

  if (!email || !password) {
    console.error('Usage: npm run seed:admin -- --email <email> --password <password> [--name "Super Admin"]');
    process.exit(1);
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) {
    console.log('Admin already exists for email:', email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, email, role',
    [name, email, passwordHash, 'ADMIN']
  );
  console.log('Admin created:', created.rows[0]);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
