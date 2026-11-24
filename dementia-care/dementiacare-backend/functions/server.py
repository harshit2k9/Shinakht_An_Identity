import random
import time
from datetime import datetime, timedelta, timezone
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from firebase_setup import initialize_firebase
from ai_assistant import generate_care_response

db = initialize_firebase()

def process_pairing_requests():
    """Generates a 6-digit pairing code for pending patient requests."""
    docs = db.collection("pairingRequests").where(filter=FieldFilter("status", "==", "pending")).stream()
    for doc in docs:
        data = doc.to_dict()
        patient_uid = data.get("uid")
        code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        # Store code in admin-only collection
        db.collection("pairingCodes").document(code).set({
            "patientUid": patient_uid,
            "expiresAt": expires_at,
            "used": False
        })

        # Write code back to request doc so client can read it
        doc.reference.update({
            "status": "completed",
            "code": code,
            "expiresAt": expires_at
        })
        print(f"[Pairing] Generated code {code} for patient {patient_uid}")

def process_link_requests():
    """Validates pairing code and links caregiver UID to patient profile."""
    docs = db.collection("linkRequests").where(filter=FieldFilter("status", "==", "pending")).stream()
    for doc in docs:
        data = doc.to_dict()
        caregiver_uid = data.get("uid")
        code = str(data.get("code", "")).strip()

        code_ref = db.collection("pairingCodes").document(code)
        code_snap = code_ref.get()

        if not code_snap.exists:
            doc.reference.update({"status": "error", "error": "Invalid code"})
            print(f"[Link] Invalid code {code} from {caregiver_uid}")
            continue

        code_data = code_snap.to_dict()
        if code_data.get("used") or code_data.get("expiresAt") < datetime.now(timezone.utc):
            doc.reference.update({"status": "error", "error": "Code expired or already used"})
            print(f"[Link] Expired/used code {code} from {caregiver_uid}")
            continue

        patient_uid = code_data.get("patientUid")

        # Add caregiver UID to patient's caregivers array
        db.collection("patients").document(patient_uid).update({
            "caregivers": firestore.ArrayUnion([caregiver_uid])
        })

        code_ref.update({"used": True})
        doc.reference.update({"status": "completed", "patientUid": patient_uid})
        print(f"[Link] Linked caregiver {caregiver_uid} to patient {patient_uid}")

def process_assistant_requests():
    """Processes pending Gemini AI queries and writes replies back to Firestore."""
    docs = db.collection("assistantRequests").where(filter=FieldFilter("status", "==", "pending")).stream()
    for doc in docs:
        data = doc.to_dict()
        uid = data.get("uid")
        text = data.get("text", "")
        language = data.get("language", "en")

        print(f"[AI] Processing query from {uid}: '{text}'")
        reply = generate_care_response(text, language)

        doc.reference.update({
            "status": "completed",
            "response": reply,
            "completedAt": datetime.now(timezone.utc)
        })
        print(f"[AI] Replied to {uid}")

if __name__ == "__main__":
    print("=== Shinakht Backend Service Running ===")
    try:
        while True:
            process_pairing_requests()
            process_link_requests()
            process_assistant_requests()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[!] Backend service stopped.")