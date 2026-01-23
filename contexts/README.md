# Contexts Documentation

## Overview
This directory contains React Contexts used for global state management. This avoids "prop drilling" and allows data to be accessible throughout the application tree.

## Key Contexts
- **`AuthContext.tsx`**: Manages user authentication state (login, logout, current user, permissions).
- **`DataContext.tsx`** (if present/used): Manages shared application data like lists of patients or clinics to avoid refetching on every page navigate.

## Pattern
1.  **Create Context**: `const MyContext = createContext(...)`.
2.  **Provider Component**: Create a component (e.g., `AuthProvider`) that holds the state and wraps its children with `MyContext.Provider`.
3.  **Custom Hook**: Export a hook (e.g., `useAuth`) to easily consume the context.

## Usage
To use a context in a component:
```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
    const { user, login } = useAuth();
    // ...
};
```

## Adding a New Context
1.  Create `NewContext.tsx`.
2.  Define the shape of your context data.
3.  Implement the Provider and Hook.
4.  Wrap the application (in `index.tsx` or `App.tsx`) with `<NewContextProvider>`.
