from fastapi import FastAPI, Depends, HTTPException, status, Header
from schemas import UserCreate, UserResponse, Token, NoteResponse, NoteCreate
from auth import authenticate_user, create_access_token, get_password_hash, verify_jwt
from database import users_collection, settings, notes_collection
from datetime import timedelta
import uvicorn

app = FastAPI()

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

@app.post("/add-note")
async def add_note(note:NoteCreate,token:str=Header(..., description="JWT Token for authorization")):
    email = verify_jwt(token)
    note_dict = {
        "owner_id": email,
        "title": note.title,
        "content": note.content
    }
    new_note = await notes_collection.insert_one(note_dict)
    created_note = await notes_collection.find_one({"_id":new_note.inserted_id})
    return NoteResponse(id=str(created_note["_id"]),title=created_note["title"],content=created_note["content"])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)