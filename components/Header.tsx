import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 md:px-8 py-4 text-center">
        <img src="/images/logo.png" alt="Logo" className="mx-auto mb-4" style={{ height: '70px', width: 'auto' }} />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
          Fact Flow
        </h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">
          Multi-stage fact-checking system
        </p>
      </div>
    </header>
  );
};

export default Header;
