import Note from "../Note";
import CreateArea from "../CreateArea";
import { useEffect, useState } from "react";
import axios from "axios";

function Home() {
  const [notes, setNotes] = useState([]);
  const [refreshNotes, setRefreshNotes] = useState(false);

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
      const response = await axios.post(
        "http://localhost:8000/add-note",
        newNote,
        {
          headers: {
            Token: `${token}`,
          },
        }
      );
      setRefreshNotes(!refreshNotes);
    } catch (error) {
      console.log("Failed to add note", error);
    }
  };

  function deleteNote(id) {
    axios
      .delete(`http://localhost:8000/delete-note/${id}`, {
        headers: {
          Token: `${localStorage.getItem("access_token")}`,
        },
      })
      .then((res) => console.log(res))
      .catch((err) => console.log("error in delete note", err));
    setRefreshNotes(!refreshNotes);
  }

  return (
    <div>
      <CreateArea onAdd={addNote} />
      {notes.map((noteItem, index) => {
        return (
          <Note
            key={index}
            id={noteItem.id}
            title={noteItem.title}
            content={noteItem.content}
            onDelete={deleteNote}
          />
        );
      })}
    </div>
  );
}

export default Home;
