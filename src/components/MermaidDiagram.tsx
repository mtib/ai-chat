import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with configuration
mermaid.initialize({
    theme: 'dark',
    fontFamily: 'Sono',
    themeVariables: {
        primaryColor: '#8f5aa5',
        primaryTextColor: '#f5f5f5',
        primaryBorderColor: '#ae52d4',
        secondaryColor: '#6f3de8',
        tertiaryColor: '#4f3072',
        lineColor: '#c7c7c7',
        backgroundColor: '#160826',
        background: '#160826',
        mainBkg: '#160826',
    },
    startOnLoad: true,
    securityLevel: 'loose',
});

interface MermaidProps {
    chart: string;
    id?: string;
}

const MermaidDiagram: React.FC<MermaidProps> = ({ chart, id }) => {
    const mermaidRef = useRef<HTMLDivElement>(null);
    const uniqueId = id || `mermaid-${Math.random().toString(36).substring(2, 11)}`;

    useEffect(() => {
        if (mermaidRef.current) {
            mermaid.render(uniqueId, chart)
                .then(result => {
                    if (mermaidRef.current) {
                        mermaidRef.current.innerHTML = result.svg;
                    }
                })
                .catch(error => {
                    console.error('Mermaid rendering failed:', error);
                    if (mermaidRef.current) {
                        mermaidRef.current.innerHTML = `<pre style="color: red;">Mermaid syntax error: ${error.message}</pre>`;
                    }
                });
        }
    }, [chart, uniqueId]);

    return <div className="mermaid-diagram" ref={mermaidRef} />;
};

export default MermaidDiagram;
