import React from "react";
import DeleteIcon from "@mui/icons-material/Delete";

function Note(props) {
  function handleDeleteClick(event) {
    event.stopPropagation();
    props.onDelete(props.id);
  }

  function handleNoteClick() {
    props.onOpenDialog(props.note);
  }

  return (
    <div className="note" onClick={handleNoteClick}>
      <h1>{props.title}</h1>
      <p>{props.content}</p>
      <button onClick={handleDeleteClick}>
        <DeleteIcon />
      </button>
    </div>
  );
}

export default Note;
