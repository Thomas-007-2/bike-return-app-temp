import React, { useState, useRef } from 'react'
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react'
import imageCompression from 'browser-image-compression'

const PhotoUpload = ({ onPhotosChange, maxPhotos = 5 }) => {
  const [photos, setPhotos] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [errors, setErrors] = useState([])
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // Progressive compression options - fallback strategy
  const compressionOptions = [
    { 
      maxSizeMB: 0.5, 
      maxWidthOrHeight: 1920, 
      initialQuality: 0.8,
      useWebWorker: true,
      fileType: 'image/jpeg'
    },
    { 
      maxSizeMB: 0.8, 
      maxWidthOrHeight: 1280, 
      initialQuality: 0.6,
      useWebWorker: true,
      fileType: 'image/jpeg'
    },
    { 
      maxSizeMB: 1.2, 
      maxWidthOrHeight: 800, 
      initialQuality: 0.4,
      useWebWorker: true,
      fileType: 'image/jpeg'
    }
  ]

  const compressImageWithFallback = async (file) => {
    console.log(`Starting compression for: ${file.name}`)
    console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    console.log(`File type: ${file.type}`)

    // Check if file is too large before processing
    const maxFileSize = 2 * 1024 * 1024 // 2MB limit
    if (file.size > maxFileSize) {
      const errorMsg = `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed size is 2MB.`
      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = `File "${file.name}" is not a valid image file.`
      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    let lastError = null

    // Try each compression option progressively
    for (let i = 0; i < compressionOptions.length; i++) {
      const options = compressionOptions[i]
      const attemptNumber = i + 1
      
      try {
        console.log(`Compression attempt ${attemptNumber}/${compressionOptions.length} for ${file.name}`)
        console.log(`Using options:`, options)
        
        setProcessingStatus(`Compressing ${file.name} (attempt ${attemptNumber}/${compressionOptions.length})...`)

        const compressedFile = await imageCompression(file, options)
        
        const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2)
        const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
        
        console.log(`✅ Compression successful for ${file.name}`)
        console.log(`Compressed size: ${compressedSizeMB}MB (${compressionRatio}% reduction)`)
        
        setProcessingStatus(`Successfully compressed ${file.name}`)
        
        return compressedFile
      } catch (error) {
        lastError = error
        console.warn(`❌ Compression attempt ${attemptNumber} failed for ${file.name}:`, error.message)
        
        if (i < compressionOptions.length - 1) {
          console.log(`Trying next compression option...`)
          setProcessingStatus(`Retrying compression for ${file.name}...`)
        }
      }
    }

    // All compression attempts failed
    const errorMsg = `Failed to compress "${file.name}" after ${compressionOptions.length} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  const validateAndProcessFiles = async (fileList) => {
    const files = Array.from(fileList)
    const newErrors = []
    
    console.log(`Processing ${files.length} files...`)

    // Check total photo limit
    if (photos.length + files.length > maxPhotos) {
      const errorMsg = `Cannot add ${files.length} photos. Maximum ${maxPhotos} photos allowed (currently have ${photos.length}).`
      newErrors.push(errorMsg)
      setErrors(prev => [...prev, errorMsg])
      return
    }

    setIsProcessing(true)
    setProcessingStatus('Validating files...')
    setErrors([])

    const processedPhotos = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        try {
          console.log(`\n--- Processing file ${i + 1}/${files.length}: ${file.name} ---`)
          
          const compressedFile = await compressImageWithFallback(file)
          
          // Create preview URL
          const previewUrl = URL.createObjectURL(compressedFile)
          
          const photoData = {
            id: Date.now() + i,
            file: compressedFile,
            preview: previewUrl,
            originalName: file.name,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1)
          }

          processedPhotos.push(photoData)
          console.log(`✅ Successfully processed: ${file.name}`)
          
        } catch (error) {
          console.error(`❌ Failed to process ${file.name}:`, error)
          newErrors.push(`Failed to process "${file.name}": ${error.message}`)
        }
      }

      if (processedPhotos.length > 0) {
        const updatedPhotos = [...photos, ...processedPhotos]
        setPhotos(updatedPhotos)
        onPhotosChange?.(updatedPhotos)
        
        console.log(`\n🎉 Successfully processed ${processedPhotos.length}/${files.length} files`)
        setProcessingStatus(`Successfully processed ${processedPhotos.length} photo(s)`)
      }

      if (newErrors.length > 0) {
        setErrors(newErrors)
        console.error(`\n⚠️ Encountered ${newErrors.length} errors during processing`)
      }

    } catch (error) {
      console.error('Unexpected error during file processing:', error)
      const errorMsg = `Unexpected error: ${error.message}`
      setErrors(prev => [...prev, errorMsg])
    } finally {
      setIsProcessing(false)
      
      // Clear processing status after a delay
      setTimeout(() => {
        setProcessingStatus('')
      }, 3000)
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      validateAndProcessFiles(files)
    }
    // Reset input
    e.target.value = ''
  }

  const handleCameraCapture = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      validateAndProcessFiles(files)
    }
    // Reset input
    e.target.value = ''
  }

  const removePhoto = (photoId) => {
    const photoToRemove = photos.find(p => p.id === photoId)
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.preview)
    }
    
    const updatedPhotos = photos.filter(photo => photo.id !== photoId)
    setPhotos(updatedPhotos)
    onPhotosChange?.(updatedPhotos)
    
    console.log(`Removed photo with ID: ${photoId}`)
  }

  const clearAllPhotos = () => {
    photos.forEach(photo => {
      URL.revokeObjectURL(photo.preview)
    })
    setPhotos([])
    onPhotosChange?.([])
    setErrors([])
    console.log('Cleared all photos')
  }

  const dismissError = (index) => {
    setErrors(prev => prev.filter((_, i) => i !== index))
  }

  const openCamera = () => {
    cameraInputRef.current?.click()
  }

  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isProcessing || photos.length >= maxPhotos}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
        disabled={isProcessing || photos.length >= maxPhotos}
      />

      {/* Button Section */}
      <div className="space-y-4 mb-6">
        {isProcessing ? (
          <div className="flex flex-col items-center space-y-2 p-8 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-blue-600 font-medium">Processing photos...</p>
            {processingStatus && (
              <p className="text-sm text-gray-600">{processingStatus}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera Button */}
            <button
              onClick={openCamera}
              disabled={photos.length >= maxPhotos}
              className="flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg transition-colors font-medium"
            >
              <Camera className="h-6 w-6" />
              <span>Kamera öffnen</span>
            </button>

            {/* File Selector Button */}
            <button
              onClick={openFileSelector}
              disabled={photos.length >= maxPhotos}
              className="flex items-center justify-center space-x-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg transition-colors font-medium"
            >
              <Upload className="h-6 w-6" />
              <span>Dateien auswählen</span>
            </button>
          </div>
        )}

        {/* Info Text */}
        <div className="text-center text-sm text-gray-600">
          <p>Maximum file size: 2MB per photo | Target compression: 500KB</p>
          <p>{photos.length}/{maxPhotos} photos uploaded</p>
          {photos.length >= maxPhotos && (
            <p className="text-orange-600 font-medium">Maximum photos reached</p>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mb-4 space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm flex-1">{error}</p>
              <button
                onClick={() => dismissError(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Success Status */}
      {processingStatus && !isProcessing && !processingStatus.includes('Failed') && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <p className="text-green-700 text-sm">{processingStatus}</p>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-700">
              Uploaded Photos ({photos.length})
            </h4>
            <button
              onClick={clearAllPhotos}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={photo.preview}
                    alt={photo.originalName}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Photo Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs">
                  <p className="truncate font-medium">{photo.originalName}</p>
                  <p>
                    {(photo.compressedSize / 1024).toFixed(0)}KB 
                    ({photo.compressionRatio}% reduced)
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUpload