import React from 'react';

const Methodology: React.FC = () => {
    return (
        <div className="mt-12 bg-gray-100 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">🔬 How it works: Our Methodology</h3>
            <p className="text-sm text-gray-600 mt-2">
                This tool uses a multi-stage AI-based process for comprehensive analysis of the provided text.
            </p>
            <ol className="list-decimal list-inside mt-4 space-y-2 text-sm text-gray-700">
                <li>
                    <strong>Fact Extraction:</strong> The text is first sent to a local AI model (Ollama with gemma3n:e4b) to identify and extract individual verifiable factual claims. The AI is instructed to break down complex sentences into simple, verifiable statements.
                </li>
                <li>
                    <strong>Publication in the System:</strong> The extracted facts are published in the system for further processing. At this stage, the user can edit, delete, or add facts before verification.
                </li>
                <li>
                    <strong>Fact Verification via Internet Search:</strong> Each published fact is checked using internet search and then analyzed by AI to determine its accuracy. The AI provides a status, explanation, and confidence score.
                </li>
            </ol>
            
        </div>
    );
};

export default Methodology;
