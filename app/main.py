from fastapi import FastAPI, Depends, HTTPException, status, Header, WebSocket, WebSocketDisconnect
from schemas import UserCreate, UserResponse, Token, NoteResponse, NoteCreate, NoteOwnerUpdateResponse, UserListResponse
from auth import authenticate_user, create_access_token, get_password_hash, verify_jwt
from database import users_collection, settings, notes_collection
from datetime import timedelta
import uvicorn
from bson import ObjectId
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows access from these origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all HTTP headers
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, note_id: str, websocket: WebSocket):
        await websocket.accept()
        if note_id not in self.active_connections:
            self.active_connections[note_id] = []
        self.active_connections[note_id].append(websocket)

    def disconnect(self, note_id: str, websocket: WebSocket):
        self.active_connections[note_id].remove(websocket)
        if not self.active_connections[note_id]:
            del self.active_connections[note_id]

    async def broadcast(self, note_id: str, message: str):
        for connection in self.active_connections.get(note_id, []):
            await connection.send_text(message)

manager = ConnectionManager()

@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    user_exists = await users_collection.find_one({"email": user.email})
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    hashed_password = get_password_hash(user.password)
    user_dict = {"email": user.email, "hashed_password": hashed_password}
    new_user = await users_collection.insert_one(user_dict)
    created_user = await users_collection.find_one({"_id": new_user.inserted_id})
    return UserResponse(**created_user)

@app.post("/token", response_model=Token)
async def login_for_access_token(user: UserCreate):
    user = await authenticate_user(user.email, user.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/get-users")
async def get_users():
    users = await users_collection.find().to_list(length=100)
    return UserListResponse(userList=[i["email"] for i in users])

@app.post("/add-note")
async def add_note(note:NoteCreate,token:str=Header(..., description="JWT Token for authorization")):
    email = verify_jwt(token)

    note_dict = {
        "owner_id": [email],
        "title": note.title,
        "content": note.content
    }
    new_note = await notes_collection.insert_one(note_dict)
    created_note = await notes_collection.find_one({"_id":new_note.inserted_id})
    return NoteResponse(id=str(created_note["_id"]),title=created_note["title"],content=created_note["content"])

@app.get("/get-note/{noteId}", response_model=NoteResponse)
async def get_note_by_id(noteId:str,token:str=Header(..., description="JWT Token for authorization")):
    email = verify_jwt(token)
    note = await notes_collection.find_one({"_id":ObjectId(noteId)})
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if email not in note["owner_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This user is not authorised to view this note")
    
    return NoteResponse(id=str(note["_id"]), title=note["title"], content=note["content"])

@app.get("/get-notes/", response_model=List[NoteResponse])
async def get_all_notes(token:str=Header(..., description="JWT Token for authorization")):
    email = verify_jwt(token)
    notes = [note for note in await notes_collection.find().to_list(length=100) if email in note["owner_id"]]
    if notes is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Notes found for this owner")
    
    return [NoteResponse(id=str(note["_id"]), title=note["title"], content=note["content"]) for note in notes]

@app.websocket("/ws/notes/{noteId}")
async def websocket_endpoint(websocket: WebSocket, noteId: str, token:str=Header(..., description="JWT Token for authorization")):
    email = verify_jwt(token)
    await manager.connect(noteId, websocket)
    try:
        while True:
            note_to_be_updated = await notes_collection.find_one({"_id":ObjectId(noteId)})
            if note_to_be_updated is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
            if email not in note_to_be_updated["owner_id"]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This user is not authorised to update this note")
            data = await websocket.receive_json()

            if data['type'] == 'content':
                await notes_collection.update_one(
                    {"_id": ObjectId(noteId)},
                    {"$set": {"title":data.title, "content":data.content}}
                )
                await manager.broadcast(noteId, data)
            elif data['type'] == 'cursor':
                cursor_data = {
                    "type": "cursor",
                    "user_id": data["user_id"],
                    "cursor_position": data["cursor_position"]
                }
                await manager.broadcast(noteId, cursor_data)

    except WebSocketDisconnect:
        manager.disconnect(noteId, websocket)

@app.put("/update-note/{noteId}", response_model=NoteResponse)
async def update_note(note:NoteCreate, noteId:str,token:str=Header(..., description="JWT Token for authorization")):
    email = verify_jwt(token)
    note_to_be_updated = await notes_collection.find_one({"_id":ObjectId(noteId)})
    if note_to_be_updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if email not in note_to_be_updated["owner_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This user is not authorised to update this note")
    
    await notes_collection.update_one(
        {"_id": ObjectId(noteId)},
        {"$set": {"title":note.title, "content":note.content}}
    )

    updated_note = await notes_collection.find_one({"_id":ObjectId(noteId)})
    await manager.broadcast(noteId, update_note["content"])
    return NoteResponse(id=str(updated_note["_id"]), title=updated_note["title"], content=updated_note["content"], updatedBy=email)

@app.delete("/delete-note/{noteId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(noteId:str,token:str=Header(..., description="JWT Token for authorization")):
    email = verify_jwt(token)
    note_to_be_deleted = await notes_collection.find_one({"_id":ObjectId(noteId)})
    if note_to_be_deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if email not in note_to_be_deleted["owner_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This user is not authorised to delete this note")
    await notes_collection.delete_one(
        {"_id":ObjectId(noteId)}
    )
    return

@app.put("/add-owner/{noteId}", response_model=NoteOwnerUpdateResponse)
async def add_owner(ownerId:str, noteId: str, token:str=Header(..., description="JWT Token for authorization")):
    email = verify_jwt(token)
    note_to_be_updated = await notes_collection.find_one({"_id":ObjectId(noteId)})
    owner_to_be_added = await users_collection.find_one({"email":ownerId})
    if note_to_be_updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if email not in note_to_be_updated["owner_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This user is not authorised to update this note")
    if owner_to_be_added is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner to be added is not registered with us.")
    note_to_be_updated["owner_id"].append(ownerId)
    await notes_collection.update_one(
        {"_id": ObjectId(noteId)},
        {"$set": {"owner_id": note_to_be_updated["owner_id"]}}
    )

    updated_note = await notes_collection.find_one({"_id":ObjectId(noteId)})
    return NoteOwnerUpdateResponse(id=str(updated_note["_id"]), title=updated_note["title"], content=updated_note["content"], owners=updated_note["owner_id"])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)