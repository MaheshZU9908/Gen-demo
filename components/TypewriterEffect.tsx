import React, { useEffect, useState, useRef } from 'react';

interface TypewriterEffectProps {
  content: string;
  isStreaming: boolean;
}

export const TypewriterEffect: React.FC<TypewriterEffectProps> = ({ content, isStreaming }) => {
  // If we are not streaming (historical message), just show content
  // If we are streaming, the parent is pushing updates to 'content'. 
  // We just render 'content' directly because the parent handles the "chunking" via the stream.
  
  // Simple markdown-ish formatting for code blocks and newlines
  const formatText = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3).replace(/^[a-z]+\n/, ''); // remove language identifier if present
        return (
          <pre key={index} className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto my-2 text-sm font-mono">
            <code>{content}</code>
          </pre>
        );
      }
      // Handle regular text with newlines
      return (
        <span key={index} className="whitespace-pre-wrap leading-relaxed">
          {part}
        </span>
      );
    });
  };

  return <div className="text-gray-100">{formatText(content)}</div>;
};
