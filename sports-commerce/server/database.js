const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.resolve(process.env.DB_PATH || './data/sportverse.db');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let db = null;

// Wrapper to provide better-sqlite3-like interface over sql.js
class DBWrapper {
  constructor(sqlDb) { this._db = sqlDb; }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        const lastId = self._db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0];
        const changes = self._db.getRowsModified();
        return { lastInsertRowid: lastId, changes };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        const cols = stmt.getColumnNames();
        while (stmt.step()) {
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          rows.push(row);
        }
        stmt.free();
        return rows;
      }
    };
  }

  exec(sql) { this._db.run(sql); }

  transaction(fn) {
    const self = this;
    return function(...args) {
      self._db.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        self._db.run('COMMIT');
        self._save();
        return result;
      } catch (e) {
        self._db.run('ROLLBACK');
        throw e;
      }
    };
  }

  _save() {
    const data = this._db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

// ──────────── SCHEMA ────────────
function createTables(wrapper) {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, preferences TEXT DEFAULT '{}', loyalty_points INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, team TEXT DEFAULT 'General', sport TEXT NOT NULL, category TEXT NOT NULL, price REAL NOT NULL, old_price REAL, image TEXT, badge TEXT, context TEXT, description TEXT, stock INTEGER DEFAULT 100, tags TEXT DEFAULT '[]', rating REAL DEFAULT 4.5, review_count INTEGER DEFAULT 0, sales_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS matches (id INTEGER PRIMARY KEY AUTOINCREMENT, sport TEXT NOT NULL, league TEXT NOT NULL, team1 TEXT NOT NULL, team2 TEXT NOT NULL, score1 TEXT, score2 TEXT, icon1 TEXT, icon2 TEXT, status TEXT DEFAULT 'Live', overs TEXT, started_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS teams (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sport TEXT NOT NULL, icon TEXT, color TEXT, product_count INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sport TEXT NOT NULL, stat TEXT, performance INTEGER DEFAULT 0, trending_merch TEXT, avatar TEXT);
    CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, icon TEXT, item_count TEXT);
    CREATE TABLE IF NOT EXISTS cart_items (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER DEFAULT 1, added_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, items TEXT NOT NULL, subtotal REAL NOT NULL, discount REAL DEFAULT 0, total REAL NOT NULL, status TEXT DEFAULT 'pending', shipping_address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS wishlist (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, added_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS user_activity (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, product_id INTEGER, action TEXT NOT NULL, metadata TEXT DEFAULT '{}', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  `;
  schema.split(';').filter(s => s.trim()).forEach(s => { try { wrapper.exec(s + ';'); } catch (_) {} });
}

// ──────────── SEED ────────────
function seedDatabase(wrapper) {
  const count = wrapper.prepare('SELECT COUNT(*) as count FROM products').get();
  if (count && count.count > 0) { console.log('[DB] Already seeded.'); return; }
  console.log('[DB] Seeding...');

  const hash = bcrypt.hashSync('demo123', 10);
  wrapper.prepare('INSERT INTO users (name,email,password,preferences) VALUES (?,?,?,?)').run('Demo User','demo@sportverse.com',hash,JSON.stringify({sports:['Cricket','Football'],teams:['Mumbai Indians','Arsenal'],interests:['Jerseys','Equipment']}));

  const products = [
    ['MI Home Jersey 2026','Mumbai Indians','Cricket','Jerseys',2499,3499,'/assets/cricket-jersey.png','trending','🔥 MI batting on fire — 186/4!','Official MI home jersey IPL 2026.','[\"cricket\",\"jersey\",\"mumbai\",\"ipl\"]',4.8,234,1820],
    ['CSK Dhoni Legend Tee','Chennai Super Kings','Cricket','Jerseys',1999,2499,'/assets/cricket-jersey.png','live','⚡ CSK vs MI happening now!','Tribute tee celebrating MS Dhoni.','[\"cricket\",\"tshirt\",\"chennai\",\"dhoni\"]',4.9,456,2340],
    ['Arsenal 26/27 Kit','Arsenal','Football','Jerseys',5999,7499,'/assets/football-jersey.png','trending','⚽ Arsenal leading 2-1 vs City!','Official Arsenal home kit 2026/27.','[\"football\",\"jersey\",\"arsenal\",\"epl\"]',4.7,189,1250],
    ['Pro Cricket Bat — SS Ton','General','Cricket','Equipment',8999,12999,'/assets/cricket-bat.jpg','new','🏏 IPL season — bat demand +340%','Professional SS Ton cricket bat.','[\"cricket\",\"equipment\",\"bat\"]',4.6,78,560],
    ['Lakers LeBron Jersey #23','LA Lakers','Basketball','Jerseys',4499,5999,'/assets/basketball-jersey.jpg','live','🏀 Lakers in NBA Playoffs!','Official Lakers LeBron #23 jersey.','[\"basketball\",\"jersey\",\"lakers\",\"lebron\"]',4.8,312,1680],
    ['Alcaraz Pro Racquet','General','Tennis','Equipment',15999,19999,'/assets/tennis-racquet.jpg','trending','🎾 Alcaraz dominating at French Open!','Pro racquet, Alcaraz model.','[\"tennis\",\"equipment\",\"racquet\"]',4.5,56,320],
    ['Man City Away Jersey','Man City','Football','Jerseys',5499,6999,'/assets/football-jersey-blue.jpg','live','⚽ City chasing at Emirates!','Man City official away jersey 2026/27.','[\"football\",\"jersey\",\"mancity\",\"epl\"]',4.6,167,980],
    ['NBA Official Basketball','General','Basketball','Equipment',3999,4999,'/assets/basketball-ball.jpg','new','🏀 Playoffs fever — ball sales +200%','Official NBA game ball.','[\"basketball\",\"equipment\",\"ball\"]',4.7,98,720],
    ['Celtics Training Shorts','Boston Celtics','Basketball','Training',1799,2499,'/assets/basketball-shorts.jpg','trending','🏀 Celtics leading in Q4!','Boston Celtics Dri-FIT shorts.','[\"basketball\",\"shorts\",\"celtics\"]',4.4,45,380],
    ['Cricket Training Gloves','General','Cricket','Equipment',1299,1799,'/assets/cricket-gloves.jpg','new','🏏 Season essentials — top seller','Professional batting gloves.','[\"cricket\",\"equipment\",\"gloves\"]',4.3,67,490],
    ['Djokovic Signature Shoes','General','Tennis','Footwear',12499,15999,'/assets/sports-shoes.jpg','trending','🎾 Djokovic fighting back at RG!','Court shoes by Novak Djokovic.','[\"tennis\",\"footwear\",\"shoes\"]',4.7,89,410],
    ['Arsenal Scarf & Cap Combo','Arsenal','Football','Accessories',999,1499,'/assets/football-accessories.jpg','live','⚽ Gunners matchday essentials!','Official Arsenal scarf and cap.','[\"football\",\"accessory\",\"arsenal\"]',4.5,123,870],
    ['RCB Virat Edition Jersey','Royal Challengers','Cricket','Jerseys',2799,3499,'/assets/rcb-jersey.png','trending','🏏 Kohli scored 87 off 49!','Limited edition Virat Kohli RCB jersey.','[\"cricket\",\"jersey\",\"rcb\",\"kohli\"]',4.9,567,3200],
    ['Football Training Kit','General','Football','Training',3499,4499,'/assets/training-gear.jpg','new','⚽ Pre-season training essentials','Complete football training kit.','[\"football\",\"training\",\"kit\"]',4.4,34,210],
    ['Basketball Hoop Portable','General','Basketball','Equipment',7999,10999,'/assets/basketball-hoop.jpg','new','🏀 Home court setup trending','Portable basketball hoop.','[\"basketball\",\"equipment\",\"hoop\"]',4.2,23,150],
    ['Tennis Ball Pack (12)','General','Tennis','Equipment',899,1199,'/assets/tennis-balls.jpg','trending','🎾 Grand Slam season essentials','Championship tennis balls 12-pack.','[\"tennis\",\"equipment\",\"balls\"]',4.6,156,1240],
  ];
  for (const p of products) wrapper.prepare('INSERT INTO products (name,team,sport,category,price,old_price,image,badge,context,description,tags,rating,review_count,sales_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(...p);

  const matches = [['Cricket','IPL 2026','Mumbai Indians','Chennai Super Kings','186/4','142/6 (16.2)','🔵','💛','Live','16.2 ov'],['Football','Premier League','Arsenal','Man City','2','1','🔴','🔵','Live',"72'"],['Basketball','NBA Playoffs','LA Lakers','Boston Celtics','98','104','💜','💚','Live','Q4 3:22'],['Tennis','French Open','C. Alcaraz','N. Djokovic','6-4, 3','3-6, 5','🇪🇸','🇷🇸','Live','Set 3']];
  for (const m of matches) wrapper.prepare('INSERT INTO matches (sport,league,team1,team2,score1,score2,icon1,icon2,status,overs) VALUES (?,?,?,?,?,?,?,?,?,?)').run(...m);

  const teams = [['Mumbai Indians','Cricket','🔵','linear-gradient(135deg,#004BA0,#00A5E0)',142],['Chennai Super Kings','Cricket','💛','linear-gradient(135deg,#F9CD05,#FF8C00)',128],['Arsenal','Football','🔴','linear-gradient(135deg,#EF0107,#9C824A)',96],['Man City','Football','🔵','linear-gradient(135deg,#6CABDD,#1C2C5B)',88],['LA Lakers','Basketball','💜','linear-gradient(135deg,#552583,#FDB927)',74],['Boston Celtics','Basketball','💚','linear-gradient(135deg,#007A33,#BA9653)',68],['Real Madrid','Football','⚪','linear-gradient(135deg,#FEBE10,#00529F)',105],['Royal Challengers','Cricket','❤️','linear-gradient(135deg,#EC1C24,#2B2A29)',134],['Golden State Warriors','Basketball','💛','linear-gradient(135deg,#1D428A,#FFC72C)',82],['Barcelona','Football','🔵','linear-gradient(135deg,#A50044,#004D98)',98]];
  for (const t of teams) wrapper.prepare('INSERT INTO teams (name,sport,icon,color,product_count) VALUES (?,?,?,?,?)').run(...t);

  const players = [['Virat Kohli','Cricket','87 runs off 49 balls',92,'34 items trending','🏏'],['Erling Haaland','Football','1 Goal, 5 Shots on Target',78,'18 items trending','⚽'],['LeBron James','Basketball','32 pts, 10 reb, 8 ast',88,'26 items trending','🏀'],['Carlos Alcaraz','Tennis','12 Aces, 78% 1st Serve',85,'14 items trending','🎾'],['Jasprit Bumrah','Cricket','3/24 in 4 overs',95,'22 items trending','🏏'],['Bukayo Saka','Football','1 Goal, 2 Assists',82,'15 items trending','⚽']];
  for (const p of players) wrapper.prepare('INSERT INTO players (name,sport,stat,performance,trending_merch,avatar) VALUES (?,?,?,?,?,?)').run(...p);

  const cats = [['Jerseys','👕','4,200+'],['Equipment','🏏','2,800+'],['Footwear','👟','1,600+'],['Accessories','🧢','3,100+'],['Fan Gear','📣','1,900+'],['Training','💪','2,400+'],['Collectibles','🏆','800+'],['Nutrition','🥤','650+']];
  for (const c of cats) wrapper.prepare('INSERT INTO categories (name,icon,item_count) VALUES (?,?,?)').run(...c);

  wrapper._save();
  console.log('[DB] ✅ Seeded: 16 products, 4 matches, 10 teams, 6 players, 8 categories');
}

// ──────────── ASYNC INIT ────────────
let _initPromise = null;

function getDB() {
  if (db) return db;
  throw new Error('Database not initialized. Call initDB() first.');
}

async function initDB() {
  if (db) return db;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const SQL = await initSqlJs();
    let sqlDb;
    if (fs.existsSync(DB_PATH)) {
      const buf = fs.readFileSync(DB_PATH);
      sqlDb = new SQL.Database(buf);
      console.log('[DB] Loaded existing database.');
    } else {
      sqlDb = new SQL.Database();
      console.log('[DB] Created new database.');
    }
    db = new DBWrapper(sqlDb);
    createTables(db);
    seedDatabase(db);
    return db;
  })();
  return _initPromise;
}

module.exports = { initDB, getDB };
