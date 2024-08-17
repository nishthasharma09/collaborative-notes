class WebSocketClient {
  constructor(noteId, token) {
    this.noteId = noteId;
    this.token = token;
    this.socket = new WebSocket(`ws://localhost:8000/ws/notes/${noteId}`, [], {
      headers: {
        "token": `${token}`
    }
    });
    this.socket.onopen = () => {
      console.log("WebSocket connection opened.");
      this.socket.send(
        JSON.stringify({ type: "authenticate", token: this.token })
      );
    };
    this.socket.onclose = () => {
      console.log("WebSocket connection closed.");
    };
    this.socket.onerror = (error) => {
      console.error("WebSocket error: ", error);
    };
  }

  send(data) {
    this.socket.send(JSON.stringify(data));
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
