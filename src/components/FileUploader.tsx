import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import JSZip from "jszip";
import { slugify } from "../lib/utils";

// Fájl állapot típus
interface FileItem {
    id: string;
    file: File;
    preview: string;
    status: 'pending' | 'converting' | 'done' | 'error';
    convertedFile?: File;
    slugifiedName?: string;
    error?: string;
}

const MAX_FILES = 10;

export default function FileUploader() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    // Egyedi ID generálás
    const generateId = () => Math.random().toString(36).substring(2, 9);

    // Fájlok hozzáadása
    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles);

        // Max 10 ellenőrzés
        const availableSlots = MAX_FILES - files.length;
        if (availableSlots <= 0) return;

        const filesToAdd = fileArray.slice(0, availableSlots);

        // Fájlok feldolgozása
        filesToAdd.forEach(file => {
            // Csak kép típusok
            if (!file.type.match(/^image\/(jpeg|png)$/)) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = e.target?.result as string;
                const newItem: FileItem = {
                    id: generateId(),
                    file,
                    preview,
                    status: 'pending'
                };
                setFiles(prev => [...prev, newItem]);
            };
            reader.readAsDataURL(file);
        });
    }, [files.length]);

    // Fájl eltávolítása
    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    // Összes törlése
    const clearAll = () => {
        setFiles([]);
    };

    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        addFiles(e.dataTransfer.files);
    };

    // Input change handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(e.target.files);
        }
        // Reset input
        e.target.value = '';
    };

    // Összes konvertálása
    const handleConvertAll = async () => {
        const pendingFiles = files.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0) return;

        setIsConverting(true);

        for (const item of pendingFiles) {
            // Státusz: converting
            setFiles(prev => prev.map(f =>
                f.id === item.id ? { ...f, status: 'converting' as const } : f
            ));

            try {
                const nameWithoutExt = item.file.name.replace(/\.[^.]+$/, '');
                const slug = slugify(nameWithoutExt);
                const newFileName = `${slug}.webp`;

                const options = {
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    fileType: "image/webp" as const,
                    initialQuality: 0.9,
                };

                const compressed = await imageCompression(item.file, options);

                // Státusz: done
                setFiles(prev => prev.map(f =>
                    f.id === item.id ? {
                        ...f,
                        status: 'done' as const,
                        convertedFile: compressed,
                        slugifiedName: newFileName
                    } : f
                ));
            } catch (error) {
                // Státusz: error
                setFiles(prev => prev.map(f =>
                    f.id === item.id ? {
                        ...f,
                        status: 'error' as const,
                        error: 'Konvertálási hiba'
                    } : f
                ));
            }
        }

        setIsConverting(false);
    };

    // Egyedi fájl letöltése
    const handleDownloadSingle = (item: FileItem) => {
        if (!item.convertedFile || !item.slugifiedName) return;

        const url = URL.createObjectURL(item.convertedFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.slugifiedName;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ZIP letöltés
    const handleDownloadZip = async () => {
        const doneFiles = files.filter(f => f.status === 'done' && f.convertedFile);
        if (doneFiles.length === 0) return;

        const zip = new JSZip();

        for (const item of doneFiles) {
            if (item.convertedFile && item.slugifiedName) {
                zip.file(item.slugifiedName, item.convertedFile);
            }
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'webp-images.zip';
        link.click();
        URL.revokeObjectURL(url);
    };

    // Statisztikák
    const pendingCount = files.filter(f => f.status === 'pending').length;
    const doneCount = files.filter(f => f.status === 'done').length;
    const totalOriginalSize = files.reduce((acc, f) => acc + f.file.size, 0);
    const totalConvertedSize = files
        .filter(f => f.convertedFile)
        .reduce((acc, f) => acc + (f.convertedFile?.size || 0), 0);
    const savedPercentage = totalOriginalSize > 0 && totalConvertedSize > 0
        ? Math.round((1 - totalConvertedSize / totalOriginalSize) * 100)
        : 0;

    // Státusz ikon komponens
    const StatusIcon = ({ status }: { status: FileItem['status'] }) => {
        switch (status) {
            case 'pending':
                return (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-border)' }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)' }} />
                    </div>
                );
            case 'converting':
                return (
                    <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                );
            case 'done':
                return (
                    <svg className="w-5 h-5" style={{ color: 'var(--color-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5" style={{ color: 'var(--color-danger)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                );
        }
    };

    return (
        <div className="w-full">
            <div className="p-5 rounded-2xl" style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
            }}>
                {/* Feltöltő terület - kiemelt */}
                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full rounded-xl cursor-pointer transition-all ${
                        files.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{
                        border: isDragging ? '2px solid var(--color-accent)' : '2px dashed var(--color-accent)',
                        backgroundColor: 'var(--color-bg)',
                        padding: files.length > 0 ? '1rem' : '2rem 1.5rem',
                        boxShadow: isDragging ? '0 0 20px rgba(255, 77, 48, 0.15)' : 'none',
                    }}>
                    <div className="flex flex-col items-center justify-center">
                        <svg
                            className={`mb-3 ${files.length > 0 ? 'w-6 h-6' : 'w-10 h-10'}`}
                            style={{ color: isDragging ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Kattints</span>
                            <span style={{ color: 'var(--color-text-muted)' }}> vagy húzd ide</span>
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            PNG, JPG • Max {MAX_FILES} fájl • {files.length}/{MAX_FILES}
                        </p>
                    </div>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png"
                        multiple
                        disabled={files.length >= MAX_FILES}
                        className="hidden"
                    />
                </label>

                {/* Fájl lista */}
                {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {files.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 rounded-lg transition-all"
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    border: item.status === 'done'
                                        ? '1px solid var(--color-accent)'
                                        : '1px solid var(--color-border)',
                                }}>
                                {/* Preview */}
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0"
                                    style={{ border: '1px solid var(--color-border)' }}>
                                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                                        {item.status === 'done' ? item.slugifiedName : item.file.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                        <span>{Math.round(item.file.size / 1024)} KB</span>
                                        {item.status === 'done' && item.convertedFile && (
                                            <>
                                                <span>→</span>
                                                <span style={{ color: 'var(--color-accent)' }}>
                                                    {Math.round(item.convertedFile.size / 1024)} KB
                                                </span>
                                                <span className="font-semibold px-1.5 py-0.5 rounded text-xs"
                                                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                                                    -{Math.round((1 - item.convertedFile.size / item.file.size) * 100)}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Státusz / Akciók */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <StatusIcon status={item.status} />

                                    {item.status === 'done' && (
                                        <button
                                            onClick={() => handleDownloadSingle(item)}
                                            className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                                            title="Letöltés">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                            </svg>
                                        </button>
                                    )}

                                    {item.status !== 'converting' && (
                                        <button
                                            onClick={() => removeFile(item.id)}
                                            className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-muted)' }}
                                            title="Eltávolítás">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Akciók */}
                {files.length > 0 && (
                    <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                        {/* Összesített statisztika */}
                        {doneCount > 0 && (
                            <div className="flex items-center justify-between text-sm p-3 rounded-lg"
                                style={{ backgroundColor: 'rgba(255, 77, 48, 0.1)' }}>
                                <span style={{ color: 'var(--color-text)' }}>
                                    Összesen megtakarítva:
                                </span>
                                <span className="font-bold" style={{ color: 'var(--color-accent)' }}>
                                    {Math.round((totalOriginalSize - totalConvertedSize) / 1024)} KB ({savedPercentage}%)
                                </span>
                            </div>
                        )}

                        {/* Gombok */}
                        <div className="flex gap-2">
                            {pendingCount > 0 && (
                                <button
                                    onClick={handleConvertAll}
                                    disabled={isConverting}
                                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                                    style={{ background: 'var(--color-accent)', color: 'white' }}>
                                    {isConverting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Konvertálás...
                                        </span>
                                    ) : (
                                        `Konvertálás (${pendingCount} kép)`
                                    )}
                                </button>
                            )}

                            {doneCount > 1 && (
                                <button
                                    onClick={handleDownloadZip}
                                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                                    style={{ background: 'var(--gradient-accent)', color: 'white' }}>
                                    ZIP letöltés ({doneCount} kép)
                                </button>
                            )}

                            <button
                                onClick={clearAll}
                                disabled={isConverting}
                                className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    color: 'var(--color-text-muted)',
                                    border: '1px solid var(--color-border)',
                                }}>
                                Törlés
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
