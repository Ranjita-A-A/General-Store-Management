import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline, Box } from '@mui/material';
import { ThemeProvider } from './theme/ThemeContext';
import darkTheme from './theme/darkTheme';
import lightTheme from './theme/lightTheme';
import { useTheme } from './theme/ThemeContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import InventoryManagement from './pages/InventoryManagement';
import ProfitReport from './pages/ProfitReport';
import LoanManagement from './pages/LoanManagement';
import GenerateBill from './pages/GenerateBill';

function AppContent() {
  const { isDarkMode } = useTheme();

  return (
    <MuiThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          display: 'flex',
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}>
          <Navbar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              height: '100vh',
              overflow: 'auto',
              pt: { xs: 8, sm: 9 },
              px: { xs: 2, sm: 3 },
              pb: { xs: 2, sm: 3 },
              bgcolor: 'background.default'
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<InventoryManagement />} />
              <Route path="/profit-report" element={<ProfitReport />} />
              <Route path="/loans" element={<LoanManagement />} />
              <Route path="/generate-bill" element={<GenerateBill />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
