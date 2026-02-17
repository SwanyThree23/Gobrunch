#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function setup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Connecting to database...');

  try {
    await pool.query('SELECT NOW()');
    console.log('Connected successfully.');

    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema...');
    await pool.query(schema);
    console.log('Database schema applied successfully.');
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
