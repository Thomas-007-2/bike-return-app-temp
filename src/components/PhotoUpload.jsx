import React, { useState, useRef } from 'react'
import { Camera, X, Image as ImageIcon } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import i18n from '../utils/i18n'

const PhotoUpload = ({ onPhotosSelected, photos = [] }) => {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [compressing, setCompressing] = useState(false)
  
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
      
      // Compress all valid images
      const compressPromises = validFiles.map(compressImage)
      const compressedFiles = await Promise.all(compressPromises)
      
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

  const getImagePreview = (file) => {
    return URL.createObjectURL(file)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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
          disabled={compressing}
          className="btn-primary flex items-center justify-center space-x-2 py-4 disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
          <span>{compressing ? 'Processing...' : i18n.t('openCamera')}</span>
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={compressing}
          className="btn-secondary flex items-center justify-center space-x-2 py-4 disabled:opacity-50"
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
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
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
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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