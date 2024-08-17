import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";

function NoteDialog({ open, onClose, note, onSave, onShare, wsClient }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  useEffect(() => {
    if (wsClient) {
      wsClient.onMessage((data) => {
        if (data.type === "content") {
          setTitle(data.title);
          setContent(data.content);
        }
      });
    }
  }, [wsClient]);

  const handleSave = () => {
    onSave({ ...note, title, content });
    onClose();
  };

  const handleShare = () => {
    onShare(note.id, email);
    setEmail("");
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (wsClient) {
      const updatedNote = {
        type: "content",
        title: title,
        content: newContent,
        user_id: localStorage.getItem("email"),
        token: localStorage.getItem("access_token"),
      };
      wsClient.send(updatedNote);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Edit Note</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Title"
          type="text"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Content"
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={content}
          onChange={handleContentChange}
        />
        <TextField
          margin="dense"
          label="Share with Email"
          type="email"
          fullWidth
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button startIcon={<ShareIcon />} onClick={handleShare} color="primary">
          Share
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NoteDialog;
