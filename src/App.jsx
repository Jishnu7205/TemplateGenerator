// App.jsx

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
// NEW: Import the markdown renderer
import ReactMarkdown from 'react-markdown';


// --- SVG Icons (No changes here) ---
const Logo = ({ className }) => ( <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}><defs><linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stopColor="#3B82F6"/><stop offset="1" stopColor="#10B981"/></linearGradient></defs><path d="M40 10 H80 Q90 10 90 20 V80 Q90 90 80 90 H40 Q30 90 30 80 V20 Q30 10 40 10 Z" fill="url(#logoGradient)" fillOpacity="0.1" /><path d="M40 10 H80 Q90 10 90 20 V80 Q90 90 80 90 H40 Q30 90 30 80 V20 Q30 10 40 10 Z" stroke="url(#logoGradient)" strokeWidth="3"/><rect x="10" y="25" width="12" height="12" rx="3" fill="#3B82F6"/><rect x="12" y="45" width="15" height="3" rx="1.5" fill="#10B981"/><rect x="12" y="52" width="10" height="3" rx="1.5" fill="#10B981"/><circle cx="18" cy="70" r="6" fill="#F59E0B"/></svg> );
const FolderIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> );
const DocumentIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> );
const SpinnerIcon = () => ( <svg className="animate-spin h-16 w-16 text-[#00aaff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> );


// --- Main App Component (No changes here) ---
export default function App() {
    // ... (rest of your App component remains the same)
    // ... I'm omitting it for brevity but no changes are needed here.
    const [currentPage, setCurrentPage] = useState('login');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [recentFiles, setRecentFiles] = useState([
        { name: 'market_analysis.pdf', size: '2.4 MB - 24 chunks' },
        { name: 'interview_transcript.docx', size: '1.1 MB - 12 chunks' },
    ]);
    const addRecentFile = (file) => {
        setRecentFiles(prevFiles => [file, ...prevFiles.slice(0, 4)]); // Keep last 5 files
    };

    const [vectorDatabase, setVectorDatabase] = useState({ vectors: 0, files: 0, storage: '0 MB' });
    const [savedTemplates, setSavedTemplates] = useState([]);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsAuthenticated(true);
        setCurrentPage('dataProcessing');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentPage('login');
    };

    // Fetch vector database statistics and saved templates
    const fetchVectorStats = useCallback(async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/status');
            if (response.ok) {
                const data = await response.json();
                setVectorDatabase({
                    vectors: data.total_vectors || 0,
                    files: data.total_files || 0,
                    storage: `${(data.total_vectors * 0.01).toFixed(1)} MB` // Rough estimate
                });
                
                // Update saved templates from backend
                if (data.templates_in_memory && Array.isArray(data.templates_in_memory)) {
                    const templateList = data.templates_in_memory.map(templateName => ({
                        name: templateName,
                        description: `Saved template: ${templateName}`
                    }));
                    setSavedTemplates(templateList);
                }
            }
        } catch (error) {
            console.error('Failed to fetch vector stats:', error);
        }
    }, []);

    // Fetch stats on component mount and when files are uploaded
    React.useEffect(() => {
        fetchVectorStats();
    }, [fetchVectorStats]);

    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="bg-[#1a1a1a] text-gray-300 min-h-screen font-sans flex flex-col">
            <header className="bg-[#2a2a2a] border-b border-gray-700 px-6 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">Synthesis</h1>
                <div className="flex items-center space-x-2">
                    <NavButton name="dataProcessing" currentPage={currentPage} setCurrentPage={setCurrentPage}>Data Processing</NavButton>
                    <NavButton name="templateBuilder" currentPage={currentPage} setCurrentPage={setCurrentPage}>Template Builder</NavButton>
                    <NavButton name="documentGenerator" currentPage={currentPage} setCurrentPage={setCurrentPage}>Document Generator</NavButton>
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <Sidebar vectorDatabase={vectorDatabase} savedTemplates={savedTemplates} recentFiles={recentFiles} onLogout={handleLogout} />
                <main className="flex-1 p-8 overflow-y-auto">
                    {currentPage === 'dataProcessing' && <DataProcessingPage onUploadSuccess={(file) => { addRecentFile(file); fetchVectorStats(); }} />}
                    {currentPage === 'templateBuilder' && <TemplateBuilderPage onTemplateSaved={fetchVectorStats} />}
                    {currentPage === 'documentGenerator' && <DocumentGeneratorPage savedTemplates={savedTemplates} />}
                </main>
            </div>
        </div>
    );
}

// --- Components (No changes needed in most of these) ---
const NavButton = ({ name, currentPage, setCurrentPage, children }) => ( <button onClick={() => setCurrentPage(name)} className={`px-4 py-2 text-sm rounded-md transition ${currentPage === name ? 'bg-[#00aaff] text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{children}</button> );
const Sidebar = ({ vectorDatabase, savedTemplates, recentFiles, onLogout }) => ( <aside className="w-72 bg-[#2a2a2a] p-6 border-r border-gray-700 flex flex-col justify-between"><div><SidebarSection title="Vector Database"><InfoRow label="Vectors" value={vectorDatabase.vectors.toLocaleString()} /><InfoRow label="Files" value={vectorDatabase.files} /><InfoRow label="Storage" value={vectorDatabase.storage} /></SidebarSection><SidebarSection title="Saved Templates">{savedTemplates.map(template => <TemplateCard key={template.name} {...template} />)}</SidebarSection><SidebarSection title="Recent Files">{recentFiles.map(file => <FileCard key={file.name} {...file} />)}</SidebarSection></div><button onClick={onLogout} className="w-full mt-8 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition">Logout</button></aside> );
const SidebarSection = ({ title, children }) => ( <div className="mb-8"><h2 className="text-lg font-semibold text-white mb-4">{title}</h2><div className="space-y-2">{children}</div></div> );
const InfoRow = ({ label, value }) => ( <div className="flex justify-between items-center bg-[#333] p-2 rounded-md text-sm"><span>{label}</span><span className="font-mono text-[#00aaff]">{value}</span></div> );
const TemplateCard = ({ name, description }) => ( <div className="bg-[#3c3c3c] p-3 rounded-lg border border-gray-600 hover:border-[#00aaff] transition cursor-pointer"><h3 className="font-semibold text-white text-sm">{name}</h3><p className="text-xs text-gray-400">{description}</p></div> );
const FileCard = ({ name, size }) => ( <div className="bg-[#3c3c3c] p-3 rounded-lg border border-gray-600 hover:border-[#00aaff] transition cursor-pointer"><h3 className="font-semibold text-white text-sm">{name}</h3><p className="text-xs text-gray-400">{size}</p></div> );
const LoginPage = ({ onLogin }) => ( <div className="min-h-screen bg-[#1a1a1a] text-gray-300 flex flex-col justify-center items-center p-4"><header className="absolute top-0 left-0 w-full p-6"><h1 className="text-xl font-bold text-white">Synthesis</h1></header><div className="w-full max-w-sm bg-[#2a2a2a] border border-gray-700 rounded-2xl shadow-lg p-8"><div className="text-center mb-8"><Logo className="mx-auto mb-4" /><h2 className="text-2xl font-bold text-white">Welcome to Synthesis</h2><p className="text-gray-400 text-sm mt-1">Sign in to assemble your next report.</p></div><form onSubmit={onLogin} className="space-y-6"><div><label className="text-sm font-medium text-gray-400" htmlFor="email">Email Address</label><input type="email" id="email" defaultValue="you@company.com" className="mt-1 w-full bg-[#3c3c3c] border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-[#00aaff] focus:outline-none" /></div><div><div className="flex justify-between items-center"><label className="text-sm font-medium text-gray-400" htmlFor="otp">OTP</label><a href="#" className="text-sm text-[#00aaff] hover:underline">Contact Support</a></div><input type="password" id="otp" defaultValue="••••••••" className="mt-1 w-full bg-[#3c3c3c] border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-[#00aaff] focus:outline-none" /></div><button type="submit" className="w-full bg-[#00aaff] hover:bg-[#0099e6] text-white font-bold py-3 rounded-md transition">Sign In</button></form></div></div> );
const DataProcessingPage = ({ onUploadSuccess }) => {
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploadStatus('uploading');
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);
        const API_URL = 'http://127.0.0.1:5000/upload';

        fetch(API_URL, { method: 'POST', body: formData, })
            .then(response => {
                if (!response.ok) { return response.json().then(err => { throw new Error(err.error || 'Network response was not ok') }); }
                return response.json();
            })
            .then(data => {
                setUploadStatus('success');
                setMessage(`Successfully processed ${data.filename}. Created ${data.chunks_created} chunks.`);
                onUploadSuccess({ name: data.filename, size: `${data.chunks_created} chunks` });
            })
            .catch(error => {
                setUploadStatus('error');
                setMessage(`Upload failed: ${error.message}`);
                console.error('There was an error!', error);
            });
    }, [onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] }, multiple: false });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || isSearching) return;

        setIsSearching(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery, n_results: 5 }),
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            setSearchResults(data.results);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const renderContent = () => {
        switch (uploadStatus) {
            case 'uploading': return (<><SpinnerIcon /><h2 className="mt-4 text-xl font-semibold text-white">Processing File...</h2><p className="mt-1 text-sm text-gray-400">Extracting, chunking, and creating embeddings.</p></>);
            case 'success': return (<><FolderIcon className="mx-auto h-16 w-16 text-green-500" /><h2 className="mt-4 text-xl font-semibold text-white">Upload Successful</h2><p className="mt-1 text-sm text-green-400">{message}</p><p className="mt-4 text-sm text-gray-500">You can now use this data in the Document Generator.</p><button onClick={() => setUploadStatus('idle')} className="mt-6 bg-[#00aaff] hover:bg-[#0099e6] text-white font-bold py-2 px-6 rounded-md transition">Upload Another File</button></>);
            case 'error': return (<><FolderIcon className="mx-auto h-16 w-16 text-red-500" /><h2 className="mt-4 text-xl font-semibold text-white">Upload Failed</h2><p className="mt-1 text-sm text-red-400">{message}</p><button onClick={() => setUploadStatus('idle')} className="mt-6 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-md transition">Try Again</button></>);
            case 'idle': default: return (<><FolderIcon className="mx-auto h-16 w-16 text-gray-500" /><h2 className="mt-4 text-xl font-semibold text-white">Upload Your Files</h2><p className="mt-1 text-sm text-gray-400">{isDragActive ? 'Drop the file here...' : 'Drag and drop or click to browse'}</p><p className="mt-1 text-xs text-gray-500">Supports PDF and TXT files</p><button type="button" className="mt-6 bg-[#00aaff] hover:bg-[#0099e6] text-white font-bold py-2 px-6 rounded-md transition">Choose Files</button></>);
        }
    };
    return (
        <div className="h-full flex flex-col">
            {/* Upload Section */}
            <div className="flex justify-center items-center flex-1">
                <div {...getRootProps()} className="w-full max-w-2xl bg-[#2a2a2a] border-2 border-dashed border-gray-600 rounded-2xl p-12 text-center cursor-pointer outline-none">
                    <input {...getInputProps()} />
                    {renderContent()}
                </div>
            </div>
            
            {/* Search Section */}
            <div className="mt-8 max-w-4xl mx-auto w-full">
                <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Search Documents</h3>
                    <form onSubmit={handleSearch} className="flex gap-4 mb-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for similar content..."
                            className="flex-1 bg-[#3c3c3c] border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-[#00aaff] focus:outline-none"
                            disabled={isSearching}
                        />
                        <button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            className="bg-[#00aaff] hover:bg-[#0099e6] disabled:bg-gray-500 text-white font-bold py-2 px-6 rounded-md transition"
                        >
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-md font-semibold text-white">Search Results ({searchResults.length})</h4>
                            {searchResults.map((result, index) => (
                                <div key={index} className="bg-[#3c3c3c] p-4 rounded-lg border border-gray-600">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm text-[#00aaff]">
                                            {result.metadata?.filename || 'Unknown file'}
                                        </span>
                                        {result.distance && (
                                            <span className="text-xs text-gray-400">
                                                Distance: {result.distance.toFixed(4)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        {result.document}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- MODIFIED: The New TemplateBuilderPage ---
const TemplateBuilderPage = ({ onTemplateSaved }) => {
    // NEW: State management for the chat, template, and loading status
    const [chatHistory, setChatHistory] = useState([
        { sender: 'ai', text: "Hello! I'm here to help you create document templates. What type of template would you like to create?" }
    ]);
    const [userInput, setUserInput] = useState('');
    const [currentTemplate, setCurrentTemplate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // NEW: Function to handle sending a message to the backend
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newUserMessage = { sender: 'user', text: userInput };
        setChatHistory(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:5000/generate-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: userInput,
                    current_template: currentTemplate // Send current template for edits
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate template');
            }

            const data = await response.json();
            setCurrentTemplate(data.template); // Update the template state
            // Add a generic AI response to chat
            const newAiMessage = { sender: 'ai', text: "Here's the updated template. What would you like to do next?" };
            setChatHistory(prev => [...prev, newAiMessage]);

        } catch (error) {
            console.error("Template generation error:", error);
            const errorAiMessage = { sender: 'ai', text: `Sorry, an error occurred: ${error.message}` };
            setChatHistory(prev => [...prev, errorAiMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Function to save the template
    const handleSaveTemplate = async () => {
        const templateName = prompt("Please enter a name for this template:");
        if (!templateName || !currentTemplate) {
            alert("Template name cannot be empty and there must be content to save.");
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/save-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: templateName, content: currentTemplate }),
            });
            const data = await response.json();
            alert(data.message);
            
            // Refresh the templates list after successful save
            if (onTemplateSaved) {
                onTemplateSaved();
            }
        } catch (error) {
            console.error("Save template error:", error);
            alert("Failed to save the template.");
        }
    };


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            {/* MODIFIED: Right side panel now renders the markdown template */}
            <Panel
                title="Template Preview"
                actionButton={
                    <button
                        onClick={handleSaveTemplate}
                        disabled={!currentTemplate || isLoading}
                        className="text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white py-1 px-3 rounded-md transition"
                    >
                        Save Template
                    </button>
                }
            >
                {currentTemplate ? (
                    <div className="prose prose-invert p-4">
                        <ReactMarkdown>{currentTemplate}</ReactMarkdown>
                    </div>
                ) : (
                    <EmptyState icon={<DocumentIcon />} text="Start chatting to create your template structure" />
                )}
            </Panel>

            {/* MODIFIED: Left side panel is now a fully interactive chat */}
            <Panel title="Template Builder Chat">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-md text-sm ${msg.sender === 'user' ? 'bg-[#00aaff] text-white' : 'bg-[#4a2e6f] text-purple-200'}`}>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="text-center text-gray-400">Generating...</div>}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                    <div className="flex space-x-2 mb-2">
                        <SuggestionChip onClick={() => setUserInput('Create a business report template')}>Business Report</SuggestionChip>
                        <SuggestionChip onClick={() => setUserInput('Make a template for a research paper')}>Research Paper</SuggestionChip>
                    </div>
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Describe your template requirements..."
                        className="w-full bg-[#3c3c3c] border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-[#00aaff] focus:outline-none"
                        disabled={isLoading}
                    />
                </form>
            </Panel>
        </div>
    );
};


const DocumentGeneratorPage = ({ savedTemplates }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [userQuery, setUserQuery] = useState('');
    const [generatedDocument, setGeneratedDocument] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [documentFormat, setDocumentFormat] = useState('markdown');
    const [editableContent, setEditableContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Handle document generation
    const handleGenerateDocument = async (e) => {
        e.preventDefault();
        if (!selectedTemplate || !userQuery.trim() || isGenerating) return;

        setIsGenerating(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/generate-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_name: selectedTemplate,
                    user_query: userQuery,
                    format: documentFormat
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate document');
            }

            const data = await response.json();
            setGeneratedDocument(data.generated_content);
            setEditableContent(data.generated_content);
        } catch (error) {
            console.error("Document generation error:", error);
            alert(`Failed to generate document: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle downloading the document
    const handleDownloadDocument = () => {
        if (!editableContent) return;
        
        const blob = new Blob([editableContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-document-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            {/* Document Preview Panel */}
            <Panel 
                title="Document Preview" 
                actionButton={
                    <div className="flex space-x-2">
                        {editableContent && (
                            <button 
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-sm bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md transition"
                            >
                                {isEditing ? 'Preview' : 'Edit'}
                            </button>
                        )}
                        <button 
                            onClick={handleDownloadDocument}
                            disabled={!editableContent}
                            className="text-sm bg-[#00aaff] hover:bg-[#0099e6] disabled:bg-gray-500 text-white py-1 px-3 rounded-md transition"
                        >
                            Download
                        </button>
                    </div>
                }
            >
                {editableContent ? (
                    <div className="flex-1 p-4 overflow-y-auto">
                        {isEditing ? (
                            <textarea
                                value={editableContent}
                                onChange={(e) => setEditableContent(e.target.value)}
                                className="w-full h-full bg-[#3c3c3c] border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-[#00aaff] focus:outline-none resize-none font-mono text-sm"
                                placeholder="Edit your document content here..."
                            />
                        ) : (
                            <div className="prose prose-invert max-w-none">
                                <ReactMarkdown>{editableContent}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                ) : (
                    <EmptyState icon={<DocumentIcon />} text="Select a template and generate your document" />
                )}
            </Panel>

            {/* Document Generator Panel */}
            <Panel 
                headerContent={
                    <div className="flex items-center space-x-4">
                        <h2 className="font-semibold text-white">Document Generator</h2>
                        <select 
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="text-sm bg-gray-700 text-white py-1 px-3 rounded-md focus:outline-none"
                            disabled={savedTemplates.length === 0}
                        >
                            <option value="">
                                {savedTemplates.length === 0 ? 'No templates available' : 'Select Template'}
                            </option>
                            {savedTemplates.map(template => (
                                <option key={template.name} value={template.name}>
                                    {template.name}
                                </option>
                            ))}
                        </select>
                        <select 
                            value={documentFormat}
                            onChange={(e) => setDocumentFormat(e.target.value)}
                            className="text-sm bg-gray-700 text-white py-1 px-3 rounded-md focus:outline-none"
                        >
                            <option value="markdown">Markdown</option>
                            <option value="html">HTML</option>
                            <option value="text">Plain Text</option>
                        </select>
                    </div>
                }
            >
                <div className="flex-1 p-4">
                    {savedTemplates.length === 0 ? (
                        <ChatMessage text="No templates available. Please create a template first in the Template Builder section." />
                    ) : !selectedTemplate ? (
                        <ChatMessage text="Please select a template from the dropdown above to get started." />
                    ) : (
                        <ChatMessage text={`Template "${selectedTemplate}" selected. Now describe what document you want to create using this template.`} />
                    )}
                </div>
                
                <form onSubmit={handleGenerateDocument} className="p-4 border-t border-gray-700">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                What document would you like to create?
                            </label>
                            <textarea
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                placeholder="Describe the document you want to create... (e.g., 'Create a business report about Q4 sales performance with data from our marketing team')"
                                className="w-full bg-[#3c3c3c] border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-[#00aaff] focus:outline-none resize-none"
                                rows={3}
                                disabled={isGenerating || !selectedTemplate}
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={!selectedTemplate || !userQuery.trim() || isGenerating}
                            className="w-full bg-[#00aaff] hover:bg-[#0099e6] disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition"
                        >
                            {isGenerating ? 'Generating Document...' : 'Generate Document'}
                        </button>
                    </div>
                </form>
            </Panel>
        </div>
    );
};

// --- Helper Components for UI ---
const Panel = ({ title, actionButton, headerContent, children }) => ( <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 flex flex-col h-full"><div className="p-4 border-b border-gray-700 flex justify-between items-center">{headerContent ? headerContent : <h2 className="font-semibold text-white">{title}</h2>}{actionButton}</div><div className="flex-1 flex flex-col overflow-hidden">{children}</div></div> );
const EmptyState = ({ icon, text }) => ( <div className="flex-1 flex justify-center items-center text-center p-8"><div><div className="mx-auto h-16 w-16 text-gray-500">{icon}</div><p className="mt-2 text-sm text-gray-500">{text}</p></div></div> );
const ChatMessage = ({ text }) => ( <div className="p-4 bg-[#4a2e6f] text-purple-200 rounded-lg max-w-md self-start"><p className="text-sm">{text}</p></div> );
// MODIFIED SuggestionChip to be clickable
const SuggestionChip = ({ children, onClick }) => (<button type="button" onClick={onClick} className="text-sm bg-[#3c3c3c] hover:bg-gray-600 py-1 px-3 rounded-full">{children}</button>);