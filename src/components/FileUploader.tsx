import { useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import imageCompression from "browser-image-compression";
import JSZip from "jszip";
import { slugify, debounce } from "../lib/utils";

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
    // Preview mezők
    previewCompressed?: string;
    previewSize?: number;
    previewQuality?: number;
    previewGenerating?: boolean;
}

const MAX_FILES = 10;

export default function FileUploader() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [quality, setQuality] = useState(90); // 50-100 skála

    // Preview modal state
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewingFileId, setPreviewingFileId] = useState<string | null>(null);
    const [previewQuality, setPreviewQuality] = useState(90);
    const [sliderPosition, setSliderPosition] = useState(50);

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

    // Blob → Data URL konverzió
    const blobToDataUrl = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // Preview generálás
    const generatePreview = async (fileItem: FileItem, q: number) => {
        const options = {
            maxWidthOrHeight: 800,
            useWebWorker: true,
            fileType: "image/webp" as const,
            initialQuality: q / 100,
        };
        const compressed = await imageCompression(fileItem.file, options);
        const dataUrl = await blobToDataUrl(compressed);
        return { dataUrl, size: compressed.size };
    };

    // Debounce-olt preview újragenerálás
    const debouncedRegenerate = useMemo(
        () => debounce(async (fileId: string, q: number) => {
            const file = files.find(f => f.id === fileId);
            if (!file) return;

            setFiles(prev => prev.map(f =>
                f.id === fileId ? { ...f, previewGenerating: true } : f
            ));

            try {
                const { dataUrl, size } = await generatePreview(file, q);
                setFiles(prev => prev.map(f =>
                    f.id === fileId ? {
                        ...f,
                        previewCompressed: dataUrl,
                        previewSize: size,
                        previewQuality: q,
                        previewGenerating: false
                    } : f
                ));
            } catch {
                setFiles(prev => prev.map(f =>
                    f.id === fileId ? { ...f, previewGenerating: false } : f
                ));
            }
        }, 300),
        [files]
    );

    // Preview modal megnyitása
    const openPreviewModal = async (fileId: string) => {
        const file = files.find(f => f.id === fileId);
        if (!file || file.status !== 'pending') return;

        setPreviewingFileId(fileId);
        setPreviewQuality(quality);
        setSliderPosition(50);
        setPreviewModalOpen(true);

        if (!file.previewCompressed || file.previewQuality !== quality) {
            debouncedRegenerate(fileId, quality);
        }
    };

    // Preview modal bezárása
    const closePreviewModal = () => {
        setPreviewModalOpen(false);
        setPreviewingFileId(null);
    };

    // Preview minőség változás
    const handlePreviewQualityChange = (newQuality: number) => {
        setPreviewQuality(newQuality);
        if (previewingFileId) {
            debouncedRegenerate(previewingFileId, newQuality);
        }
    };

    // Minőség alkalmazása
    const applyPreviewQuality = () => {
        setQuality(previewQuality);
        closePreviewModal();
    };

    // Preview file getter
    const previewingFile = previewingFileId ? files.find(f => f.id === previewingFileId) : null;

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
                                className="relative group rounded-lg overflow-hidden transition-all flex flex-col"
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    border: item.status === 'done'
                                        ? '2px solid var(--color-accent)'
                                        : '1px solid var(--color-border)',
                                }}>
                                {/* Kis preview kép */}
                                <div className="relative h-20 w-full overflow-hidden shrink-0">
                                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                                    {/* Státusz ikon */}
                                    <div className="absolute top-1.5 left-1.5">
                                        <StatusIcon status={item.status} />
                                    </div>
                                    {/* Törlés gomb hover-re */}
                                    {item.status !== 'converting' && (
                                        <button
                                            onClick={() => removeFile(item.id)}
                                            className="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                            title="Eltávolítás">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    )}
                                    {/* Előnézet gomb pending képekhez - mindig látható */}
                                    {item.status === 'pending' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openPreviewModal(item.id);
                                            }}
                                            className="absolute bottom-1.5 right-1.5 px-2 py-1 rounded-md flex items-center gap-1 transition-all hover:scale-105"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.9), rgba(34, 211, 238, 0.9))',
                                                color: 'white',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                            }}
                                            title="Előnézet">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                            </svg>
                                            <span className="text-[10px] font-semibold">Előnézet</span>
                                        </button>
                                    )}
                                </div>

                                {/* Info + letöltés */}
                                <div className="p-3 flex flex-col grow" style={{ backgroundColor: 'var(--color-surface)' }}>
                                    {/* Fájlnév */}
                                    <p className="text-sm font-semibold truncate leading-tight mb-2"
                                        style={{ color: 'var(--color-text)' }}
                                        title={item.status === 'done' ? item.slugifiedName : item.file.name}>
                                        {item.status === 'done' ? item.slugifiedName : item.file.name}
                                    </p>

                                    {/* Méret info */}
                                    <div className="text-xs space-y-1 mb-2">
                                        <div style={{ color: 'var(--color-text-muted)' }}>{item.width}×{item.height} px</div>
                                        <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                                            <span>{Math.round(item.file.size / 1024)} KB</span>
                                            <span>→</span>
                                            {item.status === 'pending' && (
                                                <span
                                                    className="font-bold px-1.5 py-0.5 rounded"
                                                    style={{
                                                        background: 'var(--gradient-primary)',
                                                        color: 'white'
                                                    }}>
                                                    ~{Math.round(estimateWebpSize(item.file.size) / 1024)} KB
                                                </span>
                                            )}
                                            {item.status === 'done' && item.convertedFile && (
                                                <span className="font-bold" style={{ color: 'var(--color-accent)' }}>
                                                    {Math.round(item.convertedFile.size / 1024)} KB
                                                </span>
                                            )}
                                            {item.status === 'converting' && (
                                                <span>...</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Megtakarítás badge */}
                                    <div
                                        className="flex items-center justify-center py-2 rounded-md text-xs font-bold"
                                        style={{
                                            background: item.status === 'done'
                                                ? 'linear-gradient(135deg, rgba(8, 145, 178, 0.2), rgba(34, 211, 238, 0.2))'
                                                : 'rgba(8, 145, 178, 0.1)',
                                            color: item.status === 'done' ? 'var(--color-accent)' : 'var(--color-primary)'
                                        }}>
                                        {item.status === 'done' && item.convertedFile && (
                                            <>{Math.round((1 - item.convertedFile.size / item.file.size) * 100)}% kisebb</>
                                        )}
                                        {item.status === 'pending' && (
                                            <>~{Math.round((1 - estimateWebpSize(item.file.size) / item.file.size) * 100)}% kisebb méret</>
                                        )}
                                        {item.status === 'converting' && (
                                            <>Feldolgozás...</>
                                        )}
                                    </div>

                                    {/* Letöltés gomb */}
                                    {item.status === 'done' && (
                                        <button
                                            onClick={() => handleDownloadSingle(item)}
                                            className="w-full py-2 mt-2 rounded-md text-sm font-semibold transition-all hover:opacity-90"
                                            style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                            Letöltés
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {/* Új kép hozzáadása gomb */}
                        {files.length < MAX_FILES && (
                            <label className="flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all hover:border-opacity-100 group"
                                style={{
                                    backgroundColor: 'var(--color-bg)',
                                    border: '2px dashed var(--color-border)',
                                    minHeight: '180px',
                                }}>
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    <svg className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                    </svg>
                                </div>
                                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                    Új kép
                                </span>
                                <span className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
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
                                <button
                                    onClick={() => {
                                        const firstPending = files.find(f => f.status === 'pending');
                                        if (firstPending) openPreviewModal(firstPending.id);
                                    }}
                                    disabled={isConverting}
                                    className="p-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                    title="Előnézet">
                                    <svg className="w-4 h-4" style={{ color: 'var(--color-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                    </svg>
                                </button>
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

            {/* Preview Modal - Portal */}
            {previewModalOpen && previewingFile && createPortal(
                <div
                    className="fixed inset-0 z-9999 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
                    onClick={closePreviewModal}
                >
                    <div
                        className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b"
                            style={{ borderColor: 'var(--color-border)' }}>
                            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                                Minőség előnézet
                            </h3>
                            <button
                                onClick={closePreviewModal}
                                className="p-2 rounded hover:opacity-70"
                                style={{ color: 'var(--color-text-muted)' }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>

                        {/* Before/After Slider */}
                        <div className="p-4">
                            <div
                                className="relative w-full aspect-video rounded-lg overflow-hidden cursor-ew-resize select-none"
                                style={{ backgroundColor: 'var(--color-bg)' }}
                                onMouseMove={(e) => {
                                    if (e.buttons !== 1) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                    setSliderPosition((x / rect.width) * 100);
                                }}
                                onMouseDown={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                    setSliderPosition((x / rect.width) * 100);
                                }}
                                onTouchMove={(e) => {
                                    const touch = e.touches[0];
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                                    setSliderPosition((x / rect.width) * 100);
                                }}
                            >
                                {/* Tömörített kép (háttér) */}
                                {previewingFile.previewGenerating ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
                                            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                                    </div>
                                ) : previewingFile.previewCompressed ? (
                                    <img
                                        src={previewingFile.previewCompressed}
                                        alt="Tömörített"
                                        className="absolute inset-0 w-full h-full object-contain"
                                        draggable={false}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span style={{ color: 'var(--color-text-muted)' }}>Generálás...</span>
                                    </div>
                                )}

                                {/* Eredeti kép (felül, clip-path-tal vágva) */}
                                <img
                                    src={previewingFile.preview}
                                    alt="Eredeti"
                                    className="absolute inset-0 w-full h-full object-contain"
                                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                                    draggable={false}
                                />

                                {/* Osztóvonal */}
                                <div
                                    className="absolute top-0 bottom-0 w-1"
                                    style={{
                                        left: `${sliderPosition}%`,
                                        transform: 'translateX(-50%)',
                                        backgroundColor: 'white',
                                        boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    {/* Fogantyú */}
                                    <div
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                                    >
                                        <svg className="w-4 h-4" style={{ color: 'var(--color-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
                                        </svg>
                                    </div>
                                </div>

                                {/* Címkék */}
                                <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}>
                                    Eredeti
                                </div>
                                <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}>
                                    WebP {previewQuality}%
                                </div>
                            </div>

                            {/* Méret összehasonlítás */}
                            <div className="flex justify-between mt-3 text-sm">
                                <span style={{ color: 'var(--color-text-muted)' }}>
                                    Eredeti: <strong style={{ color: 'var(--color-text)' }}>{Math.round(previewingFile.file.size / 1024)} KB</strong>
                                </span>
                                <span style={{ color: 'var(--color-text-muted)' }}>
                                    WebP: <strong style={{ color: 'var(--color-accent)' }}>
                                        {previewingFile.previewSize
                                            ? `~${Math.round(previewingFile.previewSize / 1024)} KB (-${Math.round((1 - previewingFile.previewSize / previewingFile.file.size) * 100)}%)`
                                            : 'Számítás...'}
                                    </strong>
                                </span>
                            </div>

                            {/* Minőség csúszka */}
                            <div className="flex items-center gap-4 mt-4 p-3 rounded-lg"
                                style={{ backgroundColor: 'var(--color-bg)' }}>
                                <label className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
                                    Minőség:
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={previewQuality}
                                    onChange={(e) => handlePreviewQualityChange(Number(e.target.value))}
                                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-accent) ${(previewQuality - 50) * 2}%, var(--color-border) ${(previewQuality - 50) * 2}%)`,
                                    }}
                                />
                                <span className="text-sm font-bold min-w-12 text-right" style={{ color: 'var(--color-accent)' }}>
                                    {previewQuality}%
                                </span>
                            </div>

                            {/* Gombok */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={applyPreviewQuality}
                                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                                    style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                    Alkalmazás
                                </button>
                                <button
                                    onClick={closePreviewModal}
                                    className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text-muted)',
                                        border: '1px solid var(--color-border)',
                                    }}>
                                    Mégse
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
