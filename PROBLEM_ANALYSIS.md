# DamarisERP - Problem Analysis & Solutions

## Issues Found

### 1. **Database Connection Error Handling** ❌

**Problem:** If `DATABASE_URL` environment variable is missing, the app crashes silently without clear error message.

**Solution:** ✅ Added validation in `database.py`:

```python
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. Please configure .env file.")
```

---

### 2. **Hardcoded API URL in Frontend** ❌

**Problem:** Frontend hardcodes API URL `http://localhost:8000`, which:

- Can't be changed without code modification
- Won't work in production/staging environments
- Causes CORS issues if URL differs

**Solution:** ✅ Created `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Updated `produk/page.js` to use:

```javascript
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

---

### 3. **Missing Input Validation** ❌

**Problem:** Backend schemas don't validate:

- Empty strings
- Negative/zero values for prices
- Invalid jenis values (should only be "masuk" or "keluar")

**Solution:** ✅ Added Pydantic validation with `Field`:

```python
class ProdukSchema(BaseModel):
    kode: str = Field(..., min_length=1)
    hpp: float = Field(..., gt=0)  # Must be > 0
    harga_jual: float = Field(..., gt=0)

class KasSchema(BaseModel):
    jenis: str = Field(..., regex="^(masuk|keluar)$")  # Only these values
    jumlah: float = Field(..., gt=0)
```

---

### 4. **Restricted CORS Origins** ⚠️

**Problem:** CORS only allows `http://localhost:3000`, but frontend might run on different ports.

**Solution:** ✅ Updated to allow multiple origins:

```python
allow_origins=["http://localhost:3000", "http://localhost:3001"],
```

---

### 5. **Edit Mode - Editable Primary Key** ⚠️

**Problem:** When editing, users can modify the `kode` (primary key), which breaks the update logic.

**Recommendation:** Disable `kode` input field when in edit mode in frontend:

```javascript
disabled={editData !== null}  // Disable when editing
```

---

### 6. **Missing Loading State on Form Submit** ⚠️

**Problem:** No visual feedback while saving (button stays clickable, can submit twice).

**Recommendation:** Add `submitting` state to prevent duplicate submissions.

---

### 7. **Generic Error Messages** ⚠️

**Problem:** Frontend catches errors but shows generic alerts, hiding actual issue.

**Recommendation:** Log errors to console:

```javascript
.catch((err) => {
  console.error("Error:", err);
  alert(err.response?.data?.detail || "Gagal mengambil data produk");
});
```

---

## Setup Instructions

### Backend

```bash
cd backend
pip install fastapi uvicorn sqlalchemy python-dotenv psycopg2
# Ensure .env file has DATABASE_URL set
python -m uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`  
Backend will run on `http://localhost:8000`

---

## Testing Checklist

- [ ] Backend starts without DATABASE_URL error
- [ ] Frontend can fetch products: GET `http://localhost:8000/produk`
- [ ] Can add product with valid data
- [ ] Cannot add product with empty fields or negative prices
- [ ] Can edit/delete products
- [ ] Frontend works on any port (not just 3000)
- [ ] Error messages show helpful details
