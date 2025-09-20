# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a full-stack mobile application built with:
- **Frontend**: React Native with Expo (TypeScript)
- **Backend**: FastAPI (Python)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage

The project follows a monorepo structure:
```
ponpa/
├── frontend/          # React Native Expo app
├── backend/           # FastAPI Python server
├── docs/             # Documentation
├── infrastructure/   # Deployment configs
└── tests/           # Integration tests
```

## Development Commands

### Frontend (React Native/Expo)
Navigate to `frontend/` directory for all frontend commands:

```bash
cd frontend/

# Development
npm start              # Start Expo dev server
npm run android       # Run on Android device/emulator
npm run ios          # Run on iOS device/simulator
npm run web          # Run in web browser

# Testing
npm test             # Run Jest tests
npm run test:watch   # Run tests in watch mode

# Type checking
npx tsc --noEmit     # TypeScript type check only
```

### Backend (FastAPI)
Navigate to `backend/` directory and activate virtual environment:

```bash
cd backend/
source venv/bin/activate  # Activate Python virtual environment

# Development
python -m uvicorn app.main:app --reload  # Start FastAPI dev server
python -m uvicorn app.main:app --reload --port 8001  # Custom port

# Testing
python -m pytest                    # Run all tests
python -m pytest tests/test_auth.py # Run specific test file
python -m pytest -v                # Verbose output

# Dependencies
pip install -r requirements.txt     # Install dependencies
pip freeze > requirements.txt       # Update requirements
```

## Architecture Overview

### Frontend Architecture
- **State Management**: Zustand store (`src/store/useStore.ts`)
- **Navigation**: React Navigation with stack and tab navigators
  - `AppNavigator.tsx` - Main app navigation logic
  - `MainNavigator.tsx` - Post-authentication navigation
  - `AuthNavigator.tsx` - Authentication flow navigation
- **UI Framework**: Tamagui for styling and theming
- **Form Handling**: React Hook Form with Yup validation
- **HTTP Client**: Axios for API calls
- **File Structure**:
  - `src/components/` - Reusable UI components
  - `src/screens/` - Screen components
  - `src/services/` - API and external service integrations
  - `src/utils/` - Utility functions and helpers
  - `src/types/` - TypeScript type definitions
  - `src/constants/` - App constants (colors, dimensions, API endpoints)

### Backend Architecture
- **Framework**: FastAPI with async/await support
- **Authentication**: Firebase Admin SDK integration
- **Database**: Firebase Firestore for data persistence
- **File Storage**: Firebase Storage for images/files
- **Structure**:
  - `app/api/endpoints/` - API route handlers
  - `app/models/` - Data models (User, Wardrobe, Outfit)
  - `app/services/` - Business logic and external integrations
  - `app/core/` - Core functionality (config, security, Firebase setup)
  - `app/utils/` - Utility functions

### Key Integrations
- **Firebase Services**: Authentication, Firestore, Storage
- **Google Generative AI**: AI-powered features
- **Image Processing**: Pillow for image manipulation
- **Security**: JWT tokens, secure password handling

## Development Notes

### Frontend Development
- Expo new architecture is enabled (`newArchEnabled: true`)
- TypeScript strict mode is enabled
- Uses Expo Secure Store for sensitive data
- Image handling with expo-image and expo-image-picker
- Testing setup with Jest and React Native Testing Library

### Backend Development
- Python virtual environment located in `backend/venv/`
- Environment variables should be set in `.env` files
- Firebase Admin SDK requires service account credentials
- FastAPI auto-generates OpenAPI documentation at `/docs`

### Testing
- Frontend: Jest with React Native Testing Library
- Backend: pytest with async test support
- Integration tests located in root `tests/` directory

### Deployment
- Frontend: Expo build and deployment
- Backend: Suitable for containerization with Docker
- Infrastructure configs in `infrastructure/` directory

## Important Files
- `frontend/app.json` - Expo configuration
- `frontend/package.json` - Frontend dependencies and scripts
- `backend/requirements.txt` - Python dependencies
- `backend/app/main.py` - FastAPI application entry point
- `frontend/App.tsx` - React Native app entry point