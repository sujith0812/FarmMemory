import os

from dotenv import load_dotenv
from hindsight_client import Hindsight


load_dotenv()

client = Hindsight(
    base_url=os.environ["HINDSIGHT_API_URL"],
    api_key=os.environ["HINDSIGHT_API_KEY"],
)

BANK_ID = os.environ["HINDSIGHT_BANK_ID"]