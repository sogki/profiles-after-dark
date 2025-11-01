import { useCallback } from "react"
import { Upload, X } from "lucide-react"

interface FileUploadAreaProps {
  file: File | null
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  inputId: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  accept?: string
  maxSize?: number
}

export default function FileUploadArea({
  file,
  onFileSelect,
  inputId,
  label,
  icon: Icon,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
}: FileUploadAreaProps) {
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.size > maxSize) {
        return
      }
      
      // Create a synthetic event
      const syntheticEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>
      
      onFileSelect(syntheticEvent)
    }
  }, [onFileSelect, maxSize])

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-white mb-2">
        {label}
      </label>
      
      <div
        className="relative border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          onChange={onFileSelect}
          className="hidden"
        />
        
        {file ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Icon className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-slate-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                // Reset file input
                const input = document.getElementById(inputId) as HTMLInputElement
                if (input) input.value = ""
                onFileSelect({ target: { files: null } } as any)
              }}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-600 bg-red-100 hover:bg-red-200"
            >
              <X className="w-3 h-3 mr-1" />
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-slate-700 rounded-full flex items-center justify-center">
              <Icon className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-400">
                {accept} (max {Math.round(maxSize / 1024 / 1024)}MB)
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Upload className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-sm text-slate-400">Choose file</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

