/**
 * All user-facing text in LeafScan AI, in English and Cebuano.
 *
 * `Translations` is the shape every language MUST provide - if a
 * key is missing or misspelled in `ceb`, TypeScript fails to
 * compile. That is what keeps the two languages from drifting
 * apart as screens change.
 *
 * What is deliberately NOT translated here, and why:
 *   - Disease names ("Southern Rust", "Gray Leaf Spot"...) - these
 *     are technical names without an established Cebuano equivalent,
 *     the same way agricultural bulletins keep them in English. The
 *     backend (GET /api/diseases) returns them in English for both
 *     languages, and `diseaseNames` below is English in `ceb` too.
 *     Their descriptions, symptoms and treatments ARE translated.
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

import { ConfidenceLevel, RiskLevel } from '../types';

export type Language = 'en' | 'ceb';

/** The report statuses a CAO can set, each of which notifies the farmer. */
export type NotificationStatusKey =
  | 'under_review'
  | 'verified'
  | 'agriculturist_required'
  | 'agriculturist_assigned'
  | 'field_assessment_completed'
  | 'resolved';

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
  | 'INVALID_CURRENT_PASSWORD'
  | 'PASSWORD_UNCHANGED'
  | 'ACCOUNT_DEACTIVATED'
  // A CAO admin account tried to sign in to the farmer app.
  | 'ADMIN_USE_WEB_PLATFORM'
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
  | 'SERVICE_UNAVAILABLE'
  | 'AI_UNAVAILABLE'
  | 'AI_REJECTED_IMAGE'
  | 'NOT_A_CORN_LEAF'
  // The model itself answered "not_corn".
  | 'NOT_CORN'
  | 'AI_BAD_GATEWAY'
  | 'AI_BAD_RESPONSE'
  | 'IMAGE_NOT_FOUND'
  | 'SCAN_TIME_OUT_OF_RANGE'
  // Raised by the phone itself (src/services/api.ts), not the backend.
  | 'NETWORK_ERROR'
  | 'REQUEST_TIMEOUT';

export interface Translations {
  common: {
    back: string;
    cancel: string;
    corn: string;
    bucketToday: string;
    bucketYesterday: string;
    bucketLastWeek: string;
    waitingToUpload: string;
    /** Title of a photo taken offline that has no diagnosis yet. */
    waitingForResult: string;
    scansNotSyncedTitle: string;
    scansNotSynced: (count: number) => string;
    /**
     * Offline-queue photos the server rejected as not corn: removed, and the farmer is told.
     * The alert's title and the "why" come from `invalidImage` below; this is only the
     * "N photos were removed" line.
     */
    scansNotCorn: (count: number) => string;
    scansSyncedTitle: string;
    scansSynced: (count: number) => string;
  };

  /**
   * The four detection classes, for screens that show a scan result
   * offline (Home, History, the report breakdown) without a call to
   * GET /api/diseases. The library / disease-detail / diagnosis
   * screens use the API's name instead. Both are English in every
   * language.
   */
  diseaseNames: {
    southern_rust: string;
    gray_leaf_spot: string;
    healthy: string;
    northern_leaf_blight: string;
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
    rememberMe: string;
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
    /** Photos taken offline that are still waiting to be sent to the server. */
    pendingScans: (count: number) => string;
    /** Under the scan total: how many of those are offline photos with no diagnosis yet. */
    includesWaiting: (count: number) => string;
    /** Disease Distribution placeholder while every scan in the period is still waiting for a verdict. */
    resultsAfterScan: string;
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
    retry: string;
    emptyTitle: string;
    emptyMessage: string;
    noMatchesTitle: string;
    noMatchesMessage: string;
    viewDetails: string;
  };

  notifications: {
    title: string;
    empty: string;
    emptyHint: string;
    loadError: string;
    retry: string;
    markAllRead: string;
    clearAll: string;
    clearAllTitle: string;
    clearAllMessage: string;
    clearAllConfirm: string;
    clearingAll: string;
    justNow: string;
    minutesAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
    daysAgo: (n: number) => string;
    /** Short month names (Jan..Dec) for the "Nov 6" shown once an item is a week old. */
    months: string[];
    /** The CAO's status-update notifications - see utils/notificationText.ts. */
    reportStatus: Record<NotificationStatusKey, { title: string; body: string }>;
    /** Appended to a status body when an agriculturist is named. */
    agriculturistLine: (name: string) => string;
  };

  scan: {
    /** Title of the camera view, which is now the Scan screen (the raised tab opens it). */
    title: string;
    /** The gallery button next to the shutter. */
    chooseFromGallery: string;
    /** Corn-only disclaimer card, shown before the farmer picks camera or gallery. */
    cornOnlyTitle: string;
    cornOnlyBody: string;
    /** Photo tips: tip1-3 are shown over the camera, all five in the photo-tips sheet. */
    tipsTitle: string;
    tip1: string;
    tip2: string;
    tip3: string;
    tip4: string;
    tip5: string;
    /** Closes the photo-tips sheet. */
    tipsGotIt: string;
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
    /** Crop button on the review screen, and the crop editor it opens. */
    crop: string;
    cropTitle: string;
    cropHint: string;
    cropApply: string;
    cropCancel: string;
    cropping: string;
    cropError: string;
    viewDiagnosis: string;
    noImage: string;
    chooseImageLink: string;
    savedOfflineTitle: string;
    savedOfflineSubtitle: string;
    /** Button label while the phone itself is scanning the leaf (no internet). */
    scanning: string;
    offlineResultTitle: string;
    offlineResultSubtitle: string;
    scanAnother: string;
    backToHome: string;
  };

  /**
   * THE one error text for a photo that fails the corn-leaf check, wherever it is shown:
   * the <InvalidImageError> screen state (both the colour check and the model's "not_corn"),
   * the offline-queue alert (PendingScanSync), and the NOT_A_CORN_LEAF / NOT_CORN entries of
   * `apiErrors`. Change the wording here and nowhere else.
   */
  invalidImage: {
    /** The red banner's title. */
    title: string;
    /** What to do instead, on its own (the offline-queue alert adds its own "removed" line). */
    advice: string;
    /** `advice` + that the photo was not saved: the banner body and the `apiErrors` text. */
    message: string;
    /** App-bar title of the rejection screen. */
    screenTitle: string;
    /** The plain part of the link under the banner, then the tappable part. */
    tipsPrompt: string;
    tipsLink: string;
    /** Camera source: primary button (the secondary one is `scan.chooseFromGallery`). */
    takeAnother: string;
    /** Gallery source: secondary button (the primary one is `preview.chooseAnother`). */
    useCameraInstead: string;
  };

  treatmentLevels: {
    level: string;
    guideTitle: string;
    guideSubtitle: string;
    prevention: { label: string; when: string };
    cultural: { label: string; when: string };
    monitoring: { label: string; when: string };
    chemical: { label: string; when: string };
    chemicalWarning: string;
  };

  diseaseDetail: {
    couldNotLoad: string;
    goBack: string;
    symptoms: string;
    favorableConditions: string;
    treatment: string;
    noTreatmentYet: string;
    howToApply: string;
  };

  diagnosis: {
    title: string;
    healthyLabel: string;
    diseaseDetectedLabel: string;
    confidence: string;
    detectionResult: string;
    statusLabel: string;
    noDiseaseDetected: string;
    healthyNote: string;
    recommendedActions: string;
    noTreatmentNeeded: string;
    noTreatmentPublished: string;
    pendingUploadNote: string;
    viewTreatmentPlan: string;
    /** How sure the AI is of the result (low / moderate / high). */
    confidenceLevelLabel: string;
    confidenceLevels: Record<ConfidenceLevel, string>;
    /** How dangerous the disease is (from the CAO's default risk level). Not the same as confidence. */
    riskLevelLabel: string;
    riskLevels: Record<RiskLevel, string>;
    /** Shown above a result whose confidence level is low. */
    lowConfidenceNotice: string;
  };

  report: {
    totalScan: string;
    cornAffected: string;
    healthy: string;
    breakdownTitle: string;
    plantsScanned: (count: number) => string;
    affected: (count: number) => string;
    detailsTitle: string;
    estimatedArea: string;
    /** Shown when the farmer submits without entering the affected area. */
    areaRequired: string;
    hectare: string;
    barangay: string;
    notSet: string;
    remarksTitle: string;
    remarksPlaceholder: string;
    submit: string;
    submitting: string;
    errorGeneric: string;
    allSentTitle: string;
    allSentMessage: string;
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
    municipality: string;
    farmArea: string;
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
    municipalityPlaceholder: string;
    cornTypeLabel: string;
    cornTypeWhite: string;
    cornTypeYellow: string;
    cornTypeBoth: string;
    saveChanges: string;
    savingChanges: string;
    profileErrorPhone: string;
    profileErrorGeneric: string;

    // Change-password modal
    changePassword: string;
    changePasswordTitle: string;
    changePasswordHint: string;
    currentPasswordPlaceholder: string;
    newPasswordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    changePasswordCta: string;
    changingPassword: string;
    passwordChanged: string;
    passwordErrorLength: string;
    passwordErrorMismatch: string;
    passwordErrorGeneric: string;

    // Profile photo
    changePhoto: string;
    takePhoto: string;
    chooseFromGallery: string;
    removePhoto: string;
    photoPermissionMessage: string;
    photoErrorGeneric: string;
    /** Instruction line of the crop editor for the (square) profile photo. */
    cropPhotoHint: string;
  };
}

/** Defined once so `apiErrors` below can reuse the message instead of keeping a second copy. */
const invalidImageAdviceEn = 'Try a close, clear photo of a single corn leaf in daylight.';
const invalidImageEn: Translations['invalidImage'] = {
  title: "We couldn't find a corn leaf",
  advice: invalidImageAdviceEn,
  message: `${invalidImageAdviceEn} This photo wasn't saved.`,
  screenTitle: 'Scan result',
  tipsPrompt: 'This is a corn leaf?',
  tipsLink: 'See photo tips',
  takeAnother: 'Take another photo',
  useCameraInstead: 'Use camera instead',
};

export const en: Translations = {
  common: {
    back: 'Back',
    cancel: 'Cancel',
    corn: 'Corn',
    bucketToday: 'Today',
    bucketYesterday: 'Yesterday',
    bucketLastWeek: 'Last week',
    waitingToUpload: 'Waiting to upload',
    waitingForResult: 'Waiting for internet',
    scansNotSyncedTitle: 'Some scans could not be saved',
    scansNotSynced: (count) =>
      count === 1
        ? '1 scan could not be saved because the server did not accept it (for example, it is older than 30 days, its photo is gone, or the photo could not be processed).'
        : `${count} scans could not be saved because the server did not accept them (for example, they are older than 30 days, their photos are gone, or the photos could not be processed).`,
    scansNotCorn: (count) =>
      count === 1
        ? '1 photo saved offline was removed and not saved to your history.'
        : `${count} photos saved offline were removed and not saved to your history.`,
    scansSyncedTitle: 'Your photos have been scanned',
    scansSynced: (count) =>
      count === 1
        ? '1 photo saved offline has been uploaded and scanned. Open History to see the result.'
        : `${count} photos saved offline have been uploaded and scanned. Open History to see the results.`,
  },

  diseaseNames: {
    southern_rust: 'Southern Rust',
    gray_leaf_spot: 'Gray Leaf Spot',
    healthy: 'Healthy Leaf',
    northern_leaf_blight: 'Northern Leaf Blight',
  },

  splash: {
    tagline: 'Protecting your corn, one scan at a time',
  },

  login: {
    welcomeBack: 'Welcome back',
    subtitle: 'Sign in to continue protecting your crops.',
    usernamePlaceholder: 'Username',
    passwordPlaceholder: 'Password',
    forgotPassword: 'Forgot password?',
    rememberMe: 'Remember me',
    signingIn: 'Signing in...',
    signIn: 'Sign in',
    errorEmptyUsername: 'Please enter your username.',
    errorEmptyPassword: 'Please enter your password.',
    errorGeneric: 'We could not sign you in. Please try again.',
    noAccount:
      'Accounts are provided by the City Agriculture Office. Ask them for your login details.',
    createAccount: 'Create account',
  },

  register: {
    title: 'Create account',
    subtitle:
      'Set up your account to start detecting corn leaf diseases and getting treatment advice.',
    personalInfo: 'Personal information',
    firstName: 'First name',
    lastName: 'Last name',
    username: 'Username',
    passwordPlaceholder: 'Password (min. 8 characters)',
    confirmPasswordPlaceholder: 'Confirm password',
    phonePlaceholder: 'Mobile number (09xxxxxxxxx)',
    phoneHint: "We'll text a code to this number if you ever forget your password.",
    farmLocation: 'Farm location',
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
    createAccount: 'Create account',
    alreadyHaveAccount: 'Already have an account? ',
    logIn: 'Log in',
    privacyNote: 'Your details are kept private and used only for your farm profile.',
  },

  forgotPassword: {
    title: 'Forgot password',
    subtitle:
      "Enter the mobile number on your account and we'll text you a 6-digit reset code.",
    phonePlaceholder: 'Mobile number (09xxxxxxxxx)',
    errorInvalidPhone: 'Enter the mobile number on your account, for example 09171234567.',
    errorGeneric: 'We could not send the code. Please try again.',
    sending: 'Sending...',
    sendCode: 'Send reset code',
    rememberedIt: 'Remembered it? ',
    backToSignIn: 'Back to sign in',
  },

  resetPassword: {
    title: 'Reset password',
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
    updatePassword: 'Update password',
    didNotGetCode: "Didn't get a code? ",
    resend: 'Resend',
    resendSuccess: 'A new code is on its way. Check your text messages.',
    resendFailure: 'Could not resend right now. Try again in a moment.',
    successTitle: 'Password updated',
    successSubtitle: 'You can now sign in with your new password.',
    backToSignIn: 'Back to sign in',
  },

  tabs: {
    home: 'Home',
    scans: 'Scan',
    history: 'History',
    library: 'Library',
    settings: 'Settings',
  },

  home: {
    goodDay: 'Good day,',
    weekly: 'Weekly',
    monthly: 'Monthly',
    scanActivity: 'SCAN ACTIVITY',
    totalScans: 'total scans',
    healthy: 'Healthy',
    diseased: 'Diseased',
    diseaseDistribution: 'DISEASE DISTRIBUTION',
    noActivityInRange: 'No scans in this period yet.',
    recentScans: 'Recent scans',
    viewHistory: 'View history →',
    tip: 'Keep scanning regularly to catch issues early.',
    emptyTitle: "You haven't scanned yet",
    emptyMessage:
      'Scan a corn leaf to see your first diagnosis. Your scan activity and history will build up here.',
    emptyAction: 'Scan your first leaf',
    libraryTeaser: 'See what LeafScan AI can identify',
    pendingScans: (count) =>
      count === 1
        ? '1 photo is saved on your phone and waiting for internet. It will be scanned automatically once you are back online.'
        : `${count} photos are saved on your phone and waiting for internet. They will be scanned automatically once you are back online.`,
    includesWaiting: (count) => `Includes ${count} waiting for internet`,
    resultsAfterScan: 'Results will show here once your photos have been scanned.',
  },

  history: {
    title: 'Scan history',
    searchPlaceholder: 'Search past scans',
    filterAll: 'All',
    filterDiseased: 'Diseased',
    filterHealthy: 'Healthy',
    noMatchesTitle: 'No matching scans',
    noMatchesMessage: 'Try a different search term or filter.',
  },

  library: {
    title: 'Disease library',
    searchPlaceholder: 'Search diseases',
    loadingErrorTitle: "Can't reach the server",
    loadingErrorMessage:
      'The disease library needs a connection to the City Agriculture Office server. Check your internet and try again.',
    retry: 'Try again',
    emptyTitle: 'No library content yet',
    emptyMessage:
      'The City Agriculture Office has not published any disease entries yet. Check back soon.',
    noMatchesTitle: 'No matches',
    noMatchesMessage: 'Try a different search term.',
    viewDetails: 'View details',
  },

  notifications: {
    title: 'Notifications',
    empty: 'No notifications yet',
    emptyHint: "Updates about your reports from the CAO will appear here.",
    loadError: 'Could not load your notifications. Pull to refresh or try again.',
    retry: 'Try again',
    markAllRead: 'Mark all read',
    clearAll: 'Clear all notifications',
    clearAllTitle: 'Clear all notifications?',
    clearAllMessage: 'This removes every notification in your inbox. There is no undo.',
    clearAllConfirm: 'Clear',
    clearingAll: 'Clearing...',
    justNow: 'just now',
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    reportStatus: {
      under_review: {
        title: 'Report under review',
        body: 'The City Agriculture Office is now reviewing your report.',
      },
      verified: {
        title: 'Report verified',
        body: 'The CAO has verified the disease findings in your report.',
      },
      agriculturist_required: {
        title: 'Report agriculturist visit required',
        body: 'Your report requires an agriculturist field assessment. A visit is being arranged.',
      },
      agriculturist_assigned: {
        title: 'Report agriculturist assigned',
        body: 'An agriculturist has been assigned to visit and assess your area.',
      },
      field_assessment_completed: {
        title: 'Report field assessment completed',
        body: 'The field assessment for your report has been completed.',
      },
      resolved: {
        title: 'Report resolved',
        body: 'Your report has been resolved. Thank you for reporting.',
      },
    },
    agriculturistLine: (name) => `Agriculturist: ${name}.`,
  },

  scan: {
    // Title of the camera view (the raised Scan tab opens it directly).
    title: 'Scan a leaf',
    chooseFromGallery: 'Choose from gallery',
    cornOnlyTitle: 'Works with corn leaves only',
    cornOnlyBody: "Other crops and non-leaf photos can't be scanned yet.",
    // The tips are shown over the camera (tip1-3) and in the photo-tips sheet (all five).
    tipsTitle: 'Tips for a clear scan',
    tip1: 'Fill the frame with one leaf',
    tip2: 'Use daylight, avoid deep shadow',
    tip3: 'Keep other leaves out of the photo',
    tip4: 'Hold the phone steady so the photo is sharp',
    tip5: 'Show the spots or damaged area',
    tipsGotIt: 'Got it',
    permissionTitle: 'Permission needed',
    permissionMessage:
      'LeafScan AI needs access to your photos so you can choose a corn leaf photo. You can enable this in your phone settings.',
    errorTitle: 'Error',
    errorImageUnreadable: 'That photo could not be read. Please try another one.',
    errorGalleryOpen: 'Could not open your gallery. Please try again.',
  },

  camera: {
    permissionTitle: 'Camera access needed',
    permissionMessage:
      'LeafScan AI uses your camera to photograph corn leaves for disease detection. Photos are only sent when you choose to scan.',
    allowAccess: 'Allow camera access',
    openSettings: 'Open settings',
    goBack: 'Go back',
    starting: 'Starting camera...',
    tapToCapture: 'Tap to capture',
  },

  preview: {
    backLink: '‹ Back',
    reviewTitle: 'Review your photo',
    reviewSubtitle: 'Make sure this is a corn leaf and clearly visible before sending.',
    uploadedTitle: 'Photo uploaded',
    uploadedSubtitle: 'The photo below is being served from the server.',
    errorGeneric: 'The photo could not be uploaded. Please try again.',
    uploadDetails: 'Upload details',
    fileName: 'File name',
    size: 'Size',
    type: 'Type',
    storedAt: 'Stored at',
    useThisImage: 'Use this photo',
    uploading: 'Uploading...',
    retakePhoto: 'Retake photo',
    chooseAnother: 'Choose another photo',
    crop: 'Crop',
    cropTitle: 'Crop photo',
    cropHint: 'Drag the edges or corners to frame the leaf. Drag inside to move the frame.',
    cropApply: 'Apply',
    cropCancel: 'Cancel',
    cropping: 'Cropping...',
    cropError: 'The photo could not be cropped. Please try again.',
    viewDiagnosis: 'View diagnosis',
    noImage: 'No photo was provided.',
    chooseImageLink: 'Choose a photo',
    savedOfflineTitle: 'Saved on your phone',
    savedOfflineSubtitle:
      'No internet right now. Your photo is saved on this phone and will be uploaded and scanned automatically once you are back online. You will find the result in History.',
    scanning: 'Scanning...',
    offlineResultTitle: 'Scanned on your phone',
    offlineResultSubtitle:
      'No internet, so your phone scanned this leaf by itself. The photo will upload automatically once you are back online.',
    scanAnother: 'Scan another leaf',
    backToHome: 'Back to home',
  },

  invalidImage: invalidImageEn,

  treatmentLevels: {
    level: 'Level',
    guideTitle: 'CHOOSE BY HOW SEVERE IT IS',
    guideSubtitle: 'Start with the mildest level. Move up only if the disease keeps spreading.',
    prevention: { label: 'Prevention', when: 'Before planting - choose resistant varieties' },
    cultural: { label: 'Cultural', when: 'Good farm practices - rotation, clean field, spacing' },
    monitoring: { label: 'Monitoring', when: 'Check the field regularly to catch it early' },
    chemical: { label: 'Chemical', when: 'If it keeps spreading - FPA-registered fungicide only' },
    chemicalWarning: 'Poisonous - wear gloves and a mask, and follow the label.',
  },

  diseaseDetail: {
    couldNotLoad: 'This disease could not be loaded.',
    goBack: 'Go back',
    symptoms: 'SYMPTOMS',
    favorableConditions: 'FAVORABLE CONDITIONS',
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
    detectionResult: 'Detection result',
    statusLabel: 'Status',
    noDiseaseDetected: 'No disease detected',
    healthyNote:
      'This leaf appears healthy. Keep monitoring the plant and scan again if symptoms appear.',
    recommendedActions: 'Recommended actions',
    noTreatmentNeeded:
      'No treatment needed - keep monitoring the plant and scan again if symptoms appear.',
    noTreatmentPublished:
      'The City Agriculture Office has not published treatment recommendations for this disease yet.',
    pendingUploadNote:
      'Scanned on your phone. The photo will upload automatically when you are back online.',
    viewTreatmentPlan: 'View treatment plan →',
    confidenceLevelLabel: 'Confidence level',
    confidenceLevels: { low: 'Low', moderate: 'Moderate', high: 'High' },
    riskLevelLabel: 'Risk level',
    riskLevels: { none: 'No risk', low: 'Low', moderate: 'Moderate', high: 'High' },
    lowConfidenceNotice:
      'The result is uncertain. Try another clear, well-lit photo of the leaf.',
  },

  report: {
    totalScan: 'Total scan',
    cornAffected: 'Corn affected',
    healthy: 'Healthy',
    breakdownTitle: 'CORN DISEASE BREAKDOWN',
    plantsScanned: (count) => `${count} plants scanned`,
    affected: (count) => `${count} affected`,
    detailsTitle: 'REPORT DETAILS',
    estimatedArea: 'Estimated affected area',
    areaRequired: 'Please enter the estimated affected area (in hectares) before submitting.',
    hectare: 'ha',
    barangay: 'Barangay',
    notSet: 'Not set',
    remarksTitle: 'REMARKS',
    remarksPlaceholder: 'Add remarks (e.g. observed symptoms, field conditions...)',
    submit: 'Submit report to CAO',
    submitting: 'Sending...',
    errorGeneric: 'We could not send your report. Please try again.',
    allSentTitle: 'All scans reported',
    allSentMessage:
      'Your scans have already been sent to the CAO. Scan more leaves to send a new report.',
  },

  reportSuccess: {
    title: 'Report submitted!',
    subtitle: 'Your report has been sent to the City Agriculture Office of Pagadian City.',
    backToHome: 'Back to home',
  },

  settings: {
    title: 'Settings',
    submitReport: 'Submit report',
    profileInfo: 'PROFILE INFORMATION',
    editProfile: 'Edit',
    phone: 'Phone',
    barangay: 'Barangay',
    municipality: 'Municipality',
    farmArea: 'Farm area',
    mainCrop: 'Main crop',
    notSet: 'Not set',
    language: 'LANGUAGE',
    languageHint: 'Select your preferred language',
    logOut: 'Log out',
    logOutTitle: 'Log out?',
    logOutMessage: 'Are you sure you want to log out of your account?',
    yesLogOut: 'Yes, log out',
    footer: 'LeafScan AI · City Agriculture Office of Pagadian City',

    editProfileTitle: 'Edit profile',
    phonePlaceholder: 'Mobile number',
    barangayPlaceholder: 'Barangay',
    municipalityPlaceholder: 'Municipality / City',
    cornTypeLabel: 'Corn type',
    cornTypeWhite: 'White corn',
    cornTypeYellow: 'Yellow corn',
    cornTypeBoth: 'White & yellow',
    saveChanges: 'Save changes',
    savingChanges: 'Saving...',
    profileErrorPhone: 'Enter a valid mobile number, for example 09171234567.',
    profileErrorGeneric: 'We could not update your profile. Please try again.',

    changePassword: 'Change password',
    changePasswordTitle: 'Change password',
    changePasswordHint: 'Enter your current password, then choose a new one only you know.',
    currentPasswordPlaceholder: 'Current password',
    newPasswordPlaceholder: 'New password',
    confirmPasswordPlaceholder: 'Confirm new password',
    changePasswordCta: 'Change password',
    changingPassword: 'Changing...',
    passwordChanged: 'Your password has been changed.',
    passwordErrorLength: 'Your new password must be at least 8 characters.',
    passwordErrorMismatch: 'The new password and its confirmation do not match.',
    passwordErrorGeneric: 'We could not change your password. Please try again.',

    changePhoto: 'Change photo',
    takePhoto: 'Take photo',
    chooseFromGallery: 'Choose from gallery',
    removePhoto: 'Remove photo',
    photoPermissionMessage:
      'LeafScan AI needs access to your photos to set a profile picture. You can enable this in your phone settings.',
    photoErrorGeneric: 'We could not update your photo. Please try again.',
    cropPhotoHint:
      'Drag a corner or edge to resize the square. Drag inside to move it. This part becomes your profile photo.',
  },

  apiErrors: {
    INVALID_CREDENTIALS: 'Incorrect username or password. Please try again.',
    INVALID_CURRENT_PASSWORD: 'Your current password is incorrect.',
    PASSWORD_UNCHANGED: 'Your new password must be different from your current one.',
    ACCOUNT_DEACTIVATED:
      'This account has been deactivated. Please contact the City Agriculture Office.',
    ADMIN_USE_WEB_PLATFORM:
      'City Agriculture Office accounts cannot sign in to the mobile app. Please use the LeafScan AI admin platform.',
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
    AI_UNAVAILABLE: 'The leaf scanner is unavailable right now. Please try again in a moment.',
    AI_REJECTED_IMAGE: 'This photo could not be read. Please take a clear photo of a corn leaf.',
    // Both failed corn-leaf checks read the same as the on-screen error (see `invalidImage`).
    NOT_A_CORN_LEAF: invalidImageEn.message,
    NOT_CORN: invalidImageEn.message,
    AI_BAD_GATEWAY: 'The disease checker had a problem. Please try again in a moment.',
    AI_BAD_RESPONSE: 'The disease checker had a problem. Please try again in a moment.',
    IMAGE_NOT_FOUND: 'The uploaded photo could not be found. Please scan again.',
    SCAN_TIME_OUT_OF_RANGE: 'This saved scan is older than 30 days and can no longer be uploaded.',
    NETWORK_ERROR: 'No internet connection. Please turn on your mobile data or Wi-Fi, then try again.',
    REQUEST_TIMEOUT: 'The connection is too slow or unstable. Please check your internet and try again.',
  },
};

/** Defined once so `apiErrors` below can reuse the message instead of keeping a second copy. */
const invalidImageAdviceCeb =
  'Sulayi ang duol ug klaro nga litrato sa usa ka dahon sa mais ilalom sa suga sa adlaw.';
const invalidImageCeb: Translations['invalidImage'] = {
  title: 'Wala kami makakita og dahon sa mais',
  advice: invalidImageAdviceCeb,
  message: `${invalidImageAdviceCeb} Wala natipigi kini nga litrato.`,
  screenTitle: 'Resulta sa scan',
  tipsPrompt: 'Dahon kini sa mais?',
  tipsLink: 'Tan-awa ang mga tip sa litrato',
  takeAnother: 'Pagkuha og lain nga litrato',
  useCameraInstead: 'Gamita na lang ang camera',
};

export const ceb: Translations = {
  common: {
    back: 'Balik',
    cancel: 'Kanselar',
    corn: 'Mais',
    bucketToday: 'Karon',
    bucketYesterday: 'Kagahapon',
    bucketLastWeek: 'Miaging semana',
    waitingToUpload: 'Naghulat ma-upload',
    waitingForResult: 'Naghulat og internet',
    scansNotSyncedTitle: 'Dili ma-save ang ubang scan',
    scansNotSynced: (count) =>
      `${count} ka scan wala ma-save kay wala kini gidawat sa server (pananglitan, lapas na sa 30 ka adlaw, nawala na ang litrato, o dili maproseso ang litrato).`,
    scansNotCorn: (count) =>
      `${count} ka litrato nga gitipigan offline gitangtang ug wala i-save sa imong History.`,
    scansSyncedTitle: 'Na-scan na ang imong mga litrato',
    scansSynced: (count) =>
      `${count} ka litrato nga gitipigan offline ang na-upload ug na-scan na. Ablihi ang History aron makita ang resulta.`,
  },

  diseaseNames: {
    // Disease names stay in English in Cebuano too - see the note at
    // the top of this file. Only the descriptions are translated.
    southern_rust: 'Southern Rust',
    gray_leaf_spot: 'Gray Leaf Spot',
    healthy: 'Healthy Leaf',
    northern_leaf_blight: 'Northern Leaf Blight',
  },

  splash: {
    tagline: 'Nagapanalipod sa imong mais, usa ka scan matag higayon',
  },

  login: {
    welcomeBack: 'Maayong pagbalik',
    subtitle: 'Pag-sign in aron magpadayon sa pagpanalipod sa imong tanom.',
    usernamePlaceholder: 'Username',
    passwordPlaceholder: 'Password',
    forgotPassword: 'Nalimtan ang password?',
    rememberMe: 'Hinumdumi ako',
    signingIn: 'Nag-sign in...',
    signIn: 'Mag-sign in',
    errorEmptyUsername: 'Palihug isulat ang imong username.',
    errorEmptyPassword: 'Palihug isulat ang imong password.',
    errorGeneric: 'Dili ka namo ma-sign in. Palihug sulayi pag-usab.',
    noAccount:
      'Ang account gihatag sa City Agriculture Office. Pangayoa kanila ang imong login details.',
    createAccount: 'Paghimo og account',
  },

  register: {
    title: 'Paghimo og account',
    subtitle:
      'I-set up ang imong account aron makasugod sa pag-ila sa sakit sa dahon sa mais ug makadawat og payo sa tambal.',
    personalInfo: 'Personal nga impormasyon',
    firstName: 'Ngalan',
    lastName: 'Apelyido',
    username: 'Username',
    passwordPlaceholder: 'Password (labing menos 8 ka letra)',
    confirmPasswordPlaceholder: 'Kumpirmaha ang password',
    phonePlaceholder: 'Numero sa selpon (09xxxxxxxxx)',
    phoneHint: 'Padad-an namo og code ining numeroha kung malimtan nimo ang imong password.',
    farmLocation: 'Lokasyon sa uma',
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
    createAccount: 'Paghimo og account',
    alreadyHaveAccount: 'Naa na kay account? ',
    logIn: 'Mag-log in',
    privacyNote: 'Ang imong impormasyon gitago nga pribado ug gigamit lang para sa imong farm profile.',
  },

  forgotPassword: {
    title: 'Nalimtan ang password',
    subtitle:
      'Isulat ang numero sa selpon nga naka-rehistro sa imong account ug padad-an ka namo og 6-digit nga code.',
    phonePlaceholder: 'Numero sa selpon (09xxxxxxxxx)',
    errorInvalidPhone:
      'Isulat ang numero sa selpon nga naka-rehistro sa imong account, pananglitan 09171234567.',
    errorGeneric: 'Dili namo mapadala ang code. Palihug sulayi pag-usab.',
    sending: 'Gina-padala...',
    sendCode: 'Ipadala ang reset code',
    rememberedIt: 'Nahinumdoman na nimo? ',
    backToSignIn: 'Balik sa sign in',
  },

  resetPassword: {
    title: 'I-reset ang password',
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
    updatePassword: 'I-update ang password',
    didNotGetCode: 'Wala ka makadawat og code? ',
    resend: 'Ipadala pag-usab',
    resendSuccess: 'Padulong na ang bag-ong code. Susiha ang imong text messages.',
    resendFailure: 'Dili karon mapadala pag-usab. Sulayi human sa makadiyot.',
    successTitle: 'Na-update na ang password',
    successSubtitle: 'Pwede ka na mag-sign in gamit ang imong bag-ong password.',
    backToSignIn: 'Balik sa sign in',
  },

  tabs: {
    home: 'Home',
    scans: 'Scan',
    history: 'Kasaysayan',
    library: 'Librarya',
    settings: 'Settings',
  },

  home: {
    goodDay: 'Maayong adlaw,',
    weekly: 'Kada semana',
    monthly: 'Kada bulan',
    scanActivity: 'KALIHOKAN SA SCAN',
    totalScans: 'kinatibuk-ang scan',
    healthy: 'Himsog',
    diseased: 'Nasakit',
    diseaseDistribution: 'PAG-APOD-APOD SA SAKIT',
    noActivityInRange: 'Wala pay scan ani nga panahon.',
    recentScans: 'Bag-ong mga scan',
    viewHistory: 'Tan-awa ang kasaysayan →',
    tip: 'Padayon sa regular nga pag-scan aron masayran dayon ang problema.',
    emptyTitle: 'Wala ka pa makascan',
    emptyMessage:
      'I-scan ang usa ka dahon sa mais aron makita ang imong unang diagnosis. Dinhi motubo ang imong kalihokan ug kasaysayan sa scan.',
    emptyAction: 'I-scan ang unang dahon',
    libraryTeaser: 'Tan-awa kung unsa ang mahibaloan sa LeafScan AI',
    pendingScans: (count) =>
      count === 1
        ? '1 ka litrato ang gitipigan sa imong telepono ug naghulat og internet. Awtomatiko kini i-scan inig naa na pud kay internet.'
        : `${count} ka litrato ang gitipigan sa imong telepono ug naghulat og internet. Awtomatiko kini i-scan inig naa na pud kay internet.`,
    includesWaiting: (count) => `Apil ang ${count} nga naghulat og internet`,
    resultsAfterScan: 'Makita ang resulta dinhi inig ma-scan na ang imong mga litrato.',
  },

  history: {
    title: 'Kasaysayan sa scan',
    searchPlaceholder: 'Pangitaa ang naunang mga scan',
    filterAll: 'Tanan',
    filterDiseased: 'Nasakit',
    filterHealthy: 'Himsog',
    noMatchesTitle: 'Walay natakdo nga scan',
    noMatchesMessage: 'Sulayi ang lain nga pulong sa pagpangita o filter.',
  },

  library: {
    title: 'Librarya sa sakit',
    searchPlaceholder: 'Pangitaa ang sakit',
    loadingErrorTitle: 'Dili maabot ang server',
    loadingErrorMessage:
      'Kinahanglan og koneksyon sa server sa City Agriculture Office ang librarya sa sakit. Susiha ang imong internet ug sulayi pag-usab.',
    retry: 'Sulayi pag-usab',
    emptyTitle: 'Wala pay sulod ang librarya',
    emptyMessage:
      'Wala pa mag-publish ang City Agriculture Office og mga entry sa sakit. Balik ug susiha sa ulahi.',
    noMatchesTitle: 'Walay natakdo',
    noMatchesMessage: 'Sulayi ang lain nga pulong sa pagpangita.',
    viewDetails: 'Tan-awa ang detalye',
  },

  notifications: {
    title: 'Mga notipikasyon',
    empty: 'Wala pay notipikasyon',
    emptyHint: 'Ang mga update sa imong report gikan sa CAO makita dinhi.',
    loadError: 'Wala ma-load ang imong mga notipikasyon. I-refresh o sulayi pag-usab.',
    retry: 'Sulayi pag-usab',
    markAllRead: 'Markahi tanan nga nabasa',
    clearAll: 'Kuhaa tanan nga notipikasyon',
    clearAllTitle: 'Kuhaon ba ang tanan nga notipikasyon?',
    clearAllMessage: 'Makuha ang tanan nimo nga notipikasyon. Dili na kini mabawi.',
    clearAllConfirm: 'Kuhaa',
    clearingAll: 'Gikuha...',
    justNow: 'karon lang',
    minutesAgo: (n) => `${n}m ang milabay`,
    hoursAgo: (n) => `${n}h ang milabay`,
    daysAgo: (n) => `${n}d ang milabay`,
    months: ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul', 'Ago', 'Sep', 'Okt', 'Nob', 'Dis'],
    reportStatus: {
      under_review: {
        title: 'Gisusi ang report',
        body: 'Gisusi na karon sa City Agriculture Office ang imong report.',
      },
      verified: {
        title: 'Napamatud-an ang report',
        body: 'Gipamatud-an sa CAO ang mga nakit-an nga sakit sa imong report.',
      },
      agriculturist_required: {
        title: 'Gikinahanglan ang pagbisita sa agriculturist',
        body: 'Ang imong report nagkinahanglan og field assessment gikan sa agriculturist. Gihikay na ang pagbisita.',
      },
      agriculturist_assigned: {
        title: 'Naitudlo ang agriculturist',
        body: 'Adunay agriculturist nga gitudlo aron mobisita ug mosusi sa imong lugar.',
      },
      field_assessment_completed: {
        title: 'Nahuman ang field assessment',
        body: 'Nahuman na ang field assessment sa imong report.',
      },
      resolved: {
        title: 'Nasulbad ang report',
        body: 'Nasulbad na ang imong report. Salamat sa pag-report.',
      },
    },
    agriculturistLine: (name) => `Agriculturist: ${name}.`,
  },

  scan: {
    // Title of the camera view (the raised Scan tab opens it directly).
    title: 'I-scan ang dahon',
    chooseFromGallery: 'Pagpili gikan sa gallery',
    cornOnlyTitle: 'Para lang sa dahon sa mais',
    cornOnlyBody: 'Ang ubang tanom ug mga litrato nga dili dahon dili pa ma-scan.',
    // The tips are shown over the camera (tip1-3) and in the photo-tips sheet (all five).
    tipsTitle: 'Mga tip para klaro ang scan',
    tip1: 'Punui sa usa ka dahon ang frame',
    tip2: 'Gamita ang suga sa adlaw, likayi ang lawom nga landong',
    tip3: 'Ayaw apila ang ubang dahon sa litrato',
    tip4: 'Kupti og lig-on ang telepono aron klaro ang litrato',
    tip5: 'Ipakita ang mga mantsa o nadaot nga bahin',
    tipsGotIt: 'Nakasabot ko',
    permissionTitle: 'Gikinahanglan ang pagtugot',
    permissionMessage:
      'Kinahanglan sa LeafScan AI ang access sa imong mga litrato aron makapili ka og litrato sa dahon sa mais. Pwede nimo i-enable kini sa settings sa imong telepono.',
    errorTitle: 'Sayop',
    errorImageUnreadable: 'Dili mabasa kanang litrato. Palihug sulayi ang lain.',
    errorGalleryOpen: 'Dili maablihan ang imong gallery. Palihug sulayi pag-usab.',
  },

  camera: {
    permissionTitle: 'Gikinahanglan ang access sa camera',
    permissionMessage:
      'Gigamit sa LeafScan AI ang imong camera aron makakuha og litrato sa dahon sa mais para sa pag-ila sa sakit. Ang litrato ipadala lang kung mag-scan ka.',
    allowAccess: 'Tugoti ang access sa camera',
    openSettings: 'Ablihi ang settings',
    goBack: 'Balik',
    starting: 'Ginasugdan ang camera...',
    tapToCapture: 'Tapika aron mokuha',
  },

  preview: {
    backLink: '‹ Balik',
    reviewTitle: 'Susiha ang imong litrato',
    reviewSubtitle: 'Siguroha nga dahon kini sa mais ug klaro kini sa wala pa ipadala.',
    uploadedTitle: 'Na-upload na ang litrato',
    uploadedSubtitle: 'Ang litrato sa ubos gikan na sa server.',
    errorGeneric: 'Wala ma-upload ang litrato. Palihug sulayi pag-usab.',
    uploadDetails: 'Detalye sa upload',
    fileName: 'Ngalan sa file',
    size: 'Gidak-on',
    type: 'Klase',
    storedAt: 'Gitipigan sa',
    useThisImage: 'Gamiton kini nga litrato',
    uploading: 'Ginaupload...',
    retakePhoto: 'Pagkuha pag-usab',
    chooseAnother: 'Pagpili og lain nga litrato',
    crop: 'I-crop',
    cropTitle: 'I-crop ang litrato',
    cropHint: 'Ibira ang mga ngilit o suok aron maframe ang dahon. Ibira sa sulod aron ibalhin ang frame.',
    cropApply: 'Gamiton',
    cropCancel: 'Kanselahon',
    cropping: 'Gi-crop...',
    cropError: 'Wala ma-crop ang litrato. Palihug sulayi pag-usab.',
    viewDiagnosis: 'Tan-awa ang diagnosis',
    noImage: 'Walay litrato nga gihatag.',
    chooseImageLink: 'Pagpili og litrato',
    savedOfflineTitle: 'Gitipigan sa imong telepono',
    savedOfflineSubtitle:
      'Walay internet karon. Gitipigan ang imong litrato ug awtomatiko kini i-upload ug i-scan inig naa na pud kay internet. Makita nimo ang resulta sa History.',
    scanning: 'Gi-scan...',
    offlineResultTitle: 'Na-scan sa imong telepono',
    offlineResultSubtitle:
      'Walay internet, busa ang imong telepono mismo ang nag-scan niini nga dahon. Awtomatiko ma-upload ang litrato inig naa na pud kay internet.',
    scanAnother: 'Mag-scan og lain nga dahon',
    backToHome: 'Balik sa home',
  },

  invalidImage: invalidImageCeb,

  treatmentLevels: {
    level: 'Lebel',
    guideTitle: 'PILI SUMALA SA KALALA',
    guideSubtitle: 'Sugdi sa pinakagaan nga lebel. Mosaka ra kung nagkaylap gihapon ang sakit.',
    prevention: { label: 'Paglikay', when: 'Sa dili pa magtanom - pilia ang lig-on nga barayti' },
    cultural: { label: 'Kultural', when: 'Maayong pamaagi sa pag-uma - pag-ilis sa tanom, limpyo nga uma, gilay-on' },
    monitoring: { label: 'Pagbantay', when: 'Susiha kanunay ang uma aron sayo makit-an' },
    chemical: { label: 'Kemikal', when: 'Kung nagkaylap gihapon - fungicide nga rehistrado sa FPA lang' },
    chemicalWarning: 'Peligroso - magsuot og guwantes ug mask, ug sunda ang label.',
  },

  diseaseDetail: {
    couldNotLoad: 'Wala ma-load kini nga sakit.',
    goBack: 'Balik',
    symptoms: 'MGA SIMTOMAS',
    favorableConditions: 'KAHIMTANG NGA PABORABLE SA SAKIT',
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
    detectionResult: 'Resulta sa pag-ila',
    statusLabel: 'Kahimtang',
    noDiseaseDetected: 'Walay nakita nga sakit',
    healthyNote:
      'Kini nga dahon morag himsog. Padayon sa pagbantay sa tanom ug pag-scan pag-usab kung naay motungha nga simtomas.',
    recommendedActions: 'Girekomendang mga aksyon',
    noTreatmentNeeded:
      'Walay kinahanglan nga tambal - padayon sa pagbantay sa tanom ug pag-scan pag-usab kung naay motungha nga simtomas.',
    noTreatmentPublished:
      'Wala pa mag-publish ang City Agriculture Office og rekomendasyon sa tambal para ani nga sakit.',
    pendingUploadNote:
      'Na-scan sa imong telepono. Awtomatiko ma-upload ang litrato inig naa na pud kay internet.',
    viewTreatmentPlan: 'Tan-awa ang plano sa tambal →',
    confidenceLevelLabel: 'Lebel sa kasigurohan',
    confidenceLevels: { low: 'Ubos', moderate: 'Kasarangan', high: 'Taas' },
    riskLevelLabel: 'Lebel sa kakuyaw',
    riskLevels: {
      none: 'Walay kakuyaw',
      low: 'Ubos',
      moderate: 'Kasarangan',
      high: 'Taas',
    },
    lowConfidenceNotice:
      'Dili sigurado ang resulta. Sulayi pag-kuha og laing klaro ug hayag nga litrato sa dahon.',
  },

  report: {
    totalScan: 'Total nga scan',
    cornAffected: 'Naapektuhang mais',
    healthy: 'Himsog',
    breakdownTitle: 'PAGKABAHIN SA SAKIT SA MAIS',
    plantsScanned: (count) => `${count} ka tanom nga na-scan`,
    affected: (count) => `${count} naapektuhan`,
    detailsTitle: 'DETALYE SA REPORT',
    estimatedArea: 'Gibanabana nga sukod sa naapektuhan',
    areaRequired: 'Palihug i-input ang gibanabana nga sukod sa naapektuhan (sa ektarya) sa dili pa ipadala.',
    hectare: 'ha',
    barangay: 'Barangay',
    notSet: 'Wala pa gibutang',
    remarksTitle: 'MGA KOMENTO',
    remarksPlaceholder: 'Pagdugang og komento (pananglitan, naobserbahang simtomas, kahimtang sa uma...)',
    submit: 'Ipadala ang report sa CAO',
    submitting: 'Ginapadala...',
    errorGeneric: 'Dili namo mapadala ang imong report. Palihug sulayi pag-usab.',
    allSentTitle: 'Naipadala na tanang scan',
    allSentMessage:
      'Ang imong mga scan gipadala na sa CAO. Mag-scan og dugang dahon aron makapadala og bag-ong report.',
  },

  reportSuccess: {
    title: 'Napadala na ang report!',
    subtitle: 'Ang imong report gipadala na sa City Agriculture Office sa Pagadian City.',
    backToHome: 'Balik sa home',
  },

  settings: {
    title: 'Mga Setting',
    submitReport: 'Ipadala ang report',
    profileInfo: 'IMPORMASYON SA PROFILE',
    editProfile: 'I-edit',
    phone: 'Telepono',
    barangay: 'Barangay',
    municipality: 'Munisipyo',
    farmArea: 'Sukod sa uma',
    mainCrop: 'Punoan nga tanom',
    notSet: 'Wala pa gibutang',
    language: 'PINULONGAN',
    languageHint: 'Pilia ang imong gustong pinulongan',
    logOut: 'Mag-log out',
    logOutTitle: 'Mag-log out?',
    logOutMessage: 'Sigurado ka ba nga gusto ka mag-log out sa imong account?',
    yesLogOut: 'Oo, mag-log out',
    footer: 'LeafScan AI · City Agriculture Office of Pagadian City',

    editProfileTitle: 'I-edit ang profile',
    phonePlaceholder: 'Numero sa selpon',
    barangayPlaceholder: 'Barangay',
    municipalityPlaceholder: 'Munisipyo / Siyudad',
    cornTypeLabel: 'Klase sa mais',
    cornTypeWhite: 'Puti nga mais',
    cornTypeYellow: 'Dalag nga mais',
    cornTypeBoth: 'Puti ug dalag',
    saveChanges: 'I-save ang mga pagbag-o',
    savingChanges: 'Ginatipig...',
    profileErrorPhone: 'Pagbutang og saktong numero sa selpon, pananglitan 09171234567.',
    profileErrorGeneric: 'Dili namo mahimo i-update ang imong profile. Palihug sulayi pag-usab.',

    changePassword: 'Ilisan ang password',
    changePasswordTitle: 'Ilisan ang password',
    changePasswordHint:
      'Isulod ang imong kasamtangang password, dayon pagpili og bag-o nga ikaw ra ang nakabalo.',
    currentPasswordPlaceholder: 'Kasamtangang password',
    newPasswordPlaceholder: 'Bag-ong password',
    confirmPasswordPlaceholder: 'Kumpirmaha ang bag-ong password',
    changePasswordCta: 'Ilisan ang password',
    changingPassword: 'Ginailisan...',
    passwordChanged: 'Nailisan na ang imong password.',
    passwordErrorLength: 'Ang bag-ong password kinahanglan labing menos 8 ka karakter.',
    passwordErrorMismatch: 'Ang bag-ong password ug ang kumpirmasyon niini wala magkatugma.',
    passwordErrorGeneric: 'Dili namo mailisan ang imong password. Palihug sulayi pag-usab.',

    changePhoto: 'Ilisan ang litrato',
    takePhoto: 'Pagkuha og litrato',
    chooseFromGallery: 'Pagpili gikan sa gallery',
    removePhoto: 'Kuhaon ang litrato',
    photoPermissionMessage:
      'Kinahanglan sa LeafScan AI ang access sa imong mga litrato aron makabutang og profile picture. Pwede nimo i-enable kini sa settings sa imong telepono.',
    photoErrorGeneric: 'Dili namo mahimo i-update ang imong litrato. Palihug sulayi pag-usab.',
    cropPhotoHint:
      'Ibira ang suok o ngilit aron usbon ang gidak-on sa kwadrado. Ibira sa sulod aron ibalhin. Kini nga bahin ang mahimong imong profile photo.',
  },

  apiErrors: {
    INVALID_CREDENTIALS: 'Sayop ang username o password. Palihug sulayi pag-usab.',
    INVALID_CURRENT_PASSWORD: 'Sayop ang imong kasamtangang password.',
    PASSWORD_UNCHANGED: 'Ang bag-ong password kinahanglan lahi sa imong kasamtangan.',
    ACCOUNT_DEACTIVATED:
      'Kini nga account gi-deactivate na. Palihug kontaka ang City Agriculture Office.',
    ADMIN_USE_WEB_PLATFORM:
      'Ang mga account sa City Agriculture Office dili makasulod sa mobile app. Palihug gamita ang LeafScan AI admin platform.',
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
    AI_UNAVAILABLE: 'Dili karon magamit ang pag-scan sa dahon. Palihug sulayi pag-usab sa makadiyot.',
    AI_REJECTED_IMAGE: 'Dili mabasa kini nga litrato. Palihug kuhai og klaro nga litrato sa dahon sa mais.',
    // Both failed corn-leaf checks read the same as the on-screen error (see `invalidImage`).
    NOT_A_CORN_LEAF: invalidImageCeb.message,
    NOT_CORN: invalidImageCeb.message,
    AI_BAD_GATEWAY: 'Naay problema sa pag-check sa sakit. Palihug sulayi pag-usab human sa pipila ka gutlo.',
    AI_BAD_RESPONSE: 'Naay problema sa pag-check sa sakit. Palihug sulayi pag-usab human sa pipila ka gutlo.',
    IMAGE_NOT_FOUND: 'Wala makit-i ang na-upload nga litrato. Palihug pag-scan pag-usab.',
    SCAN_TIME_OUT_OF_RANGE: 'Kini nga na-save nga scan kay sobra na sa 30 ka adlaw, dili na ma-upload.',
    NETWORK_ERROR: 'Walay koneksyon sa internet. Palihug ablihi ang imong mobile data o Wi-Fi, dayon sulayi pag-usab.',
    REQUEST_TIMEOUT: 'Hinay o dili lig-on ang koneksyon. Palihug susiha ang imong internet ug sulayi pag-usab.',
  },
};

export const TRANSLATIONS: Record<Language, Translations> = { en, ceb };
