# Fact Flow

**Automated fact-checking system for verifying text claims using AI and web sources.**

## 🛠 Tech Stack

* **Frontend**: React 19.1.0, TypeScript 5.7.2, Vite 6.2.0, Tailwind CSS 4.1.11
* **Backend**: Node.js 18+, Express 4.18.2, Python 3.9+, Ollama (`gemma3n:e4b`)
* **Dependencies**: react 19.1.0, react-dom 19.1.0, express 4.18.2, python-requests 2.31.0, beautifulsoup4 4.12.2

## 📋 Prerequisites

* Node.js 18+
* Python 3.9+
* Ollama installed
* npm 9+ or yarn 1.22+

## 🚀 Quick Start

### 1. Clone the repo:

```bash
git clone https://github.com/KazKozDev/fact-flow.git
cd fact-flow
```

### 2. Install frontend dependencies:

```bash
npm install
```

### 3. Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

### 4. Install Python dependencies:

```bash
pip install -r requirements.txt
```

### 5. Start Ollama and pull model:

```bash
ollama serve
ollama pull gemma3n:e4b
```

### 6. Start the app:

```bash
./start.sh
```

### 7. Open your browser

Navigate to `http://localhost:5173` to access the application.

## 🔍 Usage

1. **Enter text** in the input field
2. **Click "Extract Facts"** to identify factual claims
3. **Review/edit facts** as needed
4. **Click "Verify Facts"** to check against web sources
5. **View results** with confidence scores and source validation

## 📚 Documentation

* [API Reference](docs/api-reference.md)
* [Contributing Guide](CONTRIBUTING.md)
* [Security Policy](SECURITY.md)

## 📄 License

MIT License. See [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This automated system may have limitations. Always verify critical information with primary sources and use your own judgment when evaluating fact-checking results.

---

**Note**: Fact Flow is designed to assist with fact-checking but should not be the sole source for verifying important claims. Always cross-reference with authoritative sources when accuracy is critical.