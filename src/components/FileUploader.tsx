import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import JSZip from "jszip";
import { slugify } from "../lib/utils";

// Fájl állapot típus
interface FileItem {
    id: string;
    file: File;
    preview: string;
    width: number;
    height: number;
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
    const [quality, setQuality] = useState(90); // 50-100 skála

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
                // Kép dimenzió lekérése
                const img = new Image();
                img.onload = () => {
                    const newItem: FileItem = {
                        id: generateId(),
                        file,
                        preview,
                        width: img.width,
                        height: img.height,
                        status: 'pending'
                    };
                    setFiles(prev => [...prev, newItem]);
                };
                img.src = preview;
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
                    initialQuality: quality / 100,
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

    // Becsült WebP méret a minőség alapján
    // quality 100% → ~70% of original, quality 50% → ~20% of original
    const estimateWebpSize = (originalSize: number) => {
        const ratio = 0.2 + (quality - 50) / 50 * 0.5;
        return Math.round(originalSize * ratio);
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
                {/* Feltöltő terület - csak ha nincs fájl */}
                {files.length === 0 && (
                    <label
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="flex flex-col items-center justify-center w-full rounded-xl cursor-pointer transition-all"
                        style={{
                            border: isDragging ? '2px solid var(--color-accent)' : '2px dashed var(--color-accent)',
                            backgroundColor: 'var(--color-bg)',
                            padding: '3rem 2rem',
                            minHeight: '180px',
                            boxShadow: isDragging ? '0 0 20px rgba(255, 77, 48, 0.15)' : 'none',
                        }}>
                        <div className="flex flex-col items-center justify-center">
                            <svg
                                className="mb-3 w-14 h-14"
                                style={{ color: isDragging ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                            </svg>
                            <p className="text-base" style={{ color: 'var(--color-text)' }}>
                                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Kattints</span>
                                <span style={{ color: 'var(--color-text-muted)' }}> vagy húzd ide a képeket</span>
                            </p>
                            <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                                PNG, JPG • Max {MAX_FILES} fájl
                            </p>
                        </div>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png"
                            multiple
                            className="hidden"
                        />
                    </label>
                )}

                {/* Fájl lista - kompakt grid */}
                {files.length > 0 && (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
                        style={{
                            padding: isDragging ? '0.5rem' : '0',
                            border: isDragging ? '2px dashed var(--color-accent)' : 'none',
                            borderRadius: '0.75rem',
                        }}>
                        {files.map((item) => (
                            <div
                                key={item.id}
                                className="relative group rounded-lg overflow-hidden transition-all"
                                style={{
                                    backgroundColor: 'var(--color-bg)',
                                    border: item.status === 'done'
                                        ? '2px solid var(--color-accent)'
                                        : '1px solid var(--color-border)',
                                }}>
                                {/* Kis preview kép */}
                                <div className="relative h-16 w-full overflow-hidden">
                                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                                    {/* Státusz ikon */}
                                    <div className="absolute top-1 left-1">
                                        <StatusIcon status={item.status} />
                                    </div>
                                    {/* Törlés gomb hover-re */}
                                    {item.status !== 'converting' && (
                                        <button
                                            onClick={() => removeFile(item.id)}
                                            className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                            title="Eltávolítás">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Info + letöltés */}
                                <div className="p-2" style={{ backgroundColor: 'var(--color-surface)' }}>
                                    <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                                        {item.status === 'done' ? item.slugifiedName : item.file.name}
                                    </p>
                                    <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                        <div className="flex items-center justify-between">
                                            <span>{Math.round(item.file.size / 1024)} KB</span>
                                            {item.status === 'pending' && (
                                                <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                                                    →~{Math.round(estimateWebpSize(item.file.size) / 1024)} KB
                                                </span>
                                            )}
                                            {item.status === 'done' && item.convertedFile && (
                                                <span className="font-bold" style={{ color: 'var(--color-accent)' }}>
                                                    -{Math.round((1 - item.convertedFile.size / item.file.size) * 100)}%
                                                </span>
                                            )}
                                        </div>
                                        <div>{item.width}×{item.height}</div>
                                    </div>
                                    {item.status === 'done' && (
                                        <button
                                            onClick={() => handleDownloadSingle(item)}
                                            className="w-full mt-1.5 p-1.5 rounded text-xs font-medium"
                                            style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                            Letöltés
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {/* Új kép hozzáadása gomb */}
                        {files.length < MAX_FILES && (
                            <label className="flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all hover:opacity-80"
                                style={{
                                    backgroundColor: 'var(--color-bg)',
                                    border: '2px dashed var(--color-border)',
                                    minHeight: '100px',
                                }}>
                                <svg className="w-6 h-6 mb-1" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                    {files.length}/{MAX_FILES}
                                </span>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/png"
                                    multiple
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                )}

                {/* Akciók */}
                {files.length > 0 && (
                    <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                        {/* Minőség csúszka */}
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-4 p-3 rounded-lg"
                                style={{ backgroundColor: 'var(--color-bg)' }}>
                                <label className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
                                    Minőség:
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                    disabled={isConverting}
                                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                                    style={{
                                        background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-accent) ${(quality - 50) * 2}%, var(--color-border) ${(quality - 50) * 2}%)`,
                                    }}
                                />
                                <span className="text-sm font-bold min-w-12 text-right" style={{ color: 'var(--color-accent)' }}>
                                    {quality}%
                                </span>
                            </div>
                        )}

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
                                    style={{ background: 'var(--gradient-primary)', color: 'white' }}>
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
