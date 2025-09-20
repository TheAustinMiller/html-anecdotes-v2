const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'anecdotes.db');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  // Initialize database connection and create tables
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables()
            .then(() => {
              console.log('Database tables initialized successfully');
              resolve();
            })
            .catch(reject);
        }
      });
    });
  }

  // Create tables if they don't exist
  async createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT,
        passwordHash TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    // Create indexes for better performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)',
      'CREATE INDEX IF NOT EXISTS idx_posts_userId ON posts (userId)',
      'CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts (createdAt)'
    ];

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Enable foreign keys
        this.db.run('PRAGMA foreign_keys = ON');
        
        // Create users table
        this.db.run(createUsersTable, (err) => {
          if (err) {
            console.error('Error creating users table:', err.message);
            reject(err);
            return;
          }
          console.log('Users table ready');
        });

        // Create posts table
        this.db.run(createPostsTable, (err) => {
          if (err) {
            console.error('Error creating posts table:', err.message);
            reject(err);
            return;
          }
          console.log('Posts table ready');
        });

        // Create indexes
        createIndexes.forEach(indexQuery => {
          this.db.run(indexQuery, (err) => {
            if (err) {
              console.error('Error creating index:', err.message);
            }
          });
        });

        resolve();
      });
    });
  }

  // Helper method to run queries with promises
  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Helper method to get a single row
  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Helper method to get all rows
  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // User-related methods
  createUser = async (username, passwordHash, email = null) => {
    const query = 'INSERT INTO users (username, passwordHash, email) VALUES (?, ?, ?)';
    return this.run(query, [username, passwordHash, email]);
  }

  getUserById = async (id) => {
    const query = 'SELECT id, username, email, createdAt FROM users WHERE id = ?';
    return this.get(query, [id]);
  }

  getUserByUsername = async (username) => {
    if (!this.db) {
      throw new Error('Database connection not ready');
    }
    
    const query = 'SELECT * FROM users WHERE username = ?';
    return this.get(query, [username]);
  }

  getUserByEmail = async (email) => {
    const query = 'SELECT * FROM users WHERE email = ?';
    return this.get(query, [email]);
  }

  // Post-related methods
  async createPost(userId, title, content) {
    const query = 'INSERT INTO posts (userId, title, content) VALUES (?, ?, ?)';
    return this.run(query, [userId, title, content]);
  }

  async getPostById(id) {
    const query = `
      SELECT p.*, u.username 
      FROM posts p 
      JOIN users u ON p.userId = u.id 
      WHERE p.id = ?
    `;
    return this.get(query, [id]);
  }

  async getPostsByUser(userId, limit = 50, offset = 0) {
    const query = `
      SELECT p.*, u.username 
      FROM posts p 
      JOIN users u ON p.userId = u.id 
      WHERE p.userId = ? 
      ORDER BY p.createdAt DESC 
      LIMIT ? OFFSET ?
    `;
    return this.all(query, [userId, limit, offset]);
  }

  async getAllPosts(limit = 50, offset = 0) {
    const query = `
      SELECT p.*, u.username 
      FROM posts p 
      JOIN users u ON p.userId = u.id 
      ORDER BY p.createdAt DESC 
      LIMIT ? OFFSET ?
    `;
    return this.all(query, [limit, offset]);
  }

  async updatePost(id, title, content) {
    const query = 'UPDATE posts SET title = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
    return this.run(query, [title, content, id]);
  }

  async deletePost(id) {
    const query = 'DELETE FROM posts WHERE id = ?';
    return this.run(query, [id]);
  }

  async getPostCount() {
    const query = 'SELECT COUNT(*) as count FROM posts';
    const result = await this.get(query);
    return result.count;
  }

  async getUserCount() {
    const query = 'SELECT COUNT(*) as count FROM users';
    const result = await this.get(query);
    return result.count;
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

const database = new Database();

module.exports = database;