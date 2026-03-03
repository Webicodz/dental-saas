# 🎓 LESSON 1: Authentication System - What We Built

## 📚 What You Just Learned

Congratulations! We just built a complete authentication system together. Let me explain what each file does and how they work together.

---

## 🏗️ **Files We Created**

### 1. `lib/prisma.js` - Database Connection
**What it does:** Connects to PostgreSQL database  
**CodeIgniter equivalent:** `$this->load->database()`

**Why we need it:**
- Single connection shared across the app
- Prevents creating too many database connections
- Auto-completes table/column names (type-safe!)

**Key concept:** Import once, use everywhere

---

### 2. `lib/auth.js` - Authentication Utilities
**What it does:** Helper functions for passwords and tokens  
**CodeIgniter equivalent:** `application/helpers/auth_helper.php`

**Functions:**
- `hashPassword()` - Encrypt passwords before saving
- `comparePassword()` - Check if password is correct
- `generateToken()` - Create JWT token for logged-in users
- `verifyToken()` - Check if token is valid

**Why JWT instead of sessions?**
- Works across multiple servers
- No database lookups needed
- More secure for APIs
- Can be verified anywhere

---

### 3. `app/api/auth/login/route.js` - Login API
**What it does:** Handles login requests  
**CodeIgniter equivalent:** `Auth controller → login() method`

**Flow:**
1. Receive email + password
2. Find user in database
3. Compare password (using bcrypt)
4. Generate JWT token
5. Return token to frontend

**URL:** `POST /api/auth/login`

---

### 4. `app/api/auth/register/route.js` - Register API
**What it does:** Creates new user accounts  
**CodeIgniter equivalent:** `Auth controller → register() method`

**Flow:**
1. Receive user data
2. Validate (check required fields, email format, etc.)
3. Check if email already exists
4. Hash password
5. Insert into database
6. Generate token (auto-login)
7. Return token

**URL:** `POST /api/auth/register`

---

### 5. `app/login/page.js` - Login Page (Frontend)
**What it does:** Shows login form to users  
**CodeIgniter equivalent:** `application/views/auth/login.php`

**But better because:**
- No page reload (AJAX built-in)
- Real-time validation
- Loading states
- Error handling
- Beautiful UI

**URL:** `/login`

---

## 🔄 **How They Work Together**

### **Login Flow (Step by Step):**

```
┌──────────────────────────────────────────────────┐
│ 1. User visits /login                            │
│    → app/login/page.js renders                   │
└────────────┬─────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────┐
│ 2. User enters email + password                  │
│    → Stored in React state (useState)            │
└────────────┬─────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────┐
│ 3. User clicks "Sign In"                         │
│    → handleLogin() function runs                 │
└────────────┬─────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────┐
│ 4. Frontend sends POST to /api/auth/login        │
│    → app/api/auth/login/route.js receives it     │
└────────────┬─────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────┐
│ 5. API queries database (Prisma)                 │
│    → lib/prisma.js connection used               │
│    → SELECT * FROM users WHERE email = ?         │
└────────────┬─────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────┐
│ 6. API compares password                         │
│    → lib/auth.js → comparePassword()             │
│    → bcrypt.compare(plain, hashed)               │
└────────────┬─────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────┐
│ 7. If match: Generate JWT token                  │
│    → lib/auth.js → generateToken()               │
│    → Returns encrypted token                     │
└────────────┬─────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────┐
│ 8. API sends token back to frontend              │
│    → JSON response with token + user data        │
└────────────┬─────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────┐
│ 9. Frontend saves token                          │
│    → localStorage.setItem('token', token)        │
│    → Now user is "logged in"                     │
└────────────┬─────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────┐
│ 10. Redirect to dashboard                        │
│     → router.push('/dashboard')                  │
└──────────────────────────────────────────────────┘
```

---

## 🎯 **Key Concepts You Learned**

### 1. **API Routes in Next.js**
```javascript
// app/api/auth/login/route.js
export async function POST(request) {
  // Handle POST requests
}
```
**VS CodeIgniter:**
```php
// application/controllers/Auth.php
public function login() {
  if ($this->input->method() === 'post') {
    // Handle POST
  }
}
```

---

### 2. **React Hooks (useState)**
```javascript
const [email, setEmail] = useState('')
```
**What this means:**
- `email` = current value
- `setEmail` = function to update value
- When value changes, component re-renders

**VS CodeIgniter:**
Like form validation library or flashdata

---

### 3. **Async/Await (Modern JavaScript)**
```javascript
const response = await fetch('/api/auth/login', {...})
const data = await response.json()
```
**What this means:**
- `await` = wait for this to finish before continuing
- Replaces callbacks/promises
- Cleaner code

**VS CodeIgniter:**
Like waiting for database query result

---

### 4. **JWT Tokens**
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Decoded: { userId: '123', email: 'user@example.com' }
```
**What this means:**
- Encrypted data you can verify
- No database lookup needed
- Sent with every request

**VS CodeIgniter sessions:**
- Sessions stored on server
- JWT stored on client
- JWT works better for APIs

---

## 🧪 **How to Test This**

### Step 1: Install Dependencies
```bash
cd dental-saas-selfhosted
npm install
```

### Step 2: Set Up Database
```bash
# Create .env file
DATABASE_URL="postgresql://user:password@localhost:5432/dental_db"
JWT_SECRET="your-secret-key-here"

# Run Prisma migrations
npx prisma db push
npx prisma generate
```

### Step 3: Create Test User (in database)
```bash
# Open Prisma Studio
npx prisma studio

# Or use command line
docker exec -it dental-postgres psql -U dental_user -d dental_db

# Create admin user
INSERT INTO users (id, first_name, last_name, email, password, role, status)
VALUES (
  gen_random_uuid(),
  'Admin',
  'User',
  'admin@demo.com',
  -- Password: 'password123' (hashed)
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'ADMIN',
  'ACTIVE'
);
```

### Step 4: Run the App
```bash
npm run dev
```

### Step 5: Test Login
1. Go to: http://localhost:3000/login
2. Enter:
   - Email: admin@demo.com
   - Password: password123
3. Click "Sign In"
4. Should redirect to /dashboard (we'll build this next!)

---

## 🐛 **Debugging Tips**

### If login fails:
1. **Check browser console** (F12) for errors
2. **Check terminal** for API errors
3. **Check database** - is user there?
4. **Check .env** - is DATABASE_URL correct?

### Common errors:
- "Cannot find module prisma" → Run `npm install`
- "Database connection failed" → Check Docker is running
- "Invalid password" → Password might not be hashed correctly

---

## 📖 **What's Next?**

Now that you have authentication working, we'll build:

### **Lesson 2: Dashboard** (Next)
- Show user info
- Display stats
- Navigation menu
- Protected route (must be logged in)

### **Lesson 3: Patient Management**
- List all patients
- Add new patient
- Edit patient
- Delete patient
- Search/filter

### **Lesson 4: Appointments**
- Calendar view
- Create appointment
- Edit appointment
- Send reminders

Each lesson builds on the previous one!

---

## 💡 **Remember:**

**In CodeIgniter:** Everything is separated
- Controller handles logic
- Model handles database
- View handles display

**In Next.js:** More integrated
- API routes = Controller + Model
- Page components = View + some logic
- Utilities = Helper functions

**Both are valid!** Next.js is just more modern and has:
- Better performance
- Built-in API routes
- Type safety (TypeScript)
- Better developer experience

---

## 🎉 **You Built This!**

You now have:
- ✅ Working login system
- ✅ Password hashing (secure!)
- ✅ JWT authentication
- ✅ Beautiful login page
- ✅ API endpoints

**Ready for Lesson 2?** Let me know and I'll build the Dashboard!
