# Components Documentation

## Overview
This directory contains reusable UI components used throughout the application. Currently, it houses the main `Layout` component, but it serves as the home for any button, card, modal, or input field that is used in multiple pages.

## Directory Structure
- `Layout.tsx`: The main application shell. It handles the sidebar navigation, header, and wraps the main content area.

## Component Patterns
- **Functional Components**: Use React Functional Components (`React.FC`).
- **Props Interface**: Always define a TypeScript interface for props.
- **Styling**: Use Tailwind CSS classes directly in the JSX.
- **Icons**: Use `lucide-react` for icons.

## Adding a New Component
1.  Create a new file, e.g., `MyComponent.tsx`.
2.  Define the props interface.
3.  Implement the component using the standard pattern:
    ```tsx
    import React from 'react';

    interface MyComponentProps {
        title: string;
        isActive?: boolean;
    }

    export const MyComponent: React.FC<MyComponentProps> = ({ title, isActive }) => {
        return (
            <div className={`p-4 ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`}>
                <h3 className="font-bold">{title}</h3>
            </div>
        );
    };
    ```
4.  Export the component (named export preferred).

## Future Improvements
- Move modals (currently inline in Pages) to this folder (e.g., `EditPatientModal.tsx`).
- Create a `ui` subfolder for atomic elements like `Button`, `Input`, `Card`.
