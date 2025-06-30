import React from 'react';

interface TextInputAreaProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const TextInputArea: React.FC<TextInputAreaProps> = ({ value, onChange, onSubmit, isLoading }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <label htmlFor="text-input" className="block text-lg font-semibold text-gray-700 mb-2">
        📝 Enter text for analysis
      </label>
      <p className="text-xs text-gray-400 mb-1">
        Paste any article, statement, or text below. The system will extract factual claims and prepare them for verification.
        <br />
        <span className="font-medium">Tips:</span> Large texts are automatically processed in chunks. Include clear factual statements for best results.
      </p>
      <div className="mb-3 text-xs text-gray-400 space-y-1">
        <div><span className="font-medium">Good:</span> "Paris is the capital of France. The Eiffel Tower is 324 meters tall."</div>
        <div><span className="font-medium">Avoid:</span> Pure opinions, subjective statements, or questions.</div>
      </div>
      <textarea
        id="text-input"
        className="w-full h-64 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-gray-500 transition-shadow duration-200 resize-y text-gray-600"
        placeholder={"For example: 'The capital of France is Paris, and the city receives over 30 million tourists annually...'"}
        value={value}
        onChange={onChange}
        disabled={isLoading}
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            '🔍 Extract Facts'
          )}
        </button>
      </div>
    </div>
  );
};

export default TextInputArea;