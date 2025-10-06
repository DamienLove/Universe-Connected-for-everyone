import React, { useState } from 'react';
import { audioService } from '../services/AudioService';

const soundIds = [
    'background', 'purchase_upgrade', 'milestone_achievement', 'collect_orb',
    'connect_success', 'node_bounce', 'connection_bounce', 'phage_spawn',
    'phage_drain', 'phage_capture', 'ui_click', 'ui_open'
];

const DevPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [selectedSound, setSelectedSound] = useState<string>(soundIds[0]);
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedSound) {
            setMessage('Please select a sound and a file.');
            return;
        }

        try {
            const blob = new Blob([file], { type: file.type });
            await audioService.loadSoundFromBlob(selectedSound, blob);
            setMessage(`Successfully uploaded and replaced '${selectedSound}'.`);
            setFile(null);
        } catch (error) {
            console.error('Error uploading file:', error);
            setMessage('Failed to upload sound.');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(50, 50, 50, 0.95)', padding: '2rem', borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 1001, color: 'white',
            border: '1px solid #444', display: 'flex', flexDirection: 'column', gap: '1rem',
            width: 'clamp(300px, 80vw, 500px)'
        }}>
            <h2 style={{ textAlign: 'center', margin: 0, paddingBottom: '1rem', borderBottom: '1px solid #555' }}>
                SFX Upload Panel
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="sound-select">Select Sound to Replace:</label>
                <select
                    id="sound-select"
                    value={selectedSound}
                    onChange={(e) => setSelectedSound(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
                >
                    {soundIds.map(id => <option key={id} value={id}>{id}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="file-upload">Upload Audio File:</label>
                <input
                    id="file-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    style={{ padding: '0.5rem', background: '#333', borderRadius: '5px' }}
                />
            </div>

            <button
                onClick={handleUpload}
                disabled={!file}
                style={{
                    padding: '0.75rem', borderRadius: '5px', background: '#4CAF50', color: 'white',
                    border: 'none', cursor: 'pointer', opacity: !file ? 0.5 : 1, transition: 'background-color 0.3s'
                }}
            >
                Upload & Replace
            </button>

            {message && <p style={{ textAlign: 'center', margin: '0.5rem 0 0', color: message.includes('Successfully') ? '#4CAF50' : '#F44336' }}>
                {message}
            </p>}

            <button
                onClick={onClose}
                style={{
                    marginTop: '1rem', padding: '0.5rem', background: '#f44336', color: 'white',
                    border: 'none', borderRadius: '5px', cursor: 'pointer', transition: 'background-color 0.3s'
                }}
            >
                Close
            </button>
        </div>
    );
};

export default DevPanel;