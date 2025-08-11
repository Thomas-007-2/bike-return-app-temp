// Language translation utility for E-Bike Damage Report App 
// Default language is German 
const translations={
de: {
// App.jsx 
title: 'Fahrrad Rückgabemeldung',
bookingId: 'Buchungs-ID',
step1: 'Fotos',
step2: 'Zustand',
nextStepButton: 'Weiter zur Zustandsbewertung',
loadingMessage: 'Meldung wird übertragen...',
errorMessage: 'Fehler beim Übertragen der Meldung. Bitte versuchen Sie es erneut.',
loading: 'Lädt...',

// PhotoUpload.jsx 
uploadTitle: 'Fotos hochladen',
uploadSubtitle: 'Lade Fotos vom Zustand des/der Bikes hoch',
openCamera: 'Kamera öffnen',
selectFiles: 'Dateien auswählen',
selectedPhotos: 'Ausgewählte Fotos',

// ConditionForm.jsx 
question: 'Frage',
of: 'von',
maintenanceExplanation: 'Damit der nächste Gast ein Top-Fahrrad erhält, brauchen wir deine Hilfe um eventuelle Wartungsarbeiten zu ermitteln.',
gears: 'Schaltung:',
brakes: 'Bremsen:',
otherIssues: 'Sonstige Mängel:',
additionalNotes: 'Zusätzliche Bemerkungen:',
gearsPlaceholder: 'Hakt, springt, Sonstiges',
brakesPlaceholder: 'Schleifgeräusche, schlechte Bremsleistung, quietschen, Sonstiges',
otherIssuesPlaceholder: 'Klappern/Knarzen, lockere Teile, Beleuchtung, Sonstiges',
additionalNotesPlaceholder: 'Optional: weitere Anmerkungen zum Bike oder zum Ausleihprozess',
perfect: 'Einwandfrei',
problems: 'Probleme',
back: 'Zurück',
next: 'Weiter',
submit: 'Meldung abschicken',
sending: 'Wird übertragen...',

// ThankYou.jsx 
thankYou: 'Vielen Dank!',
submissionSuccess: 'Deine Rückgabemeldung wurde erfolgreich übermittelt.',
chargeBike: 'Bei E-Bike: aufladen nicht vergessen',
chargeDescription: 'Bitte schließe das Ladegerät an,bevor Du den Raum verlässt.',
lockRoom: 'Raum abschließen',
lockDescription: 'Schließe die Tür und verriegele sie mit der Pfeiltaste auf dem Keypad außen.',

// Auth.jsx 
loginTitle: 'E-Bike Schadensmeldung',
loginSubtitle: 'Melden Sie sich an,um fortzufahren',
registerSubtitle: 'Erstellen Sie ein Konto',
emailLabel: 'E-Mail-Adresse',
emailPlaceholder: 'ihre.email@beispiel.de',
passwordLabel: 'Passwort',
loginButton: 'Anmelden',
registerButton: 'Registrieren',
noAccount: 'Noch kein Konto? Hier registrieren',
hasAccount: 'Bereits ein Konto? Hier anmelden',
authError: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
},
en: {
// App.jsx 
title: 'Bicycle Return Report',
bookingId: 'Booking ID',
step1: 'Photos',
step2: 'Condition',
nextStepButton: 'Continue to Condition Assessment',
loadingMessage: 'Submitting report...',
errorMessage: 'Error submitting the report. Please try again.',
loading: 'Loading...',

// PhotoUpload.jsx 
uploadTitle: 'Upload Photos',
uploadSubtitle: 'Upload photos showing the condition of the bike(s)',
openCamera: 'Open Camera',
selectFiles: 'Select Files',
selectedPhotos: 'Selected Photos',

// ConditionForm.jsx 
question: 'Question',
of: 'of',
maintenanceExplanation: 'To ensure the next guest receives a top-quality bicycle, we need your help to identify any potential maintenance work.',
gears: 'Gears:',
brakes: 'Brakes:',
otherIssues: 'Other Issues:',
additionalNotes: 'Additional Notes:',
gearsPlaceholder: 'Sticking,skipping,other issues',
brakesPlaceholder: 'Rubbing,poor braking performance,squeaking,other issues',
otherIssuesPlaceholder: 'Rattling,loose parts,lighting,other issues',
additionalNotesPlaceholder: 'Optional: additional comments about the bike or rental process',
perfect: 'Perfect',
problems: 'Problems',
back: 'Back',
next: 'Next',
submit: 'Submit Report',
sending: 'Sending...',

// ThankYou.jsx 
thankYou: 'Thank You!',
submissionSuccess: 'Your return report has been successfully submitted.',
chargeBike: 'For E-Bikes: Don\'t Forget to Charge',
chargeDescription: 'Please connect the charger before leaving the room.',
lockRoom: 'Lock the Room',
lockDescription: 'Close the door and lock it using the arrow key on the keypad outside.',

// Auth.jsx 
loginTitle: 'E-Bike Damage Report',
loginSubtitle: 'Sign in to continue',
registerSubtitle: 'Create an account',
emailLabel: 'Email Address',
emailPlaceholder: 'your.email@example.com',
passwordLabel: 'Password',
loginButton: 'Sign In',
registerButton: 'Register',
noAccount: 'No account yet? Register here',
hasAccount: 'Already have an account? Sign in here',
authError: 'An error occurred. Please try again.'
}
};

// Create a language utility to get translations 
const createI18n=(defaultLang='de')=> {
let currentLang=defaultLang;

// Try to get language from URL 
const detectLanguage=()=> {
try {
const urlParams=new URLSearchParams(window.location.search);
const langParam=urlParams.get('lang');
return langParam==='en' ? 'en' : 'de';
} catch (error) {
console.error('Error detecting language:',error);
return 'de';
}
};

// Initialize language 
currentLang=detectLanguage();

// Get translation for a key 
const t=(key)=> {
try {
const langData=translations[currentLang] || translations.de;
return langData[key] || translations.de[key] || key;
} catch (error) {
console.error(`Translation error for key: ${key}`,error);
return key;
}
};

// Get current language 
const getLanguage=()=> currentLang;

// Set language manually if needed 
const setLanguage=(lang)=> {
if (lang==='en' || lang==='de') {
currentLang=lang;
return true;
} 
return false;
};

return {
t,
getLanguage,
setLanguage,
detectLanguage
};
};

export default createI18n();