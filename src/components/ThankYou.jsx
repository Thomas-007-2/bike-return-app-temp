import React, { useState, useEffect } from 'react'
import { CheckCircle, Battery, Lock, Car, Coffee, Key, Zap, Shield, Info } from 'lucide-react'
import { getMerchantConfig } from '../utils/supabase'
import i18n from '../utils/i18n'

const getIconComponent = (iconName) => {
  const iconMap = {
    'Battery': Battery,
    'Lock': Lock,
    'Car': Car,
    'Coffee': Coffee,
    'Key': Key,
    'Zap': Zap,
    'Shield': Shield,
    'Info': Info,
    'CheckCircle': CheckCircle
  }
  return iconMap[iconName] || Info
}

const ThankYou = ({ orderId, merchantId, submissionId }) => {
  const [merchantConfig, setMerchantConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMerchantConfig = async () => {
      try {
        const config = await getMerchantConfig(merchantId)
        setMerchantConfig(config)
      } catch (error) {
        console.error('Error loading merchant config:', error)
      } finally {
        setLoading(false)
      }
    }

    if (merchantId) {
      loadMerchantConfig()
    } else {
      setLoading(false)
    }
  }, [merchantId])

  const getDefaultInstructions = () => {
    // Für alle anderen Merchant IDs außer "0MB1NGsZUlpbNn1Umyi9"
    if (merchantId !== '0MB1NGsZUlpbNn1Umyi9') {
      return [
        {
          icon: 'Lock',
          title_de: 'Fahrrad abgeschlossen?',
          title_en: 'Bike locked?',
          description_de: 'Wenn das Fahrrad wieder abgeschlossen ist, ist nichts weiter zu tun. Wir wünschen noch einen tollen Tag!',
          description_en: 'Once the bicycle is locked again, theres nothing more to do. We wish you a great day!',
          color: 'orange'
        }
      ]
    }

    return [
      {
        icon: 'Battery',
        title_de: 'Bei E-Bike: Aufladen nicht vergessen',
        title_en: 'For E-Bikes: Don\'t Forget to Charge',
        description_de: 'Bitte schließe das Ladegerät an, bevor Du den Raum verlässt.',
        description_en: 'Please connect the charger before leaving the room.',
        color: 'blue'
      },
      {
        icon: 'Lock',
        title_de: 'Raum abschließen',
        title_en: 'Lock the Room',
        description_de: 'Schließe die Tür und verriegele sie mit der Pfeiltaste auf dem Keypad außen.',
        description_en: 'Close the door and lock it using the arrow key on the keypad outside.',
        color: 'orange'
      }
    ]
  }

  const getInstructions = () => {
    if (merchantConfig && merchantConfig.instructions) {
      try {
        return JSON.parse(merchantConfig.instructions)
      } catch (error) {
        console.error('Error parsing merchant instructions:', error)
        return getDefaultInstructions()
      }
    }
    return getDefaultInstructions()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{i18n.t('loading')}</p>
        </div>
      </div>
    )
  }

  const instructions = getInstructions()
  const isGerman = i18n.getLanguage() === 'de'

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {i18n.t('thankYou')}
          </h1>
          <p className="text-lg text-gray-600">
            {i18n.t('submissionSuccess')}
          </p>
        </div>

        <div className="card space-y-6">
          <div className="space-y-4">
            {instructions.map((instruction, index) => {
              const IconComponent = getIconComponent(instruction.icon)
              const colorClasses = {
                blue: 'bg-blue-50 text-blue-600 text-blue-900 text-blue-700',
                orange: 'bg-orange-50 text-orange-600 text-orange-900 text-orange-700',
                green: 'bg-green-50 text-green-600 text-green-900 text-green-700',
                red: 'bg-red-50 text-red-600 text-red-900 text-red-700',
                purple: 'bg-purple-50 text-purple-600 text-purple-900 text-purple-700',
                gray: 'bg-gray-50 text-gray-600 text-gray-900 text-gray-700'
              }
              const colors = colorClasses[instruction.color] || colorClasses.blue
              const [bgColor, iconColor, titleColor, descColor] = colors.split(' ')

              return (
                <div key={index} className={`flex items-start p-4 ${bgColor} rounded-lg`}>
                  <IconComponent className={`w-8 h-8 ${iconColor} mr-4 mt-1`} />
                  <div className="text-left">
                    <h3 className={`font-medium ${titleColor} mb-1`}>
                      {isGerman ? instruction.title_de : instruction.title_en}
                    </h3>
                    <p className={`text-sm ${descColor}`}>
                      {isGerman ? instruction.description_de : instruction.description_en}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThankYou