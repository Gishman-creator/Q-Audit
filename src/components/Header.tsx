import React, { type ChangeEvent } from 'react';

interface HeaderProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onFileUpload: (file: File) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onFileUpload }) => {
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };

    return (
        <header className="max-w-7xl mx-auto flex justify-between items-center mb-10 bg-[#11141d] p-5 rounded-2xl border border-slate-800 shadow-2xl">
            <h1 className="text-2xl font-black text-white italic tracking-tighter">Q<span className="text-indigo-500">.</span>Audit</h1>
            <div className="flex items-center gap-4">
                <nav className="flex bg-[#080a0f] p-1 rounded-xl border border-slate-800">
                    {['dashboard', 'statistics', 'simulation'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            {t}
                        </button>
                    ))}
                </nav>
                <label className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all">
                    Import Report <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
            </div>
        </header>
    );
};

export default Header;
