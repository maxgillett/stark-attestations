import * as Wasm from '../pkg';
import * as React from 'react';
import Button from '@mui/material/Button';
import { 
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import HomePage from "./pages/Home/HomePage"
import MintPage from "./pages/Mint/MintPage"
import ViewAccountPage from "./pages/Badges/ViewAccountPage"
import ViewBadgePage from "./pages/Badges/ViewBadgePage"
import Header from "./components/Header/Header"

export default function App() {	
  return (
    <div style={{width: '100%'}}>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/mint" element={<MintPage/>}/>
          <Route path="/view/account/:account" element={<ViewAccountPage/>}/>
          <Route path="/view/badge/:cid" element={<ViewBadgePage/>}/>
        </Routes>
      </Router>
    </div>
  )
}
