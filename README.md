# Fact Flow

![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)
![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)
![Ollama](https://img.shields.io/badge/Ollama-gemma3n:e4b-purple.svg)
![AI Powered](https://img.shields.io/badge/AI-Powered-red.svg)
![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)

Automated fact-checking system that extracts claims from text and verifies them using web search + local AI analysis.

**For**: Journalists, researchers, students who need to verify information locally without sending data to cloud services.

**Why**: Automate fact-checking routine while maintaining full privacy and transparency of the verification process.

**Advantages**: Local processing, transparent decisions with source links, bypasses search engine blocks, free (no API keys required), full control over your data.

## How it works

1. **Fact Extraction**: Local AI model (Ollama) extracts individual factual claims from input text
2. **Web Search**: System searches Wikipedia and DuckDuckGo for information about each claim  
3. **AI Analysis**: Local AI analyzes found sources and determines if claims are verified/misleading/unverified with detailed explanations

**Key features**:
- **Robust search**: Anti-blocking mechanisms ensure reliable web search results
- **3 sources per fact**: System searches multiple sources for each claim
- **Transparent decisions**: All verifications include detailed explanations showing what sources were found and why a particular decision was made
- **Clickable source links**: Users can verify all sources and reasoning themselves
- **Performance**: ~10 facts processed in 2 minutes

**Important**: The AI model's knowledge base is NOT used for fact verification to avoid hallucinations. Only web search results are analyzed.

## Demo

![Movie](https://github.com/user-attachments/assets/325b92eb-39e7-492d-a9c0-cef97bebe47a)

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express
- **AI Model**: Ollama with `gemma3n:e4b`
- **Search**: Python script for DuckDuckGo + Wikipedia API

## Prerequisites

- **Node.js 18+** 
- **Python 3.9+** with `requests` and `beautifulsoup4`
- **Ollama** with `gemma3n:e4b` model
- **RAM**: Minimum 8GB (3GB for model + 5GB for system and browser)
- **Storage**: ~10GB (7.5GB for model + dependencies)
- **Internet connection** (required for fact verification)

## Installation

```bash
# 1. Clone repository
git clone https://github.com/KazKozDev/fact-flow.git
cd fact-flow

# 2. Install Ollama and model
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve
ollama pull gemma3n:e4b

# 3. Install Python dependencies  
pip install requests beautifulsoup4

# 4. Install Node.js dependencies
npm install
cd backend && npm install && cd ..

# 5. Start system
./start.sh
```

## Usage

1. Open http://localhost:5173
2. Paste text containing factual claims
3. Click "Extract Facts" - AI extracts individual claims
4. Review/edit extracted facts, then click "Publish All"
5. Click "Verify Facts" - system searches web and analyzes results
6. View verification results with confidence scores and sources

### Good input example:
```
Albert Einstein (14 March 1879 – 18 April 1955) was a German-born theoretical physicist who is best known for developing the theory of relativity. Einstein also made important contributions to quantum mechanics. His mass–energy equivalence formula E = mc², which arises from special relativity, has been called "the world's most famous equation". He received the 1921 Nobel Prize in Physics for his services to theoretical physics, and especially for his discovery of the law of the photoelectric effect.
```

### Poor input example:
```
I think artificial intelligence is really fascinating and could change our world in many ways. It's amazing how technology evolves and impacts society.
```
*Contains opinions and subjective statements, no verifiable facts to extract.*

## Limitations

- Requires internet connection for fact verification
- Accuracy depends on availability of information online
- AI model may miss complex or implicit claims
- Search results quality varies by topic

## File Structure

```
fact-flow/
├── components/          # React UI components
├── services/           # AI, search, and API services
├── backend/            # Express server + Python parser
├── parsing_duckduckgo.py  # Web search script
└── start.sh           # Launch script
```

## License

MIT License

## Author

Artem Kazakov Kozlov  
GitHub: [@KazKozDev](https://github.com/KazKozDev)  
Email: kazkozdev@gmail.com

---

**Disclaimer**: This is an automated system with inherent limitations. Always verify critical information through authoritative sources.
