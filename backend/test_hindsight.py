import os

from dotenv import load_dotenv
from hindsight_client import Hindsight


load_dotenv()

client = Hindsight(
    base_url=os.environ["HINDSIGHT_API_URL"],
    api_key=os.environ["HINDSIGHT_API_KEY"],
)

bank_id = os.environ["HINDSIGHT_BANK_ID"]


print("🌾 FarmMemory Hindsight Test")
print("=" * 40)


# 1. Store a farmer's experience
print("\n1. Storing farm memory...")

client.retain(
    bank_id=bank_id,
    content="""
    Field F-01 belongs to Green Valley Farm.
    During Kharif 2025, the farmer grew groundnut in Field F-01.
    In August 2025, the farmer noticed a soil-moisture problem.
    The farmer then irrigated the field.
    After irrigation, the farmer recorded that the field condition improved.
    """
)

print("✅ Memory stored successfully!")


# 2. Recall the memory
print("\n2. Asking Hindsight to recall the memory...")

result = client.recall(
    bank_id=bank_id,
    query="What happened to Field F-01 during Kharif 2025?"
)

print("\n🧠 Memories recalled:")

for memory in result.results:
    print(f"- [{memory.type}] {memory.text}")


# 3. Reflect over the memory
print("\n3. Asking Hindsight to reason over the memory...")

response = client.reflect(
    bank_id=bank_id,
    query="What should I know about the history of Field F-01?"
)

print("\n🤖 FarmMemory response:")
print(response.text)


client.close()

print("\n" + "=" * 40)
print("🎉 FarmMemory memory test completed!")