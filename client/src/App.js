import React, { useState } from "react";
import Header from "./layout/Header";
import Footer from "./layout/Footer";

import { ThemeProvider } from "@mui/material/styles";

import { createTheme } from "@mui/material/styles";
import Home from "./home/Home";

const keepNotesTheme = createTheme({
  palette: {
    primary: {
      main: "#ffffff", // White background for the notes
    },
    secondary: {
      main: "#fbbc04", // Accent color, e.g., for buttons or icons
    },
    text: {
      primary: "#202124", // Primary text color
      secondary: "#5f6368", // Secondary text color
    },
    background: {
      default: "#f1f3f4", // Background color for the app
      paper: "#ffffff", // Paper component background
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "1.5rem",
      fontWeight: 400,
    },
    h2: {
      fontSize: "1.3rem",
      fontWeight: 400,
    },
    body1: {
      fontSize: "1rem",
    },
    button: {
      textTransform: "none", // Keep text as-is in buttons
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: "#202124",
          backgroundColor: "#f1f3f4",
          "&:hover": {
            backgroundColor: "#e8eaed",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(60,64,67,.3)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: "#202124",
          boxShadow: "none",
          borderBottom: "1px solid #dadce0",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "#f1f3f4",
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#e0e0e0",
            },
            "&:hover fieldset": {
              borderColor: "#d2d2d2",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#a8a8a8",
            },
          },
        },
      },
    },
  },
});

function App() {
  const [notes, setNotes] = useState([]);

  function addNote(newNote) {
    setNotes((prevNotes) => {
      return [...prevNotes, newNote];
    });
  }

  function deleteNote(id) {
    setNotes((prevNotes) => {
      return prevNotes.filter((noteItem, index) => {
        return index !== id;
      });
    });
  }

  return (
    <ThemeProvider theme={keepNotesTheme}>
      <div>
        <Header />
        <Home />
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
