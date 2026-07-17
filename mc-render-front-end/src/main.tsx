import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Upload from './Upload.tsx'
import { BrowserRouter, Routes, Route } from "react-router";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter >
      <Routes>
        <Route path="/" index element={<App />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
  ,
)
