# Pages Documentation

## Overview
This directory contains the main views (routes) of the application. Each file corresponds to a major feature or screen in the system.

## Key Pages
- **`Dashboard.tsx`**: Main landing page with overview stats.
- **`PatientProfile.tsx`**: Detailed view of a patient, including clinical data, PEI, and documents.
- **`SessionRunner.tsx`**: interface for therapists to run ABA sessions and collect data.
- **`TeamManagement.tsx`**: Admin view to manage users and permissions.
- **`Financial.tsx`**: Financial dashboard, transactions, and reports.
- **`TimeClock.tsx`**: Employee time tracking (ponto).
- **`SaaSAdmin.tsx`**: Super-admin panel for managing clinics (SaaS level).

## Page Structure Pattern
Most pages follow this structure:
1.  **Imports**: React hooks, icons, services, types.
2.  **Component Definition**: `export const PageName: React.FC = () => { ... }`.
3.  **State Management**: `useState` for local data (forms, modals, lists).
4.  **Effects**: `useEffect` for initial data fetching (usually calling `ApiService`).
5.  **Helper Functions**: Handlers for clicks, form submissions, and calculations.
6.  **Render**:
    - **Header**: Page title and main actions.
    - **Content Grid**: The detailed content, often using responsive grid layouts.
    - **Modals**: Conditional rendering of modals (e.g., `{isModalOpen && <Modal ... />}`).

## Data Fetching
- Use `useEffect` to trigger data loading on mount.
- Use `ApiService` methods (e.g., `ApiService.getPatients()`) instead of raw `fetch`.
- Handle loading states (optional but recommended) and errors.

## Routing
- Routes are defined in the main `App.tsx` (or `index.tsx`).
- To add a new page:
  1. Create `NewPage.tsx` in this folder.
  2. Import it in `App.tsx`.
  3. Add a `<Route path="/new-route" element={<NewPage />} />`.

## Best Practices
- **Keep it Clean**: If a page gets too large (>500 lines), consider extracting parts into `components/`.
- **Modals**: If a modal is complex, move it to its own file in `components/`.
- **State**: Use `useContext` (like `AuthContext` or `DataContext`) for global state, but keep UI-specific state local.
