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
import Avatar from "@mui/material/Avatar";

function NoteDialog({ open, onClose, note, onSave, onShare, wsClient }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [email, setEmail] = useState("");
  const [cursors, setCursors] = useState({});
  const contentRef = useRef(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  useEffect(() => {
    if (wsClient) {
      wsClient.onMessage((data) => {
        if (data.type === "cursor") {
          setCursors((prevCursors) => ({
            ...prevCursors,
            [data.user_id]: data,
          }));
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

  const handleCursorMove = (e) => {
    const token = localStorage.getItem("access_token");
    const userEmail = token ? JSON.parse(atob(token.split(".")[1])).sub : null;

    if (wsClient && userEmail) {
      const cursorData = {
        type: "cursor",
        user_id: userEmail,
        cursor_position: contentRef.current.selectionStart,
      };
      wsClient.send(cursorData);
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
          onChange={(e) => setContent(e.target.value)}
          onKeyUp={handleCursorMove}
          inputRef={contentRef}
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
        <div>
          {Object.entries(cursors).map(([user_id, cursor]) => (
            <div key={user_id} style={{ position: "relative" }}>
              <Avatar
                style={{
                  position: "absolute",
                  left: cursor.cursor_position,
                  top: -10,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {user_id[0].toUpperCase()}
              </Avatar>
            </div>
          ))}
        </div>
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
