import time
from firebase_setup import initialize_firebase

db = initialize_firebase()

def test_pairing_and_linking():
    print("--- 1. Testing Patient Pairing & Caregiver Linking ---")
    patient_uid = "patient_001"
    caregiver_uid = "caregiver_001"

    # Seed an empty patient document first
    db.collection("patients").document(patient_uid).set({
        "name": "Ramesh",
        "caregivers": []
    })

    # 1. Patient requests a pairing code
    pair_ref = db.collection("pairingRequests").document()
    pair_ref.set({
        "uid": patient_uid,
        "status": "pending"
    })
    print(f"[Client] Sent pairing request ({pair_ref.id}). Waiting for backend...")

    # Poll for the generated code
    code = None
    for _ in range(15):
        time.sleep(1)
        snap = pair_ref.get().to_dict()
        if snap.get("status") == "completed":
            code = snap.get("code")
            print(f"[Client] Received pairing code: {code}")
            break

    if not code:
        print("[!] Timed out waiting for pairing code.")
        return

    # 2. Caregiver submits the pairing code to link
    link_ref = db.collection("linkRequests").document()
    link_ref.set({
        "uid": caregiver_uid,
        "code": code,
        "status": "pending"
    })
    print(f"[Client] Submitted link request with code {code}. Waiting for backend...")

    for _ in range(10):
        time.sleep(1)
        snap = link_ref.get().to_dict()
        if snap.get("status") == "completed":
            patient_doc = db.collection("patients").document(patient_uid).get().to_dict()
            print(f"[Client] Link successful! Patient caregivers list: {patient_doc.get('caregivers')}")
            break
        elif snap.get("status") == "error":
            print(f"[!] Link failed: {snap.get('error')}")
            break

def test_ai_assistant():
    print("\n--- 2. Testing Gemini AI Companion ---")
    ai_ref = db.collection("assistantRequests").document()
    ai_ref.set({
        "uid": "patient_001",
        "text": "I forgot where I kept my glasses and I am feeling anxious.",
        "language": "en",
        "status": "pending"
    })
    print(f"[Client] Sent AI query ({ai_ref.id}). Waiting for Gemini...")

    for _ in range(15):
        time.sleep(1)
        snap = ai_ref.get().to_dict()
        if snap.get("status") == "completed":
            print(f"\n[Client] Gemini Reply:\n> {snap.get('response')}\n")
            break

if __name__ == "__main__":
    test_pairing_and_linking()
    test_ai_assistant()