# FindSafety

FindSafety is a web application designed to provide users with insights into crime trends, statistics, and alerts in their area. It leverages modern web technologies and backend services to deliver a seamless and informative experience.

## Features

- **Crime Map**: Visualize crime data on an interactive map.
- **Crime Trends**: Analyze historical crime trends.
- **Crime Statistics**: View detailed statistics about crimes in specific areas.
- **Alerts**: Receive notifications about recent crimes.
- **Dashboard**: A personalized dashboard for exploring crime data and interacting with features like chat and filters.
- **Community Page**: 

## Project Structure

The project is organized into the following main directories:

### Frontend
- **`app/`**: Contains the main Next.js application files, including layouts, pages, and API routes.
- **`components/`**: Reusable React components for UI elements like buttons, charts, and dialogs.
- **`hooks/`**: Custom React hooks for managing state and behavior.
- **`lib/`**: Utility functions and services for API and authentication.
- **`public/`**: Static assets like images and service worker files.
- **`styles/`**: Global and component-specific styles.

### Backend
- **`backend/`**: Python-based backend services for data processing, authentication, and scraping.
- **`besafe/`**: Virtual environment for Python dependencies.

### Configuration Files
- **`next.config.mjs`**: Next.js configuration.
- **`tailwind.config.ts`**: Tailwind CSS configuration.
- **`tsconfig.json`**: TypeScript configuration.
- **`requirements.txt`**: Python dependencies.

## Installation

### Prerequisites
- Node.js and pnpm for the frontend.
- Python 3.9+ for the backend.

### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd findsafety
  ```

2. Install frontend dependencies:
   ```bash
      pnpm install
   ```

3. Set up the Python virtual environment:
   ```bash
    cd besafe
    source bin/activate
    pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   Add Firebase credentials to findsafety-c108d-firebase-adminsdk-fbsvc-189248dba5.json.
   Set up .env files for both frontend and backend.
  ```

Usage
Frontend
Start the Next.js development server:

```bash
  pnpm dev
```
Backend
Run the Flask backend server:

```bash
  cd backend
  source ../besafe/bin/activate
  python app.py
```

## Technologies Used
- Frontend: Next.js, React, Tailwind CSS
- Backend: Flask, Python
- Database: Firebase
- Other Tools: Docker, Hugging Face Transformers, OpenAI API

## Contributing
Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request.
