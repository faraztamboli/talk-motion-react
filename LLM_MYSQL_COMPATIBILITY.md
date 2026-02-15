# MySQL Compatibility Guide - LLM Database Schema

## ✅ **Yes, the MySQL migration is fully compatible!**

The `llm_database_migration_mysql.sql` file is designed specifically for MySQL and handles all MySQL-specific requirements.

---

## 🔄 **Key Differences from PostgreSQL**

### **1. Data Types**
| PostgreSQL | MySQL | Status |
|------------|-------|--------|
| `SERIAL` | `INT AUTO_INCREMENT` | ✅ Converted |
| `JSONB` | `JSON` | ✅ Converted |
| `TEXT[]` (arrays) | `JSON` | ✅ Converted |
| `INTEGER` | `INT` | ✅ Compatible |

### **2. Indexes**
| Feature | PostgreSQL | MySQL | Status |
|---------|-----------|-------|--------|
| Partial indexes (`WHERE dismissed_at IS NULL`) | ✅ Supported | ❌ Not supported | ⚠️ Removed in MySQL version |
| Regular indexes | ✅ | ✅ | ✅ Compatible |
| DESC ordering in indexes | ✅ | ✅ | ✅ Compatible |

**Note**: The partial indexes are removed in MySQL version. Queries will still work, but may be slightly less optimized. You can add application-level filtering.

### **3. Foreign Keys**
| Feature | PostgreSQL | MySQL | Status |
|---------|-----------|-------|--------|
| Cross-schema FKs (`alpharithmic.user`) | ✅ | ✅ | ✅ Compatible |
| ON DELETE CASCADE/SET NULL | ✅ | ✅ | ✅ Compatible |

### **4. Table Modifications**
| Feature | PostgreSQL | MySQL | Status |
|---------|-----------|-------|--------|
| `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` | ✅ Native | ❌ Not native | ✅ Uses helper procedure |
| Helper procedures | N/A | ✅ Required | ✅ Uses `add_column_if_not_exists` |

### **5. Triggers**
| Feature | PostgreSQL | MySQL | Status |
|---------|-----------|-------|--------|
| Auto-update timestamps | ✅ Triggers | ✅ ON UPDATE CURRENT_TIMESTAMP | ✅ Different but equivalent |

**Note**: MySQL uses `ON UPDATE CURRENT_TIMESTAMP` instead of triggers for `updated_at` columns.

---

## ✅ **MySQL Version Requirements**

- **Minimum**: MySQL 5.7+ (for JSON support)
- **Recommended**: MySQL 8.0+ (better JSON performance and features)
- **Storage Engine**: InnoDB (required for foreign keys)
- **Character Set**: utf8mb4 (for full Unicode support)

---

## 📋 **What's Included in MySQL Version**

### **✅ All 7 Core Tables**
1. ✅ `ai_generated_content` - Fully compatible
2. ✅ `llm_api_usage` - Fully compatible
3. ✅ `user_ai_preferences` - Fully compatible
4. ✅ `ai_conversations` - Fully compatible
5. ✅ `ai_recommendations` - Compatible (partial index removed)
6. ✅ `ai_feedback` - Fully compatible
7. ✅ `ai_learning_insights` - Compatible (partial index removed)

### **✅ All Table Modifications**
1. ✅ `video_recording` - Adds AI columns (uses JSON for tags)
2. ✅ `folders` - Adds AI columns (uses JSON for objectives)
3. ✅ `users` - Adds AI features flag

### **✅ All Indexes** (except partial indexes)
- All regular indexes are included
- Partial indexes with WHERE clauses are removed (MySQL limitation)

---

## 🔧 **Prerequisites**

Before running the MySQL migration, ensure:

1. ✅ **Helper Procedures Exist**: The migration uses `add_column_if_not_exists` and `add_column_if_not_exists_cross_schema` procedures from `database_schema_mysql.sql`
2. ✅ **Schema Exists**: The `alpharithmic` schema exists with the `user` table
3. ✅ **Permissions**: User has CREATE TABLE, ALTER TABLE, CREATE INDEX permissions
4. ✅ **Foreign Key Support**: InnoDB engine is used (default in MySQL 8.0+)

---

## 🚀 **How to Run**

```sql
-- 1. Ensure helper procedures exist (from database_schema_mysql.sql)
-- 2. Run the migration
SOURCE llm_database_migration_mysql.sql;

-- Or execute directly:
mysql -u username -p database_name < llm_database_migration_mysql.sql
```

---

## ⚠️ **Known Limitations**

### **1. Partial Indexes**
**PostgreSQL has**:
```sql
CREATE INDEX idx_ai_recommendations_active 
    ON ai_recommendations(user_id, created_at DESC) 
    WHERE dismissed_at IS NULL;
```

**MySQL doesn't support this**. Instead:
- The index is removed
- Queries still work efficiently
- Add `WHERE dismissed_at IS NULL` in application queries

### **2. Array Types**
**PostgreSQL has**:
```sql
ai_tags TEXT[]
ai_objectives TEXT[]
```

**MySQL uses**:
```sql
ai_tags JSON
ai_objectives JSON
```

**Usage difference**:
- PostgreSQL: `WHERE 'tag' = ANY(ai_tags)`
- MySQL: `WHERE JSON_CONTAINS(ai_tags, '"tag"')`

---

## ✅ **Verification**

After running the migration, verify with:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = DATABASE()
  AND table_name LIKE 'ai_%';

-- Check columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = DATABASE()
  AND table_name = 'video_recording' 
  AND column_name LIKE 'ai_%';

-- Check indexes
SHOW INDEXES FROM ai_generated_content;
```

---

## 📊 **Performance Considerations**

### **JSON Columns**
- MySQL 5.7+: JSON is stored as binary (efficient)
- Use JSON functions: `JSON_EXTRACT()`, `JSON_CONTAINS()`, `JSON_SEARCH()`
- Consider adding generated columns for frequently queried JSON fields

### **Indexes**
- All indexes are created
- Partial indexes removed (minor performance impact)
- Regular indexes work the same as PostgreSQL

### **Foreign Keys**
- Fully supported in InnoDB
- Same performance characteristics as PostgreSQL

---

## 🔄 **Migration Path**

If you need to migrate from PostgreSQL to MySQL:

1. **Export data** from PostgreSQL (excluding partial indexes)
2. **Run MySQL migration** to create schema
3. **Import data** (may need JSON conversion for arrays)
4. **Update application code** for JSON queries instead of array queries

---

## ✅ **Summary**

| Aspect | Status |
|--------|--------|
| **Core Tables** | ✅ 100% Compatible |
| **Data Types** | ✅ Fully Converted |
| **Indexes** | ✅ Compatible (partial indexes removed) |
| **Foreign Keys** | ✅ Fully Compatible |
| **Triggers/Timestamps** | ✅ Equivalent (different implementation) |
| **Table Modifications** | ✅ Compatible (uses helper procedures) |
| **JSON Support** | ✅ MySQL 5.7+ Required |

**Conclusion**: The MySQL migration is **fully compatible** and ready to use! 🎉

---

## 📝 **Next Steps**

1. ✅ Review the migration file
2. ✅ Ensure helper procedures exist
3. ✅ Test on development database
4. ✅ Run on production (with backup)
5. ✅ Update application code for JSON queries (if using arrays)

