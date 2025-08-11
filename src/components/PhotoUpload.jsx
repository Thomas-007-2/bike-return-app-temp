import React, { useState, useRef } from 'react'
import { Camera, X, Image as ImageIcon } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import i18n from '../utils/i18n'

const PhotoUpload = ({ onPhotosSelected, photos = [] }) => {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [compressing, setCompressing] = useState(false)
  
  // Android 14 fix: Enhanced compression with better memory management
  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 0.5,         // 500KB max size
      maxWidthOrHeight: 1920, // Reasonable resolution limit
      useWebWorker: true,     // Use web workers for better performance
      fileType: 'image/jpeg', // Convert to JPEG format
      initialQuality: 0.8     // Start with 80% quality
    }
    
    try {
      console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)
      
      // Android 14 fix: Additional validation before compression
      if (file.size > 20 * 1024 * 1024) { // 20MB limit before compression
        throw new Error('File too large for processing')
      }
      
      const compressedFile = await imageCompression(file, options)
      console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`)
      
      // Create a new file with jpg extension regardless of original extension
      const finalFile = new File(
        [compressedFile], 
        `${file.name.split('.')[0]}.jpg`,
        { type: 'image/jpeg' }
      )
      
      return finalFile
    } catch (error) {
      console.error('Error compressing image:', error)
      // Return original file if compression fails
      return file
    }
  }
  
  // Android 14 fix: Sequential file processing instead of parallel
  const handleFiles = async (files) => {
    setCompressing(true)
    try {
      const validFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      )
      
      if (validFiles.length === 0) {
        alert('Please select valid image files')
        return
      }
      
      // Android 14 fix: Process files one by one to avoid memory pressure
      const compressedFiles = []
      for (let i = 0; i < validFiles.length; i++) {
        try {
          const compressedFile = await compressImage(validFiles[i])
          compressedFiles.push(compressedFile)
          
          // Android 14 fix: Small delay to prevent memory pressure
          if (i < validFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (error) {
          console.error(`Failed to process file ${validFiles[i].name}:`, error)
        }
      }
      
      onPhotosSelected([...photos, ...compressedFiles])
    } catch (error) {
      console.error('Error processing images:', error)
      alert('Error processing images. Please try again.')
    } finally {
      setCompressing(false)
    }
  }

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosSelected(newPhotos)
  }

  // Android 14 fix: Better memory management for previews
  const getImagePreview = (file) => {
    // Store reference to clean up later if needed
    return URL.createObjectURL(file)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Android 14 fix: Cleanup effect
  React.useEffect(() => {
    return () => {
      // Clean up object URLs when component unmounts
      photos.forEach(photo => {
        if (photo instanceof File) {
          // URLs are created in getImagePreview, cleanup handled by browser
        }
      })
    }
  }, [photos])

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {i18n.t('uploadTitle')}
        </h2>
        <p className="text-gray-600 text-sm">
          {i18n.t('uploadSubtitle')}
        </p>
      </div>

      {/* Camera and File Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          onTouchEnd={(e) => {
            // Android 14 fix: Ensure touch events work properly
            e.preventDefault()
            if (!compressing) {
              cameraInputRef.current?.click()
            }
          }}
          disabled={compressing}
          className="btn-primary flex items-center justify-center space-x-2 py-4 disabled:opacity-50"
          style={{ touchAction: 'manipulation' }} // Android 14 fix
        >
          <Camera className="w-5 h-5" />
          <span>{compressing ? 'Processing...' : i18n.t('openCamera')}</span>
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          onTouchEnd={(e) => {
            // Android 14 fix: Ensure touch events work properly
            e.preventDefault()
            if (!compressing) {
              fileInputRef.current?.click()
            }
          }}
          disabled={compressing}
          className="btn-secondary flex items-center justify-center space-x-2 py-4 disabled:opacity-50"
          style={{ touchAction: 'manipulation' }} // Android 14 fix
        >
          <ImageIcon className="w-5 h-5" />
          <span>{compressing ? 'Processing...' : i18n.t('selectFiles')}</span>
        </button>
      </div>

      {/* Compression Status */}
      {compressing && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Compressing images...</span>
          </div>
        </div>
      )}

      {/* Hidden Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files)
            // Android 14 fix: Clear input to allow same file selection
            e.target.value = ''
          }
        }}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files)
            // Android 14 fix: Clear input to allow same file selection
            e.target.value = ''
          }
        }}
      />

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">
            {i18n.t('selectedPhotos')} ({photos.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={getImagePreview(photo)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-28 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removePhoto(index)
                  }}
                  onTouchEnd={(e) => {
                    // Android 14 fix: Ensure touch events work
                    e.preventDefault()
                    e.stopPropagation()
                    removePhoto(index)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ touchAction: 'manipulation' }} // Android 14 fix
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  <div>{photo.name}</div>
                  <div className="text-xs opacity-75">{formatFileSize(photo.size)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUpload