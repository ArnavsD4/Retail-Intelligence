
from pathlib import Path
import re

import numpy as np
from sentence_transformers import SentenceTransformer


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def load_documents(docs_dir: Path = DOCS_DIR) -> list[dict]:
    """Load Markdown and text documents from the docs directory."""
    documents = []

    for path in sorted(docs_dir.rglob("*")):
        if path.is_file() and path.suffix.lower() in {".md", ".txt"}:
            text = path.read_text(encoding="utf-8").strip()

            if text:
                documents.append({
                    "source": path.name,
                    "text": text,
                })

    return documents


def split_into_sections(text: str) -> list[dict]:
    """Split Markdown into sections using headings."""
    sections = []
    current_heading = "General"
    current_lines = []

    for line in text.splitlines():
        heading_match = re.match(r"^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$", line)

        if heading_match:
            content = "\n".join(current_lines).strip()

            if content:
                sections.append({
                    "heading": current_heading,
                    "text": content,
                })

            current_heading = heading_match.group(2).strip()
            current_lines = []
        else:
            current_lines.append(line)

    content = "\n".join(current_lines).strip()

    if content:
        sections.append({
            "heading": current_heading,
            "text": content,
        })

    return sections


def chunk_text(
    text: str,
    chunk_size: int = 120,
    overlap: int = 25,
) -> list[str]:
    """Split text into overlapping word-based chunks."""
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be >= 0 and smaller than chunk_size")

    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunks.append(" ".join(words[start:end]))

        if end == len(words):
            break

        start = end - overlap

    return chunks


def build_knowledge_base(
    docs_dir: Path = DOCS_DIR,
    model_name: str = EMBEDDING_MODEL_NAME,
) -> tuple[list[dict], np.ndarray]:
    """Create heading-aware chunks and normalized embeddings."""
    documents = load_documents(docs_dir)
    chunks = []

    for document in documents:
        sections = split_into_sections(document["text"])

        for section in sections:
            for index, text in enumerate(chunk_text(section["text"])):
                chunks.append({
                    "source": document["source"],
                    "heading": section["heading"],
                    "chunk_id": index,
                    "text": text,
                })

    if not chunks:
        raise ValueError(f"No .md or .txt documents found in {docs_dir}")

    model = SentenceTransformer(model_name)

    embeddings = model.encode(
        [
            f"Section: {chunk['heading']}\n{chunk['text']}"
            for chunk in chunks
        ],
        normalize_embeddings=True,
        show_progress_bar=True,
    )

    return chunks, np.asarray(embeddings)


def search_documents(
    query: str,
    chunks: list[dict],
    embeddings: np.ndarray,
    model_name: str = EMBEDDING_MODEL_NAME,
    top_k: int = 3,
    model: SentenceTransformer | None = None,
) -> list[dict]:
    """Retrieve the most semantically similar document chunks."""
    if not query.strip():
        raise ValueError("Query must not be empty")

    if top_k <= 0:
        raise ValueError("top_k must be positive")

    if len(chunks) != len(embeddings):
        raise ValueError("Each chunk must have a corresponding embedding")

    if not chunks:
        return []

    # Reuse a loaded model when the caller supplies one.
    if model is None:
        model = SentenceTransformer(model_name)

    query_embedding = model.encode(
        [query],
        normalize_embeddings=True,
    )[0]

    scores = embeddings @ query_embedding
    top_indices = np.argsort(scores)[::-1][:min(top_k, len(chunks))]

    return [
        {
            **chunks[int(index)],
            "score": float(scores[index]),
        }
        for index in top_indices
    ]


if __name__ == "__main__":
    chunks, embeddings = build_knowledge_base()
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    print(f"\nLoaded {len(chunks)} document chunks.")

    queries = [
        "How should a retailer assess stockout risk?",
        "How should demand forecasts be evaluated?",
        "How should supplier lead time affect inventory?",
        "How should reorder quantity be calculated?",
    ]

    for query in queries:
        results = search_documents(
            query,
            chunks,
            embeddings,
            top_k=2,
            model=model,
        )

        print(f"\n{'=' * 70}")
        print(f"Query: {query}")

        for result in results:
            print(f"\nSource: {result['source']}")
            print(f"Section: {result['heading']}")
            print(f"Similarity: {result['score']:.3f}")
            print(result["text"])
