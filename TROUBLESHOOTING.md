# Troubleshooting Guide

## Fixed: Infinite Loading Issue

The infinite loading issue has been resolved with the following changes:

### ✅ **Solution Implemented:**

1. **AuthContext**: Created proper session management
2. **Conditional Navigation**: App now shows different screens based on auth state
3. **Loading States**: Added proper loading indicators
4. **Error Boundaries**: Added error handling for crashes

### **Authentication Flow:**
- **Loading**: Shows spinner while checking session
- **No Session**: Shows Login/SignUp screens  
- **Has Session**: Shows main app tabs (Home, Search, Goals, Profile)

## **Testing the Fix:**

1. **First Launch**: Should show Login screen (not infinite loading)
2. **After Login**: Should navigate to Home screen automatically
3. **After Logout**: Should return to Login screen

## **Common Issues & Solutions:**

### **Issue: App still loading infinitely**
**Solution**: Check these in order:
```bash
# 1. Clear Expo cache
expo start -c

# 2. Reset Metro bundler  
expo start --reset-cache

# 3. Restart Expo Go app completely
```

### **Issue: "Network request failed"**
**Solution**: Supabase connection problem
- Verify your Supabase URL and keys in `lib/supabase.ts`
- Check internet connection
- Try using different network (mobile data vs WiFi)

### **Issue: "Can't find variable: fetch"**
**Solution**: Add to the top of `App.tsx`:
```typescript
import 'react-native-url-polyfill/auto';
```

### **Issue: Login/SignUp not working**
**Solution**: Check Supabase setup:
1. Run the SQL schema in Supabase dashboard
2. Enable email authentication in Supabase Auth settings
3. Check RLS policies are properly set

### **Issue: App crashes on startup**
**Solution**: Check error logs:
1. Shake device → "Debug Remote JS" 
2. Open Chrome DevTools
3. Look for specific error messages

## **Debug Commands:**

```bash
# Clear everything and restart fresh
expo start -c --reset-cache

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting issues  
npx eslint . --ext .ts,.tsx
```

## **Key Changes Made:**

### **1. AuthContext (`contexts/AuthContext.tsx`)**
- Manages authentication state globally
- Handles session checking and auth state changes
- Provides `loading`, `session`, `user`, and `signOut`

### **2. AppNavigator (`navigation/AppNavigator.tsx`)**  
- Conditional rendering based on auth state
- LoadingScreen while checking session
- AuthStack (Login/SignUp) when not authenticated
- TabNavigator when authenticated

### **3. Screens Updated**
- LoginScreen: Removed manual navigation (handled by AuthContext)
- SignUpScreen: Simplified success flow
- ProfileScreen: Uses AuthContext for logout

### **4. Error Handling**
- ErrorBoundary component catches React errors
- Better error handling in API calls
- Graceful fallbacks for missing data

## **Expected Behavior:**

1. **App Launch**: 
   - Shows loading spinner briefly
   - Then shows Login screen

2. **User Signs Up**:
   - Creates account in Supabase
   - Shows success message
   - Redirects to Login screen

3. **User Logs In**:
   - Authenticates with Supabase
   - AuthContext detects session change
   - Automatically shows main app tabs

4. **User Logs Out**:
   - Clears session in Supabase
   - AuthContext detects change
   - Returns to Login screen

The app should now work smoothly without infinite loading issues!