import React, { useState, useEffect } from 'react'
import { createReport, uploadPhoto, callWebhook } from '../lib/supabaseAPI'
import PhotoUpload from './PhotoUpload'

const ReportForm = ({ orderId, merchantId, onSuccess, onError }) => {
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('damaged')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState('')

  // Android 14 fix: Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.preview) {
          URL.revokeObjectURL(photo.preview)
        }
      })
    }
  }, [photos])

  // Android 14 fix: Add retry wrapper for photo uploads
  const uploadPhotoWithRetry = async (photo, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Android 14 fix: Use timeout wrapper
        return await Promise.race([
          uploadPhoto(photo, orderId, merchantId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 30000)
          )
        ])
      } catch (error) {
        if (attempt === maxRetries) throw error
        
        // Android 14 fix: Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting) return // Prevent double submission
    
    setIsSubmitting(true)
    setSubmissionError('')
    
    try {
      // Android 14 fix: Process files one by one instead of batch
      const uploadedPhotos = []
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        
        // Android 14 fix: Validate file size and type
        if (photo.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File ${photo.name} is too large. Maximum size is 10MB.`)
        }
        
        if (!photo.type.startsWith('image/')) {
          throw new Error(`File ${photo.name} is not a valid image.`)
        }
        
        try {
          // Android 14 fix: Add timeout and retry logic
          const uploadResult = await uploadPhotoWithRetry(photo, 3)
          uploadedPhotos.push(uploadResult)
          
          // Android 14 fix: Clear memory between uploads
          if (window.URL && photo.preview) {
            URL.revokeObjectURL(photo.preview)
          }
          
          // Android 14 fix: Small delay to prevent memory pressure
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (uploadError) {
          console.error(`Failed to upload ${photo.name}:`, uploadError)
          throw new Error(`Failed to upload ${photo.name}. Please try again.`)
        }
      }
      
      // Create the report
      const reportData = await createReport(orderId, status, description, merchantId)
      
      // Call webhook to notify success
      await callWebhook(orderId, merchantId)
      
      if (onSuccess) {
        onSuccess({ report: reportData, photos: uploadedPhotos })
      }
      
    } catch (error) {
      console.error('Submission error:', error)
      const errorMessage = error.message || 'Submission failed. Please try again.'
      setSubmissionError(errorMessage)
      if (onError) {
        onError(error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Rücksendung melden</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="damaged">Beschädigt</option>
            <option value="wrong_item">Falscher Artikel</option>
            <option value="not_as_described">Nicht wie beschrieben</option>
            <option value="defective">Defekt</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreiben Sie das Problem..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            required
          />
        </div>

        <PhotoUpload onPhotosChange={setPhotos} />

        {submissionError && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {submissionError}
          </div>
        )}

        <button
          type="submit"
          onClick={handleSubmit}
          onTouchEnd={(e) => {
            // Android 14 fix: Ensure touch events work
            e.preventDefault()
            if (!isSubmitting) {
              handleSubmit(e)
            }
          }}
          disabled={isSubmitting || photos.length === 0}
          className="w-full btn-primary py-4 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          style={{ touchAction: 'manipulation' }} // Android 14 fix
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            'Meldung abschicken'
          )}
        </button>
      </form>
    </div>
  )
}

export default ReportForm