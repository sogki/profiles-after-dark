import type { Components } from "react-markdown";

export const helpMarkdownComponents: Components = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline" />
  ),
  strong: ({ node, ...props }) => <strong {...props} className="font-semibold text-white" />,
  h1: ({ node, ...props }) => <h1 {...props} className="text-2xl font-bold text-white mt-6 mb-4" />,
  h2: ({ node, ...props }) => <h2 {...props} className="text-xl font-bold text-white mt-5 mb-3" />,
  h3: ({ node, ...props }) => <h3 {...props} className="text-lg font-semibold text-white mt-4 mb-2" />,
  ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside text-slate-300 my-4 space-y-2" />,
  ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside text-slate-300 my-4 space-y-2" />,
  li: ({ node, ...props }) => <li {...props} className="text-slate-300" />,
  p: ({ node, ...props }) => <p {...props} className="text-slate-300 leading-relaxed my-3" />,
  code: ({ node, inline, ...props }) => {
    if (inline) {
      return <code {...props} className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-sm" />;
    }
    return <code {...props} className="block bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto my-4" />;
  },
};

