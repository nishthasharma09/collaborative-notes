class WebSocketClient {
  constructor(noteId, token) {
    this.noteId = noteId;
    this.token = token;
    this.socket = new WebSocket(`ws://localhost:8000/ws/notes/${noteId}`);

    this.socket.onopen = () => {
      console.log("WebSocket connection opened.");
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error: ", error);
    };
  }

  send(data, userId) {
    const message = {
      ...data,
      user_id: localStorage.getItem("email"),
      token: this.token,
    };
    console.log(message);
    this.socket.send(JSON.stringify(message));
  }

  onMessage(callback) {
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };
  }

  close() {
    this.socket.close();
  }
}

export default WebSocketClient;
