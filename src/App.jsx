import React, { useState, useEffect } from 'react'
import { createReport, uploadPhoto, callWebhook } from './utils/supabase'
import PhotoUpload from './components/PhotoUpload'
import ConditionForm from './components/ConditionForm'
import ThankYou from './components/ThankYou'
import { ArrowLeft, Loader } from 'lucide-react'
import i18n from './utils/i18n'

const App = () => {
  const [currentStep, setCurrentStep] = useState('photos')
  const [photos, setPhotos] = useState([])
  const [orderId, setOrderId] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [loading, setLoading] = useState(false)
  const [submissionComplete, setSubmissionComplete] = useState(false)
  const [language, setLanguage] = useState(i18n.getLanguage())
  const [hasSubmitted, setHasSubmitted] = useState(false) // Add submission guard
  const [submissionId, setSubmissionId] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get('id') || `ORDER-${Date.now()}`
    const mid = urlParams.get('mid') || 'default'
    const stid = urlParams.get('stid') || 'default'
    const lang = urlParams.get('lang')
    
    setOrderId(id)
    setMerchantId(mid)
    setStoreId(stid)
    
    // Update language if needed
    if (lang === 'en') {
      i18n.setLanguage('en')
      setLanguage('en')
    } else {
      i18n.setLanguage('de')
      setLanguage('de')
    }
    
    console.log('App initialized with:', { orderId: id, merchantId: mid, storeId: stid, language: lang || 'de' })
  }, [])

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentStep, submissionComplete])

  const handlePhotosSelected = (selectedPhotos) => {
    setPhotos(selectedPhotos)
  }

  const handleNextStep = () => {
    if (currentStep === 'photos' && photos.length > 0) {
      setCurrentStep('condition')
    }
  }

  const handleBackStep = () => {
    if (currentStep === 'condition') {
      setCurrentStep('photos')
    }
  }

  const handleFormSubmit = async (formData) => {
    // Prevent multiple submissions
    if (loading || hasSubmitted) {
      console.log('Submission already in progress or completed, ignoring')
      return
    }

    setLoading(true)
    setHasSubmitted(true)
    setError(null)
    
    try {
      console.log('Submitting report for order:', orderId, 'merchant:', merchantId)
      console.log('Form data:', formData)
      
      // Create the report with a unique submission ID
      const report = await createReport(orderId, formData.status, formData.description, merchantId)
      console.log('Report created:', report)
      
      // Store the submission ID for reference
      if (report && report.submission_id) {
        setSubmissionId(report.submission_id)
      }
      
      // Upload photos
      if (photos.length > 0) {
        console.log('Uploading photos:', photos.length)
        const uploadPromises = photos.map(photo => 
          uploadPhoto(photo, orderId, merchantId)
        )
        const uploads = await Promise.all(uploadPromises)
        console.log('Photos uploaded:', uploads)
      }
      
      // Call webhook
      try {
        await callWebhook(orderId, storeId)
        console.log('Webhook called successfully')
      } catch (webhookError) {
        console.error('Webhook call failed, but continuing with submission:', webhookError)
        // Continue even if webhook fails
      }
      
      setSubmissionComplete(true)
    } catch (error) {
      console.error('Error submitting report:', error)
      setError(error.message || i18n.t('errorMessage'))
      setHasSubmitted(false) // Reset on error to allow retry
    } finally {
      setLoading(false)
    }
  }

  if (submissionComplete) {
    return <ThankYou orderId={orderId} merchantId={merchantId} submissionId={submissionId} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {currentStep === 'condition' && (
                <button
                  onClick={handleBackStep}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {i18n.t('title')}
                </h1>
                <p className="text-sm text-gray-600">
                  {i18n.t('bookingId')}: #{orderId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${
              currentStep === 'photos' ? 'text-primary-600' : 'text-gray-400'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'photos' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">{i18n.t('step1')}</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 rounded">
              <div className={`h-1 bg-primary-600 rounded transition-all duration-300 ${
                currentStep === 'condition' ? 'w-full' : 'w-0'
              }`} />
            </div>
            
            <div className={`flex items-center ${
              currentStep === 'condition' ? 'text-primary-600' : 'text-gray-400'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'condition' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">{i18n.t('step2')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {currentStep === 'photos' && (
          <div className="space-y-4">
            <PhotoUpload 
              photos={photos} 
              onPhotosSelected={handlePhotosSelected} 
            />
            {photos.length > 0 && (
              <div className="text-center pb-4">
                <button
                  onClick={handleNextStep}
                  disabled={loading}
                  className="btn-primary text-lg py-3 px-6 disabled:opacity-50"
                >
                  {i18n.t('nextStepButton')}
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'condition' && (
          <ConditionForm 
            onSubmit={handleFormSubmit} 
            loading={loading}
          />
        )}
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
            <p className="text-lg font-medium text-gray-900">
              {i18n.t('loadingMessage')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App