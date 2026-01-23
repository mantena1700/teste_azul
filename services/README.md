# Services Documentation

## Overview
This directory contains the integration logic with the backend API. It acts as a bridge between the frontend components and the server.

## Key Files
- **`ApiService.ts`**: The primary service file containing all HTTP request functions.

## Pattern
We use a collection of asynchronous functions that wrap the native `fetch` API.
- **Base URL**: Defined via `VITE_API_URL` environment variable (defaults to `/api`).
- **Error Handling**: The `apiCall` helper function detects non-OK responses and throws errors, which should be caught by the calling component.

## How to Add a New Service Method
1.  Open `ApiService.ts`.
2.  Locate the relevant section (e.g., Users, Patients, Financial).
3.  Export a new async function.
4.  Use the `apiCall` helper.

### Example
```typescript
// GET Request
export async function getSomething(id: string): Promise<any> {
    return apiCall(`/something/${id}`);
}

// POST Request
export async function createSomething(data: any): Promise<{ success: boolean; data: any }> {
    return apiCall('/something', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
```

## Types
- Wherever possible, use TypeScript interfaces/types defined in `../types.ts` to type the return values and parameters.
