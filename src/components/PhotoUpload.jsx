import React, { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, RotateCw } from 'lucide-react'

const PhotoUpload = ({ onPhotosChange, maxPhotos = 5 }) => {
  const [photos, setPhotos] = useState([])
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState(null)

  // Android 14 fix: Improved file compression with better memory management
  const compressImage = useCallback((file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
          // Android 14 fix: Clean up image object URL immediately
          URL.revokeObjectURL(img.src)
          resolve(blob)
        }, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }, [])

  // Android 14 fix: Enhanced file handling with validation
  const handleFiles = useCallback(async (fileList) => {
    const newPhotos = []
    
    for (let i = 0; i < Math.min(fileList.length, maxPhotos - photos.length); i++) {
      const file = fileList[i]
      
      // Android 14 fix: Validate file type and size
      if (!file.type.startsWith('image/')) {
        console.warn(`File ${file.name} is not an image, skipping`)
        continue
      }
      
      if (file.size > 20 * 1024 * 1024) { // 20MB limit before compression
        console.warn(`File ${file.name} is too large, skipping`)
        continue
      }
      
      try {
        // Android 14 fix: Compress image with error handling
        const compressedBlob = await compressImage(file)
        
        // Android 14 fix: Create proper File object with metadata
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
        
        // Android 14 fix: Create preview URL
        const preview = URL.createObjectURL(compressedFile)
        
        newPhotos.push({
          ...compressedFile,
          id: Date.now() + i,
          preview
        })
        
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error)
      }
    }
    
    const updatedPhotos = [...photos, ...newPhotos]
    setPhotos(updatedPhotos)
    onPhotosChange(updatedPhotos)
  }, [photos, maxPhotos, onPhotosChange, compressImage])

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleFiles(files)
    }
    // Android 14 fix: Clear input to allow same file selection
    e.target.value = ''
  }, [handleFiles])

  const removePhoto = useCallback((id) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === id)
      if (photoToRemove && photoToRemove.preview) {
        // Android 14 fix: Clean up object URL
        URL.revokeObjectURL(photoToRemove.preview)
      }
      
      const updatedPhotos = prev.filter(p => p.id !== id)
      onPhotosChange(updatedPhotos)
      return updatedPhotos
    })
  }, [onPhotosChange])

  // Android 14 fix: Enhanced camera support with better error handling
  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true)
      
      // Android 14 fix: Request camera with specific constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setIsCapturing(false)
      alert('Camera access denied or not available')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
  }, [stream])

  // Android 14 fix: Improved photo capture with proper canvas handling
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      
      canvas.toBlob(async (blob) => {
        try {
          // Android 14 fix: Create proper file from blob
          const file = new File([blob], `camera-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          
          await handleFiles([file])
          stopCamera()
        } catch (error) {
          console.error('Error processing captured photo:', error)
        }
      }, 'image/jpeg', 0.8)
    }
  }, [handleFiles, stopCamera])

  // Android 14 fix: Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Clean up all object URLs
      photos.forEach(photo => {
        if (photo.preview) {
          URL.revokeObjectURL(photo.preview)
        }
      })
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [photos, stream])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Fotos hinzufügen</h3>
        <span className="text-sm text-gray-500">{photos.length}/{maxPhotos}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* File Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= maxPhotos}
          className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ touchAction: 'manipulation' }} // Android 14 fix
        >
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600 text-center">Datei wählen</span>
        </button>

        {/* Camera Button */}
        <button
          type="button"
          onClick={startCamera}
          disabled={photos.length >= maxPhotos || isCapturing}
          className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ touchAction: 'manipulation' }} // Android 14 fix
        >
          <Camera className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600 text-center">Foto aufnehmen</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Camera Interface */}
      {isCapturing && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-sm w-full mx-4">
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={capturePhoto}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                style={{ touchAction: 'manipulation' }} // Android 14 fix
              >
                Aufnehmen
              </button>
              <button
                onClick={stopCamera}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                style={{ touchAction: 'manipulation' }} // Android 14 fix
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.preview}
                alt="Upload preview"
                className="w-full aspect-square object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ touchAction: 'manipulation' }} // Android 14 fix
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Mindestens ein Foto ist erforderlich
        </p>
      )}
    </div>
  )
}

export default PhotoUpload