import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography } from '@mui/material';
import { Assessment } from '@mui/icons-material';
import SurveyList from './pages/SurveyList';
import SurveyDashboard from './pages/SurveyDashboard';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Assessment sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Survey Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Routes>
          <Route path="/" element={<SurveyList />} />
          <Route path="/surveys/:id" element={<SurveyDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
