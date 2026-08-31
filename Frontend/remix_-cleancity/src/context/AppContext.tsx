import React, { createContext, useContext, useState, useEffect } from 'react';
import { Complaint, Citizen, AppNotification, WorkforceTeam, ComplaintCategory, ComplaintPriority, ComplaintComment, ComplaintStatus, ComplaintFeedback, Vehicle, VehicleStatus } from '../types';
import { storage, mockCitizen, mockAuthorityUsers, AuthorityUser, updateAuthorityUserPasswordInMock } from '../data/mockData';
import { submitComplaint } from '../services/api';
import {
  adminLogin,
  supervisorLogin,
  workerLogin,
  getProfile,
  BASE_URL,
} from "../services/api";
import { submitFeedback } from "../services/api";

// Dictionary containing translations for 11 regional languages
export const translations: Record<string, Record<string, string>> = {
  english: {
    welcome_msg: "Your single complaint, a new beginning for a clean and smart city. 🌿",
    report_btn: "Report Garbage",
    submitted: "Submitted",
    in_progress: "In Progress",
    resolved: "Resolved",
    rewards: "CleanPoints",
    dashboard: "Dashboard",
    my_complaints: "My Complaints",
    profile: "Profile",
    settings: "Settings",
    help_support: "Help & Support",
    notifications: "Notifications",
    logout: "Logout",
    how_to_earn: "How do I earn CleanPoints?",
    waste_categories: "What waste categories exist?",
    resolve_time: "How long to resolve a report?",
    upload_photo: "Upload Photo",
    camera_capture: "Capture photo with camera",
    gps_location: "Auto-detect GPS Location",
    address_landmark: "Address / Landmark",
    choose_category: "Choose Complaint Category",
    add_description: "Add Description",
    submit: "Submit Complaint",
    rate_service: "Rate the cleanup service",
    reopen: "Reopen Complaint",
    announcements: "Latest announcements from the municipality",
    rank: "Rank",
    change_password: "Change Password",
    phone_number: "Phone Number",
    email_address: "Email Address",
    full_name: "Full Name",
    save_changes: "Save Changes",
    reopen_success: "Complaint reopened successfully",
    rate_success: "Thank you for your feedback!",
    under_review: "Under Review",
    assigned: "Assigned",
    rejected: "Rejected",
    pending: "Pending"
  },
  hindi: {
    welcome_msg: "आपकी एक शिकायत, स्वच्छ और स्मार्ट शहर की नई शुरुआत। 🌿",
    report_btn: "कचरे की शिकायत करें",
    submitted: "कुल शिकायतें",
    in_progress: "प्रगति में",
    resolved: "सुलझाई गई",
    rewards: "क्लीनपॉइंट्स",
    dashboard: "डैशबोर्ड",
    my_complaints: "मेरी शिकायतें",
    profile: "प्रोफाइल",
    settings: "सेटिंग्स",
    help_support: "सहायता और समर्थन",
    notifications: "सूचनाएं",
    logout: "लॉगआउट",
    how_to_earn: "क्लीनपॉइंट्स कैसे कमाएं?",
    waste_categories: "कचरा श्रेणियां क्या हैं?",
    resolve_time: "समाधान में कितना समय लगता है?",
    upload_photo: "फोटो अपलोड करें",
    camera_capture: "कैमरे से फोटो लें",
    gps_location: "जीपीएस लोकेशन पता करें",
    address_landmark: "पता / लैंडमार्क",
    choose_category: "शिकायत श्रेणी चुनें",
    add_description: "विवरण जोड़ें",
    submit: "शिकायत दर्ज करें",
    rate_service: "सफाई सेवा को रेट करें",
    reopen: "शिकायत फिर से खोलें",
    announcements: "नगर पालिका से नवीनतम घोषणाएं",
    rank: "रैंक",
    change_password: "पासवर्ड बदलें",
    phone_number: "फ़ोन नंबर",
    email_address: "ईमेल पता",
    full_name: "पूरा नाम",
    save_changes: "बदलाव सहेजें",
    reopen_success: "शिकायत सफलतापूर्वक फिर से खोल दी गई है",
    rate_success: "आपकी प्रतिक्रिया के लिए धन्यवाद!",
    under_review: "समीक्षाधीन",
    assigned: "सौंपी गई",
    rejected: "अस्वीकृत",
    pending: "लंभित"
  },
  marathi: {
    welcome_msg: "तुमची एक तक्रार, स्वच्छ आणि स्मार्ट शहराची नवीन सुरुवात. 🌿",
    report_btn: "कचऱ्याची तक्रार करा",
    submitted: "एकूण तक्रारी",
    in_progress: "प्रगतीपथावर",
    resolved: "निवारण झाले",
    rewards: "क्लीनपॉइंट्स",
    dashboard: "डॅशबोर्ड",
    my_complaints: "माझ्या तक्रारी",
    profile: "प्रोफाइल",
    settings: "सेटिंग्ज",
    help_support: "मदत आणि समर्थन",
    notifications: "सूचना",
    logout: "लॉगआउट",
    how_to_earn: "क्लीनपॉइंट्स कसे मिळवायचे?",
    waste_categories: "कचऱ्याचे वर्गीकरण काय आहे?",
    resolve_time: "निवारणासाठी किती वेळ लागतो?",
    upload_photo: "फोटो अपलोड करा",
    camera_capture: "कॅमेरा वापरा",
    gps_location: "जीपीएस लोकेशन मिळवा",
    address_landmark: "पत्ता / खूण",
    choose_category: "तक्रार श्रेणी निवडा",
    add_description: "तपशील जोडा",
    submit: "तक्रार दाखल करा",
    rate_service: "सफाई सेवेचे मूल्यांकन करा",
    reopen: "तक्रार पुन्हा उघडा",
    announcements: "नगरपालिकेकडून नवीनतम घोषणा",
    rank: "रँक",
    change_password: "पासवर्ड बदला",
    phone_number: "फोन नंबर",
    email_address: "ईमेल पत्ता",
    full_name: "पूर्ण नाव",
    save_changes: "बदल जतन करा",
    reopen_success: "तक्रार यशस्वीरित्या पुन्हा उघडली",
    rate_success: "तुमच्या अभिप्रायाबद्दल धन्यवाद!",
    under_review: "पुनरावलोकनाखाली",
    assigned: "नियुक्त",
    rejected: "नाकारले",
    pending: "प्रलंबित"
  },
  bengali: {
    welcome_msg: "আপনার একটি অভিযোগ, পরিচ্ছন্ন ও স্মার্ট শহরের নতুন শুরু। 🌿",
    report_btn: "আবর্জনা রিপোর্ট করুন",
    submitted: "মোট অভিযোগ",
    in_progress: "চলমান",
    resolved: "সমাধান হয়েছে",
    rewards: "ক্লিনপয়েন্ট",
    dashboard: "ড্যাশবোর্ড",
    my_complaints: "আমার অভিযোগ",
    profile: "প্রোফাইল",
    settings: "সেটিংস",
    help_support: "সাহায্য ও সহযোগিতা",
    notifications: "বিজ্ঞপ্তি",
    logout: "লগআউট",
    how_to_earn: "ক্লিনপয়েন্ট কীভাবে অর্জন করবেন?",
    waste_categories: "বর্জ্য বিভাগ কী কী?",
    resolve_time: "সমাধানে কত সময় লাগে?",
    upload_photo: "ছবি আপলোড করুন",
    camera_capture: "ক্যামেরা দিয়ে ছবি তুলুন",
    gps_location: "জিপিএস লোকেশন সনাক্ত করুন",
    address_landmark: "ঠিকানা / ল্যান্ডমার্ক",
    choose_category: "অভিযোগের বিভাগ চয়ন করুন",
    add_description: "বর্ণনা যোগ করুন",
    submit: "অভিযোগ জমা দিন",
    rate_service: "পরিচ্ছন্নতার রেটিং দিন",
    reopen: "অভিযোগ আবার খুলুন",
    announcements: "পৌরসভার সর্বশেষ ঘোষণা",
    rank: "র‍্যাঙ্ক",
    change_password: "পাসওয়ার্ড পরিবর্তন",
    phone_number: "ফোন নম্বর",
    email_address: "ইমেল ঠিকানা",
    full_name: "পুরো নাম",
    save_changes: "পরিবর্তন সংরক্ষণ করুন",
    reopen_success: "অভিযোগ সফলভাবে পুনরায় খোলা হয়েছে",
    rate_success: "আপনার মতামতের জন্য ধন্যবাদ!",
    under_review: "পর্যালোচনাধীন",
    assigned: "বরাদ্দ করা হয়েছে",
    rejected: "প্রত্যাখ্যাত",
    pending: "তুলে ধরা"
  },
  tamil: {
    welcome_msg: "உங்கள் ஒரு புகார், தூய்மையான மற்றும் ஸ்மார்ட் நகரத்தின் புதிய தொடக்கம். 🌿",
    report_btn: "குப்பையைப் புகார் செய்",
    submitted: "மொத்த புகார்கள்",
    in_progress: "செயல்பாட்டில்",
    resolved: "தீர்வு காணப்பட்டது",
    rewards: "கிளீன்பாயிண்ட்ஸ்",
    dashboard: "டாஷ்போர்டு",
    my_complaints: "எனது புகார்கள்",
    profile: "சுயவிவரம்",
    settings: "அமைப்புகள்",
    help_support: "உதவி & ஆதரவு",
    notifications: "அறிவிப்புகள்",
    logout: "வெளியேறு",
    how_to_earn: "கிளீன்பாயிண்ட்ஸ் பெறுவது எப்படி?",
    waste_categories: "குப்பை வகைகள் யாவை?",
    resolve_time: "தீர்வு காண எவ்வளவு நேரமாகும்?",
    upload_photo: "புகைப்படம் பதிவேற்று",
    camera_capture: "கேமராவில் படம் பிடி",
    gps_location: "ஜிபிஎஸ் இருப்பிடத்தைக் கண்டறி",
    address_landmark: "முகவரி / அடையாளம்",
    choose_category: "புகார் வகையைத் தேர்ந்தெடு",
    add_description: "விவரம் சேர்க்கவும்",
    submit: "புகாரைச் சமர்ப்பி",
    rate_service: "சேவையை மதிப்பிடவும்",
    reopen: "புகாரை மீண்டும் திறக்கவும்",
    announcements: "நகராட்சியின் சமீபத்திய அறிவிப்புகள்",
    rank: "தரவரிசை",
    change_password: "கடவுச்சொல்லை மாற்று",
    phone_number: "தொலைபேசி எண்",
    email_address: "மின்னஞ்சல் முகவரி",
    full_name: "முழு பெயர்",
    save_changes: "மாற்றங்களைச் சேமி",
    reopen_success: "புகார் வெற்றிகரமாக மீண்டும் திறக்கப்பட்டது",
    rate_success: "உங்கள் கருத்துக்கு நன்றி!",
    under_review: "மதிப்பீட்டில் உள்ளது",
    assigned: "ஒதுக்கப்பட்டது",
    rejected: "நிராகரிக்கப்பட்டது",
    pending: "நிலுவையில் உள்ளது"
  },
  telugu: {
    welcome_msg: "మీ ఒక్క ఫిర్యాదు, స్వచ్ఛమైన మరియు స్మార్ట్ నగరానికి కొత్త ప్రారంభం. 🌿",
    report_btn: "చెత్తపై ఫిర్యాదు చేయండి",
    submitted: "మొత్తం ఫిర్యాదులు",
    in_progress: "ప్రగతిలో ఉంది",
    resolved: "పరిష్కరించబడింది",
    rewards: "క్లీన్ పాయింట్లు",
    dashboard: "డాష్‌బోర్డ్",
    my_complaints: "నా ఫిర్యాదులు",
    profile: "ప్రొఫైల్",
    settings: "సెట్టింగులు",
    help_support: "సహాయం & మద్దతు",
    notifications: "నోటిఫికేషన్లు",
    logout: "లాగ్అవుట్",
    how_to_earn: "క్లీన్ పాయింట్లు ఎలా సంపాదించాలి?",
    waste_categories: "చెత్త వర్గాలు ఏమిటి?",
    resolve_time: "పరిష్కారానికి ఎంత సమయం పడుతుంది?",
    upload_photo: "ఫోటో అప్‌లోడ్ చేయండి",
    camera_capture: "కెమెరాతో ఫోటో తీయండి",
    gps_location: "జీపీఎస్ లొకేషన్ గుర్తించు",
    address_landmark: "చిరునామా / ల్యాండ్‌మార్క్",
    choose_category: "ఫిర్యాదు వర్గాన్ని ఎంచుకోండి",
    add_description: "వివరణను జోడించండి",
    submit: "ఫిర్యాదు సమర్పించండి",
    rate_service: "సేవకు రేటింగ్ ఇవ్వండి",
    reopen: "ఫిర్యాదును మళ్లీ తెరవండి",
    announcements: "మునిసిపాలిటీ నుండి తాజా ప్రకటనలు",
    rank: "ర్యాంక్",
    change_password: "పాస్‌వర్డ్ మార్చండి",
    phone_number: "ఫోన్ నంబర్",
    email_address: "ఇమెయిల్ చిరునామా",
    full_name: "పూర్తి పేరు",
    save_changes: "మార్పులను సేవ్ చేయి",
    reopen_success: "ఫిర్యాదు విజయవంతంగా మళ్లీ తెరవబడింది",
    rate_success: "మీ అభిప్రాయానికి ధన్యవాదాలు!",
    under_review: "పరిశీలనలో ఉంది",
    assigned: "కేటాయించబడింది",
    rejected: "తిరస్కరించబడింది",
    pending: "పెండింగ్‌లో ఉంది"
  },
  kannada: {
    welcome_msg: "ನಿಮ್ಮ ಒಂದು ದೂರು, ಸ್ವಚ್ಛ ಮತ್ತು ಸ್ಮಾರ್ಟ್ ನಗರದ ಹೊಸ ಆರಂಭ. 🌿",
    report_btn: "ಕಸದ ದೂರು ನೀಡಿ",
    submitted: "ಒಟ್ಟು ದೂರುಗಳು",
    in_progress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
    rewards: "ಕ್ಲೀನ್‌ಪಾಯಿಂಟ್ಸ್",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    my_complaints: "ನನ್ನ ದೂರುಗಳು",
    profile: "ಪ್ರೊಫೈಲ್",
    settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
    help_support: "ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ",
    notifications: "ಅಧಿಸೂಚನೆಗಳು",
    logout: "ಲಾಗ್ ಔಟ್",
    how_to_earn: "ಕ್ಲೀನ್‌ಪಾಯಿಂಟ್ಸ್ ಗಳಿಸುವುದು ಹೇಗೆ?",
    waste_categories: "ತ್ಯಾಜ್ಯ ವರ್ಗಗಳು ಯಾವುವು?",
    resolve_time: "ಪರಿಹಾರಕ್ಕೆ ಎಷ್ಟು ಸಮಯ ಬೇಕು?",
    upload_photo: "ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    camera_capture: "ಕ್ಯಾವೆರಾದಿಂದ ಫೋಟೋ ತೆಗೆಯಿರಿ",
    gps_location: "ಜಿಪಿಎಸ್ ಸ್ಥಳ ಪತ್ತೆ ಮಾಡಿ",
    address_landmark: "ವಿಳಾಸ / ಹೆಗ್ಗುರುತು",
    choose_category: "ದೂರಿನ ವರ್ಗವನ್ನು ಆರಿಸಿ",
    add_description: "ವಿವರಣೆಯನ್ನು ಸೇರಿಸಿ",
    submit: "ದೂರನ್ನು ಸಲ್ಲಿಸಿ",
    rate_service: "ಸೇವೆಯನ್ನು ರೇಟ್ ಮಾಡಿ",
    reopen: "ದೂರನ್ನು ಮರುಪ್ರಾರಂಭಿಸಿ",
    announcements: "ಪುರಸಭೆಯಿಂದ ಇತ್ತೀಚಿನ ಪ್ರಕಟಣೆಗಳು",
    rank: "ಶ್ರೇಣಿ",
    change_password: "ಪಾಸ್ವರ್ಡ್ ಬದಲಾಯಿಸಿ",
    phone_number: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    email_address: "ಇಮೇಲ್ ವಿಳಾಸ",
    full_name: "ಪೂರ್ಣ ಹೆಸರು",
    save_changes: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
    reopen_success: "ದೂರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪುನರ್ ಆರಂಭಿಸಲಾಗಿದೆ",
    rate_success: "ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗೆ ಧನ್ಯವಾದಗಳು!",
    under_review: "ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ",
    assigned: "ನಿಯೋಜಿಸಲಾಗಿದೆ",
    rejected: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
    pending: "ಬಾಕಿ ಇದೆ"
  },
  malayalam: {
    welcome_msg: "നിങ്ങളുടെ ഒരു പരാതി, വൃത്തിയുള്ളതും സ്മാർട്ട് ആയതുമായ നഗരത്തിന്റെ പുതിയ തുടക്കം. 🌿",
    report_btn: "മാലിന്യം റിപ്പോർട്ട് ചെയ്യുക",
    submitted: "ആകെ പരാതികൾ",
    in_progress: "നടന്നുകൊണ്ടിരിക്കുന്നു",
    resolved: "പരിഹരിച്ചു",
    rewards: "ക്ലീൻ പോയിന്റുകൾ",
    dashboard: "ഡാഷ്‌ബോർഡ്",
    my_complaints: "എന്റെ പരാതികൾ",
    profile: "പ്രൊഫൈൽ",
    settings: "ക്രമീകരണങ്ങൾ",
    help_support: "സഹായവും പിന്തുണയും",
    notifications: "അറിയിപ്പുകൾ",
    logout: "ലോഗ് ഔട്ട്",
    how_to_earn: "എങ്ങനെ ക്ലീൻ പോയിന്റുകൾ നേടാം?",
    waste_categories: "മാലിന്യ വിഭാഗങ്ങൾ ഏവ?",
    resolve_time: "പരിഹരിക്കാൻ എത്ര സമയമെടുക്കും?",
    upload_photo: "ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക",
    camera_capture: "ക്യാമറയിൽ ഫോട്ടോ എടുക്കുക",
    gps_location: "ജിപിഎസ് ലൊക്കേഷൻ കണ്ടെത്തുക",
    address_landmark: "വിലാസം / ലാൻഡ്മാർക്ക്",
    choose_category: "പരാതി വിഭാഗം തിരഞ്ഞെടുക്കുക",
    add_description: "വിവരണം ചേർക്കുക",
    submit: "പരാതി സമർപ്പിക്കുക",
    rate_service: "സേവനം വിലയിരുത്തുക",
    reopen: "പരാതി പുനരാരംഭിക്കുക",
    announcements: "മുനിസിപ്പാലിറ്റിയിൽ നിന്നുള്ള അറിയിപ്പുകൾ",
    rank: "റാങ്ക്",
    change_password: "പാസ്‌വേഡ് മാറ്റുക",
    phone_number: "ഫോൺ നമ്പർ",
    email_address: "ഇമെയിൽ വിലാസം",
    full_name: "മുഴുവൻ പേര്",
    save_changes: "മാറ്റങ്ങൾ സേവ് ചെയ്യുക",
    reopen_success: "പരാതി വിജകരമായി വീണ്ടും ഫയൽ ചെയ്തു",
    rate_success: "നിങ്ങളുടെ പ്രതികരണത്തിന് നന്ദി!",
    under_review: "പരിശോധനയിലാണ്",
    assigned: "ചുമതലപ്പെടുത്തി",
    rejected: "നിരസിച്ചു",
    pending: "തീരുമാനമാകാത്തത്"
  },
  gujarati: {
    welcome_msg: "તમારી એક ફરિયાદ, સ્વચ્છ અને સ્માર્ટ શહેરની નવી શરૂઆત. 🌿",
    report_btn: "કચરાની ફરિયાદ કરો",
    submitted: "કુલ ફરિયાદો",
    in_progress: "પ્રગતિમાં",
    resolved: "ઉકેલાયેલ",
    rewards: "ક્લીનપોઇન્ટ્સ",
    dashboard: "ડેશબોર્ડ",
    my_complaints: "મારી ફરિયાદો",
    profile: "પ્રોફાઇલ",
    settings: "સેટિંગ્સ",
    help_support: "મદદ અને સપોર્ટ",
    notifications: "સૂચનાઓ",
    logout: "લોગઆઉટ",
    how_to_earn: "ક્લીનપોઇન્ટ્સ કેવી રીતે મેળવવા?",
    waste_categories: "કચરાના પ્રકારો કયા છે?",
    resolve_time: "ઉકેલ લાવવામાં કેટલો સમય લાગે?",
    upload_photo: "ફોટો અપલોડ કરો",
    camera_capture: "કેમેરા વડે ફોટો લો",
    gps_location: "જીપીએસ લોકેશન મેળવો",
    address_landmark: "સરનામું / લેન્ડમાર્ક",
    choose_category: "ફરિયાદનો પ્રકાર પસંદ કરો",
    add_description: "વર્ણન ઉમેરો",
    submit: "ફરિયાદ સબમિટ કરો",
    rate_service: "સફાઈ સેવાનું રેટિંગ આપો",
    reopen: "ફરિયાદ ફરીથી ખોલો",
    announcements: "નગરપાલિકાની નવીનતમ જાહેરાત",
    rank: "રેન્ક",
    change_password: "પાસવર્ડ બદલો",
    phone_number: "ફોન નંબર",
    email_address: "ઇમેઇલ સરનામું",
    full_name: "પૂરું નામ",
    save_changes: "ફેરફારો સાચવો",
    reopen_success: "ફરિયાદ સફળતાપૂર્વક ફરીથી ખોલવામાં આવી છે",
    rate_success: "તમારા પ્રતિભાવ બદલ આભાર!",
    under_review: "સમીક્ષા હેઠળ",
    assigned: "નિમણૂક થયેલ",
    rejected: "અસ્વીકાર્ય",
    pending: "બાકી"
  },
  punjabi: {
    welcome_msg: "ਤੁਹਾਡੀ ਇੱਕ ਸ਼ਿਕਾਇਤ, ਸਾਫ਼ ਅਤੇ ਸਮਾਰਟ ਸ਼ਹਿਰ ਦੀ ਨਵੀਂ ਸ਼ੁਰੂਆਤ। 🌿",
    report_btn: "ਕੂੜੇ ਦੀ ਸ਼ਿਕਾਇਤ ਕਰੋ",
    submitted: "ਕੁੱਲ ਸ਼ਿਕਾਇਤਾਂ",
    in_progress: "ਚੱਲ ਰਿਹਾ ਹੈ",
    resolved: "ਹੱਲ ਕੀਤਾ ਗਿਆ",
    rewards: "ਕਲੀਨਪੁਆਇੰਟਸ",
    dashboard: "ਡੈਸ਼ਬੋਰਡ",
    my_complaints: "ਮੇਰੀਆਂ ਸ਼ਿਕਾਇਤਾਂ",
    profile: "ਪ੍ਰੋਫਾਈਲ",
    settings: "ਸੈਟਿੰਗਜ਼",
    help_support: "ਮਦਦ ਅਤੇ ਸਹਾਇਤਾ",
    notifications: "ਨੋਟੀਫਿਕੇਸ਼ਨ",
    logout: "ਲੌਗਆਉਟ",
    how_to_earn: "ਕਲੀਨਪੁਆਇੰਟਸ ਕਿਵੇਂ ਕਮਾਏ ਜਾਣ?",
    waste_categories: "ਕੂੜੇ ਦੀਆਂ ਸ਼੍ਰੇਣੀਆਂ ਕਿਹੜੀਆਂ ਹਨ?",
    resolve_time: "ਹੱਲ ਕਰਨ ਵਿੱਚ ਕਿੰਨਾ ਸਮਾਂ ਲੱਗਦਾ ਹੈ?",
    upload_photo: "ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ",
    camera_capture: "ਕੈਮਰੇ ਨਾਲ ਫੋਟੋ ਲਓ",
    gps_location: "ਜੀਪੀਐਸ ਲੋਕੇਸ਼ਨ ਲੱਭੋ",
    address_landmark: "ਪਤਾ / ਲੈਂਡਮਾਰਕ",
    choose_category: "ਸ਼ਿਕਾਇਤ ਦੀ ਸ਼੍ਰੇਣੀ ਚੁਣੋ",
    add_description: "ਵੇਰਵਾ ਸ਼ਾਮਲ ਕਰੋ",
    submit: "ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ",
    rate_service: "ਸਫ਼ਾਈ ਸੇਵਾ ਦੀ ਰੇਟਿੰਗ ਦਿਓ",
    reopen: "ਸ਼ਿਕਾਇਤ ਦੁਬਾਰਾ ਖੋਲ੍ਹੋ",
    announcements: "ਨਗਰ ਪਾਲਿਕਾ ਵੱਲੋਂ ਤਾਜ਼ਾ ਐਲਾਨ",
    rank: "ਰੈਂਕ",
    change_password: "ਪਾਸਵਰਡ ਬਦਲੋ",
    phone_number: "ਫ਼ੋਨ ਨੰਬਰ",
    email_address: "ਈਮੇਲ ਪਤਾ",
    full_name: "ਪੂਰਾ ਨਾਮ",
    save_changes: "ਤਬਦੀਲੀਆਂ ਸੁਰੱਖਿਅਤ ਕਰੋ",
    reopen_success: "ਸ਼ਿਕਾਇਤ ਸਫ਼ਲਤਾਪੂਰਵਕ ਮੁੜ ਖੋਲ੍ਹੀ ਗਈ",
    rate_success: "ਤੁਹਾਡੀ ਪ੍ਰਤੀਕਿਰਿਆ ਲਈ ਧੰਨਵਾਦ!",
    under_review: "ਸਮੀਖਿਆ ਅਧੀਨ",
    assigned: "ਸੌਂਪਿਆ ਗਿਆ",
    rejected: "ਰੱਦ ਕੀਤਾ ਗਿਆ",
    pending: "ਲੰਬਿਤ"
  },
  odia: {
    welcome_msg: "ଆପଣଙ୍କର ଗୋଟିଏ ଅଭିଯୋଗ, ସ୍ୱଚ୍ଛ ଓ ସ୍ମାର୍ਟ ସହରର ନୂଆ ଆରମ୍ଭ। 🌿",
    report_btn: "ଆବର୍ଜନା ଅଭିଯୋଗ କରନ୍ତୁ",
    submitted: "ସମୁଦାୟ ଅଭିଯୋଗ",
    in_progress: "ଚାଲୁଅଛି",
    resolved: "ସମାଧାନ ହେଲା",
    rewards: "କ୍ଲିନ୍ ପଏଣ୍ଟସ",
    dashboard: "ଡ୍ୟାସବୋର୍ଡ",
    my_complaints: "ମୋର ଅଭିଯୋଗ",
    profile: "ପ୍ରୋଫାଇଲ୍",
    settings: "ସେଟିଂସ",
    help_support: "ସାହାଯ୍ୟ ଓ ସମର୍ଥନ",
    notifications: "ସୂଚନା",
    logout: "ଲଗଆଉଟ୍",
    how_to_earn: "କ୍ଲିନ୍ ପଏଣ୍ଟସ କିପରି ପାଇବେ?",
    waste_categories: "ଆବର୍ଜନା ଶ୍ରେଣୀ କଣ?",
    resolve_time: "ସମାଧାନ ପାଇଁ କେତେ ସମୟ ଲାଗେ?",
    upload_photo: "ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ",
    camera_capture: "କ୍ୟାମେରା ବ୍ୟବହାର କରନ୍ତು",
    gps_location: "ଜିପିଏସ ଅବସ୍ଥିତି ସନ୍ଧାନ କରନ୍ତು",
    address_landmark: "ଠିକଣା / ଚିହ୍ନଟ ସ୍ଥାନ",
    choose_category: "ଅଭିଯୋଗ ଶ୍ରେଣୀ ବାଛନ୍ତୁ",
    add_description: "ବିବରଣୀ ଯୋଡନ୍ତୁ",
    submit: "ଅଭିଯୋଗ ଦାଖଲ କରନ୍ତୁ",
    rate_service: "ସେବାକୁ ମୂଲ୍ୟାଙ୍କନ କରନ୍ତು",
    reopen: "ଅଭିଯୋଗ ପୁଣି ଖୋଲନ୍ତು",
    announcements: "ପୌରପାଳିକାର ସର୍ବଶେଷ ଘୋଷଣା",
    rank: "ରାଙ୍କ",
    change_password: "ପାସୱାର୍ଡ ବଦଳାନ୍ତୁ",
    phone_number: "ମୋବାଇଲ୍ ନମ୍ବର",
    email_address: "ଇମେଲ୍ ଠିକଣା",
    full_name: "ପୂରା ନାମ",
    save_changes: "ପରିବର୍ତ୍ତନ ସଞ୍ଚୟ କରନ୍ତୁ",
    reopen_success: "ଅଭିଯୋଗ ସଫଳତାର ସହ ପୁନର୍ବାର ଖୋଲାଗଲା",
    rate_success: "ଆପଣଙ୍କ ମତାମତ ପାଇଁ ଧନ୍ୟବାଦ!",
    under_review: "ସମୀକ୍ଷାଧୀନ",
    assigned: "ନ୍ୟସ୍ତ କରାଗଲା",
    rejected: "ପ୍ରତ୍ୟାଖ୍ୟାତ",
    pending: "ବାକି ଅଛି"
  }
};

export const languageOptions = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'हिन्दी (Hindi)' },
  { value: 'marathi', label: 'मराठी (Marathi)' },
  { value: 'bengali', label: 'बंगाली (Bengali)' },
  { value: 'tamil', label: 'तमिल (Tamil)' },
  { value: 'telugu', label: 'తెలుగు (Telugu)' },
  { value: 'kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'malayalam', label: 'मलयालम (Malayalam)' },
  { value: 'gujarati', label: 'गुजराती (Gujarati)' },
  { value: 'punjabi', label: 'पंजाबी (Punjabi)' },
  { value: 'odia', label: 'ओड़िया (Odia)' }
];

interface AppContextType {
  complaints: Complaint[];
  user: Citizen;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  teams: WorkforceTeam[];
  currentRole: 'citizen' | 'admin' | 'supervisor' | 'worker';
  authoritySubRole: 'Admin' | 'Supervisor' | 'Field Worker';
  setAuthoritySubRole: (subrole: 'Admin' | 'Supervisor' | 'Field Worker') => void;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setRole: (role: 'citizen' | 'admin' | 'supervisor' | 'worker') => void;
  loginUser: (phoneOrEmail: string, password?: string, remember?: boolean) => Promise<boolean>;
  registerUser: (name: string, phone: string, email: string, password?: string, remember?: boolean) => Promise<boolean>;
  logoutUser: () => void;
  submitGrievance: (title: string, description: string, category: ComplaintCategory, beforeImage: string, address: string, latitude: number, longitude: number, isDirectSubmit?: boolean) => Promise<Complaint>;
  assignWorkforce: (complaintId: string, teamId: string) => void;
  updateComplaintStatus: (complaintId: string, status: ComplaintStatus, afterImage?: string, rejectionReason?: string) => void;
  updateComplaintPriority: (complaintId: string, priority: ComplaintPriority) => void;
  addComplaintComment: (complaintId: string, text: string, isAdmin: boolean) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  updateUserProfile: (name: string, email?: string, phone?: string, password?: string, avatar?: string, cleanPoints?: number) => void;
  
  // New localization variables
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  showLanguageModal: boolean;
  setShowLanguageModal: (show: boolean) => void;
  t: (key: string) => string;
  translateText: (text: string, targetLanguage: string) => Promise<string>;
  translationCache: Record<string, string>;
  
  // New citizen feedback and reopening features
  rateComplaint: (complaintId: string, rating: number, feedback: string) => void;
  feedbacks: ComplaintFeedback[];
  submitDetailedFeedback: (
    complaintId: string,
    resolutionQuality: number,
    staffBehaviour: number,
    responseTime: number,
    overallExperience: number,
    citizenComment: string,
    appUsabilityRating?: number
  ) => void;
  reopenComplaint: (complaintId: string) => void;
  checkUserExistsByPhone: (phone: string) => boolean;
  checkAuthorityUserExists: (idOrEmail: string) => boolean;

  // Municipal Vehicle Management
  vehicles: Vehicle[];
  assignComplaintResources: (
    complaintId: string,
    resources: {
      supervisorId?: string;
      supervisorName?: string;
      teamId?: string;
      teamName?: string;
      vehicleId?: string;
    }
  ) => void;
  updateVehicleStatus: (vehicleId: string, status: VehicleStatus) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>(() => storage.getComplaints());
  
  const [feedbacks, setFeedbacks] = useState<ComplaintFeedback[]>(() => storage.getFeedbacks());
  const [user, setUser] = useState<Citizen>(() => {
    const savedUser = storage.getUser();
    const role = localStorage.getItem('cleancity_role') || 'citizen';
    const rememberedUser = localStorage.getItem('cleancity_remembered_user');


    if (role === 'admin' && rememberedUser) {
      const authUser = mockAuthorityUsers.find(
        u => u.employeeId.toLowerCase().trim() === rememberedUser.toLowerCase().trim() ||
             u.email.toLowerCase().trim() === rememberedUser.toLowerCase().trim()
      );
      if (authUser) {
        return {
          id: authUser.employeeId,
          name: authUser.name,
          phoneNumber: '',
          email: authUser.email,
          password: authUser.password,
          cleanPoints: 0,
          rank: 'BRONZE',
          avatar: authUser.avatar
        };
      }
    }
    return savedUser;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => storage.getNotifications());
  const [teams, setTeams] = useState<WorkforceTeam[]>(() => storage.getTeams());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => storage.getVehicles());
 const [currentRole, setRoleState] = useState<
  'citizen' | 'admin' | 'supervisor' | 'worker'
>(() => {
  const saved = localStorage.getItem('cleancity_role');
  return (saved as 'citizen' | 'admin' | 'supervisor' | 'worker') || 'citizen';
});
  const [authoritySubRole, setAuthoritySubRoleState] = useState<'Admin' | 'Supervisor' | 'Field Worker'>(() => {
    const saved = localStorage.getItem('cleancity_authority_subrole');
    return (saved as 'Admin' | 'Supervisor' | 'Field Worker') || 'Admin';
  });
  const setAuthoritySubRole = (subrole: 'Admin' | 'Supervisor' | 'Field Worker') => {
    setAuthoritySubRoleState(subrole);
    localStorage.setItem('cleancity_authority_subrole', subrole);
  };
const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
  const role = localStorage.getItem('cleancity_role') || 'citizen';
  const rememberMe = localStorage.getItem('cleancity_remember_me') === 'true';
  const loggedIn = localStorage.getItem('cleancity_loggedin') === 'true';
  const sessionLoggedIn = sessionStorage.getItem('cleancity_session_loggedin') === 'true';

  if (role === 'admin') {
    if ((rememberMe && loggedIn) || sessionLoggedIn || loggedIn) {
      return true;
    }
    return false;
  } else {
    if (rememberMe && loggedIn) return true;
    if (sessionLoggedIn) return true;
    return false;
  }
});

  // Localization States
  const [currentLanguage, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('cleancity_lang') || 'english';
  });
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({});
  

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('cleancity_lang', lang);
  };

  const t = (key: string): string => {
    const langDict = translations[currentLanguage] || translations['english'];
    return langDict[key] || translations['english'][key] || key;
  };

  const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    if (!text || !text.trim()) return text;
    
    const targetLangLower = targetLanguage.toLowerCase().trim();
    const cacheKey = `${text.trim()}::${targetLangLower}`;
    
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage })
      });
      
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      
      const data = await response.json();
      if (data.translatedText) {
        setTranslationCache(prev => ({
          ...prev,
          [cacheKey]: data.translatedText
        }));
        return data.translatedText;
      }
      throw new Error('Translation content is empty');
    } catch (err) {
      console.error('Translation error:', err);
      throw err;
    }
  };

  // Sync to local storage on changes
  useEffect(() => {
    storage.setComplaints(complaints);
  }, [complaints]);

  useEffect(() => {
    storage.setUser(user);
  }, [user]);

  useEffect(() => {
    storage.setNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    storage.setTeams(teams);
  }, [teams]);

  useEffect(() => {
    storage.setVehicles(vehicles);
  }, [vehicles]);

  useEffect(() => {
    storage.setFeedbacks(feedbacks);
  }, [feedbacks]);

  const setRole = (role: 'citizen' | 'admin' | 'supervisor' | 'worker') => {
    setRoleState(role);
    localStorage.setItem('cleancity_role', role);
  };

  const getStoredCitizens = (): Citizen[] => {
    try {
      const data = localStorage.getItem('cleancity_citizens');
      return data ? JSON.parse(data) : [mockCitizen];
    } catch {
      return [mockCitizen];
    }
  };

  const saveStoredCitizens = (citizensList: Citizen[]) => {
    try {
      localStorage.setItem('cleancity_citizens', JSON.stringify(citizensList));
    } catch (e) {
      console.error(e);
    }
  };

  const checkUserExistsByPhone = (phone: string): boolean => {
    const citizensList = getStoredCitizens();
    const normalizedTarget = phone.replace(/\D/g, '').trim();
    if (!normalizedTarget) return false;
    
    // Check in storage list
    const found = citizensList.some(
      c => c.phoneNumber.replace(/\D/g, '') === normalizedTarget || 
           c.phoneNumber.trim() === phone.trim()
    );
    if (found) return true;

    // Check mock citizen
    const mockNormalized = mockCitizen.phoneNumber.replace(/\D/g, '');
    if (normalizedTarget === mockNormalized || phone.trim() === mockCitizen.phoneNumber) {
      return true;
    }

    return false;
  };

  const checkAuthorityUserExists = (idOrEmail: string): boolean => {
    return mockAuthorityUsers.some(
      u => u.employeeId.toLowerCase().trim() === idOrEmail.toLowerCase().trim() ||
           u.email.toLowerCase().trim() === idOrEmail.toLowerCase().trim()
    );
  };

  const loginUser = async (phoneOrEmail: string, password?: string, remember: boolean = false): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const role = localStorage.getItem('cleancity_role') || 'citizen';
        console.log("loginUser role =", role);
        
        if (role === 'admin') {
         const authUser = await adminLogin(
         phoneOrEmail.trim(),
         password || ""
         );

        if (!authUser || !authUser.token) {
            resolve(false);
            return;
          }

// Save JWT token
localStorage.setItem("token", authUser.token);

          const citizenRep: Citizen = {
          id: authUser.admin.employee_id,
          name: authUser.admin.full_name,
          phoneNumber: '',
          email: authUser.admin.email,
          password: '',
          cleanPoints: 0,
          rank: 'BRONZE',
          avatar: ''
        };

          setUser(citizenRep);
          storage.setUser(citizenRep);
          const savedRole = localStorage.getItem("cleancity_role");
if (savedRole === "supervisor") {
  setAuthoritySubRole("Supervisor");
  setRoleState("supervisor");
} else if (savedRole === "worker") {
  setAuthoritySubRole("Field Worker");
  setRoleState("worker");
} else {
  setAuthoritySubRole("Admin");
  setRoleState("admin");
}

setIsLoggedIn(true);

          sessionStorage.setItem('cleancity_session_loggedin', 'true');
          if (remember) {
            localStorage.setItem('cleancity_remember_me', 'true');
            localStorage.setItem('cleancity_loggedin', 'true');
            localStorage.setItem('cleancity_remembered_user', phoneOrEmail.trim());
          } else {
            localStorage.setItem('cleancity_remember_me', 'false');
            localStorage.removeItem('cleancity_loggedin');
            localStorage.removeItem('cleancity_remembered_user');
          }

          resolve(true);
      }
            else if (role === "supervisor") {
              
        const authUser = await supervisorLogin(
  phoneOrEmail.trim(),
  password || ""
);

if (!authUser || !authUser.token) {
  resolve(false);
  return;
}

localStorage.setItem("token", authUser.token);

const supervisorRep: Citizen = {
  id: authUser.supervisor.employee_id,
  name: authUser.supervisor.full_name,
  phoneNumber: "",
  email: authUser.supervisor.email,
  password: "",
  cleanPoints: 0,
  rank: "BRONZE",
  avatar: ""
};

setUser(supervisorRep);
storage.setUser(supervisorRep);
setAuthoritySubRole("Supervisor");
setRoleState("supervisor");
setIsLoggedIn(true);

sessionStorage.setItem("cleancity_session_loggedin", "true");

if (remember) {
  localStorage.setItem("cleancity_remember_me", "true");
  localStorage.setItem("cleancity_loggedin", "true");
  localStorage.setItem("cleancity_remembered_user", phoneOrEmail.trim());
} else {
  localStorage.setItem("cleancity_remember_me", "false");
  localStorage.removeItem("cleancity_loggedin");
  localStorage.removeItem("cleancity_remembered_user");
}

resolve(true);
        }

        else if (role === "worker") {

          const authUser = await workerLogin(
            phoneOrEmail.trim(),
            password || ""
          );

          if (!authUser || !authUser.token) {
            resolve(false);
            return;
          }

          localStorage.setItem("token", authUser.token);

          const workerRep: Citizen = {
            id: authUser.worker.employee_id,
            name: authUser.worker.full_name,
            phoneNumber: "",
            email: authUser.worker.email,
            password: "",
            cleanPoints: 0,
            rank: "BRONZE",
            avatar: ""
          };

          setUser(workerRep);
          storage.setUser(workerRep);
         setAuthoritySubRole("Field Worker");
localStorage.setItem("authoritySubRole", "Field Worker");
setRoleState("worker");
setIsLoggedIn(true);
          sessionStorage.setItem(
            "cleancity_session_loggedin",
            "true"
          );

          resolve(true);

        }

      else {
  try {
    const profileData = await getProfile();
    const profile = profileData.user;

    const newCitizen: Citizen = {
      id: profile.id || `CITIZEN_${Math.floor(10000 + Math.random() * 90000)}`,
      name: profile.full_name || phoneOrEmail,
      phoneNumber: profile.mobile_number || phoneOrEmail,
      email: profile.email || "",
      password: password || "",
      cleanPoints: profile.clean_points || 0,
      rank: "BRONZE",
      avatar: profile.profile_photo
        ? `${BASE_URL}/${profile.profile_photo.replace(/\\/g, "/")}`
        : ""
    };

    setUser(newCitizen);
    storage.setUser(newCitizen);
    setRoleState("citizen");
    setIsLoggedIn(true);

    sessionStorage.setItem(
      "cleancity_session_loggedin",
      "true"
    );

    resolve(true);
  } catch (error) {
    console.error("Failed to load citizen profile:", error);
    resolve(false);
  }
}
        
      }, 800);
    });
  };

  const registerUser = async (name: string, phone: string, email: string, password?: string, remember: boolean = true): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const citizensList = getStoredCitizens();
        const normalizedTarget = phone.replace(/\D/g, '');
        
        const filteredList = citizensList.filter(
          c => c.phoneNumber.replace(/\D/g, '') !== normalizedTarget
        );
        
        const newCitizen: Citizen = {
          id: `CITIZEN_${Math.floor(10000 + Math.random() * 90000)}`,
          name: name.trim(),
          phoneNumber: phone.trim(),
          email: email.trim(),
          password: password || 'password',
          cleanPoints: 0,
          rank: 'BRONZE',
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(phone)}`
        };
        
        const updatedList = [...filteredList, newCitizen];
        saveStoredCitizens(updatedList);
        
       console.log("Before setUser");
        setUser(newCitizen);
        storage.setUser(newCitizen);
        setIsLoggedIn(true);
        console.log("Citizen login success");
console.log("Token:", localStorage.getItem("token"));

        sessionStorage.setItem('cleancity_session_loggedin', 'true');
        if (remember) {
          localStorage.setItem('cleancity_remember_me', 'true');
          localStorage.setItem('cleancity_loggedin', 'true');
          localStorage.setItem('cleancity_remembered_user', phone.trim());
        } else {
          localStorage.setItem('cleancity_remember_me', 'false');
          localStorage.removeItem('cleancity_loggedin');
          localStorage.removeItem('cleancity_remembered_user');
        }

        // Trigger language selection modal after sign up
        setShowLanguageModal(true);

        resolve(true);
      }, 800);
    });
  };

  const logoutUser = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('cleancity_loggedin');
    localStorage.removeItem('cleancity_remember_me');
    localStorage.removeItem('cleancity_remembered_user');
    localStorage.removeItem('cleancity_role');
    sessionStorage.removeItem('cleancity_session_loggedin');
    setUser(mockCitizen);
    storage.setUser(mockCitizen);
  };

  // Submit Complaint with Simulated AI processing
  const submitGrievance = async (
    title: string,
    description: string,
    category: ComplaintCategory,
    beforeImage: string,
    address: string,
    latitude: number,
    longitude: number,
    isDirectSubmit?: boolean
  ): Promise<Complaint> => {
    console.log("SUBMIT GRIEVANCE START");
    return new Promise((resolve) => {
      const categoryKeywords: Record<string, ComplaintCategory> = {
        plastic: 'Plastic',
        bottle: 'Plastic',
        trash: 'Household',
        garbage: 'Household',
        overflow: 'Household',
        debris: 'Construction',
        construction: 'Construction',
        hazardous: 'Hazardous',
        chemical: 'Hazardous'
      };

      let detectedCategory: ComplaintCategory = category;
      const lowerText = (title + ' ' + description).toLowerCase();
      for (const [key, cat] of Object.entries(categoryKeywords)) {
        if (lowerText.includes(key)) {
          detectedCategory = cat;
          break;
        }
      }

      const priorityMap: Record<ComplaintCategory, ComplaintPriority> = {
        Hazardous: 'HIGH',
        Plastic: 'MEDIUM',
        Household: 'HIGH',
        Construction: 'MEDIUM',
        Other: 'LOW'
      };

      const suggestedPriority = priorityMap[detectedCategory] || 'MEDIUM';
      const severityScore = Math.floor(Math.random() * 30) + (suggestedPriority === 'HIGH' ? 70 : suggestedPriority === 'MEDIUM' ? 40 : 15);

      const newId = `CC-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowStr = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });

      const newComplaint: Complaint = {
        id: newId,
        title,
        description,
        category: detectedCategory,
        status: 'SUBMITTED',
        priority: isDirectSubmit ? 'MEDIUM' : suggestedPriority,
        latitude,
        longitude,
        address,
        beforeImage,
        submitTime: nowStr,
        submitTimestamp: Date.now(),
        isDirectSubmit,
        citizenId: user.id,
        citizenName: user.name,
        liveUpdates: isDirectSubmit ? [
          { time: 'Just now', text: 'Complaint submitted successfully via CleanCity Mobile App.' }
        ] : [
          { time: 'Just now', text: 'Complaint submitted successfully via CleanCity Mobile App.' },
          { time: 'Just now', text: `AI Auto-Analysis completed: classified as "${detectedCategory}" with ${severityScore}% severity.` }
        ],
        comments: [],
        aiAnalysis: isDirectSubmit ? undefined : {
          confidence: Math.floor(Math.random() * 15) + 80,
          detectedCategory,
          suggestedPriority,
          severityScore
        }
      };

      setComplaints(prev => [newComplaint, ...prev]);

      // Trigger standard submitted notification
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        title: `Complaint Submitted: ${newId}`,
        message: isDirectSubmit 
          ? `Your grievance "${title}" is successfully recorded.`
          : `Your grievance "${title}" is successfully recorded and our AI vision model classified it as ${detectedCategory} (Severity: ${severityScore}%).`,
        time: nowStr,
        read: false,
        complaintId: newId
      };
      setNotifications(prev => [newNotif, ...prev]);

      resolve(newComplaint);
    });
  };

  // Assign Workforce to Complaint
  const assignWorkforce = (complaintId: string, teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const nowStr = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });

    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: 'ASSIGNED',
          assignTime: nowStr,
          assignedTeamId: teamId,
          assignedTeamName: team.name,
          liveUpdates: [
            { time: 'Just now', text: `Workforce dispatched: ${team.name} has been assigned to clear this site (Vehicle: ${team.vehicleNumber}).` },
            ...c.liveUpdates
          ]
        };
      }
      return c;
    }));

    // Update Team to Busy
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, status: 'BUSY' } : t));

    // Notify Citizen
    const complaint = complaints.find(c => c.id === complaintId);
    if (complaint && complaint.citizenId === user.id) {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        title: `Workforce Assigned: ${complaintId}`,
        message: `Cleanup Crew "${team.name}" led by ${team.leader} is dispatched to resolve "${complaint.title}".`,
        time: nowStr,
        read: false,
        complaintId
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Update Complaint Status (fully supports IN_PROGRESS, REJECTED, REOPENED transitions)
  const updateComplaintStatus = (
    complaintId: string,
    status: ComplaintStatus,
    afterImage?: string,
    rejectionReason?: string
  ) => {
    const nowStr = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });

    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        let updateText = '';
        const updates = [...c.liveUpdates];

        const updatedComp: Complaint = { ...c, status };

        if (afterImage) {
          updatedComp.afterImage = afterImage;
        }

        if (status === 'VERIFIED') {
          updatedComp.verifyTime = nowStr;
          updateText = `Complaint verified by municipal authority dispatcher. Priority set to ${c.priority}.`;
        } else if (status === 'IN_PROGRESS') {
          updateText = afterImage 
            ? `Field team completed clearing and uploaded "After Cleaning" proof. Pending quality audit verification.`
            : `Field workers are currently clean clearing the location. Heavy sweepers are on-site.`;
        } else if (status === 'REJECTED') {
          updatedComp.rejectionReason = rejectionReason || 'Location is on private property or already cleared.';
          updateText = `Complaint rejected by supervisor. Reason: ${updatedComp.rejectionReason}`;
        } else if (status === 'REOPENED') {
          updateText = `Complaint reopened by citizen. Requires further inspection and cleanup.`;
        } else if (status === 'RESOLVED') {
          updatedComp.resolveTime = nowStr;
          if (!updatedComp.afterImage) {
            updatedComp.afterImage = afterImage || 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800';
          }
          updateText = 'Area successfully cleared and washed. Complaint marked as Resolved.';

          // Free up assigned team if any
          if (c.assignedTeamId) {
            setTeams(prevTeams => prevTeams.map(t => t.id === c.assignedTeamId ? { ...t, status: 'IDLE' } : t));
          }

          // Reward points to Citizen!
          if (c.citizenId === user.id) {
            const pointsGained = 100;
            const newPoints = user.cleanPoints + pointsGained;
            let newRank = user.rank;
            if (newPoints >= 2000) newRank = 'PLATINUM';
            else if (newPoints >= 1500) newRank = 'GOLD';
            else if (newPoints >= 1000) newRank = 'SILVER';

            setUser(prevUser => ({
              ...prevUser,
              cleanPoints: newPoints,
              rank: newRank
            }));

            // Reward Notification
            const pointsNotif: AppNotification = {
              id: `notif_${Date.now()}_pts`,
              title: `CleanPoints Rewarded!`,
              message: `You earned +${pointsGained} CleanPoints for the resolution of "${c.title}". Rank: ${newRank}!`,
              time: nowStr,
              read: false,
              complaintId
            };
            setTimeout(() => {
              setNotifications(prev => [pointsNotif, ...prev]);
            }, 100);
          }
        }

        updatedComp.liveUpdates = [
          { time: 'Just now', text: updateText },
          ...updates
        ];

        return updatedComp;
      }
      return c;
    }));

    // Notify Citizen of status update
    const complaint = complaints.find(c => c.id === complaintId);
    if (complaint && complaint.citizenId === user.id) {
      const statusNotif: AppNotification = {
        id: `notif_${Date.now()}_status`,
        title: `Complaint Status: ${status}`,
        message: `Your report "${complaint.title}" is now marked as ${status.replace('_', ' ').toLowerCase()}.`,
        time: nowStr,
        read: false,
        complaintId
      };
      setNotifications(prev => [statusNotif, ...prev]);
    }
  };

  // Citizen Rating/Feedback after Resolution
  const rateComplaint = (complaintId: string, rating: number, feedback: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          rating,
          feedback,
          liveUpdates: [
            { time: 'Just now', text: `Citizen rated this resolution ${rating} Stars. Feedback: "${feedback}"` },
            ...c.liveUpdates
          ]
        };
      }
      return c;
    }));
  };

 const submitDetailedFeedback = async (
  
    complaintId: string,
    resolutionQuality: number,
    staffBehaviour: number,
    responseTime: number,
    overallExperience: number,
    citizenComment: string,
    appUsabilityRating?: number
  ) => {
    console.log("submitDetailedFeedback called");
    const complaintCategory = "Household"; // temporary
    try {
      console.log("Calling submitFeedback API");
  await submitFeedback(
    Number(complaintId),
    resolutionQuality,
    staffBehaviour,
    overallExperience,
    citizenComment
  );
  console.log("Calling backend submit feedback...");

    const newFeedback: ComplaintFeedback = {
      id: `fb_${Date.now()}`,
      complaintId,
     complaintCategory: complaintCategory as ComplaintCategory,
      submissionDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      resolutionQuality,
      staffBehaviour,
      responseTime,
      overallExperience,
      citizenComment,
      feedbackStatus: 'Submitted',
      appUsabilityRating
    };

    setFeedbacks(prev => [newFeedback, ...prev]);

    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          rating: overallExperience,
          feedback: citizenComment,
          liveUpdates: [
            { time: 'Just now', text: `Citizen submitted detailed resolution feedback: ${overallExperience}/5 Stars. Comment: "${citizenComment}"` },
            ...c.liveUpdates
          ]
        };
      }
      return c;
    }));
    } catch (err) {
  console.error("Feedback submit failed:", err);
}
  };

  // Citizen Reopening a resolved complaint
  const reopenComplaint = (complaintId: string) => {
    const nowStr = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });
    
    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: 'REOPENED',
          liveUpdates: [
            { time: 'Just now', text: `Complaint reopened by citizen. Marked as Under Review for further clearance.` },
            ...c.liveUpdates
          ]
        };
      }
      return c;
    }));

    const statusNotif: AppNotification = {
      id: `notif_${Date.now()}_reopen`,
      title: `Complaint Reopened: ${complaintId}`,
      message: `You successfully reopened the complaint. Our supervisor will verify the clearing quality again.`,
      time: nowStr,
      read: false,
      complaintId
    };
    setNotifications(prev => [statusNotif, ...prev]);
  };

  // Manage complaint priority
  const updateComplaintPriority = (complaintId: string, priority: ComplaintPriority) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          priority,
          liveUpdates: [
            { time: 'Just now', text: `Complaint priority was manually changed to ${priority} by Rajesh (Supervisor).` },
            ...c.liveUpdates
          ]
        };
      }
      return c;
    }));
  };

  // Municipal Vehicle Management Actions
  const assignComplaintResources = (
    complaintId: string,
    resources: {
      supervisorId?: string;
      supervisorName?: string;
      teamId?: string;
      teamName?: string;
      vehicleId?: string;
    }
  ) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        const nowStr = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });
        let updates = [...c.liveUpdates];
        let status = c.status;
        
        const supervisorId = resources.supervisorId !== undefined ? resources.supervisorId : c.assignedSupervisorId;
        const supervisorName = resources.supervisorName !== undefined ? resources.supervisorName : c.assignedSupervisorName;
        const teamId = resources.teamId !== undefined ? resources.teamId : c.assignedTeamId;
        const teamName = resources.teamName !== undefined ? resources.teamName : c.assignedTeamName;
        
        let assignedVehicle = c.assignedVehicle;
        let vehicleAssignedTime = c.vehicleAssignedTime;
        
        if (resources.supervisorId && resources.supervisorId !== c.assignedSupervisorId) {
          updates = [
            { time: 'Just now', text: `Supervisor ${resources.supervisorName} assigned to oversee this complaint.` },
            ...updates
          ];
        }

        if (resources.teamId && resources.teamId !== c.assignedTeamId) {
          updates = [
            { time: 'Just now', text: `Sanitation Crew ${resources.teamName} dispatched to clear this site.` },
            ...updates
          ];
          status = 'ASSIGNED';
          // Also set the team to BUSY
          setTeams(prevTeams => prevTeams.map(t => t.id === resources.teamId ? { ...t, status: 'BUSY' } : t));
        }

        if (resources.vehicleId !== undefined) {
          const oldVehicle = c.assignedVehicle;
          if (oldVehicle && oldVehicle.id !== resources.vehicleId) {
            // Free old vehicle
            setVehicles(prevVehicles => prevVehicles.map(v => v.id === oldVehicle.id ? { ...v, status: 'Available' } : v));
          }
          
          if (resources.vehicleId) {
            const foundV = vehicles.find(v => v.id === resources.vehicleId);
            if (foundV) {
              assignedVehicle = { ...foundV, status: 'Assigned' };
              
              // Format standard assignment date & time
              const d = new Date();
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const day = d.getDate();
              const month = months[d.getMonth()];
              const year = d.getFullYear();
              let hours = d.getHours();
              const minutes = d.getMinutes().toString().padStart(2, '0');
              const ampm = hours >= 12 ? 'PM' : 'AM';
              hours = hours % 12;
              hours = hours ? hours : 12;
              vehicleAssignedTime = `${day} ${month} ${year} • ${hours}:${minutes} ${ampm}`;

              // Mark as assigned in global vehicles list
              setVehicles(prevVehicles => prevVehicles.map(v => v.id === resources.vehicleId ? { ...v, status: 'Assigned' } : v));
              updates = [
                { time: 'Just now', text: `Municipal vehicle ${foundV.number} (${foundV.type}) has been assigned to this complaint.` },
                ...updates
              ];
            }
          } else {
            assignedVehicle = undefined;
            vehicleAssignedTime = undefined;
            if (oldVehicle) {
              updates = [
                { time: 'Just now', text: `Vehicle ${oldVehicle.number} has been unassigned.` },
                ...updates
              ];
            }
          }
        }

        return {
          ...c,
          status,
          assignedSupervisorId: supervisorId,
          assignedSupervisorName: supervisorName,
          assignedTeamId: teamId,
          assignedTeamName: teamName,
          assignedVehicle,
          vehicleAssignedTime,
          liveUpdates: updates
        };
      }
      return c;
    }));
  };

  const updateVehicleStatus = (vehicleId: string, status: VehicleStatus) => {
    // Update in global vehicles list
    setVehicles(prevVehicles => prevVehicles.map(v => v.id === vehicleId ? { ...v, status } : v));
    
    // Also update inside the complaint that has this vehicle assigned
    setComplaints(prevComplaints => prevComplaints.map(c => {
      if (c.assignedVehicle && c.assignedVehicle.id === vehicleId) {
        return {
          ...c,
          assignedVehicle: {
            ...c.assignedVehicle,
            status
          },
          liveUpdates: [
            { time: 'Just now', text: `Vehicle ${c.assignedVehicle.number} status updated to: ${status}.` },
            ...c.liveUpdates
          ]
        };
      }
      return c;
    }));
  };

  // Add a comment to a complaint's live comment/discussion stream
  const addComplaintComment = (complaintId: string, text: string, isAdmin: boolean) => {
    const nowStr = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });
    const newComment: ComplaintComment = {
      id: `comment_${Date.now()}`,
      authorName: isAdmin ? 'Municipal Dispatcher' : user.name,
      authorAvatar: isAdmin
        ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100'
        : user.avatar,
      text,
      time: nowStr,
      isAdmin
    };

    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          comments: [...c.comments, newComment]
        };
      }
      return c;
    }));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateUserProfile = (name: string, email?: string, phone?: string, password?: string, avatar?: string, cleanPoints?: number) => {
    setUser(prev => {
      const updated = {
        ...prev,
        name,
        email: email !== undefined ? email : prev.email,
        phoneNumber: phone !== undefined ? phone : prev.phoneNumber,
        password: password || prev.password,
        avatar: avatar || prev.avatar,
        cleanPoints: cleanPoints !== undefined ? cleanPoints : prev.cleanPoints
      };
      
      // Persist user state to storage
      storage.setUser(updated);

      const role = localStorage.getItem('cleancity_role') || 'citizen';
      if (role === 'admin' && prev.id) {
        // Also update the password in persistent mock list
      if (updated.password) {
           updateAuthorityUserPasswordInMock(prev.id, updated.password);
      }

      }

      return updated;
    });
  };

  return (
    <AppContext.Provider value={{
      complaints,
      user,
      notifications,
      setNotifications,
      teams,
      currentRole,
      authoritySubRole,
      setAuthoritySubRole,
      isLoggedIn,
      setIsLoggedIn,
      setRole,
      loginUser,
      registerUser,
      logoutUser,
      submitGrievance,
      assignWorkforce,
      updateComplaintStatus,
      updateComplaintPriority,
      addComplaintComment,
      markNotificationRead,
      clearNotifications,
      updateUserProfile,
      
      // Localization variables
      currentLanguage,
      setLanguage,
      showLanguageModal,
      setShowLanguageModal,
      t,
      translateText,
      translationCache,

      // Citizen actions
      rateComplaint,
      feedbacks,
      submitDetailedFeedback,
      reopenComplaint,
      checkUserExistsByPhone,
      checkAuthorityUserExists,

      // Vehicle Management Exports
      vehicles,
      assignComplaintResources,
      updateVehicleStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
