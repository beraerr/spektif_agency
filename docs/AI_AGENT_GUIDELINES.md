# 🤖 AI AGENT GUIDELINES - SPEKTIF AGENCY

## 🚨 **CRITICAL WARNINGS FOR AI AGENTS**

### **⚠️ NEVER DO THESE THINGS**

1. **NEVER use `order` field** - Always use `position`
   - ❌ Wrong: `order: number`
   - ✅ Correct: `position: number`

2. **NEVER comment out position update logic** in backend
   - File: `apps/api/src/cards/cards.service.ts`
   - Lines: Card reordering logic must be active

3. **NEVER deploy without TypeScript build check**
   - Always run: `npm run build` in `apps/web`
   - Must pass with 0 errors before committing

4. **NEVER use non-existent properties**
   - ❌ Wrong: `board.name` (doesn't exist)
   - ✅ Correct: `board.title`

5. **NEVER ignore type mismatches**
   - `CardMember[]` must be mapped to `string[]`
   - Use proper type casting for missing properties

---

## 🔧 **REQUIRED CHECKS BEFORE ANY CHANGES**

### **1. TypeScript Build Check**
```bash
cd apps/web
npm run build
# Must return exit code 0
```

### **2. Field Name Verification**
- All position fields must use `position` not `order`
- Check all API calls use correct field names
- Verify DTOs match database schema

### **3. Card Reordering Logic Check**
- File: `apps/api/src/cards/cards.service.ts`
- Ensure position update queries are NOT commented out
- Lines 402-430 must be active

### **4. Type Mapping Verification**
- `CardData.members` expects `string[]`
- Backend returns `CardMember[]` objects
- Must map: `member.user?.name || member.user?.email`

---

## 📁 **CRITICAL FILES TO CHECK**

### **Frontend Files**
- `apps/web/src/hooks/use-boards.ts` - Interface definitions
- `apps/web/src/hooks/use-board.ts` - Hook implementations
- `apps/web/src/lib/api.ts` - API client calls
- `apps/web/src/app/[locale]/org/[orgId]/board/[boardId]/page.tsx` - Type mappings

### **Backend Files**
- `apps/api/src/boards/dto/boards.dto.ts` - DTO field names
- `apps/api/src/cards/cards.service.ts` - Card reordering logic
- `apps/api/prisma/schema.prisma` - Database schema

---

## 🚀 **DEPLOYMENT WORKFLOW**

### **1. Make Changes**
- Follow field naming conventions
- Check TypeScript compilation
- Verify type mappings

### **2. Test Locally**
```bash
# Frontend build test
cd apps/web && npm run build

# Backend build test  
cd apps/api && npm run build
```

### **3. Commit & Push**
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### **4. Verify Deployment**
- **Vercel**: Check build logs for TypeScript errors
- **Render**: Check API health endpoint
- **Railway**: No changes needed (database)

---

## 🔍 **TROUBLESHOOTING COMMON ISSUES**

### **Vercel Build Fails**
1. Check TypeScript errors in build logs
2. Verify all field names use `position`
3. Check type mappings for `CardData`
4. Remove references to non-existent properties

### **Render API Fails**
1. Check environment variables
2. Verify `DATABASE_URL` format
3. Check if card reordering logic is active
4. Verify DTOs use `position` field

### **Database Operations Fail**
1. Check Railway connection string
2. Verify schema uses `position` field
3. Check Prisma migrations are up to date
4. Verify field mappings in service layer

---

## 📝 **CODE EXAMPLES**

### **✅ CORRECT Field Usage**
```typescript
// Frontend interface
export interface List {
  id: string
  title: string
  position: number  // ← Correct
}

// Backend DTO
export class UpdateListDto {
  title?: string
  position?: number  // ← Correct
}

// API call
await apiClient.updateList(listId, { position: newPosition })
```

### **❌ WRONG Field Usage**
```typescript
// ❌ NEVER DO THIS
export interface List {
  id: string
  title: string
  order: number  // ← Wrong field name
}

// ❌ NEVER DO THIS
await apiClient.updateList(listId, { order: newPosition })
```

### **✅ CORRECT Type Mapping**
```typescript
// Convert CardMember[] to string[]
members: card.members?.map(member => 
  member.user?.name || member.user?.email || 'Unknown'
) || []
```

---

## 🎯 **SUCCESS CRITERIA**

### **Before Deploying**
- [ ] TypeScript build passes (`npm run build`)
- [ ] All field names use `position` not `order`
- [ ] Card reordering logic is active in backend
- [ ] Type mappings handle `CardMember[]` → `string[]`
- [ ] No references to non-existent properties

### **After Deploying**
- [ ] Vercel deployment succeeds
- [ ] Render API responds to health check
- [ ] Frontend can create/edit boards, lists, cards
- [ ] Drag & drop functionality works
- [ ] Changes persist after page refresh

---

## 📞 **EMERGENCY CONTACTS**

### **Deployment URLs**
- **Frontend**: https://spektif-agency-final.vercel.app
- **Backend**: https://spektif-agency.onrender.com
- **Health Check**: https://spektif-agency.onrender.com/api/health

### **Admin Credentials**
- **Email**: admin@spektif.com
- **Password**: admin123

---

**🤖 Remember: When in doubt, check the field names and run the TypeScript build!**
