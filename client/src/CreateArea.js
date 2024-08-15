import React, { useState } from "react";
import { Zoom, Fab, TextField, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

function CreateArea(props) {
  const [isExpanded, setExpanded] = useState(false);
  const [note, setNote] = useState({
    title: "",
    content: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setNote((prevNote) => ({
      ...prevNote,
      [name]: value,
    }));
  }

  function submitNote(event) {
    event.preventDefault();
    props.onAdd(note);
    setNote({
      title: "",
      content: "",
    });
  }

  function expand() {
    setExpanded(true);
  }

  return (
    <Box component="form" className="create-note" onSubmit={submitNote}>
      <TextField
        name="title"
        onChange={handleChange}
        value={note.title}
        label="Title"
        fullWidth
        margin="normal"
      />

      <TextField
        name="content"
        onClick={expand}
        onChange={handleChange}
        value={note.content}
        label="Take a note..."
        multiline
        rows={isExpanded ? 3 : 1}
        fullWidth
        margin="normal"
      />
      <Zoom in={isExpanded}>
        <Fab type="submit" color="primary">
          <AddIcon />
        </Fab>
      </Zoom>
    </Box>
  );
}

export default CreateArea;
