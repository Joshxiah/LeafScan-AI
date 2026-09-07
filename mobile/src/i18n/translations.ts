/**
 * All user-facing text in LeafScan AI, in English and Cebuano.
 *
 * `Translations` is the shape every language MUST provide - if a
 * key is missing or misspelled in `ceb`, TypeScript fails to
 * compile. That is what keeps the two languages from drifting
 * apart as screens change.
 *
 * What is deliberately NOT translated here, and why:
 *   - Disease names ("Common Rust", "Gray Leaf Spot"...) - these
 *     come from the backend (GET /api/diseases) and are technical/
 *     scientific names without an established Cebuano equivalent,
 *     the same way agricultural bulletins keep them in English.
 *   - "Corn (Zea mays)" - a scientific binomial, never translated.
 *   - "Username" / "Password" - said in English in everyday
 *     Cebuano tech speech; inventing local words would confuse
 *     more than help.
 *   - Proper nouns: "LeafScan AI", "CAO", "Barangay", place names.
 *
 * The Cebuano text below was written by Claude, not reviewed by a
 * native speaker. It should be checked by someone from the City
 * Agriculture Office before real farmers rely on it, especially
 * the safety-relevant bits (camera tips, password rules).
 */

export type Language = 'en' | 'ceb';

/**
 * Stable identifiers the backend attaches to certain errors (see
 * backend/src/utils/ApiError.ts) - "INVALID_CREDENTIALS" rather than
 * the English sentence that goes with it. This lets a known failure
 * show a localized message instead of the raw English text the
 * server sent, which is never translated. An error without a mapped
 * code still falls back to that raw message - see getErrorMessage()
 * in src/services/api.ts.
 */
export type ApiErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DEACTIVATED'
  | 'USERNAME_TAKEN'
  | 'PHONE_TAKEN'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_MISSING'
  | 'UPLOAD_INVALID_TYPE'
  | 'UPLOAD_TOO_LARGE'
  | 'UPLOAD_TOO_MANY_FILES'
  | 'UPLOAD_UNEXPECTED_FIELD'
  | 'UPLOAD_FAILED'
  | 'TOO_MANY_REQUESTS'
  | 'SERVICE_UNAVAILABLE';

export interface Translations {
  common: {
    back: string;
    cancel: string;
    corn: string;
    bucketToday: string;
    bucketYesterday: string;
    bucketLastWeek: string;
  };

  /** Localized text for the backend error codes above. */
  apiErrors: Record<ApiErrorCode, string>;

  splash: {
    tagline: string;
  };

  login: {
    welcomeBack: string;
    subtitle: string;
    usernamePlaceholder: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    signingIn: string;
    signIn: string;
    errorEmptyUsername: string;
    errorEmptyPassword: string;
    errorGeneric: string;
    noAccount: string;
    createAccount: string;
  };

  register: {
    title: string;
    subtitle: string;
    personalInfo: string;
    firstName: string;
    lastName: string;
    username: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    phonePlaceholder: string;
    phoneHint: string;
    farmLocation: string;
    addressPlaceholder: string;
    errorFullName: string;
    errorUsernameLength: string;
    errorUsernameChars: string;
    errorPasswordLength: string;
    errorPasswordMismatch: string;
    errorPhone: string;
    errorGeneric: string;
    creatingAccount: string;
    createAccount: string;
    alreadyHaveAccount: string;
    logIn: string;
    privacyNote: string;
  };

  forgotPassword: {
    title: string;
    subtitle: string;
    phonePlaceholder: string;
    errorInvalidPhone: string;
    errorGeneric: string;
    sending: string;
    sendCode: string;
    rememberedIt: string;
    backToSignIn: string;
  };

  resetPassword: {
    title: string;
    subtitleWithPhone: (phone: string) => string;
    subtitleGeneric: string;
    codePlaceholder: string;
    newPasswordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    errorInvalidCode: string;
    errorPasswordLength: string;
    errorPasswordMismatch: string;
    errorGeneric: string;
    updating: string;
    updatePassword: string;
    didNotGetCode: string;
    resend: string;
    resendSuccess: string;
    resendFailure: string;
    successTitle: string;
    successSubtitle: string;
    backToSignIn: string;
  };

  tabs: {
    home: string;
    scans: string;
    history: string;
    library: string;
    settings: string;
  };

  home: {
    goodDay: string;
    weekly: string;
    monthly: string;
    scanActivity: string;
    totalScans: string;
    healthy: string;
    diseased: string;
    diseaseDistribution: string;
    noActivityInRange: string;
    recentScans: string;
    viewHistory: string;
    tip: string;
    emptyTitle: string;
    emptyMessage: string;
    emptyAction: string;
    libraryTeaser: string;
  };

  history: {
    title: string;
    searchPlaceholder: string;
    filterAll: string;
    filterDiseased: string;
    filterHealthy: string;
    noMatchesTitle: string;
    noMatchesMessage: string;
  };

  library: {
    title: string;
    searchPlaceholder: string;
    loadingErrorTitle: string;
    loadingErrorMessage: string;
    noMatchesTitle: string;
    noMatchesMessage: string;
  };

  scan: {
    title: string;
    subtitle: string;
    takePhoto: string;
    takePhotoDesc: string;
    chooseFromGallery: string;
    openingGallery: string;
    chooseFromGalleryDesc: string;
    tipsTitle: string;
    tip1: string;
    tip2: string;
    tip3: string;
    tip4: string;
    tip5: string;
    permissionTitle: string;
    permissionMessage: string;
    errorTitle: string;
    errorImageUnreadable: string;
    errorGalleryOpen: string;
  };

  camera: {
    permissionTitle: string;
    permissionMessage: string;
    allowAccess: string;
    openSettings: string;
    goBack: string;
    instruction: string;
    frameHint: string;
    starting: string;
    tapToCapture: string;
  };

  preview: {
    backLink: string;
    reviewTitle: string;
    reviewSubtitle: string;
    uploadedTitle: string;
    uploadedSubtitle: string;
    errorGeneric: string;
    uploadDetails: string;
    fileName: string;
    size: string;
    type: string;
    storedAt: string;
    useThisImage: string;
    uploading: string;
    retakePhoto: string;
    chooseAnother: string;
    viewDiagnosis: string;
    noImage: string;
    chooseImageLink: string;
  };

  diseaseDetail: {
    couldNotLoad: string;
    goBack: string;
    symptoms: string;
    treatment: string;
    noTreatmentYet: string;
    howToApply: string;
  };

  diagnosis: {
    title: string;
    healthyLabel: string;
    diseaseDetectedLabel: string;
    confidence: string;
    recommendedActions: string;
    noTreatmentNeeded: string;
    noTreatmentPublished: string;
    viewTreatmentPlan: string;
  };

  report: {
    province: string;
    totalScan: string;
    cornAffected: string;
    healthy: string;
    breakdownTitle: string;
    plantsScanned: (count: number) => string;
    affected: (count: number) => string;
    detailsTitle: string;
    estimatedArea: string;
    hectare: string;
    barangay: string;
    notSet: string;
    remarksTitle: string;
    remarksPlaceholder: string;
    submit: string;
    submitting: string;
    errorGeneric: string;
  };

  reportSuccess: {
    title: string;
    subtitle: string;
    backToHome: string;
  };

  settings: {
    title: string;
    submitReport: string;
    profileInfo: string;
    editProfile: string;
    phone: string;
    barangay: string;
    mainCrop: string;
    notSet: string;
    language: string;
    languageHint: string;
    logOut: string;
    logOutTitle: string;
    logOutMessage: string;
    yesLogOut: string;
    footer: string;

    // Edit-profile modal
    editProfileTitle: string;
    phonePlaceholder: string;
    barangayPlaceholder: string;
    cornTypeLabel: string;
    cornTypeWhite: string;
    cornTypeYellow: string;
    cornTypeBoth: string;
    saveChanges: string;
    savingChanges: string;
    profileErrorPhone: string;
    profileErrorGeneric: string;

    // Profile photo
    changePhoto: string;
    takePhoto: string;
    chooseFromGallery: string;
    removePhoto: string;
    photoPermissionMessage: string;
    photoErrorGeneric: string;
  };
}

export const en: Translations = {
  common: {
    back: 'Back',
    cancel: 'Cancel',
    corn: 'Corn',
    bucketToday: 'Today',
    bucketYesterday: 'Yesterday',
    bucketLastWeek: 'Last Week',
  },

  splash: {
    tagline: 'Protecting your corn, one scan at a time',
  },

  login: {
    welcomeBack: 'Welcome Back',
    subtitle: 'Sign in to continue protecting your crops.',
    usernamePlaceholder: 'Username',
    passwordPlaceholder: 'Password',
    forgotPassword: 'Forgot password?',
    signingIn: 'Signing in...',
    signIn: 'Sign In',
    errorEmptyUsername: 'Please enter your username.',
    errorEmptyPassword: 'Please enter your password.',
    errorGeneric: 'We could not sign you in. Please try again.',
    noAccount: "Don't have an account? ",
    createAccount: 'Create Account',
  },

  register: {
    title: 'Create Account',
    subtitle:
      'Set up your account to start detecting corn leaf diseases and getting treatment advice.',
    personalInfo: 'Personal Information',
    firstName: 'First name',
    lastName: 'Last name',
    username: 'Username',
    passwordPlaceholder: 'Password (min. 8 characters)',
    confirmPasswordPlaceholder: 'Confirm password',
    phonePlaceholder: 'Mobile number (09xxxxxxxxx)',
    phoneHint: "We'll text a code to this number if you ever forget your password.",
    farmLocation: 'Farm Location',
    addressPlaceholder: 'Barangay, City / Municipality (optional)',
    errorFullName: 'Please enter your first and last name.',
    errorUsernameLength: 'Username must be between 4 and 50 characters.',
    errorUsernameChars:
      'Username can only use lowercase letters, numbers, dots and underscores.',
    errorPasswordLength: 'Password must be at least 8 characters.',
    errorPasswordMismatch: 'The passwords do not match.',
    errorPhone: 'Enter a valid mobile number, for example 09171234567.',
    errorGeneric: 'We could not create your account. Please try again.',
    creatingAccount: 'Creating account...',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account? ',
    logIn: 'Log In',
    privacyNote: 'Your details are kept private and used only for your farm profile.',
  },

  forgotPassword: {
    title: 'Forgot Password',
    subtitle:
      "Enter the mobile number on your account and we'll text you a 6-digit reset code.",
    phonePlaceholder: 'Mobile number (09xxxxxxxxx)',
    errorInvalidPhone: 'Enter the mobile number on your account, for example 09171234567.',
    errorGeneric: 'We could not send the code. Please try again.',
    sending: 'Sending...',
    sendCode: 'Send Reset Code',
    rememberedIt: 'Remembered it? ',
    backToSignIn: 'Back to Sign In',
  },

  resetPassword: {
    title: 'Reset Password',
    subtitleWithPhone: (phone) =>
      `Enter the 6-digit code texted to ${phone} and choose a new password.`,
    subtitleGeneric: 'Enter the 6-digit code from the text message and choose a new password.',
    codePlaceholder: '6-digit code',
    newPasswordPlaceholder: 'New password (min. 8 characters)',
    confirmPasswordPlaceholder: 'Confirm new password',
    errorInvalidCode: 'Enter the 6-digit code from the text message.',
    errorPasswordLength: 'Password must be at least 8 characters.',
    errorPasswordMismatch: 'The passwords do not match.',
    errorGeneric: 'We could not reset your password. Please try again.',
    updating: 'Updating...',
    updatePassword: 'Update Password',
    didNotGetCode: "Didn't get a code? ",
    resend: 'Resend',
    resendSuccess: 'A new code is on its way. Check your text messages.',
    resendFailure: 'Could not resend right now. Try again in a moment.',
    successTitle: 'Password Updated',
    successSubtitle: 'You can now sign in with your new password.',
    backToSignIn: 'Back to Sign In',
  },

  tabs: {
    home: 'Home',
    scans: 'Scans',
    history: 'History',
    library: 'Library',
    settings: 'Setting',
  },

  home: {
    goodDay: 'Good Day,',
    weekly: 'Weekly',
    monthly: 'Monthly',
    scanActivity: 'SCAN ACTIVITY',
    totalScans: 'total scans',
    healthy: 'Healthy',
    diseased: 'Diseased',
    diseaseDistribution: 'DISEASE DISTRIBUTION',
    noActivityInRange: 'No scans in this period yet.',
    recentScans: 'Recent Scans',
    viewHistory: 'View history →',
    tip: 'Keep scanning regularly to catch issues early.',
    emptyTitle: "You haven't scanned yet",
    emptyMessage:
      'Scan a corn leaf to see your first diagnosis. Your scan activity and history will build up here.',
    emptyAction: 'Scan Your First Leaf',
    libraryTeaser: 'See what LeafScan AI can identify',
  },

  history: {
    title: 'Scan History',
    searchPlaceholder: 'Search past scans',
    filterAll: 'All',
    filterDiseased: 'Diseased',
    filterHealthy: 'Healthy',
    noMatchesTitle: 'No matching scans',
    noMatchesMessage: 'Try a different search term or filter.',
  },

  library: {
    title: 'Disease Library',
    searchPlaceholder: 'Search diseases',
    loadingErrorTitle: 'Could not load the library',
    loadingErrorMessage: 'Check your connection and reopen this tab to try again.',
    noMatchesTitle: 'No matches',
    noMatchesMessage: 'Try a different search term.',
  },

  scan: {
    title: 'Scan a Corn Leaf',
    subtitle: 'Choose how you want to provide the image',
    takePhoto: 'Take a Photo',
    takePhotoDesc: 'Use the camera to photograph a leaf right now',
    chooseFromGallery: 'Choose from Gallery',
    openingGallery: 'Opening gallery...',
    chooseFromGalleryDesc: 'Select a corn leaf photo you already have',
    tipsTitle: 'For the best results',
    tip1: 'Photograph a single leaf, filling most of the frame.',
    tip2: 'Use natural daylight. Avoid deep shadow.',
    tip3: 'Hold the phone steady so the image is sharp.',
    tip4: 'Include the affected area if there are visible spots.',
    tip5: 'Use a plain background where possible.',
    permissionTitle: 'Permission Needed',
    permissionMessage:
      'LeafScan AI needs access to your photos so you can choose a corn leaf image. You can enable this in your phone settings.',
    errorTitle: 'Error',
    errorImageUnreadable: 'That image could not be read. Please try another one.',
    errorGalleryOpen: 'Could not open your gallery. Please try again.',
  },

  camera: {
    permissionTitle: 'Camera Access Needed',
    permissionMessage:
      'LeafScan AI uses your camera to photograph corn leaves for disease detection. Photos are only sent when you choose to scan.',
    allowAccess: 'Allow Camera Access',
    openSettings: 'Open Settings',
    goBack: 'Go Back',
    instruction: 'Photograph a corn leaf',
    frameHint: 'Place the leaf inside the square',
    starting: 'Starting camera...',
    tapToCapture: 'Tap to capture',
  },

  preview: {
    backLink: '‹ Back',
    reviewTitle: 'Review Your Image',
    reviewSubtitle: 'Make sure the leaf is clearly visible before sending.',
    uploadedTitle: 'Image Uploaded',
    uploadedSubtitle: 'The image below is being served from the server.',
    errorGeneric: 'The image could not be uploaded. Please try again.',
    uploadDetails: 'Upload Details',
    fileName: 'File Name',
    size: 'Size',
    type: 'Type',
    storedAt: 'Stored At',
    useThisImage: 'Use This Image',
    uploading: 'Uploading...',
    retakePhoto: 'Retake Photo',
    chooseAnother: 'Choose Another Image',
    viewDiagnosis: 'View Diagnosis',
    noImage: 'No image was provided.',
    chooseImageLink: 'Choose an Image',
  },

  diseaseDetail: {
    couldNotLoad: 'This disease could not be loaded.',
    goBack: 'Go back',
    symptoms: 'SYMPTOMS',
    treatment: 'TREATMENT',
    noTreatmentYet:
      'The City Agriculture Office has not published treatment recommendations for this disease yet. Check back soon.',
    howToApply: 'How to apply: ',
  },

  diagnosis: {
    title: 'Diagnosis',
    healthyLabel: 'HEALTHY LEAF',
    diseaseDetectedLabel: 'DISEASE DETECTED',
    confidence: 'CONFIDENCE',
    recommendedActions: 'Recommended Actions',
    noTreatmentNeeded:
      'No treatment needed - keep monitoring the plant and scan again if symptoms appear.',
    noTreatmentPublished:
      'The City Agriculture Office has not published treatment recommendations for this disease yet.',
    viewTreatmentPlan: 'View treatment plan →',
  },

  report: {
    province: 'Zamboanga Del Sur',
    totalScan: 'Total Scan',
    cornAffected: 'Corn Affected',
    healthy: 'Healthy',
    breakdownTitle: 'CORN DISEASE BREAKDOWN',
    plantsScanned: (count) => `${count} plants scanned`,
    affected: (count) => `${count} affected`,
    detailsTitle: 'REPORT DETAILS',
    estimatedArea: 'Estimated Affected Area',
    hectare: 'hectare',
    barangay: 'Barangay',
    notSet: 'Not set',
    remarksTitle: 'REMARKS',
    remarksPlaceholder: 'Add remarks (e.g. observed symptoms, field conditions...)',
    submit: 'Submit Report to CAO',
    submitting: 'Sending...',
    errorGeneric: 'We could not send your report. Please try again.',
  },

  reportSuccess: {
    title: 'Report Submitted!',
    subtitle: 'Your report has been sent to the City Agriculture Office of Pagadian City.',
    backToHome: 'Back to Home',
  },

  settings: {
    title: 'Settings',
    submitReport: 'Submit Report',
    profileInfo: 'PROFILE INFORMATION',
    editProfile: 'Edit',
    phone: 'Phone',
    barangay: 'Barangay',
    mainCrop: 'Main Crop',
    notSet: 'Not set',
    language: 'LANGUAGE',
    languageHint: 'Select your preferred language',
    logOut: 'Log Out',
    logOutTitle: 'Log Out?',
    logOutMessage: 'Are you sure you want to log out of your account?',
    yesLogOut: 'Yes, Log out',
    footer: 'LeafScan AI · City Agriculture Office of Pagadian City',

    editProfileTitle: 'Edit Profile',
    phonePlaceholder: 'Mobile number',
    barangayPlaceholder: 'Barangay',
    cornTypeLabel: 'Corn Type',
    cornTypeWhite: 'White Corn',
    cornTypeYellow: 'Yellow Corn',
    cornTypeBoth: 'White & Yellow',
    saveChanges: 'Save Changes',
    savingChanges: 'Saving...',
    profileErrorPhone: 'Enter a valid mobile number, for example 09171234567.',
    profileErrorGeneric: 'We could not update your profile. Please try again.',

    changePhoto: 'Change Photo',
    takePhoto: 'Take Photo',
    chooseFromGallery: 'Choose from Gallery',
    removePhoto: 'Remove Photo',
    photoPermissionMessage:
      'LeafScan AI needs access to your photos to set a profile picture. You can enable this in your phone settings.',
    photoErrorGeneric: 'We could not update your photo. Please try again.',
  },

  apiErrors: {
    INVALID_CREDENTIALS: 'Incorrect username or password. Please try again.',
    ACCOUNT_DEACTIVATED:
      'This account has been deactivated. Please contact the City Agriculture Office.',
    USERNAME_TAKEN: 'That username is already taken. Please choose another.',
    PHONE_TAKEN: 'That mobile number is already registered to an account.',
    TOKEN_EXPIRED: 'Your session has ended. Please log in again.',
    TOKEN_INVALID: 'Your session is no longer valid. Please log in again.',
    TOKEN_MISSING: 'Please log in to continue.',
    UPLOAD_INVALID_TYPE: 'Only JPG, PNG, and WEBP photos are allowed.',
    UPLOAD_TOO_LARGE: 'That photo is too large. Please choose a smaller one.',
    UPLOAD_TOO_MANY_FILES: 'Please upload only one photo at a time.',
    UPLOAD_UNEXPECTED_FIELD: 'The photo could not be read. Please try again.',
    UPLOAD_FAILED: 'The photo could not be processed. Please try another one.',
    TOO_MANY_REQUESTS: 'Too many attempts. Please wait a while before trying again.',
    SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again shortly.',
  },
};

export const ceb: Translations = {
  common: {
    back: 'Balik',
    cancel: 'Kanselar',
    corn: 'Mais',
    bucketToday: 'Karon',
    bucketYesterday: 'Kagahapon',
    bucketLastWeek: 'Miaging Semana',
  },

  splash: {
    tagline: 'Nagapanalipod sa imong mais, usa ka scan matag higayon',
  },

  login: {
    welcomeBack: 'Maayong Pagbalik',
    subtitle: 'Pag-sign in aron magpadayon sa pagpanalipod sa imong tanom.',
    usernamePlaceholder: 'Username',
    passwordPlaceholder: 'Password',
    forgotPassword: 'Nalimtan ang password?',
    signingIn: 'Nag-sign in...',
    signIn: 'Mag-sign In',
    errorEmptyUsername: 'Palihug isulat ang imong username.',
    errorEmptyPassword: 'Palihug isulat ang imong password.',
    errorGeneric: 'Dili ka namo ma-sign in. Palihug sulayi pag-usab.',
    noAccount: 'Wala pay account? ',
    createAccount: 'Paghimo og Account',
  },

  register: {
    title: 'Paghimo og Account',
    subtitle:
      'I-set up ang imong account aron makasugod sa pag-ila sa sakit sa dahon sa mais ug makadawat og payo sa tambal.',
    personalInfo: 'Personal nga Impormasyon',
    firstName: 'Ngalan',
    lastName: 'Apelyido',
    username: 'Username',
    passwordPlaceholder: 'Password (labing menos 8 ka letra)',
    confirmPasswordPlaceholder: 'Kumpirmaha ang password',
    phonePlaceholder: 'Numero sa selpon (09xxxxxxxxx)',
    phoneHint: 'Padad-an namo og code ining numeroha kung malimtan nimo ang imong password.',
    farmLocation: 'Lokasyon sa Uma',
    addressPlaceholder: 'Barangay, Lungsod / Munisipyo (opsyonal)',
    errorFullName: 'Palihug isulat ang imong ngalan ug apelyido.',
    errorUsernameLength: 'Ang username kinahanglan tunga sa 4 ug 50 ka letra.',
    errorUsernameChars:
      'Ang username pwede lang og gagmay nga letra, numero, tuldok, ug underscore.',
    errorPasswordLength: 'Ang password kinahanglan labing menos 8 ka letra.',
    errorPasswordMismatch: 'Wala magtugma ang password.',
    errorPhone: 'Pagbutang og saktong numero sa selpon, pananglitan 09171234567.',
    errorGeneric: 'Dili namo mahimo ang imong account. Palihug sulayi pag-usab.',
    creatingAccount: 'Ginahimo ang account...',
    createAccount: 'Paghimo og Account',
    alreadyHaveAccount: 'Naa na kay account? ',
    logIn: 'Mag-log In',
    privacyNote: 'Ang imong impormasyon gitago nga pribado ug gigamit lang para sa imong farm profile.',
  },

  forgotPassword: {
    title: 'Nalimtan ang Password',
    subtitle:
      'Isulat ang numero sa selpon nga naka-rehistro sa imong account ug padad-an ka namo og 6-digit nga code.',
    phonePlaceholder: 'Numero sa selpon (09xxxxxxxxx)',
    errorInvalidPhone:
      'Isulat ang numero sa selpon nga naka-rehistro sa imong account, pananglitan 09171234567.',
    errorGeneric: 'Dili namo mapadala ang code. Palihug sulayi pag-usab.',
    sending: 'Gina-padala...',
    sendCode: 'Ipadala ang Reset Code',
    rememberedIt: 'Nahinumdoman na nimo? ',
    backToSignIn: 'Balik sa Sign In',
  },

  resetPassword: {
    title: 'I-reset ang Password',
    subtitleWithPhone: (phone) =>
      `Isulat ang 6-digit nga code nga gipadala sa ${phone} ug pagpili og bag-ong password.`,
    subtitleGeneric: 'Isulat ang 6-digit nga code gikan sa text message ug pagpili og bag-ong password.',
    codePlaceholder: '6-digit nga code',
    newPasswordPlaceholder: 'Bag-ong password (labing menos 8 ka letra)',
    confirmPasswordPlaceholder: 'Kumpirmaha ang bag-ong password',
    errorInvalidCode: 'Isulat ang 6-digit nga code gikan sa text message.',
    errorPasswordLength: 'Ang password kinahanglan labing menos 8 ka letra.',
    errorPasswordMismatch: 'Wala magtugma ang password.',
    errorGeneric: 'Dili namo ma-reset ang imong password. Palihug sulayi pag-usab.',
    updating: 'Ginabag-o...',
    updatePassword: 'I-update ang Password',
    didNotGetCode: 'Wala ka makadawat og code? ',
    resend: 'Ipadala Pag-usab',
    resendSuccess: 'Padulong na ang bag-ong code. Susiha ang imong text messages.',
    resendFailure: 'Dili karon mapadala pag-usab. Sulayi human sa makadiyot.',
    successTitle: 'Na-update na ang Password',
    successSubtitle: 'Pwede ka na mag-sign in gamit ang imong bag-ong password.',
    backToSignIn: 'Balik sa Sign In',
  },

  tabs: {
    home: 'Home',
    scans: 'Scan',
    history: 'Kasaysayan',
    library: 'Librarya',
    settings: 'Setting',
  },

  home: {
    goodDay: 'Maayong Adlaw,',
    weekly: 'Kada Semana',
    monthly: 'Kada Bulan',
    scanActivity: 'KALIHOKAN SA SCAN',
    totalScans: 'kinatibuk-ang scan',
    healthy: 'Himsog',
    diseased: 'Nasakit',
    diseaseDistribution: 'PAG-APOD-APOD SA SAKIT',
    noActivityInRange: 'Wala pay scan ani nga panahon.',
    recentScans: 'Bag-ong mga Scan',
    viewHistory: 'Tan-awa ang kasaysayan →',
    tip: 'Padayon sa regular nga pag-scan aron masayran dayon ang problema.',
    emptyTitle: 'Wala ka pa makascan',
    emptyMessage:
      'I-scan ang usa ka dahon sa mais aron makita ang imong unang diagnosis. Dinhi motubo ang imong kalihokan ug kasaysayan sa scan.',
    emptyAction: 'I-scan ang Unang Dahon',
    libraryTeaser: 'Tan-awa kung unsa ang mahibaloan sa LeafScan AI',
  },

  history: {
    title: 'Kasaysayan sa Scan',
    searchPlaceholder: 'Pangitaa ang naunang mga scan',
    filterAll: 'Tanan',
    filterDiseased: 'Nasakit',
    filterHealthy: 'Himsog',
    noMatchesTitle: 'Walay natakdo nga scan',
    noMatchesMessage: 'Sulayi ang lain nga pulong sa pagpangita o filter.',
  },

  library: {
    title: 'Librarya sa Sakit',
    searchPlaceholder: 'Pangitaa ang sakit',
    loadingErrorTitle: 'Wala ma-load ang librarya',
    loadingErrorMessage: 'Susiha ang imong koneksyon ug ablihi pag-usab kini nga tab.',
    noMatchesTitle: 'Walay natakdo',
    noMatchesMessage: 'Sulayi ang lain nga pulong sa pagpangita.',
  },

  scan: {
    title: 'I-scan ang Dahon sa Mais',
    subtitle: 'Pilia kung unsaon paghatag sa hulagway',
    takePhoto: 'Pagkuha og Litrato',
    takePhotoDesc: 'Gamita ang camera aron makuha dayon ang litrato sa dahon',
    chooseFromGallery: 'Pagpili gikan sa Gallery',
    openingGallery: 'Ginaabli ang gallery...',
    chooseFromGalleryDesc: 'Pagpili og litrato sa dahon sa mais nga naa na nimo',
    tipsTitle: 'Para sa labing maayong resulta',
    tip1: 'Kuhaa ang usa lang ka dahon, punua ang kadaghanan sa frame.',
    tip2: 'Gamita ang natural nga suga sa adlaw. Likayi ang lawom nga landong.',
    tip3: 'Kupti og lig-on ang telepono aron klaro ang litrato.',
    tip4: 'Iapil ang naapektuhan nga bahin kung naay makita nga mantsa.',
    tip5: 'Gamita ang yano nga background kung mahimo.',
    permissionTitle: 'Gikinahanglan ang Pagtugot',
    permissionMessage:
      'Kinahanglan sa LeafScan AI ang access sa imong mga litrato aron makapili ka og hulagway sa dahon sa mais. Pwede nimo i-enable kini sa settings sa imong telepono.',
    errorTitle: 'Sayop',
    errorImageUnreadable: 'Dili mabasa kanang hulagway. Palihug sulayi ang lain.',
    errorGalleryOpen: 'Dili maablihan ang imong gallery. Palihug sulayi pag-usab.',
  },

  camera: {
    permissionTitle: 'Gikinahanglan ang Access sa Camera',
    permissionMessage:
      'Gigamit sa LeafScan AI ang imong camera aron makakuha og litrato sa dahon sa mais para sa pag-ila sa sakit. Ang litrato ipadala lang kung mag-scan ka.',
    allowAccess: 'Tugoti ang Access sa Camera',
    openSettings: 'Ablihi ang Settings',
    goBack: 'Balik',
    instruction: 'Kuhaa ang litrato sa dahon sa mais',
    frameHint: 'Ibutang ang dahon sulod sa kwadrado',
    starting: 'Ginasugdan ang camera...',
    tapToCapture: 'Tapika aron mokuha',
  },

  preview: {
    backLink: '‹ Balik',
    reviewTitle: 'Susiha ang Imong Litrato',
    reviewSubtitle: 'Siguroha nga klaro ang dahon sa wala pa ipadala.',
    uploadedTitle: 'Na-upload na ang Litrato',
    uploadedSubtitle: 'Ang litrato sa ubos gikan na sa server.',
    errorGeneric: 'Wala ma-upload ang litrato. Palihug sulayi pag-usab.',
    uploadDetails: 'Detalye sa Upload',
    fileName: 'Ngalan sa File',
    size: 'Gidak-on',
    type: 'Klase',
    storedAt: 'Gitipigan sa',
    useThisImage: 'Gamiton Kini nga Litrato',
    uploading: 'Ginaupload...',
    retakePhoto: 'Pagkuha Pag-usab',
    chooseAnother: 'Pagpili og Lain nga Litrato',
    viewDiagnosis: 'Tan-awa ang Diagnosis',
    noImage: 'Walay litrato nga gihatag.',
    chooseImageLink: 'Pagpili og Litrato',
  },

  diseaseDetail: {
    couldNotLoad: 'Wala ma-load kini nga sakit.',
    goBack: 'Balik',
    symptoms: 'MGA SIMTOMAS',
    treatment: 'TAMBAL',
    noTreatmentYet:
      'Wala pa mag-publish ang City Agriculture Office og rekomendasyon sa tambal para ani nga sakit. Balik ug susiha sa ulahi.',
    howToApply: 'Paagi sa paggamit: ',
  },

  diagnosis: {
    title: 'Diagnosis',
    healthyLabel: 'HIMSOG NGA DAHON',
    diseaseDetectedLabel: 'NAAY NAKITA NGA SAKIT',
    confidence: 'KASIGUROHAN',
    recommendedActions: 'Girekomendang mga Aksyon',
    noTreatmentNeeded:
      'Walay kinahanglan nga tambal - padayon sa pagbantay sa tanom ug pag-scan pag-usab kung naay motungha nga simtomas.',
    noTreatmentPublished:
      'Wala pa mag-publish ang City Agriculture Office og rekomendasyon sa tambal para ani nga sakit.',
    viewTreatmentPlan: 'Tan-awa ang plano sa tambal →',
  },

  report: {
    province: 'Zamboanga Del Sur',
    totalScan: 'Total nga Scan',
    cornAffected: 'Naapektuhang Mais',
    healthy: 'Himsog',
    breakdownTitle: 'PAGKABAHIN SA SAKIT SA MAIS',
    plantsScanned: (count) => `${count} ka tanom nga na-scan`,
    affected: (count) => `${count} naapektuhan`,
    detailsTitle: 'DETALYE SA REPORT',
    estimatedArea: 'Gibanabana nga Sukod sa Naapektuhan',
    hectare: 'ektarya',
    barangay: 'Barangay',
    notSet: 'Wala pa gibutang',
    remarksTitle: 'MGA KOMENTO',
    remarksPlaceholder: 'Pagdugang og komento (pananglitan, naobserbahang simtomas, kahimtang sa uma...)',
    submit: 'Ipadala ang Report sa CAO',
    submitting: 'Ginapadala...',
    errorGeneric: 'Dili namo mapadala ang imong report. Palihug sulayi pag-usab.',
  },

  reportSuccess: {
    title: 'Napadala na ang Report!',
    subtitle: 'Ang imong report gipadala na sa City Agriculture Office sa Pagadian City.',
    backToHome: 'Balik sa Home',
  },

  settings: {
    title: 'Mga Setting',
    submitReport: 'Ipadala ang Report',
    profileInfo: 'IMPORMASYON SA PROFILE',
    editProfile: 'I-edit',
    phone: 'Telepono',
    barangay: 'Barangay',
    mainCrop: 'Punoan nga Tanom',
    notSet: 'Wala pa gibutang',
    language: 'PINULONGAN',
    languageHint: 'Pilia ang imong gustong pinulongan',
    logOut: 'Mag-log Out',
    logOutTitle: 'Mag-log Out?',
    logOutMessage: 'Sigurado ka ba nga gusto ka mag-log out sa imong account?',
    yesLogOut: 'Oo, Mag-log out',
    footer: 'LeafScan AI · City Agriculture Office of Pagadian City',

    editProfileTitle: 'I-edit ang Profile',
    phonePlaceholder: 'Numero sa selpon',
    barangayPlaceholder: 'Barangay',
    cornTypeLabel: 'Klase sa Mais',
    cornTypeWhite: 'Puti nga Mais',
    cornTypeYellow: 'Dalag nga Mais',
    cornTypeBoth: 'Puti ug Dalag',
    saveChanges: 'I-save ang mga Pagbag-o',
    savingChanges: 'Ginatipig...',
    profileErrorPhone: 'Pagbutang og saktong numero sa selpon, pananglitan 09171234567.',
    profileErrorGeneric: 'Dili namo mahimo i-update ang imong profile. Palihug sulayi pag-usab.',

    changePhoto: 'Ilisan ang Litrato',
    takePhoto: 'Pagkuha og Litrato',
    chooseFromGallery: 'Pagpili gikan sa Gallery',
    removePhoto: 'Kuhaon ang Litrato',
    photoPermissionMessage:
      'Kinahanglan sa LeafScan AI ang access sa imong mga litrato aron makabutang og profile picture. Pwede nimo i-enable kini sa settings sa imong telepono.',
    photoErrorGeneric: 'Dili namo mahimo i-update ang imong litrato. Palihug sulayi pag-usab.',
  },

  apiErrors: {
    INVALID_CREDENTIALS: 'Sayop ang username o password. Palihug sulayi pag-usab.',
    ACCOUNT_DEACTIVATED:
      'Kini nga account gi-deactivate na. Palihug kontaka ang City Agriculture Office.',
    USERNAME_TAKEN: 'Gigamit na kanang username. Palihug pagpili og lain.',
    PHONE_TAKEN: 'Kanang numero sa selpon rehistrado na sa laing account.',
    TOKEN_EXPIRED: 'Natapos na ang imong session. Palihug pag-login pag-usab.',
    TOKEN_INVALID: 'Dili na balido ang imong session. Palihug pag-login pag-usab.',
    TOKEN_MISSING: 'Palihug pag-login aron makapadayon.',
    UPLOAD_INVALID_TYPE: 'JPG, PNG, ug WEBP nga litrato lang ang gitugotan.',
    UPLOAD_TOO_LARGE: 'Sobra ka dako kanang litrato. Palihug pagpili og mas gamay.',
    UPLOAD_TOO_MANY_FILES: 'Usa lang ka litrato ang i-upload sa matag higayon.',
    UPLOAD_UNEXPECTED_FIELD: 'Wala mabasa ang litrato. Palihug sulayi pag-usab.',
    UPLOAD_FAILED: 'Wala maproseso ang litrato. Palihug sulayi og lain.',
    TOO_MANY_REQUESTS: 'Sobra na ka daghan ang sulay. Palihug hulat una ug sulayi pag-usab.',
    SERVICE_UNAVAILABLE: 'Dili karon ma-abot ang serbisyo. Palihug sulayi sa lain nga higayon.',
  },
};

export const TRANSLATIONS: Record<Language, Translations> = { en, ceb };
