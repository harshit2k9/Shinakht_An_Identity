import os

# Set emulator host before importing firebase
os.environ["FIRESTORE_EMULATOR_HOST"] = "127.0.0.1:8080"

import firebase_admin
from firebase_admin import credentials, firestore
from config import PROJECT_ID

class FakeCredential(credentials.Base):
    """Mock credential for local Firestore emulator testing."""
    def get_credential(self):
        return {}

def initialize_firebase():
    """Initializes Firebase Admin SDK with a mock credential for local emulator."""
    if not firebase_admin._apps:
        firebase_admin.initialize_app(FakeCredential(), options={"projectId": PROJECT_ID})

    return firestore.client()