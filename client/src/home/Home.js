import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Note from "../Note";
import CreateArea from "../CreateArea";
import NoteDialog from "../NoteDialog";
import WebSocketClient from "../WebSocketClient";

function Home() {
  const [notes, setNotes] = useState([]);
  const [refreshNotes, setRefreshNotes] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const wsClient = useRef(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get("http://localhost:8000/get-notes", {
          headers: {
            Token: `${token}`,
          },
        });
        setNotes(response.data);
      } catch (error) {
        console.log("Error in get notes", error);
      }
    };

    fetchNotes();
  }, [refreshNotes]);

  const addNote = async (newNote) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.post("http://localhost:8000/add-note", newNote, {
        headers: {
          Token: `${token}`,
        },
      });
      setRefreshNotes(!refreshNotes);
    } catch (error) {
      console.log("Failed to add note", error);
    }
  };

  const deleteNote = (id) => {
    axios
      .delete(`http://localhost:8000/delete-note/${id}`, {
        headers: {
          Token: `${localStorage.getItem("access_token")}`,
        },
      })
      .then((res) => console.log(res))
      .catch((err) => console.log("error in delete note", err));
    setRefreshNotes(!refreshNotes);
  };

  const openDialog = (note) => {
    const token = localStorage.getItem("access_token");
    setSelectedNote(note);
    setIsDialogOpen(true);
    // Initialize WebSocket connection when opening a note
    const userId = localStorage.getItem("email");
    wsClient.current = new WebSocketClient(note.id, token);

    // Handle incoming messages
    wsClient.current.onMessage((data) => {
      if (data.type === "content" && data.noteId === note.id) {
        setSelectedNote((prevNote) => ({
          ...prevNote,
          title: data.title,
          content: data.content,
        }));
      }
    });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedNote(null);
    // Close WebSocket connection when closing the note dialog
    if (wsClient.current) {
      wsClient.current.close();
      wsClient.current = null;
    }
  };

  const saveNote = async (updatedNote) => {
    try {
      const userId = localStorage.getItem("email");
      wsClient.current.send({
        type: "content",
        title: updatedNote.title,
        content: updatedNote.content,
        user_id: userId,
        token: localStorage.getItem("access_token"),
      });

      // Additionally, you can perform an HTTP PUT request if needed
      const token = localStorage.getItem("access_token");
      await axios.put(
        `http://localhost:8000/update-note/${updatedNote.id}`,
        updatedNote,
        {
          headers: {
            Token: `${token}`,
          },
        }
      );
      setRefreshNotes(!refreshNotes);
    } catch (error) {
      console.log("Failed to update note", error);
    }
  };

  const shareNote = async (noteId, email) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.put(
        `http://localhost:8000/add-owner/${noteId}?ownerId=${encodeURIComponent(
          email
        )}`,
        {},
        {
          headers: {
            Token: `${token}`,
          },
        }
      );
      console.log(`Note shared with ${email}: ${response.data.message}`);
    } catch (error) {
      console.log("Failed to share note", error);
    }
  };

  return (
    <div>
      <CreateArea onAdd={addNote} />
      {notes.map((noteItem, index) => (
        <Note
          key={index}
          note={noteItem}
          id={noteItem.id}
          title={noteItem.title}
          content={noteItem.content}
          onDelete={deleteNote}
          onOpenDialog={openDialog}
        />
      ))}
      <NoteDialog
        open={isDialogOpen}
        onClose={closeDialog}
        note={selectedNote}
        onSave={saveNote}
        onShare={shareNote}
        wsClient={wsClient.current}
      />
    </div>
  );
}

export default Home;
