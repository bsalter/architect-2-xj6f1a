import React from 'react'; // react v18.2.0
import ReactDOM from 'react-dom/client'; // react-dom v18.2.0
import { createRoot } from 'react-dom/client'; // react-dom/client v18.2.0

// Internal imports
import App from './App';
import './assets/styles/index.css';

/**
 * Renders the root App component into the DOM using React 18's createRoot API
 */
const renderApp = (): void => {
  // LD1: Find the root DOM element with id 'root'
  const rootElement = document.getElementById('root');

  // LD2: Handle cases where the root element is not found with appropriate error logging
  if (!rootElement) {
    console.error('Root element with id "root" not found in the document.');
    return;
  }

  // IE1: Create a React root using createRoot
  const root = createRoot(rootElement);

  // IE2: Render the App component wrapped in React.StrictMode for additional development checks
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Call the renderApp function to start the application
renderApp();