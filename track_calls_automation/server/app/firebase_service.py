import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

db = None

# Industry Standard: Check if credentials JSON is supplied directly via Environment Variable first
firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

if firebase_creds_json:
    try:
        # Parse JSON string directly from Azure Application Setting
        cred_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("INFO: Firebase Admin SDK initialized successfully from environment JSON string.")
    except Exception as e:
        print(f"ERROR: Failed to initialize Firebase Admin SDK from environment JSON: {e}")

# Fallback: Load from file path (standard GOOGLE_APPLICATION_CREDENTIALS file path)
if db is None:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "google_service_credentials.json")
    if not os.path.isabs(cred_path):
        # Try absolute path from workspace root
        root_cred = "/Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/track_calls_automation/server/google_service_credentials.json"
        if os.path.exists(root_cred):
            cred_path = root_cred

    if os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            print(f"INFO: Firebase Admin SDK initialized successfully from file: {cred_path}")
        except Exception as e:
            print(f"ERROR: Failed to initialize Firebase Admin SDK from file: {e}")
    else:
        print("WARNING: Firebase credentials not found (no JSON env variable or local credentials file). Firestore features disabled.")

def update_tracking_status_in_firestore(
    emp_id: str,
    organisation_id: str,
    system_id: str,
    is_tracking_enabled: bool,
    last_activity_timestamp: datetime,
    is_tracking_needed: bool = None
):
    if db is None:
        print("WARNING: Firestore client is not initialized. Cannot update tracking status.")
        return False
    
    try:
        if not emp_id:
            print("WARNING: emp_id is empty. Cannot use as document ID in Firestore.")
            return False
            
        collection_name = os.getenv("FIREBASE_COLLECTION_NAME")
        if not collection_name:
            print("WARNING: No collection name found in environment variables.")
            return False
            
        collection_ref = db.collection(collection_name)
        doc_ref = collection_ref.document(emp_id)
        
        data = {
            "emp_id": emp_id,
            "organization_id": organisation_id,
            "system_id": system_id,
            "is_tracking_enabled": is_tracking_enabled,
            "last_activity_timestamp": last_activity_timestamp
        }
        
        if is_tracking_needed is not None:
            data["is_tracking_needed"] = is_tracking_needed
        else:
            # If not explicitly passed, check if the doc exists
            doc_snap = doc_ref.get()
            if not doc_snap.exists:
                # Default to True for new documents
                data["is_tracking_needed"] = True
        
        # Use emp_id as the document ID and perform an upsert (merge=True)
        doc_ref.set(data, merge=True)
        print(f"INFO: Updated Firestore tracking status for user (doc_id/emp_id: {emp_id})")
        return True
    except Exception as e:
        print(f"ERROR: Failed to update Firestore: {e}")
        return False
