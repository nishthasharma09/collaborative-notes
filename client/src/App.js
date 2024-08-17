import React, { useState } from "react";
import Header from "./layout/Header";
import Footer from "./layout/Footer";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import Home from "./home/Home";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "./auth/Login";
import RegistrationPage from "./auth/Register";

const keepNotesTheme = createTheme({
  palette: {
    primary: {
      main: "#f5ba13",
    },
    secondary: {
      main: "#808080", // Gray color
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegistrationPage />,
  },
  {
    path: "/notes",
    element: <Home />,
  },
]);

function App() {
  return (
    <ThemeProvider theme={keepNotesTheme}>
      <div>
        <Header />
        <RouterProvider router={router} />
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
