
print("Test script started", flush=True)

import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
print("Environment loaded", flush=True)

api_key = os.getenv("GROQ_API_KEY")
print(f"API key found: {bool(api_key)}", flush=True)

if not api_key:
    print("ERROR: GROQ_API_KEY .env mein nahi mili.", flush=True)
else:
    try:
        client = Groq(api_key=api_key)
        print("Sending test request to Groq...", flush=True)

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "user", "content": "Say hello in one short sentence."}
            ],
            max_tokens=200,
        )

        print("Full response:", response, flush=True)
        print("Finish reason:", response.choices[0].finish_reason, flush=True)
        print("Message:", repr(response.choices[0].message), flush=True)

    except Exception as e:
        print(f"API test failed: {type(e).__name__}: {e}", flush=True)
