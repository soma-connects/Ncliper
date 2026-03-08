import os
import google.generativeai as genai

# Load API key from .env.local
env_vars = {}
try:
    with open(".env.local", "r") as f:
        for line in f:
            if "=" in line:
                key, val = line.strip().split("=", 1)
                env_vars[key] = val.strip().strip("'\"")
except Exception as e:
    pass

api_key = env_vars.get("GOOGLE_API_KEY")
genai.configure(api_key=api_key)
print("Filtered Models:")
for m in genai.list_models():
    if "generateContent" in m.supported_generation_methods:
        if "1.5" in m.name or "flash" in m.name or "pro" in m.name:
            print(m.name)
