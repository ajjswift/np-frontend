import ReactMarkdown from "react-markdown";

const components = {
    h1: ({ node, ...props }) => (
        <h1
            className="text-4xl font-extrabold mt-8 mb-4 tracking-tight"
            {...props}
        />
    ),
    h2: ({ node, ...props }) => (
        <h2 className="text-2xl font-bold mt-6 mb-3 border-b pb-1" {...props} />
    ),
    a: ({ node, ...props }) => (
        <a
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
        />
    ),
    code: ({ node, inline, className, children, ...props }) => {
        return inline ? (
            <code
                className="bg-gray-100 rounded px-1 py-0.5 font-mono text-sm"
                {...props}
            >
                {children}
            </code>
        ) : (
            <pre className="bg-gray-900 text-gray-100 rounded p-4 overflow-x-auto my-4">
                <code {...props}>{children}</code>
            </pre>
        );
    },
};

export default function MarkdownRenderer({ content }) {
    return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
}
