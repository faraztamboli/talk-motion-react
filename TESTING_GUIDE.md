# LLM Integration - Testing Guide

## Overview
This guide covers testing strategies for the LLM integration features.

---

## 🧪 **Test Files Created**

### **1. Hook Tests**
- ✅ `src/__tests__/hooks/useLLM.test.js` - Tests for useLLM hook

### **2. Component Tests**
- ✅ `src/__tests__/components/AIContentGenerator.test.jsx` - Tests for AIContentGenerator
- ✅ `src/__tests__/components/AITutor.test.jsx` - Tests for AITutor

---

## 📋 **Testing Checklist**

### **Unit Tests**
- [x] Hook functions return correct data
- [x] Hook functions handle errors correctly
- [x] Components render correctly
- [x] Components handle user interactions
- [x] Components handle API responses

### **Integration Tests**
- [ ] Components work with real backend API
- [ ] Multiple components work together
- [ ] Data flows correctly between components
- [ ] State management works correctly

### **E2E Tests** (To be created)
- [ ] User can generate AI description
- [ ] User can approve/reject AI content
- [ ] User can chat with AI tutor
- [ ] User can view recommendations
- [ ] User can update AI preferences

### **Accessibility Tests**
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] ARIA labels are correct
- [ ] Focus management works

---

## 🚀 **Running Tests**

### **Using Vitest** (if configured)
```bash
npm run test
```

### **Using Jest** (if configured)
```bash
npm test
```

### **Run specific test file**
```bash
npm test useLLM.test.js
```

---

## 📝 **Test Coverage Goals**

- **Hooks**: 80%+ coverage
- **Components**: 70%+ coverage
- **Integration**: 60%+ coverage
- **E2E**: 50%+ coverage

---

## 🔧 **Mocking Strategy**

### **Backend API**
All backend calls are mocked using `vi.mock()`:
```javascript
vi.mock('../../remotepyjs', () => ({
  default: {
    PythonFunctions: {
      TalkMotionServer: {
        generateVideoDescription: vi.fn(),
        // ... other functions
      },
    },
  },
}));
```

### **Hooks**
Hooks are mocked at the component level:
```javascript
vi.mock('../../hooks/useLLM', () => ({
  default: () => ({
    generateVideoDescription: vi.fn(() => Promise.resolve({...})),
  }),
}));
```

---

## ✅ **Test Status**

- ✅ Hook tests created
- ✅ Component tests created (basic)
- ⏳ Integration tests (pending)
- ⏳ E2E tests (pending)
- ⏳ Accessibility audit (pending)

---

**Next Steps**: 
1. Run tests to verify they work
2. Add more test cases
3. Set up E2E testing framework
4. Perform accessibility audit

