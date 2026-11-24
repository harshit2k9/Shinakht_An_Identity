import os
from google import genai
from google.genai import types

def get_ai_client():
    """Initializes the official google-genai client with direct API key."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API key is required.")
    return genai.Client(api_key=api_key)

def generate_care_response(prompt_text, language="en"):
    """Generates a supportive, non-medical caregiver/patient response using Gemini."""
    client = get_ai_client()
    
    system_instruction = (
        "You are a compassionate, calm AI companion for dementia patients and their caregivers. "
        "Keep responses simple, reassuring, short, and clear. "
        "CRITICAL: Never provide medical diagnoses, medication dosages, or clinical treatment advice. "
        "If medical questions arise, advise consulting a healthcare professional immediately."
    )
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_text,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
            )
        )
        return response.text
    except Exception as e:
        print(f"[!] Gemini generation error: {e}")
        return "I am here with you. Please take a slow, deep breath, and let's check in with your caregiver."