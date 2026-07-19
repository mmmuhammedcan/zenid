import { useRef, useState } from "react";
import { FileUp } from "lucide-react";

export default function Dropzone({ onFileSelected }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      role="button"
      tabIndex={0}
      className={`flex w-full max-w-xl cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-10 py-16 text-center transition-all ${
        isDragActive
          ? "border-indigo-400 bg-indigo-500/10"
          : "border-neutral-700 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900/70"
      }`}
    >
      <FileUp size={36} className={isDragActive ? "text-indigo-400" : "text-neutral-500"} />
      <div>
        <p className="text-base font-medium text-neutral-200">Drag & drop a PDF or image here</p>
        <p className="mt-1 text-sm text-neutral-500">PDF, JPG, or PNG — or click to browse</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={(e) => onFileSelected(e.target.files[0])}
      />
    </div>
  );
}
