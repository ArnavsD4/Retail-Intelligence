# Retail Intelligence & Autonomous Demand Forecasting

An end-to-end retail analytics platform combining machine learning, inventory optimization, Retrieval-Augmented Generation (RAG), and the Model Context Protocol (MCP).

## Overview

Retail Intelligence helps retail teams analyze demand forecasts, evaluate inventory levels, identify stockout risk, and retrieve policy-grounded explanations through an AI assistant.

The project uses the Walmart sales dataset to train a weekly sales forecasting model and provides a web dashboard for interacting with forecasting, inventory, and retail policy features.

**Important:** The current forecasting model predicts weekly sales revenue in USD, not physical product units. Inventory recommendations require unit-based demand estimates, so these inputs must not be treated as interchangeable.

## Key Features

- **Demand forecasting:** Weekly sales prediction using a HistGradientBoostingRegressor.
- **Inventory optimization:** Reorder quantity, target stock, days of cover, and stockout-risk calculations.
- **RAG-powered assistant:** Retrieves relevant retail policies using semantic search and generates grounded explanations.
- **MCP integration:** Exposes forecasting, inventory analysis, and policy-search tools to MCP-compatible clients.
- **FastAPI backend:** REST endpoints for forecasting, inventory recommendations, and AI-assisted analysis.
- **Interactive dashboard:** React, Vite, and Tailwind CSS frontend.
- **Automated tests:** Unit and integration-style tests for core inventory, MCP, and AI-related functionality.

## Tech Stack

| Layer | Technologies |
|---|---|
| Language | Python |
| Machine Learning | Pandas, scikit-learn |
| Backend | FastAPI, Uvicorn |
| LLM integration | Groq API |
| RAG and embeddings | Sentence Transformers |
| Agent/tool integration | Model Context Protocol (MCP) |
| Frontend | React, Vite, Tailwind CSS |
| Testing | pytest |

## Architecture

1. **Data layer:** Walmart sales, store, and feature datasets.
2. **ML layer:** Feature engineering, model training, and validation.
3. **Inventory layer:** Stock targets, reorder quantities, and stockout-risk analysis.
4. **RAG layer:** Semantic retrieval from `docs/retail_policies.md`.
5. **AI layer:** LLM-generated explanations grounded in retrieved policies.
6. **MCP layer:** Exposes core capabilities as tools for compatible clients.
7. **Application layer:** FastAPI backend and React dashboard.

## Model Performance

Current validation metrics:

| Metric | Result |
|---|---:|
| MAE | $1,839.08 |
| RMSE | $3,696.40 |
| WAPE | 11.65% |

Model: `HistGradientBoostingRegressor`

These are the project's recorded validation results. The target is Walmart weekly sales revenue in USD, not physical units.

## Project Structure

```text
retail-intelligence/
├── api.py
├── requirements.txt
├── docs/
│   └── retail_policies.md
├── frontend/
├── src/
│   ├── features.py
│   ├── inventory.py
│   ├── llm.py
│   ├── mcp_server.py
│   ├── rag.py
│   └── train_model.py
├── tests/
└── data/
    └── raw/
├── models/
│   └── demand_model.joblib  # Generated locally
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ArnavsD4/Retail-Intelligence.git
cd Retail-Intelligence
```

### 2. Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install Python dependencies

```powershell
python -m pip install -r requirements.txt
```

### 4. Add the dataset

Place the required Walmart dataset files in `data/raw/`:

- `train.csv`
- `features.csv`
- `stores.csv`

The raw dataset is excluded from Git. Obtain the Walmart Store Sales Forecasting dataset separately and place the files in the specified directory.

### 5. Train the forecasting model

The trained model artifact is excluded from Git. After placing the required dataset files in `data/raw/`, generate it locally:

```powershell
python src/train_model.py
```

This should create `models/demand_model.joblib`. Ensure the training script completes successfully before starting the backend.



### 6. Configure the LLM API

Create a local `.env` file in the project root and add your Groq API key:

```env
GROQ_API_KEY=your_api_key_here
```

Never commit `.env` or publish your API key. Some functionality may require a valid API key and may be subject to provider rate limits.

### 7. Start the backend

```powershell
uvicorn api:app --reload
```

API documentation: `http://127.0.0.1:8000/docs`

### 8. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### 9. Run the tests

From the project root:

```powershell
python -m pytest -q
```

### 10. Run the MCP server

From the project root, with the virtual environment activated:

```powershell
python src/mcp_server.py
```

The server uses standard input/output transport for MCP-compatible clients. Configure your MCP client to launch it using the appropriate Python interpreter and project path.

## Current Limitations

- The model predicts sales revenue, not product-unit demand.
- Inventory calculations are valid only when demand and stock use consistent physical units.
- Forecasting is currently constrained by the available local dataset and its feature records.
- AI responses depend on the configured LLM provider and its availability.
- Validation metrics represent the current model's recorded evaluation; performance may vary across stores, departments, and time periods.

## Future Improvements

- Unit-level SKU demand forecasting.
- Time-based backtesting and comparison of multiple forecasting models.
- More robust model monitoring and explainability.
- Improved MCP client integration and deployment.
- Containerized deployment and production configuration.

## Author

**ArnavsD4**

[GitHub Repository](https://github.com/ArnavsD4/Retail-Intelligence)
