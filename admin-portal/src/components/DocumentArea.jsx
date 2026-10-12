import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Clock, Upload, Edit3 } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * DocumentArea â€” uploads files to Firebase Cloud Storage.
 * Only the download URL is stored in Firestore (no more base64).
 *
 * Props:
 *   title, description â€” section labels
 *   documents  â€” [{ id, name, status, requirement, fileUrl, file }]
 *   userEmail  â€” used to build the Storage path
 *   onUpload(id, downloadURL) â€” called after successful upload
 *   onAccept(id) / onDeny(id) â€” for Terms doc
 */
const DocumentArea = ({ title, description, documents, userEmail, onUpload, onAccept, onDeny }) => {
    const [uploadingId, setUploadingId] = React.useState(null);
    const [uploadProgress, setUploadProgress] = React.useState({});
    const [previewDoc, setPreviewDoc] = React.useState(null);
    const [showTermsModal, setShowTermsModal] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const pendingDocId = React.useRef(null);

    const handleUploadClick = (id) => {
        pendingDocId.current = id;
        setUploadingId(id);
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) { setUploadingId(null); return; }

        const docId = pendingDocId.current;

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            alert('âš ï¸ PDF files are not supported. Please take a photo of your document (JPG/PNG) and upload that instead.');
            setUploadingId(null);
            e.target.value = null;
            return;
        }

        try {
            const emailKey = (userEmail || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
            const timestamp = Date.now();
            const ext = file.name.split('.').pop() || 'jpg';
            const storagePath = `documents/${emailKey}/${docId}/${timestamp}.${ext}`;
            const storageRef = ref(storage, storagePath);

            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setUploadProgress(prev => ({ ...prev, [docId]: pct }));
                },
                (error) => {
                    console.error('Storage upload error:', error);
                    alert('âŒ Upload failed. Please check your internet connection and try again.');
                    setUploadingId(null);
                    setUploadProgress(prev => ({ ...prev, [docId]: 0 }));
                    e.target.value = null;
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    if (onUpload) onUpload(docId, downloadURL);
                    setUploadingId(null);
                    setUploadProgress(prev => ({ ...prev, [docId]: 0 }));
                    e.target.value = null;
                }
            );
        } catch (err) {
            console.error('Upload error:', err);
            alert('âŒ Upload failed. Please try again.');
            setUploadingId(null);
            e.target.value = null;
        }
    };

    const getDisplayUrl = (doc) => doc.fileUrl || doc.file || null;

    return (
        <div className="space-y-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />

            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">{title}</h3>
                <p className="text-gray-500 text-xs md:text-sm lg:text-base font-bold uppercase tracking-widest">{description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc, idx) => {
                    const displayUrl = getDisplayUrl(doc);
                    const progress = uploadProgress[doc.id] || 0;
                    const isUploading = uploadingId === doc.id;

                    return (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all hover:border-brand/30 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl ${doc.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : doc.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                                        <FileText size={24} />
                                    </div>
                                    {displayUrl && (
                                        <div
                                            onClick={() => setPreviewDoc(doc)}
                                            className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer hover:border-brand/40 hover:scale-105 active:scale-95 transition-all shadow-md"
                                            title="Click to preview"
                                        >
                                            <img src={displayUrl} className="w-full h-full object-cover" alt="Thumbnail" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {doc.status === 'verified' ? (
                                        <span className="flex items-center gap-1 text-[10px] md:text-xs lg:text-sm font-black uppercase text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                                            <CheckCircle2 size={10} /> Verified
                                        </span>
                                    ) : doc.status === 'pending' ? (
                                        <span className="flex items-center gap-1 text-[10px] md:text-xs lg:text-sm font-black uppercase text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                                            <Clock size={10} /> Pending Review
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] md:text-xs lg:text-sm font-black uppercase text-red-500 bg-red-500/10 px-3 py-1 rounded-full">
                                            <AlertCircle size={10} /> Missing
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-lg font-black tracking-tight text-white mb-1 uppercase italic">{doc.name}</h4>
                                <p className="text-gray-500 text-[10px] md:text-xs lg:text-sm leading-relaxed font-bold uppercase tracking-wider">{doc.requirement}</p>
                            </div>

                            {/* Progress bar */}
                            {isUploading && progress > 0 && (
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-brand">Uploading to Cloud...</span>
                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand">{progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                {doc.id === 'terms' ? (
                                    <div className="flex flex-col gap-2 w-full">
                                        <button
                                            onClick={() => setShowTermsModal(true)}
                                            className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-black text-[10px] md:text-xs lg:text-sm uppercase tracking-widest transition-all"
                                        >
                                            Bedingungen Lesen
                                        </button>
                                        {doc.status === 'verified' ? (
                                            <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-black text-[10px] md:text-xs lg:text-sm uppercase tracking-widest text-emerald-500 text-center">
                                                Bedingungen Akzeptiert
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button onClick={() => onAccept && onAccept(doc.id)} className="flex-1 py-3 bg-brand text-dark-900 rounded-xl font-black text-[10px] md:text-xs lg:text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand/20">Akzeptieren</button>
                                                <button onClick={() => onDeny && onDeny(doc.id)} className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-black text-[10px] md:text-xs lg:text-sm uppercase tracking-widest hover:bg-red-500/20 transition-all">Ablehnen</button>
                                            </div>
                                        )}
                                    </div>
                                ) : doc.status === 'missing' ? (
                                    <button
                                        onClick={() => handleUploadClick(doc.id)}
                                        disabled={isUploading}
                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] md:text-xs lg:text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${isUploading ? 'bg-gray-700 text-gray-500' : 'bg-brand text-dark-900 hover:scale-105 shadow-brand/20'}`}
                                    >
                                        {isUploading ? <><Clock size={14} className="animate-spin" /> {progress > 0 ? `${progress}%` : 'Lädt hoch...'}</> : <><Upload size={14} /> Jetzt Hochladen</>}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setPreviewDoc(doc)}
                                            className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl font-black text-[10px] md:text-xs lg:text-sm uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <Clock size={14} /> Foto Öffnen
                                        </button>
                                        <button
                                            onClick={() => handleUploadClick(doc.id)}
                                            disabled={isUploading}
                                            className={`flex-1 py-3 border border-white/5 rounded-xl font-black text-[10px] md:text-xs lg:text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isUploading ? 'bg-white/5 text-gray-600' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            {isUploading ? <><Clock size={14} className="animate-spin" /> {progress > 0 ? `${progress}%` : 'Aktualisiert...'}</> : <><Edit3 size={14} /> Aktualisieren</>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Photo Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer" onClick={() => setPreviewDoc(null)} />
                    <div className="relative w-full max-w-[400px] bg-neutral-950 border border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col p-6 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-neutral-800/60">
                            <h4 className="font-black italic uppercase tracking-tighter text-white">{previewDoc.name}</h4>
                            <button onClick={() => setPreviewDoc(null)} className="text-white/50 hover:text-white"><CheckCircle2 size={24} /></button>
                        </div>
                        <div className="aspect-[4/3] bg-[#1e2520] rounded-2xl flex items-center justify-center overflow-hidden border border-neutral-800/40 relative">
                            {getDisplayUrl(previewDoc) ? (
                                <img src={getDisplayUrl(previewDoc)} className="w-full h-full object-cover" alt={previewDoc.name} />
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent" />
                                    <FileText size={64} className="text-brand/20" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-white/50 italic text-center px-8">
                                            [ Document Photo Preview ]<br /><br />
                                            {previewDoc.name}<br />Status: {previewDoc.status?.toUpperCase()}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-[#1e2520] rounded-2xl space-y-2">
                                <p className="text-[10px] md:text-xs lg:text-sm font-black text-white/50 uppercase tracking-widest">Requirement</p>
                                <p className="text-xs md:text-sm lg:text-base text-white/70 font-medium leading-relaxed">{previewDoc.requirement}</p>
                            </div>
                            {getDisplayUrl(previewDoc) && (
                                <a href={getDisplayUrl(previewDoc)} target="_blank" rel="noopener noreferrer"
                                    className="block w-full py-3 bg-white/5 border border-white/10 text-white/70 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm lg:text-base text-center transition-all">
                                    Open Full Size â†—
                                </a>
                            )}
                            <button onClick={() => setPreviewDoc(null)} className="w-full py-4 bg-brand text-dark-900 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm lg:text-base">
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Terms & Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer" onClick={() => setShowTermsModal(false)} />
                    <div className="relative w-full max-w-[500px] max-h-[80vh] bg-neutral-950 border border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col p-6 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-neutral-800/60">
                            <h4 className="font-black italic uppercase tracking-tighter text-white">Partner-Bedingungen & Datenvereinbarung</h4>
                            <button onClick={() => setShowTermsModal(false)} className="text-white/50 hover:text-white text-lg font-bold">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs md:text-sm lg:text-base text-white/70 leading-relaxed font-medium">
                            <p className="text-brand font-bold uppercase tracking-wider">Zuletzt aktualisiert: Juni 2026</p>
                            <p>Willkommen auf der GreenRide Plattform. Durch die Zustimmung erklärst du dich bereit, eine verbindliche Partnerschaftsvereinbarung mit GreenRide einzugehen.</p>
                            <h5 className="font-black text-white uppercase tracking-tight">1. Partnerschaft & Umfang</h5>
                            <p>Als registrierter Flottenfahrer handelst du als unabhängiger Dienstleister oder als Mitarbeiter eines angeschlossenen Flottenmanagers. Du erklärst dich einverstanden, alle regionalen Personenbeförderungsgenehmigungen, Fahrzeugprüfungspläne und Qualitätsstandards der Plattform einzuhalten.</p>
                            <h5 className="font-black text-white uppercase tracking-tight">2. Compliance & Verifizierung</h5>
                            <p>Fahrer müssen gültige Fahrdokumente, Personenbeförderungsscheine (P-Schein) und Zulassungsbescheinigungen vorweisen. Jegliche Unterbrechung führt zur sofortigen vorübergehenden Sperrung des Dispositionszugangs.</p>
                            <h5 className="font-black text-white uppercase tracking-tight">3. Datennutzung & Standortverfolgung</h5>
                            <p>Die GreenRide App erfasst Echtzeit-Standort- und GPS-Daten, während du aktiv oder online bist. Mit deiner Zustimmung erteilst du die Erlaubnis für das Streaming deines Standorts, Telemetrie-Analysen und die Speicherung von Fahrtenhistorien.</p>
                            <h5 className="font-black text-white uppercase tracking-tight">4. Sicherheit & Standards</h5>
                            <p>Du verpflichtest dich, Fahrzeuge sicher und gesetzmäßig zu führen. Sauberkeit, Fahrzeugpflege und professionelles Verhalten gegenüber Kunden müssen jederzeit gewährleistet sein.</p>
                            <h5 className="font-black text-white uppercase tracking-tight">5. Provision & Abrechnung</h5>
                            <p>Plattformgebühren und Auszahlungen werden dynamisch berechnet und wöchentlich über das Abrechnungssystem (Settlement Ledger) beglichen, vorbehaltlich der überprüften Fahrten-Compliance.</p>
                        </div>
                        <div className="pt-4 border-t border-neutral-800/60">
                            <button onClick={() => setShowTermsModal(false)} className="w-full py-4 bg-brand text-dark-900 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm lg:text-base hover:scale-[1.02] transition-all">
                                Schließen & Zurückkehren
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentArea;

