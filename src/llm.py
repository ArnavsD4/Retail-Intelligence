
import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

from src.rag import build_knowledge_base, search_documents

# Load environment variables from project-root .env
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

MODEL_NAME = "openai/gpt-oss-20b"

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError(
        "GROQ_API_KEY not found. Add it to the project-root .env file."
    )

client = Groq(api_key=api_key)

# Build the knowledge base once when this module is imported.
print("Loading retail policy knowledge base...")
chunks, embeddings = build_knowledge_base()
print(f"Loaded {len(chunks)} retail policy chunks.")


def answer_retail_question(question: str) -> dict:
    """
    Retrieve relevant retail policies and generate a grounded answer.
    """
    question = question.strip()
    if not question:
        raise ValueError("Question cannot be empty.")

    results = search_documents(
        query=question,
        chunks=chunks,
        embeddings=embeddings,
        top_k=3,
    )

    if not results:
        return {
            "question": question,
            "answer": "I could not find relevant information in the retail policies.",
            "sources": [],
        }

    context_parts = []
    sources = []

    for result in results:
        context_parts.append(
            f"Source: {result['source']}\n"
            f"Section: {result['heading']}\n"
            f"Policy text:\n{result['text']}"
        )

        sources.append({
            "source": result["source"],
            "section": result["heading"],
            "similarity": round(float(result["score"]), 3),
        })

    context = "\n\n---\n\n".join(context_parts)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a retail inventory analyst. Explain the provided "
                    "inventory calculation using the retrieved retail policies. "
                    "Treat inventory_result as the authoritative source for all "
                    "numbers and risk labels. Never recalculate, alter, or invent "
                    "numeric values. Do not claim a policy says something unless "
                    "supported by the supplied context. If context is insufficient, "
                    "say so. Give a concise explanation and practical next step. "
                    "IMPORTANT UNIT RULE: The upstream model predicts Walmart "
                    "Weekly_Sales, which is sales revenue in USD, not physical "
                    "product units. Do not describe forecast_weekly_demand or "
                    "daily_demand as product units. Explicitly state that the "
                    "current inventory calculation uses sales-value numbers as "
                    "a proxy and is not a valid physical-stock recommendation "
                    "until demand is converted to compatible product units. "
                    "Do not present the resulting target_stock or reorder_quantity "
                    "as validated real-world quantities."
                    ),
            },
            
            {
                "role": "user",
                "content": (
                    f"Question: {question}\n\n"
                    f"Retrieved policy context:\n{context}"
                ),
            },
        ],
        max_tokens=500,
        temperature=0.2,
    )

    answer = response.choices[0].message.content

    if not answer:
        answer = (
            "The model returned no text. Please retry the question."
        )

    return {
        "question": question,
        "answer": answer,
        "sources": sources,
    }


def explain_inventory_recommendation(inventory_result: dict) -> dict:
    """
    Explain an already-calculated inventory recommendation using
    retrieved retail policies and Groq. Numeric calculations remain
    the responsibility of the inventory module.
    """
    question = (
        "Explain the inventory recommendation and stockout risk "
        "using the retail policies. Identify relevant actions."
    )

    results = search_documents(
        query=question,
        chunks=chunks,
        embeddings=embeddings,
        top_k=3,
    )

    context_parts = []
    sources = []

    for result in results:
        context_parts.append(
            f"Section: {result['heading']}\n"
            f"Policy text:\n{result['text']}"
        )
        sources.append({
            "source": result["source"],
            "section": result["heading"],
            "similarity": round(float(result["score"]), 3),
        })

    context = "\n\n---\n\n".join(context_parts)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a retail inventory analyst. Explain the "
                    "provided inventory calculation using the retrieved "
                    "retail policies. Treat inventory_result as the "
                    "authoritative source for all numbers and risk labels. "
                    "Never recalculate, alter, or invent numeric values. "
                    "Do not claim a policy says something unless supported "
                    "by the supplied context. If context is insufficient, "
                    "say so. Give a concise explanation and practical next step."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Calculated inventory result:\n{inventory_result}\n\n"
                    f"Retrieved retail policies:\n{context}"
                ),
            },
        ],
        max_tokens=500,
        temperature=0.2,
    )

    answer = response.choices[0].message.content

    if not answer:
        answer = (
            "No explanation was generated. Please retry. "
            "The inventory calculation is still available separately."
        )

    return {
        "inventory": inventory_result,
        "explanation": answer,
        "sources": sources,
    }



if __name__ == "__main__":
    test_question = "How should a retailer assess stockout risk?"

    result = answer_retail_question(test_question)

    print("\nQuestion:", result["question"])
    print("\nAnswer:", result["answer"])
    print("\nSources:")

    for source in result["sources"]:
        print(
            f"- {source['section']} "
            f"(similarity: {source['similarity']})"
        )
