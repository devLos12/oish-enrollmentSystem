import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter as Router } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import { MyGlobalContext } from './context/global.jsx';




createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <MyGlobalContext>
        <App />
      </MyGlobalContext>
    </Router>
  </StrictMode>,
)
