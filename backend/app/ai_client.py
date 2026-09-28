import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()

groq_client = Groq(
    api_key=os.environ["GROQ_API_KEY"]
)

MODEL = "openai/gpt-oss-20b"