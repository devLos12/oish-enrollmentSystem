# Auto-Fetch Track & Strand Analysis

## 📊 Current Status

### ✅ IMPLEMENTED (Track → Strand Auto-Fetch Pattern)

#### 1. **Subjects Management** (`subjects.jsx` - Lines 829-847)
- **Track Select**: Changes strand to empty string
  ```jsx
  onChange={(e) => setSelectedSubject({ ...selectedSubject, track: e.target.value, strand: '' })}
  ```
- **Strand Select**: 
  - Disabled until track selected: `disabled={!selectedSubject?.track}`
  - Dynamic options: `getStrandOptions(selectedSubject.track)`
  - Smart messaging: "Select Track First" vs "Select Strand"
- **Location**: Modal (add/edit subject)
- **Status**: ✅ Full implementation

#### 2. **Section Management** (`sectionmanagement.jsx` - Lines 872-898)
- **Track Select**: Changes strand to empty string
  ```jsx
  onChange={(e) => setSelectedSection({ ...selectedSection, track: e.target.value, strand: "" })}
  ```
- **Strand Select**:
  - Disabled until track selected: `disabled={!selectedSection?.track}`
  - Dynamic options: `getStrandOptions(selectedSection?.track)`
  - Smart messaging: "Select Track First" vs "Select Strand"
- **Location**: Modal (add/edit section)
- **Status**: ✅ Full implementation

#### 3. **Import Modals (Both Files)**
- Manual entry rows sa import features both have the auto-fetch pattern
- Subjects: Lines 1292-1304
- Sections: Lines 1330-1342

---

### ❌ INCOMPLETE (Needs Implementation)

#### **Edit Student** (`editStudent.jsx` - Lines 342-368)

**Current Implementation:**
```jsx
// Track select - Line 343-353
<select value={selectedStudent?.track || ''} 
    onChange={(e) => setSelectedStudent({ ...selectedStudent, track: e.target.value, strand: '' })}
    disabled={!isAcademicFieldsEditable}>

// Strand select - Line 356-368  
<select value={selectedStudent?.strand || ''}
    onChange={(e) => setSelectedStudent({ ...selectedStudent, strand: e.target.value })}
    disabled={!isAcademicFieldsEditable}>  // ⚠️ ISSUE: Based on editability, not track selection
    <option value="">Select Strand</option>
    {selectedStudent?.track && trackStrandMapping[selectedStudent.track]?.map(...)}
</select>
```

**Issues Found:**
1. ✅ Track clears strand on change - CORRECT
2. ✅ Strand options are dynamically populated - CORRECT  
3. ❌ **Missing**: Smart disable logic for strand (should be `disabled={!isAcademicFieldsEditable || !selectedStudent?.track}`)
4. ❌ **Missing**: Smart messaging ("Select Track First" vs "Select Strand")
5. ❌ **Missing**: The disable logic prioritizes editability over track selection

---

## 📋 Complete Pattern Checklist

### What the FULL Pattern Includes:

```jsx
// TRACK SELECT
<select 
    value={selectedItem?.track || ''} 
    onChange={(e) => setSelectedItem({ ...selectedItem, track: e.target.value, strand: '' })}
>
    <option value="">Select Track</option>
    {trackOptions.map(t => <option value={t}>{t}</option>)}
</select>

// STRAND SELECT  
<select 
    value={selectedItem?.strand || ''}
    onChange={(e) => setSelectedItem({ ...selectedItem, strand: e.target.value })}
    disabled={!selectedItem?.track}  // ✅ Disable until track selected
>
    {/* ✅ Smart messaging */}
    <option value="">
        {!selectedItem?.track ? 'Select Track First' : 'Select Strand'}
    </option>
    {selectedItem?.track && getStrandOptions(selectedItem.track).map(s => 
        <option value={s}>{s}</option>
    )}
</select>
```

---

## 🛠️ Recommended Fix for Edit Student

**Update lines 356-368** to match the pattern:

```jsx
<select
    className="form-select"
    value={selectedStudent?.strand || ''}
    onChange={(e) => setSelectedStudent({ ...selectedStudent, strand: e.target.value })}
    disabled={!isAcademicFieldsEditable || !selectedStudent?.track}
>
    <option value="">
        {!selectedStudent?.track ? 'Select Track First' : 'Select Strand'}
    </option>
    {selectedStudent?.track && trackStrandMapping[selectedStudent.track]?.map(strand => (
        <option key={strand} value={strand}>{strand}</option>
    ))}
</select>
```

---

## 🔍 Other Modules to Check

You might want to audit these components for the same pattern:
- `applicant-form.jsx` - Probably has form with track/strand
- `updateEnrollment.jsx` - May need track/strand selects
- `registrationViewForm.jsx` - Student registration form

