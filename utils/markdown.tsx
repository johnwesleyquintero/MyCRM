import React from 'react';

// A lightweight, dependency-free Markdown formatter for the sovereign architecture.
// Handles: Bold, Italic, Links, Lists, Headers, and Newlines.
export const SimpleMarkdown: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, index) => {
        // Headers (### )
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-sm font-bold text-slate-800 mt-2 mb-1">{parseInline(line.replace('### ', ''))}</h3>;
        }
        if (line.startsWith('## ')) {
            return <h2 key={index} className="text-base font-bold text-slate-900 mt-3 mb-2">{parseInline(line.replace('## ', ''))}</h2>;
        }
        if (line.startsWith('# ')) {
            return <h1 key={index} className="text-lg font-bold text-slate-900 mt-4 mb-2">{parseInline(line.replace('# ', ''))}</h1>;
        }

        // List items (- )
        if (line.trim().startsWith('- ')) {
          return (
            <div key={index} className="flex items-start space-x-2 ml-1">
              <span className="text-slate-400 mt-1.5">•</span>
              <span className="text-slate-700">{parseInline(line.replace('- ', ''))}</span>
            </div>
          );
        }

        // Standard paragraph (with empty line check)
        if (line.trim() === '') {
          return <div key={index} className="h-2" />;
        }

        return <p key={index} className="text-slate-700 leading-relaxed">{parseInline(line)}</p>;
      })}
    </div>
  );
};

const parseInline = (text: string) => {
  // We split by regex to find tokens, then map them to React nodes
  // Regex for **bold**, *italic*, and [link](url)
  const regex = /(\*\*.*?\*\*)|(\*.*?\*)|(\[.*?\]\(.*?\))/g;
  const parts = text.split(regex).filter(p => p !== undefined && p !== '');

  return parts.map((part, i) => {
    // Bold
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    // Italic
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-slate-600">{part.slice(1, -1)}</em>;
    }
    // Link
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const [label, url] = part.split('](');
        return (
            <a 
                key={i} 
                href={url.slice(0, -1)} 
                target="_blank" 
                rel="noreferrer" 
                className="text-indigo-600 hover:underline decoration-indigo-300 underline-offset-2"
            >
                {label.slice(1)}
            </a>
        );
    }
    return part;
  });
};