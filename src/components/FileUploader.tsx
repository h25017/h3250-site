import { useState } from "react";
import imageCompression from "browser-image-compression";
import { slugify } from "../lib/utils";

export default function FileUploader() {
    // Eredeti fájl és preview
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Konvertált fájl és preview - ÚJ!
    const [convertedFile, setConvertedFile] = useState<File | null>(null);
    const [convertedPreview, setConvertedPreview] = useState<string | null>(null);
    const [slugifiedName, setSlugifiedName] = useState<string>('');

    // Fájl választás (mint eddig)
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            setSelectedFile(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setImagePreview(result);
            };
            reader.readAsDataURL(file);
        }
    };
    // Drag & Drop kezelés - ÚJ!
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;

        if (files && files.length > 0) {
            const file = files[0];

            // Ugyanaz mint handleFileChange-ben
            setSelectedFile(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setImagePreview(result);
            };
            reader.readAsDataURL(file);
        }
    };
    // Konvertálás - ÚJ!
    const handleConvert = async () => {
        if (!selectedFile) return; // Ha nincs fájl, ne csinálj semmit
        // Slug generálás ELŐSZÖR
        const nameWithoutExt = selectedFile.name.replace(/\.[^.]+$/, '');
        const slug = slugify(nameWithoutExt);
        const newFileName = `${slug}.webp`;
        setSlugifiedName(newFileName); // Elmentjük!

        const options = {
            maxWidthOrHeight: 1920, // Max 800px széles/magas
            useWebWorker: true, // Gyorsabb
            fileType: "image/webp", // WebP formátum
            initialQuality: 0.9, // 90% minőség
        };

        try {
            // Konverzió
            const compressed = await imageCompression(selectedFile, options);
            setConvertedFile(compressed);

            // Preview generálás
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setConvertedPreview(result);
            };
            reader.readAsDataURL(compressed);
        } catch (error) {
            console.error("Hiba a konverzió során:", error);
        }
    };
    // Letöltés függvény - ÚJ!
 const handleDownload = () => {
  if (!convertedFile || !slugifiedName) return;
  
  // Új File objektum az előre generált névvel
  const renamedFile = new File([convertedFile], slugifiedName, {
    type: 'image/webp'
  });
  
  const url = URL.createObjectURL(renamedFile);
  const link = document.createElement('a');
  link.href = url;
  link.download = slugifiedName;
  link.click();
  URL.revokeObjectURL(url);
};

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div
                className="mb-8 p-8 rounded-2xl"
                style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                }}>
                <h2
                    className="text-3xl font-bold mb-6"
                    style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--color-text)",
                    }}>
                    Fájl feltöltő
                </h2>

                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all"
                    style={{
                        borderColor: isDragging
                            ? "var(--color-primary)"
                            : "var(--color-border)",
                        backgroundColor: isDragging
                            ? "var(--color-primary)10"
                            : "var(--color-bg)",
                    }}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                            className="w-10 h-10 mb-3"
                            style={{ color: "var(--color-text-muted)" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p
                            className="mb-2 text-sm"
                            style={{ color: "var(--color-text-muted)" }}>
                            <span className="font-semibold">Kattints a feltöltéshez</span>{" "}
                            vagy húzd ide
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            PNG vagy JPG (MAX. 10MB)
                        </p>
                    </div>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png"
                        className="hidden"
                    />
                </label>
            </div>

            {/* EREDETI KÉP */}
            {selectedFile && (
                <div
                    className="mb-8 p-8 rounded-2xl"
                    style={{
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                    }}>
                    <h3
                        className="text-2xl font-bold mb-4"
                        style={{
                            fontFamily: "var(--font-display)",
                            color: "var(--color-text)",
                        }}>
                        📷 Eredeti kép
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <div className="space-y-2 mb-4">
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--color-text-muted)" }}>
                                    <span
                                        className="font-semibold"
                                        style={{ color: "var(--color-text)" }}>
                                        Fájlnév:
                                    </span>{" "}
                                    {selectedFile.name}
                                </p>
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--color-text-muted)" }}>
                                    <span
                                        className="font-semibold"
                                        style={{ color: "var(--color-text)" }}>
                                        Méret:
                                    </span>{" "}
                                    {Math.round(selectedFile.size / 1024)} KB
                                </p>
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--color-text-muted)" }}>
                                    <span
                                        className="font-semibold"
                                        style={{ color: "var(--color-text)" }}>
                                        Típus:
                                    </span>{" "}
                                    {selectedFile.type}
                                </p>
                            </div>

                            <button
                                onClick={handleConvert}
                                className="w-full px-6 py-3 rounded-xl text-base font-semibold transition-all hover:opacity-90"
                                style={{
                                    backgroundColor: "var(--color-primary)",
                                    color: "white",
                                }}>
                                🔄 Konvertálás WebP-re
                            </button>
                        </div>

                        {imagePreview && (
                            <div
                                className="rounded-xl overflow-hidden"
                                style={{ border: "1px solid var(--color-border)" }}>
                                <img
                                    src={imagePreview}
                                    alt="Original"
                                    className="w-full h-auto"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* KONVERTÁLT KÉP */}
            {convertedFile && (
                <div
                    className="p-8 rounded-2xl"
                    style={{
                        backgroundColor: "var(--color-surface)",
                        border: "2px solid var(--color-accent)",
                    }}>
                    <h3
                        className="text-2xl font-bold mb-4"
                        style={{
                            fontFamily: "var(--font-display)",
                            color: "var(--color-text)",
                        }}>
                        ✅ Konvertált kép
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <div className="space-y-2 mb-4">
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--color-text-muted)" }}>
                                    <span
                                        className="font-semibold"
                                        style={{ color: "var(--color-text)" }}>
                                        Fájlnév:
                                    </span>{" "}
                                    {slugifiedName}
                                </p>
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--color-text-muted)" }}>
                                    <span
                                        className="font-semibold"
                                        style={{ color: "var(--color-text)" }}>
                                        Méret:
                                    </span>{" "}
                                    {Math.round(convertedFile.size / 1024)} KB
                                </p>
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--color-text-muted)" }}>
                                    <span
                                        className="font-semibold"
                                        style={{ color: "var(--color-text)" }}>
                                        Típus:
                                    </span>{" "}
                                    {convertedFile.type}
                                </p>
                                <p
                                    className="text-sm font-semibold"
                                    style={{ color: "var(--color-accent)" }}>
                                    📉 Méretcsökkenés:{" "}
                                    {Math.round(
                                        (1 - convertedFile.size / selectedFile.size) * 100
                                    )}
                                    %
                                </p>
                            </div>

                            <button
                                onClick={handleDownload}
                                className="w-full px-6 py-3 rounded-xl text-base font-semibold transition-all hover:opacity-90"
                                style={{
                                    backgroundColor: "var(--color-accent)",
                                    color: "white",
                                }}>
                                💾 Letöltés
                            </button>
                        </div>

                        {convertedPreview && (
                            <div
                                className="rounded-xl overflow-hidden"
                                style={{ border: "2px solid var(--color-accent)" }}>
                                <img
                                    src={convertedPreview}
                                    alt="Converted"
                                    className="w-full h-auto"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
