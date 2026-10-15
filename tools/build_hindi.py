#!/usr/bin/env python3
"""Builds site/assets/js/hi.js, the Hindi for the site's interface.

Keys are the exact English the pages show (whitespace collapsed). A value may
contain the same inline markup as its key; the build checks that every tag and
link in the English is kept, in the same order, so a translation can never
break a link or drop a form hint.

Programme names, descriptions and the programme-page details stay in English
until they are translated in phase two; only their lengths and places, which
come from a short fixed list, are translated here.

Run:  python3 tools/build_hindi.py
"""
import json
import re
import sys
from pathlib import Path

BRAND = "Talaash Heritage"

TEXT = {
    # ---- header, footer, shared --------------------------------------------
    "Skip to content": "मुख्य सामग्री पर जाएँ",
    f"{BRAND} home": f"{BRAND} मुखपृष्ठ",
    "Main": "मुख्य",
    # phone app shell: bottom tabs and the "More" sheet
    "App": "ऐप",
    "Home": "मुखपृष्ठ",
    "Programmes": "कार्यक्रम",
    "Choose": "चुनें",
    "More": "और",
    "Close": "बंद करें",
    "Policies": "नीतियाँ",
    "Display": "प्रदर्शन",
    "Walks and experiences": "भ्रमण और अनुभव",
    "Courses and lectures": "पाठ्यक्रम और व्याख्यान",
    "Counselling": "परामर्श",
    "Everything": "सब कुछ",
    "About": "हमारे बारे में",
    "About us": "हमारे बारे में",
    "Our work": "हमारा कार्य",
    "Journeys": "यात्राएँ",
    "Learn": "सीखें",
    "Booking closed": "बुकिंग बंद",
    "Includes GST": "जीएसटी सहित",
    "Career course": "करियर पाठ्यक्रम",
    "Career counselling and career courses": "करियर परामर्श और करियर पाठ्यक्रम",
    "Follow us": "हमें फ़ॉलो करें",
    "Traffic": "ट्रैफ़िक",
    "All guides": "सभी मार्गदर्शिकाएँ",
    "UNESCO sites in India": "भारत के यूनेस्को स्थल",
    "Ancient Indian history": "प्राचीन भारतीय इतिहास",
    "Archaeology in India": "भारत में पुरातत्व",
    "Temple architecture": "मंदिर स्थापत्य",
    "Sanskrit and scripts": "संस्कृत और लिपियाँ",
    "Heritage walks by city": "शहरवार धरोहर भ्रमण",
    "Heritage sites by state": "राज्यवार धरोहर स्थल",
    "Guides to India's heritage": "भारत की धरोहर पर मार्गदर्शिकाएँ",
    "TALAASHH journeys": "TALAASHH यात्राएँ",
    "Indian culture for kids": "बच्चों के लिए भारतीय संस्कृति",
    # home: the two paths and the record under the hero
    "Learn or travel with us": "हमारे साथ सीखें या यात्रा करें",
    "Learn with us": "हमारे साथ सीखें",
    "Travel with us": "हमारे साथ यात्रा करें",
    "Lectures, workshops, walks and courses for schools, colleges, workplaces and anyone curious.":
        "विद्यालयों, महाविद्यालयों, कार्यस्थलों और हर जिज्ञासु के लिए व्याख्यान, कार्यशालाएँ, भ्रमण और पाठ्यक्रम।",
    "Heritage journeys, field experiences and private trips, led by people who study the sites.":
        "धरोहर यात्राएँ, क्षेत्र-कार्य के अनुभव और निजी यात्राएँ, उन लोगों के साथ जो इन स्थलों का अध्ययन करते हैं।",
    "Our record": "हमारा अनुभव",
    "Since 2018": "2018 से",
    "Registered in 2021": "2021 में पंजीकृत",
    "In the field": "क्षेत्र-कार्य",
    "Kargil, Sirpur, Sumerpur and Hazaribagh": "कारगिल, सिरपुर, सुमेरपुर और हज़ारीबाग",
    "Teaching": "अध्यापन",
    "Prakrit, Brāhmī and Śāradā, online and on campus": "प्राकृत, ब्राह्मी और शारदा, ऑनलाइन और परिसर में",
    "See our work": "हमारा कार्य देखें",
    "Cart": "कार्ट",
    "items": "आइटम",
    "Switch to dark theme": "गहरी थीम पर जाएँ",
    "Switch to light theme": "हल्की थीम पर जाएँ",
    "Team for Archaeology, Linguistics, Anthropology, Arts, Sanskrit, History and Heritage.":
        "पुरातत्व, भाषाविज्ञान, नृविज्ञान, कला, संस्कृत, इतिहास और धरोहर के लिए समर्पित दल।",
    "Shop": "हमारी पेशकश",
    "Recordings": "रिकॉर्डिंग",
    "Books and prints": "पुस्तकें और प्रिंट",
    "Help": "सहायता",
    "Help me choose a programme": "कार्यक्रम चुनने में मदद",
    "Who are you planning for?": "आप किसके लिए योजना बना रहे हैं?",
    "Contact us": "संपर्क करें",
    "Common questions": "सामान्य प्रश्न",
    "Sell with us": "हमारे साथ साझेदारी करें",
    "Partner sign-in": "साझेदार लॉग-इन",
    "Shipping, cancellations and refunds": "डिलीवरी, रद्दीकरण और धनवापसी",
    "Privacy notice": "गोपनीयता सूचना",
    "Terms of sale": "बिक्री की शर्तें",
    "Your details": "आपका विवरण",
    "Update my details": "मेरा विवरण बदलें",
    "Remove my details": "मेरा विवरण हटाएँ",
    "Register": "पंजीकरण करें",
    "Added to cart": "कार्ट में जोड़ा गया",
    "View cart": "कार्ट देखें",
    "Add to cart": "कार्ट में जोड़ें",
    "View details": "विवरण देखें",

    # ---- registration form ---------------------------------------------------
    f"Welcome to {BRAND}": f"{BRAND} में आपका स्वागत है",
    f"Register with {BRAND}": f"{BRAND} के साथ पंजीकरण करें",
    "Update your details": "अपना विवरण अपडेट करें",
    "Our privacy notice changed. Confirm your details": "हमारी गोपनीयता सूचना बदल गई है। कृपया अपने विवरण की पुष्टि करें",
    "We ask every visitor for their contact details and location. We use them to send lecture links and order updates, and to plan sessions and walks near you.":
        "हम हर आगंतुक से उनका संपर्क विवरण और स्थान पूछते हैं। इनका उपयोग व्याख्यान के लिंक और ऑर्डर से जुड़ी जानकारी भेजने, और आपके आस-पास सत्रों व भ्रमणों की योजना बनाने के लिए किया जाता है।",
    "Full name": "पूरा नाम",
    "Email": "ईमेल",
    'Phone number <span class="hint">with country code</span>': 'फ़ोन नंबर <span class="hint">देश कोड सहित</span>',
    "Country code": "देश कोड",
    "City or town": "शहर या कस्बा",
    'State <span class="hint">optional</span>': 'राज्य <span class="hint">वैकल्पिक</span>',
    "Country": "देश",
    'PIN code <span class="hint">optional</span>': 'पिन कोड <span class="hint">वैकल्पिक</span>',
    "Add my precise location": "मेरा सटीक स्थान जोड़ें",
    "Optional. Your browser will ask for permission.": "वैकल्पिक। आपका ब्राउज़र अनुमति माँगेगा।",
    "Leave this empty": "इसे खाली छोड़ें",
    f'I agree to {BRAND} storing these details and contacting me about my registrations and orders, as set out in the <a href="privacy.html" target="_blank" rel="noopener">privacy notice</a>.':
        f'मेरी सहमति है कि {BRAND} <a href="privacy.html" target="_blank" rel="noopener">गोपनीयता सूचना</a> के अनुसार यह विवरण सुरक्षित रखे और मेरे पंजीकरण व ऑर्डर के संबंध में मुझसे संपर्क करे।',
    "Also tell me about new lectures, courses and walks by email and WhatsApp. I can stop these at any time.":
        "नए व्याख्यानों, पाठ्यक्रमों और भ्रमणों की जानकारी मुझे ईमेल और WhatsApp पर भी भेजें। इन्हें कभी भी बंद करवाया जा सकता है।",
    "Register and enter": "पंजीकरण करें और आगे बढ़ें",
    "Save my details": "मेरा विवरण सहेजें",
    "Cancel": "रद्द करें",
    "Not now": "अभी नहीं",
    "Look around first": "पहले साइट देखें",
    "Close and look around first": "बंद करें और पहले साइट देखें",
    "Register once and we can send you walk dates and lecture links, and plan a programme around you. Or look around first.":
        "एक बार पंजीकरण करें, ताकि हम आपको भ्रमण की तिथियाँ और व्याख्यान के लिंक भेज सकें और आपके अनुसार कार्यक्रम बना सकें। या पहले साइट देख लें।",
    "We use these details to send lecture links and order updates, and to plan sessions and walks near you.":
        "हम इन विवरणों से व्याख्यान के लिंक और ऑर्डर की जानकारी भेजते हैं, और आपके पास सत्र व भ्रमण की योजना बनाते हैं।",
    "Country, state and PIN code": "देश, राज्य और पिन कोड",
    "India unless you change it": "बदलें नहीं तो भारत",
    "This browser cannot share a location. City and country are enough.": "यह ब्राउज़र स्थान साझा नहीं कर सकता। शहर और देश पर्याप्त हैं।",
    "Waiting for permission…": "अनुमति की प्रतीक्षा है…",
    "Location added.": "स्थान जोड़ दिया गया।",
    "Location not shared. City and country are enough.": "स्थान साझा नहीं किया गया। शहर और देश पर्याप्त हैं।",
    "Could not save your details. Try again.": "आपका विवरण सहेजा नहीं जा सका। फिर से प्रयास करें।",
    "Tick the consent box to continue.": "आगे बढ़ने के लिए सहमति वाले बॉक्स पर टिक करें।",
    "Saving…": "सहेजा जा रहा है…",
    "Details saved.": "विवरण सहेज लिया गया।",
    "Enter your full name.": "अपना पूरा नाम लिखें।",
    "That email address does not look right. Check it and try again.": "यह ईमेल पता सही नहीं लगता। इसे जाँचकर फिर प्रयास करें।",
    "Enter your phone number with country code, digits only.": "देश कोड सहित अपना फ़ोन नंबर लिखें, केवल अंकों में।",
    "Enter your city and country.": "अपना शहर और देश लिखें।",
    "Too many registrations from this network in the last hour. Try again later.": "पिछले एक घंटे में इस नेटवर्क से बहुत अधिक पंजीकरण हुए हैं। कुछ देर बाद प्रयास करें।",

    # ---- connection messages ------------------------------------------------
    "We could not reach the booking system just now. Your cart is safe; please try again in a minute.":
        "अभी बुकिंग प्रणाली से संपर्क नहीं हो सका। आपका कार्ट सुरक्षित है; कृपया एक मिनट बाद फिर प्रयास करें।",
    "Could not reach the server. Check your connection and try again.": "सर्वर से संपर्क नहीं हो सका। अपना इंटरनेट कनेक्शन जाँचकर फिर प्रयास करें।",
    "The server took too long to answer.": "सर्वर ने उत्तर देने में बहुत अधिक समय लिया।",
    "The catalogue could not be loaded. Reload the page.": "कार्यक्रम-सूची लोड नहीं हो सकी। पृष्ठ फिर से लोड करें।",
    "Something went wrong. Try again.": "कुछ गड़बड़ हो गई। फिर प्रयास करें।",

    # ---- formats ------------------------------------------------------------
    "Heritage walk": "धरोहर भ्रमण",
    "Museum visit": "संग्रहालय भ्रमण",
    "Lecture": "व्याख्यान",
    "Workshop": "कार्यशाला",
    "Course": "पाठ्यक्रम",
    "Field school": "फ़ील्ड स्कूल",
    "Study tour": "अध्ययन यात्रा",
    "One-to-one counselling": "व्यक्तिगत परामर्श",
    "Experience": "अनुभव",
    "Live lecture": "लाइव व्याख्यान",
    "Recorded lecture": "रिकॉर्ड किया गया व्याख्यान",
    "Printed item": "मुद्रित सामग्री",
    "Ships across India": "पूरे भारत में डिलीवरी",
    "On request": "अनुरोध पर",
    "Coming soon": "जल्द आ रहा है",
    "Arranged on request": "अनुरोध पर आयोजित",

    # ---- calls to action -------------------------------------------------------
    "Enquire about this walk": "इस भ्रमण के बारे में पूछें",
    "Enquire about this visit": "इस संग्रहालय भ्रमण के बारे में पूछें",
    "Enquire about this field school": "इस फ़ील्ड स्कूल के बारे में पूछें",
    "Request this lecture": "यह व्याख्यान आयोजित करवाएँ",
    "Request this workshop": "यह कार्यशाला आयोजित करवाएँ",
    "Request this course": "यह पाठ्यक्रम आयोजित करवाएँ",
    "Plan this study tour": "इस अध्ययन यात्रा की योजना बनाएँ",
    "Request a session": "सत्र का अनुरोध करें",
    "Enquire": "पूछताछ करें",
    "Notify me when available": "उपलब्ध होने पर सूचना पाएँ",

    # ---- lengths and places (a fixed list in the catalogue) -------------------
    "1 to 2 days": "1 से 2 दिन",
    "2 to 3 hours": "2 से 3 घंटे",
    "5 to 6 days": "5 से 6 दिन",
    "6 to 7 days": "6 से 7 दिन",
    "6 to 8 days": "6 से 8 दिन",
    "60 to 75 minutes": "60 से 75 मिनट",
    "About 2 hours": "लगभग 2 घंटे",
    "About 3 days": "लगभग 3 दिन",
    "About 3 hours": "लगभग 3 घंटे",
    "About 60 minutes": "लगभग 60 मिनट",
    "About 75 minutes": "लगभग 75 मिनट",
    "About 90 minutes": "लगभग 90 मिनट",
    "About 7 days, plus travel": "लगभग 7 दिन, यात्रा का समय अलग",
    "About ten evening sessions": "शाम के लगभग दस सत्र",
    "As long as you need": "जितना समय आपको चाहिए",
    "Evening sessions, number agreed with you": "शाम के सत्र, संख्या आपके साथ तय की जाती है",
    "Four sessions, about 4.5 hours in all": "चार सत्र, कुल लगभग 4.5 घंटे",
    "Half a day": "आधा दिन",
    "Half a day or a full day": "आधा दिन या पूरा दिन",
    "Six sessions": "छह सत्र",
    "Three evenings, 90 minutes each": "तीन शामें, प्रत्येक 90 मिनट",
    "Three months of weekend sessions": "तीन महीने तक सप्ताहांत सत्र",
    "A Delhi museum chosen with you": "आपके साथ चुना गया दिल्ली का कोई संग्रहालय",
    "A field area agreed with you": "आपके साथ तय किया गया क्षेत्र",
    "A museum or temple near you": "आपके पास का कोई संग्रहालय या मंदिर",
    "Anywhere in India": "भारत में कहीं भी",
    "At a host museum": "किसी मेज़बान संग्रहालय में",
    "Delhi, Agra and Jaipur": "दिल्ली, आगरा और जयपुर",
    "Hauz Khas, Delhi": "हौज़ ख़ास, दिल्ली",
    "Madhya Pradesh": "मध्य प्रदेश",
    "Mehrauli, Delhi": "महरौली, दिल्ली",
    "Online": "ऑनलाइन",
    "Online or at your venue": "ऑनलाइन या आपके परिसर में",
    "Online video call": "ऑनलाइन वीडियो कॉल",
    "Purana Qila, Delhi": "पुराना क़िला, दिल्ली",
    "Rajasthan": "राजस्थान",
    "Your campus": "आपका परिसर",
    "Your campus or collection": "आपका परिसर या संग्रह",
    "Your campus or office": "आपका परिसर या कार्यालय",
    "Your campus or office, or online": "आपका परिसर या कार्यालय, या ऑनलाइन",
    "Your campus, outdoors or in sand trays": "आपका परिसर, खुले में या रेत की ट्रे में",
    "Your museum, archive or office": "आपका संग्रहालय, अभिलेखागार या कार्यालय",
    "Your office or an offsite venue": "आपका कार्यालय या कोई बाहरी स्थान",

    "1 to 1.5 hours": "1 से 1.5 घंटे",
    "1.5 to 2 hours": "1.5 से 2 घंटे",
    "2 to 2.5 hours": "2 से 2.5 घंटे",
    "About 85 minutes": "लगभग 85 मिनट",
    "About 95 minutes": "लगभग 95 मिनट",
    "About 100 minutes": "लगभग 100 मिनट",
    "About 105 minutes": "लगभग 105 मिनट",
    "About 110 minutes": "लगभग 110 मिनट",
    "About 2.5 hours": "लगभग 2.5 घंटे",
    "Four sessions": "चार सत्र",
    "Two days": "दो दिन",
    "Half a day on site": "स्थल पर आधा दिन",
    "Half a day, plus the ferry": "आधा दिन, साथ में फ़ेरी का समय",
    "A full day on site": "स्थल पर पूरा दिन",
    "A full day, with driving": "पूरा दिन, यात्रा सहित",
    "A full day, with transport": "पूरा दिन, वाहन सहित",
    "A full day at the site, plus travel from Delhi": "स्थल पर पूरा दिन, साथ में दिल्ली से यात्रा",
    "About 2 hours at the site, plus travel from Delhi": "स्थल पर लगभग 2 घंटे, साथ में दिल्ली से यात्रा",
    "About 2.5 hours at the site, plus travel from Delhi": "स्थल पर लगभग 2.5 घंटे, साथ में दिल्ली से यात्रा",
    "2 to 3 hours at the site, plus travel from Delhi": "स्थल पर 2 से 3 घंटे, साथ में दिल्ली से यात्रा",
    "2 days, adjusted to you": "2 दिन, आपकी सुविधा अनुसार",
    "3 days, adjusted to you": "3 दिन, आपकी सुविधा अनुसार",
    "4 days, adjusted to you": "4 दिन, आपकी सुविधा अनुसार",
    "5 days, adjusted to you": "5 दिन, आपकी सुविधा अनुसार",
    "6 days, adjusted to you": "6 दिन, आपकी सुविधा अनुसार",
    "Agroha, Haryana": "अग्रोहा, हरियाणा",
    "Ahmedabad and Kachchh, Gujarat": "अहमदाबाद और कच्छ, गुजरात",
    "At a partner venue": "किसी साझेदार स्थान पर",
    "At your school, or online": "आपके विद्यालय में, या ऑनलाइन",
    "Ballimaran, Delhi": "बल्लीमारान, दिल्ली",
    "Begumpur, Delhi": "बेगमपुर, दिल्ली",
    "Bhimbetka and Bhojpur, near Bhopal, Madhya Pradesh": "भीमबेटका और भोजपुर, भोपाल के पास, मध्य प्रदेश",
    "Bhimbetka, Madhya Pradesh": "भीमबेटका, मध्य प्रदेश",
    "Bhojpur, Madhya Pradesh": "भोजपुर, मध्य प्रदेश",
    "Bhopal, Madhya Pradesh": "भोपाल, मध्य प्रदेश",
    "Bhubaneswar, Odisha": "भुवनेश्वर, ओडिशा",
    "Bhuleshwar, Mumbai": "भुलेश्वर, मुंबई",
    "Central Delhi": "मध्य दिल्ली",
    "Chandni Chowk, Delhi": "चाँदनी चौक, दिल्ली",
    "Chennai and Tamil Nadu": "चेन्नई और तमिलनाडु",
    "Connaught Place, Delhi": "कनॉट प्लेस, दिल्ली",
    "Daryaganj, Delhi": "दरियागंज, दिल्ली",
    "Delhi": "दिल्ली",
    "Delhi and Haryana": "दिल्ली और हरियाणा",
    "Delhi, or a city you choose": "दिल्ली, या आपका चुना हुआ शहर",
    "Dholavira, Gujarat": "धोलावीरा, गुजरात",
    "Elephanta, Mumbai": "एलिफेंटा, मुंबई",
    "Fatehpur Sikri, Uttar Pradesh": "फ़तेहपुर सीकरी, उत्तर प्रदेश",
    "Firoz Shah Kotla, Delhi": "फ़िरोज़ शाह कोटला, दिल्ली",
    "Fort, Mumbai": "फ़ोर्ट, मुंबई",
    "Hansi, Haryana": "हाँसी, हरियाणा",
    "Hisar, Haryana": "हिसार, हरियाणा",
    "Jahanpanah, Delhi": "जहाँपनाह, दिल्ली",
    "Jaipur, Rajasthan": "जयपुर, राजस्थान",
    "Kashmere Gate, Delhi": "कश्मीरी गेट, दिल्ली",
    "Khirki, Delhi": "खिड़की, दिल्ली",
    "Konark, Odisha": "कोणार्क, ओडिशा",
    "Lodhi Garden, Delhi": "लोधी गार्डन, दिल्ली",
    "Lodhi Road, Delhi": "लोधी रोड, दिल्ली",
    "Lothal, Gujarat": "लोथल, गुजरात",
    "Mamallapuram, Tamil Nadu": "मामल्लपुरम, तमिलनाडु",
    "Mandu, Madhya Pradesh": "मांडू, मध्य प्रदेश",
    "Mumbai": "मुंबई",
    "Nalanda, Bihar": "नालंदा, बिहार",
    "Nizamuddin, Delhi": "निज़ामुद्दीन, दिल्ली",
    "Old Delhi": "पुरानी दिल्ली",
    "Online or at your campus": "ऑनलाइन या आपके परिसर में",
    "Online, then a neighbourhood near you": "ऑनलाइन, फिर आपके पास का कोई मोहल्ला",
    "Pattadakal and Aihole, Karnataka": "पट्टदकल और ऐहोल, कर्नाटक",
    "Pavagadh, Gujarat": "पावागढ़, गुजरात",
    "Pinjore, Haryana": "पिंजौर, हरियाणा",
    "Raisen, Madhya Pradesh": "रायसेन, मध्य प्रदेश",
    "Rakhigarhi, Hisar district, Haryana": "राखीगढ़ी, हिसार ज़िला, हरियाणा",
    "Roshanara Bagh, Delhi": "रोशनआरा बाग़, दिल्ली",
    "Sanchi and Vidisha, Madhya Pradesh": "साँची और विदिशा, मध्य प्रदेश",
    "Sanchi, Madhya Pradesh": "साँची, मध्य प्रदेश",
    "Sanjay Gandhi National Park, Mumbai": "संजय गांधी राष्ट्रीय उद्यान, मुंबई",
    "Siri Fort, Delhi": "सीरी फ़ोर्ट, दिल्ली",
    "South Mumbai": "दक्षिण मुंबई",
    "Sultan Ghari, Delhi": "सुल्तान गढ़ी, दिल्ली",
    "Sunder Nursery, Delhi": "सुंदर नर्सरी, दिल्ली",
    "Thanesar, Kurukshetra, Haryana": "थानेसर, कुरुक्षेत्र, हरियाणा",
    "Tughlaqabad, Delhi": "तुग़लक़ाबाद, दिल्ली",
    "Udayagiri, Madhya Pradesh": "उदयगिरि, मध्य प्रदेश",
    "Walkeshwar, Mumbai": "वालकेश्वर, मुंबई",

    # ---- sections and carousels (home and shop)
    "Explore the programmes": "कार्यक्रम देखें",
    "Start here": "यहाँ से शुरू करें",
    "See all": "सभी देखें",
    "← All sections": "← सभी खंड",
    "Scroll back": "पीछे जाएँ",
    "Scroll on": "आगे देखें",
    "Upcoming dates": "आने वाली तिथियाँ",
    "Heritage walks in Delhi": "दिल्ली में धरोहर भ्रमण",
    "Study tours and private journeys": "अध्ययन यात्राएँ और निजी यात्राएँ",
    "Walks and visits around India": "भारत भर में भ्रमण",
    "Museum visits": "संग्रहालय भ्रमण",
    "Lectures and masterclasses": "व्याख्यान और मास्टरक्लास",
    "Courses": "पाठ्यक्रम",
    "Workshops": "कार्यशालाएँ",
    "Discussions": "परिचर्चाएँ",
    "Career guidance and counselling": "करियर मार्गदर्शन और परामर्श",
    "Field schools": "फ़ील्ड स्कूल",
    "More programmes": "अन्य कार्यक्रम",
    "Day trips and journeys": "एक दिन की यात्राएँ और लंबी यात्राएँ",
    "Rakhigarhi, study tours and private trips across India, with a specialist.": "राखीगढ़ी, अध्ययन यात्राएँ और भारत भर की निजी यात्राएँ, विशेषज्ञ के साथ।",

    # ---- contact: journeys and visitors from abroad
    "Planning a journey or visiting from abroad": "यात्रा की योजना या विदेश से आगमन",
    'For a day trip, a study tour or a private journey, also tell us where you will start from, how many days you have, the language you would like to be guided in, and the kind of hotel you prefer. Visitors from outside India can write in English or in their own language, and we reply in English. See <a href="journeys.html">TALAASHH journeys</a>.':
        'एक दिन की यात्रा, अध्ययन यात्रा या निजी यात्रा के लिए यह भी बताएँ कि आप कहाँ से शुरू करेंगे, आपके पास कितने दिन हैं, आप किस भाषा में मार्गदर्शन चाहते हैं और किस तरह का होटल पसंद करेंगे। भारत के बाहर से आने वाले यात्री अंग्रेज़ी या अपनी भाषा में लिख सकते हैं, और हम अंग्रेज़ी में उत्तर देते हैं। देखें <a href="journeys.html">TALAASHH यात्राएँ</a>।',

    # ---- new formats, buttons, programme-page sections and the shop's "Where" row
    "Day trip": "एक दिन की यात्रा",
    "Masterclass": "मास्टरक्लास",
    "Career session": "करियर सत्र",
    "Discussion": "परिचर्चा",
    "Private journey": "निजी यात्रा",
    "Plan this day trip": "इस यात्रा की योजना बनाएँ",
    "Request this masterclass": "यह मास्टरक्लास आयोजित करवाएँ",
    "Request this discussion": "यह परिचर्चा आयोजित करवाएँ",
    "Plan this journey": "इस यात्रा की योजना बनाएँ",
    "How the time is spent": "समय कैसे बीतेगा",
    "Day by day": "दिन-प्रतिदिन",
    "Course outline": "पाठ्यक्रम की रूपरेखा",
    "How it is planned": "योजना कैसे बनती है",
    "Timings are a guide. The plan is confirmed with your quotation.": "समय अनुमानित है। योजना आपके कोटेशन के साथ पक्की की जाती है।",
    "Days can be added, removed or reordered. The final itinerary comes with your quotation.": "दिन जोड़े, घटाए या आगे-पीछे किए जा सकते हैं। अंतिम यात्रा-कार्यक्रम आपके कोटेशन के साथ आता है।",
    "The number and length of sessions are agreed with your batch.": "सत्रों की संख्या और अवधि आपके बैच के साथ तय की जाती है।",
    "By the end you can": "अंत तक आप",
    "You take away": "आप साथ ले जाते हैं",
    "Options you can add": "जोड़े जा सकने वाले विकल्प",
    "Good to know": "जानने योग्य बातें",
    "Programmes in this journey": "इस यात्रा के कार्यक्रम",
    "Anywhere": "कहीं भी",
    "Day trips from Delhi": "दिल्ली से एक दिन की यात्राएँ",
    "Around India": "भारत भर में",

    # ---- home ---------------------------------------------------------------
    f"{BRAND} | Heritage walks, courses and counselling": f"{BRAND} | धरोहर भ्रमण, पाठ्यक्रम और परामर्श",
    f"{BRAND}: a team for archaeology, linguistics, anthropology, arts, Sanskrit, history and heritage.":
        f"{BRAND}: पुरातत्व, भाषाविज्ञान, नृविज्ञान, कला, संस्कृत, इतिहास और धरोहर के लिए समर्पित दल।",
    "Study India's past with the people who research it": "भारत के अतीत को उन्हीं से सीखें जो उस पर शोध करते हैं",
    "Explore India's past through heritage walks, hands-on workshops, lectures, courses and study tours led by researchers and subject specialists.":
        "धरोहर भ्रमणों, व्यावहारिक कार्यशालाओं, व्याख्यानों, पाठ्यक्रमों और अध्ययन यात्राओं के माध्यम से भारत के अतीत को जानें, जिनका संचालन शोधकर्ता और विषय-विशेषज्ञ करते हैं।",
    "Help me choose": "चुनने में मदद करें",
    "See everything": "सब देखें",
    "See everything we offer": "हमारी सभी पेशकश देखें",
    "What we offer": "हम क्या प्रदान करते हैं",
    "Monuments, museums, workshops and study tours with an expert beside you.": "विशेषज्ञ के साथ स्मारक, संग्रहालय, कार्यशालाएँ और अध्ययन यात्राएँ।",
    "Online or at your venue, from a single talk to a three-month course.": "ऑनलाइन या आपके परिसर में, एक व्याख्यान से लेकर तीन महीने के पाठ्यक्रम तक।",
    "One-to-one advice on studying and working in heritage.": "धरोहर के क्षेत्र में पढ़ाई और करियर पर व्यक्तिगत सलाह।",
    "Past lectures to watch in your own time.": "पिछले व्याख्यान, जिन्हें आप अपनी सुविधा से देख सकते हैं।",
    "Books, prints and field gear": "पुस्तकें, प्रिंट और फ़ील्ड सामग्री",
    "All books and prints": "सभी पुस्तकें और प्रिंट",
    "How it works": "प्रक्रिया",
    "<strong>Send your request</strong>Choose a programme or describe your own, with your preferred dates, group size and city, by WhatsApp or email.":
        "<strong>अपना अनुरोध भेजें</strong>कोई कार्यक्रम चुनें या अपनी ज़रूरत बताएँ, साथ में पसंदीदा तिथियाँ, समूह का आकार और शहर, WhatsApp या ईमेल से।",
    "<strong>Receive a plan and quotation</strong>We adapt the length, level, language and venue to your group. Study tours include a day-by-day itinerary.":
        "<strong>योजना और कोटेशन पाएँ</strong>हम अवधि, स्तर, भाषा और स्थान को आपके समूह के अनुसार ढालते हैं। अध्ययन यात्राओं के साथ दिन-प्रतिदिन का यात्रा-कार्यक्रम दिया जाता है।",
    "<strong>Confirm</strong>No payment is taken until you approve the plan. The date and the expert are then confirmed.":
        "<strong>पुष्टि करें</strong>योजना को आपकी स्वीकृति मिलने तक कोई भुगतान नहीं लिया जाता। इसके बाद तिथि और विशेषज्ञ की पुष्टि की जाती है।",
    "Made to fit your group": "आपके समूह के अनुरूप",
    "Every programme is a starting point. Tell us who it is for, and we adapt it to your group.":
        "हर कार्यक्रम एक शुरुआत है। बताइए यह किसके लिए है, और हम इसे आपके समूह के अनुसार ढाल देंगे।",
    "<strong>Your level and language</strong>The same subject can be taught to a Class 6 group or a postgraduate department, in English, Hindi or both.":
        "<strong>आपका स्तर और भाषा</strong>एक ही विषय कक्षा 6 के समूह को भी पढ़ाया जा सकता है और स्नातकोत्तर विभाग को भी, अंग्रेज़ी, हिन्दी या दोनों में।",
    "<strong>Your dates and venue</strong>At your campus or office, at a monument, or online; on weekdays, weekends or evenings.":
        "<strong>आपकी तिथियाँ और स्थान</strong>आपके परिसर या कार्यालय में, किसी स्मारक पर, या ऑनलाइन; सप्ताह के दिनों में, सप्ताहांत पर या शाम को।",
    "<strong>Combined programmes</strong>A lecture with a walk, a workshop with a museum visit, or a course with a field trip.":
        "<strong>संयुक्त कार्यक्रम</strong>भ्रमण के साथ व्याख्यान, संग्रहालय भ्रमण के साथ कार्यशाला, या क्षेत्र-यात्रा के साथ पाठ्यक्रम।",
    "<strong>Any group size</strong>Each listing suggests a group size. It is a guide, not a requirement; smaller and larger groups are welcome.":
        "<strong>किसी भी आकार का समूह</strong>हर कार्यक्रम के साथ एक समूह आकार सुझाया गया है। यह केवल मार्गदर्शन है, अनिवार्य नहीं; छोटे और बड़े, दोनों तरह के समूहों का स्वागत है।",
    "<strong>Itinerary before you commit</strong>Study tours and field schools come with a day-by-day itinerary and a quotation, revised until they suit you.":
        "<strong>स्वीकृति से पहले यात्रा-कार्यक्रम</strong>अध्ययन यात्राओं और फ़ील्ड स्कूलों के साथ दिन-प्रतिदिन का यात्रा-कार्यक्रम और कोटेशन दिया जाता है, जिनमें आपकी सुविधा के अनुसार बदलाव किए जाते हैं।",
    "<strong>A single point of contact</strong>One person handles your request, from the first enquiry to the final day.":
        "<strong>संपर्क के लिए एक ही व्यक्ति</strong>पहली पूछताछ से लेकर अंतिम दिन तक, आपका अनुरोध एक ही व्यक्ति सँभालता है।",
    "Programmes for your group": "आपके समूह के लिए कार्यक्रम",
    "Featured session": "विशेष सत्र",
    "Featured": "चुनिंदा",
    "Dates and group size set by you": "तिथियाँ और समूह का आकार आप तय करें",
    "For schools and colleges": "विद्यालयों और महाविद्यालयों के लिए",
    "Sessions are open to anyone. You do not need a background in history to join. Schools and colleges can book lectures, heritage tours and hands-on workshops for their students.":
        "सत्र सभी के लिए खुले हैं। जुड़ने के लिए इतिहास की पृष्ठभूमि आवश्यक नहीं है। विद्यालय और महाविद्यालय अपने विद्यार्थियों के लिए व्याख्यान, धरोहर भ्रमण और व्यावहारिक कार्यशालाएँ बुक कर सकते हैं।",
    '<a href="about.html">Read more about us</a> · <a href="about.html#schools">Programmes for schools</a>':
        '<a href="about.html">हमारे बारे में और पढ़ें</a> · <a href="about.html#schools">विद्यालयों के लिए कार्यक्रम</a>',
    f"About {BRAND}": f"{BRAND} के बारे में",
    "Talaash means search. It also spells out who we are: a Team for Archaeology, Linguistics, Anthropology, Arts, Sanskrit, History and Heritage. We began in 2018 and were registered in 2021, to teach India's past the way it is studied: from inscriptions, texts, monuments and excavated material, with the sources in front of you.":
        "तलाश का अर्थ है खोज। यह नाम यह भी बताता है कि हम कौन हैं: पुरातत्व, भाषाविज्ञान, नृविज्ञान, कला, संस्कृत, इतिहास और धरोहर (Team for Archaeology, Linguistics, Anthropology, Arts, Sanskrit, History and Heritage) के लिए समर्पित दल। हमने 2018 में शुरुआत की और 2021 में पंजीकरण कराया, ताकि भारत के अतीत को उसी तरह पढ़ाया जाए जैसे उसका अध्ययन होता है: अभिलेखों, ग्रंथों, स्मारकों और उत्खनन से मिली सामग्री से, स्रोतों को सामने रखकर।",
    "Lead walks or teach with us": "हमारे साथ भ्रमण कराएँ या पढ़ाएँ",
    "Guides, archaeologists, historians, museum educators and makers can list their own walks, courses, counselling sessions and prints here. We handle bookings and payments and send you your share every week.":
        "गाइड, पुरातत्वविद, इतिहासकार, संग्रहालय शिक्षक और शिल्पकार यहाँ अपने भ्रमण, पाठ्यक्रम, परामर्श सत्र और प्रिंट सूचीबद्ध कर सकते हैं। बुकिंग और भुगतान हम सँभालते हैं और आपका हिस्सा हर सप्ताह आपको भेजते हैं।",
    'Tell us what your group wants to study and we will build it. <a href="contact.html">Contact us</a>.':
        'बताइए आपका समूह क्या पढ़ना चाहता है, हम उसके अनुसार कार्यक्रम तैयार करेंगे। <a href="contact.html">संपर्क करें</a>।',

    # ---- the catalogue ----------------------------------------------------------
    "Everything we offer": "हमारी सभी पेशकश",
    "Heritage walks and experiences": "धरोहर भ्रमण और अनुभव",
    "Recorded lectures": "रिकॉर्ड किए गए व्याख्यान",
    "Filter the shop": "कार्यक्रम छाँटें",
    "Featured programmes": "चुनिंदा कार्यक्रम",
    "All programmes": "सभी कार्यक्रम",
    "Not yet available. Register your interest on any of these and we will let you know when it is ready.":
        "अभी उपलब्ध नहीं। इनमें से किसी में भी अपनी रुचि दर्ज करें, तैयार होते ही हम आपको सूचित करेंगे।",
    "Suitable for": "किसके लिए उपयुक्त",
    "All": "सभी",
    "Schools": "विद्यालय",
    "Colleges and universities": "महाविद्यालय और विश्वविद्यालय",
    "Workplaces": "कार्यस्थल",
    "Individuals and private groups": "व्यक्ति और निजी समूह",
    "Sort by": "क्रम",
    "Date, soonest first": "तिथि, निकटतम पहले",
    "Price, low to high": "शुल्क, कम से अधिक",
    "Price, high to low": "शुल्क, अधिक से कम",
    "Lectures, workshops, heritage walks, courses and study tours in Indian history, archaeology and Indology, each arranged for the group that requests it.":
        "भारतीय इतिहास, पुरातत्व और भारतविद्या में व्याख्यान, कार्यशालाएँ, धरोहर भ्रमण, पाठ्यक्रम और अध्ययन यात्राएँ, हर एक अनुरोध करने वाले समूह के लिए आयोजित।",
    'Almost every programme is arranged for the group that requests it, so prices are quoted rather than fixed. Choose a programme, send your preferred dates and group size, and you will receive a plan and a written quotation before you commit. <a href="about.html#questions">How pricing works</a>':
        'लगभग हर कार्यक्रम अनुरोध करने वाले समूह के लिए आयोजित किया जाता है, इसलिए शुल्क पहले से तय न होकर कोटेशन के रूप में बताया जाता है। कार्यक्रम चुनें, अपनी पसंदीदा तिथियाँ और समूह का आकार भेजें, और स्वीकृति से पहले आपको एक योजना और लिखित कोटेशन मिलेगा। <a href="about.html#questions">शुल्क कैसे तय होता है</a>',
    'Not sure where to start? <a href="finder.html">Answer four questions and we will suggest programmes.</a>':
        'समझ नहीं आ रहा कहाँ से शुरू करें? <a href="finder.html">चार प्रश्नों के उत्तर दें, हम कार्यक्रम सुझाएँगे।</a>',
    "Nothing listed here yet": "यहाँ अभी कुछ सूचीबद्ध नहीं है",
    'Tell us what you are looking for and we will arrange it. <a href="contact.html">Contact us</a> or <a href="shop.html">see everything we offer</a>.':
        'बताइए आप क्या खोज रहे हैं, हम उसकी व्यवस्था करेंगे। <a href="contact.html">संपर्क करें</a> या <a href="shop.html">हमारी सभी पेशकश देखें</a>।',
    f"Heritage walks and experiences, courses, lectures and one-to-one counselling in Indian history, archaeology and Indology from {BRAND}.":
        f"{BRAND} की ओर से भारतीय इतिहास, पुरातत्व और भारतविद्या में धरोहर भ्रमण और अनुभव, पाठ्यक्रम, व्याख्यान और व्यक्तिगत परामर्श।",
    f"Heritage walks and experiences, courses, lectures, counselling, recordings, books and prints from {BRAND}.":
        f"{BRAND} की ओर से धरोहर भ्रमण और अनुभव, पाठ्यक्रम, व्याख्यान, परामर्श, रिकॉर्डिंग, पुस्तकें और प्रिंट।",

    # ---- a programme page -------------------------------------------------------
    f"A walk, course, lecture, counselling session or print from {BRAND}.": f"{BRAND} की ओर से भ्रमण, पाठ्यक्रम, व्याख्यान, परामर्श सत्र या प्रिंट।",
    "<strong>Arranged for your group.</strong> Send your preferred dates, group size and location. We adapt the length, level and language, and prepare a quotation. The suggested group size is a guide, not a requirement.":
        "<strong>आपके समूह के लिए आयोजित।</strong> अपनी पसंदीदा तिथियाँ, समूह का आकार और स्थान भेजें। हम अवधि, स्तर और भाषा को आपके अनुसार ढालते हैं और कोटेशन तैयार करते हैं। सुझाया गया समूह आकार केवल मार्गदर्शन है, अनिवार्य नहीं।",
    "<strong>Arranged for your group.</strong> Send your preferred dates, group size and starting point. We prepare a day-by-day itinerary and a quotation, and revise both until they suit you. The suggested group size is a guide, not a requirement.":
        "<strong>आपके समूह के लिए आयोजित।</strong> अपनी पसंदीदा तिथियाँ, समूह का आकार और यात्रा आरंभ करने का स्थान भेजें। हम दिन-प्रतिदिन का यात्रा-कार्यक्रम और कोटेशन तैयार करते हैं, और आपकी सुविधा के अनुसार दोनों में बदलाव करते हैं। सुझाया गया समूह आकार केवल मार्गदर्शन है, अनिवार्य नहीं।",
    "<strong>Scheduled at a time that suits you.</strong> Share what you would like to discuss and when you are available. We confirm a time and the fee before you commit.":
        "<strong>आपकी सुविधा के समय पर।</strong> बताएँ कि आप किस विषय पर बात करना चाहते हैं और कब उपलब्ध हैं। आपकी स्वीकृति से पहले हम समय और शुल्क की पुष्टि करते हैं।",
    "<strong>Coming soon.</strong> Register your interest and we will let you know as soon as it is available.":
        "<strong>जल्द आ रहा है।</strong> अपनी रुचि दर्ज करें, उपलब्ध होते ही हम आपको सूचित करेंगे।",
    "Request on WhatsApp": "WhatsApp पर अनुरोध भेजें",
    "Request by email": "ईमेल से अनुरोध भेजें",
    "Request a session on WhatsApp": "WhatsApp पर सत्र का अनुरोध करें",
    "Notify me on WhatsApp": "WhatsApp पर सूचना पाएँ",
    "Notify me by email": "ईमेल से सूचना पाएँ",
    "<strong>Scheduled at a time that suits you.</strong> Share what you would like to discuss and when you are available. We confirm a time before you pay.":
        "<strong>आपकी सुविधा के समय पर।</strong> बताएँ कि आप किस विषय पर बात करना चाहते हैं और कब उपलब्ध हैं। भुगतान से पहले हम समय की पुष्टि करते हैं।",
    "<strong>Questions before you book?</strong> Ask us and we help you decide.":
        "<strong>बुकिंग से पहले कोई प्रश्न?</strong> हमसे पूछें, निर्णय लेने में हम आपकी मदद करेंगे।",
    "<strong>Questions before you pay?</strong> We answer on WhatsApp, by email or on the phone.":
        "<strong>भुगतान से पहले कोई प्रश्न?</strong> हम WhatsApp, ईमेल या फ़ोन पर उत्तर देते हैं।",
    "Ask on WhatsApp": "WhatsApp पर पूछें",
    "Share": "साझा करें",
    "Search": "खोजें",
    "Email us": "हमें ईमेल करें",
    "Call +91 7397829282": "फ़ोन करें: +91 7397829282",
    "Payments by card, netbanking and UPI are processed securely by Razorpay.": "कार्ड, नेटबैंकिंग और यूपीआई से भुगतान रेज़रपे के माध्यम से सुरक्षित रूप से होता है।",
    'No payment is taken until you approve the plan. <a href="about.html#questions">Common questions</a>':
        'योजना को आपकी स्वीकृति मिलने तक कोई भुगतान नहीं लिया जाता। <a href="about.html#questions">सामान्य प्रश्न</a>',
    'No payment is taken until you confirm the session. <a href="about.html#questions">Common questions</a>':
        'सत्र की पुष्टि होने तक कोई भुगतान नहीं लिया जाता। <a href="about.html#questions">सामान्य प्रश्न</a>',
    "What it covers": "विषय-वस्तु",
    "For": "किसके लिए",
    "Length": "अवधि",
    "When": "कब",
    "Led by": "संचालन",
    "Language": "भाषा",
    "Group size": "समूह का आकार",
    "Price": "शुल्क",
    "You arrange": "आपकी ओर से",
    "We provide": "हमारी ओर से",
    "You need": "आपको चाहिए",
    "Itinerary": "यात्रा-कार्यक्रम",
    "Travel, stay and meals": "यात्रा, ठहरना और भोजन",
    "Meeting point": "मिलने का स्थान",
    "Entry fees": "प्रवेश शुल्क",
    "What to bring": "साथ क्या लाएँ",
    "Where": "स्थान",
    "Scheduling": "समय-निर्धारण",
    "Length and fee": "अवधि और शुल्क",
    "Size": "आकार",
    "Starts": "आरंभ",
    "Each session": "प्रत्येक सत्र",
    "This listing is not available": "यह कार्यक्रम उपलब्ध नहीं है",
    'It may have been withdrawn, or the link may be incomplete. <a href="shop.html">Browse everything we have</a>.':
        'हो सकता है इसे हटा दिया गया हो, या लिंक अधूरा हो। <a href="shop.html">हमारी सभी पेशकश देखें</a>।',
    "The catalogue did not load": "कार्यक्रम-सूची लोड नहीं हुई",

    # ---- help me choose ------------------------------------------------------------
    f"Answer four short questions and get suggestions from the {BRAND} catalogue, with an enquiry ready to send.":
        f"चार छोटे प्रश्नों के उत्तर दें और {BRAND} की सूची से सुझाव पाएँ, साथ में भेजने के लिए तैयार पूछताछ संदेश।",
    "Answer four short questions. We suggest programmes from our catalogue and prepare an enquiry you can send on WhatsApp or by email.":
        "चार छोटे प्रश्नों के उत्तर दें। हम अपनी सूची से कार्यक्रम सुझाएँगे और एक पूछताछ संदेश तैयार करेंगे, जिसे आप WhatsApp या ईमेल से भेज सकते हैं।",
    "1. Who is it for?": "1. कार्यक्रम किसके लिए है?",
    "2. Where would you like it?": "2. आप इसे कहाँ चाहते हैं?",
    "3. How much time do you have?": "3. आपके पास कितना समय है?",
    "4. What interests the group?": "4. समूह की रुचि किसमें है?",
    "A school class": "विद्यालय की कक्षा",
    "A college or university group": "महाविद्यालय या विश्वविद्यालय का समूह",
    "A workplace team": "कार्यस्थल की टीम",
    "Myself, or a private group": "स्वयं, या कोई निजी समूह",
    "An individual or a private group": "कोई व्यक्ति या निजी समूह",
    "In Delhi, at a monument or museum": "दिल्ली में, किसी स्मारक या संग्रहालय में",
    "At your school, college or office": "आपके विद्यालय, महाविद्यालय या कार्यालय में",
    "A trip of several days": "कई दिनों की यात्रा",
    "Out of town: a day trip or a longer journey": "शहर से बाहर: एक दिन की या उससे लंबी यात्रा",
    "A day trip from Delhi": "दिल्ली से एक दिन की यात्रा",
    "No preference": "कोई वरीयता नहीं",
    "Up to about 2 hours": "लगभग 2 घंटे तक",
    "About half a day": "लगभग आधा दिन",
    "A full day or more": "पूरा दिन या अधिक",
    "Several sessions": "कई सत्र",
    "Monuments and architecture": "स्मारक और स्थापत्य",
    "Archaeology and fieldwork": "पुरातत्व और क्षेत्रकार्य",
    "Prehistory and the first cities": "प्रागितिहास और प्रारंभिक नगर",
    "Scripts, languages and texts": "लिपियाँ, भाषाएँ और ग्रंथ",
    "Art, sculpture and religion": "कला, मूर्तिकला और धर्म",
    "Museums and conservation": "संग्रहालय और संरक्षण",
    "Living traditions and culture": "जीवित परंपराएँ और संस्कृति",
    "Careers and further study": "करियर और उच्च शिक्षा",
    "Choose any that apply, or none.": "जो लागू हों, चुनें, या कोई भी नहीं।",
    "Required. Choose one.": "आवश्यक। कोई एक चुनें।",
    "Back": "पीछे",
    "Next": "आगे",
    "Added to your enquiry below.": "नीचे आपकी पूछताछ में जोड़ा गया।",
    "Show suggestions": "सुझाव देखें",
    "Choose who the programme is for.": "चुनें कि कार्यक्रम किसके लिए है।",
    "Suggested programmes": "सुझाए गए कार्यक्रम",
    "Why it fits:": "यह क्यों उपयुक्त है:",
    "Suits schools": "विद्यालयों के लिए उपयुक्त",
    "Suits colleges and universities": "महाविद्यालयों और विश्वविद्यालयों के लिए उपयुक्त",
    "Suits workplace teams": "कार्यस्थल की टीमों के लिए उपयुक्त",
    "Open to individuals and private groups": "व्यक्तियों और निजी समूहों के लिए",
    "In Delhi": "दिल्ली में",
    "At your venue": "आपके परिसर में",
    "We will design one for you": "हम आपके लिए एक कार्यक्रम तैयार करेंगे",
    "Nothing in the catalogue matches these answers yet, but most of our work is arranged on request. Tell us what you need and we will propose a programme.":
        "हमारी सूची में अभी इन उत्तरों से मेल खाता कोई कार्यक्रम नहीं है, पर हमारा अधिकांश काम अनुरोध पर ही आयोजित होता है। अपनी ज़रूरत बताएँ, हम एक कार्यक्रम प्रस्तावित करेंगे।",
    "Browse every programme": "सभी कार्यक्रम देखें",
    "Send an enquiry": "पूछताछ भेजें",
    "Tick the programmes you are interested in and add a few details. Nothing is booked or charged; we reply with a plan and a quotation.":
        "जिन कार्यक्रमों में आपकी रुचि है उन पर टिक करें और कुछ विवरण जोड़ें। न कुछ बुक होता है, न कोई शुल्क लिया जाता है; हम योजना और कोटेशन के साथ उत्तर देंगे।",
    "Programmes to enquire about": "पूछताछ के लिए कार्यक्रम",
    "Approximate group size": "समूह का अनुमानित आकार",
    "Preferred dates": "पसंदीदा तिथियाँ",
    "For example, a Saturday in November": "उदाहरण के लिए, नवंबर का कोई शनिवार",
    "City or venue": "शहर या स्थान",
    'Anything else <span class="hint">(optional)</span>': 'कुछ और <span class="hint">(वैकल्पिक)</span>',
    "Class or level, language, anything you would like changed": "कक्षा या स्तर, भाषा, या कोई बदलाव जो आप चाहते हैं",
    "Send on WhatsApp": "WhatsApp पर भेजें",
    "Send by email": "ईमेल से भेजें",
    "Tick at least one programme.": "कम से कम एक कार्यक्रम पर टिक करें।",
    "Enquiry": "पूछताछ",
    "Request": "अनुरोध",
    "Notify me": "सूचित करें",

    # ---- contact ------------------------------------------------------------------
    f"How to reach {BRAND} about a lecture, an order or a group booking.": f"व्याख्यान, ऑर्डर या समूह बुकिंग के बारे में {BRAND} से संपर्क कैसे करें।",
    "Our official channels": "हमारे आधिकारिक माध्यम",
    "Contact": "संपर्क",
    "Business name": "संस्था का नाम",
    "Phone and WhatsApp": "फ़ोन और WhatsApp",
    '<a href="https://wa.me/917397829282" rel="noopener">+91 7397829282</a>, Monday to Saturday, 10 am to 6 pm IST':
        '<a href="https://wa.me/917397829282" rel="noopener">+91 7397829282</a>, सोमवार से शनिवार, सुबह 10 बजे से शाम 6 बजे तक (IST)',
    "We reply within two working days, usually sooner.": "हम दो कार्यदिवसों के भीतर, प्रायः उससे पहले, उत्तर देते हैं।",
    f"This website, the email address and WhatsApp number above, and @talaashheritage on Instagram are the only channels {BRAND} uses. Web addresses printed on our older brochures may no longer be ours. We take payment only through these channels. For a programme arranged on request, we ask for it only after you have approved a written plan.":
        f"यह वेबसाइट, ऊपर दिया गया ईमेल पता और WhatsApp नंबर, और Instagram पर @talaashheritage ही {BRAND} के एकमात्र माध्यम हैं। हमारे पुराने ब्रोशरों पर छपे वेब पते अब हमारे न हों, ऐसा संभव है। हम भुगतान केवल इन्हीं माध्यमों से लेते हैं। अनुरोध पर आयोजित कार्यक्रम के लिए भुगतान तभी माँगा जाता है जब आप लिखित योजना स्वीकार कर लें।",
    "Requesting a programme": "कार्यक्रम का अनुरोध",
    "To prepare a quotation, we need five details:": "कोटेशन तैयार करने के लिए हमें पाँच जानकारियाँ चाहिए:",
    'The programme you want from <a href="shop.html">the catalogue</a>, or the subject if it is not listed.':
        'आप <a href="shop.html">हमारी सूची</a> से कौन-सा कार्यक्रम चाहते हैं, या विषय, यदि वह सूची में नहीं है।',
    "Who it is for: a school class, a college department, a workplace team or a private group.":
        "किसके लिए: विद्यालय की कक्षा, महाविद्यालय का विभाग, कार्यस्थल की टीम या कोई निजी समूह।",
    "The approximate number of participants.": "प्रतिभागियों की अनुमानित संख्या।",
    "Your preferred dates.": "आपकी पसंदीदा तिथियाँ।",
    "Your city and venue, or whether it is to be online.": "आपका शहर और स्थान, या यह कि कार्यक्रम ऑनलाइन होगा।",
    "The request buttons on each programme page open WhatsApp or email with these details ready to complete.":
        "हर कार्यक्रम पृष्ठ पर दिए गए अनुरोध बटन WhatsApp या ईमेल खोलते हैं, जिनमें ये बिंदु भरने के लिए पहले से लिखे होते हैं।",
    "About an order": "ऑर्डर के बारे में",
    "Include your order number, which starts with TH. You will find it on your order page and in the payment receipt.":
        "अपना ऑर्डर नंबर लिखें, जो TH से शुरू होता है। यह आपके ऑर्डर पृष्ठ और भुगतान रसीद पर मिलेगा।",
    "About your personal details": "आपके व्यक्तिगत विवरण के बारे में",
    'To see, correct or delete the details you registered with, or to stop announcements, write to the email above from your registered address. See the <a href="privacy.html#your-choices">privacy notice</a>.':
        'अपने पंजीकृत विवरण देखने, सुधारने या हटाने, या घोषणाएँ बंद करवाने के लिए अपने पंजीकृत ईमेल पते से ऊपर दिए गए पते पर लिखें। <a href="privacy.html#your-choices">गोपनीयता सूचना</a> देखें।',
    "Group sizes, pricing, weather and other common questions": "समूह का आकार, शुल्क, मौसम और अन्य सामान्य प्रश्न",

    # ---- cart (the page itself is in English for now) --------------------------
    "Your cart": "आपका कार्ट",
    "Your cart is empty": "आपका कार्ट खाली है",
    "Review the items in your cart.": "अपने कार्ट की वस्तुएँ देखें।",
    "Pick a lecture, a walk or something for your desk.": "कोई व्याख्यान, भ्रमण या अपनी मेज़ के लिए कुछ चुनें।",
    "Browse the shop": "सूची देखें",

    # ---- Our work ------------------------------------------------------------
    "Our work: field projects and research": "हमारा कार्य: क्षेत्र परियोजनाएँ और शोध",
    "Field projects, documentation and teaching by Talaash Heritage since 2018: museum work in Kargil, explorations at Sirpur and Sumerpur, rock art in Hazaribagh, and courses in Prakrit.":
        "2018 से Talaash Heritage की क्षेत्र परियोजनाएँ, प्रलेखन और अध्यापन: कारगिल में संग्रहालय कार्य, सिरपुर और सुमेरपुर में अन्वेषण, हज़ारीबाग में शैलचित्र, और प्राकृत के पाठ्यक्रम।",
    "Since 2018 · Registered 2021": "2018 से · 2021 में पंजीकृत",
    "Talaash Heritage began in 2018, when young professionals from archaeology, linguistics, anthropology, the arts, Sanskrit and history started working together. It was registered in 2021. Our team was in the field before this site existed: exploring sites, documenting collections and rock art, and teaching the languages India's inscriptions are written in.":
        "Talaash Heritage की शुरुआत 2018 में हुई, जब पुरातत्व, भाषाविज्ञान, नृविज्ञान, कला, संस्कृत और इतिहास के युवा पेशेवरों ने साथ मिलकर काम करना शुरू किया। 2021 में इसका पंजीकरण हुआ। यह वेबसाइट बनने से पहले ही हमारा दल क्षेत्र में काम कर रहा था: स्थलों का अन्वेषण, संग्रहों और शैलचित्रों का प्रलेखन, और उन भाषाओं का अध्यापन जिनमें भारत के अभिलेख लिखे गए हैं।",
    "Field projects": "क्षेत्र परियोजनाएँ",
    "Kargil, Ladakh": "कारगिल, लद्दाख",
    "A museum field school": "संग्रहालय क्षेत्र-विद्यालय",
    "Training in museum management, documentation and conservation, carried out alongside the documentation and refurbishment of a museum collection.":
        "संग्रहालय प्रबंधन, प्रलेखन और संरक्षण का प्रशिक्षण, जो एक संग्रहालय संग्रह के प्रलेखन और नवीनीकरण के साथ-साथ किया गया।",
    "Sirpur, Chhattisgarh": "सिरपुर, छत्तीसगढ़",
    "Archaeological and anthropological exploration": "पुरातात्विक और नृवैज्ञानिक अन्वेषण",
    "Archaeological exploration of sites around Sirpur, together with anthropological study of the area.":
        "सिरपुर के आसपास के स्थलों का पुरातात्विक अन्वेषण, साथ में क्षेत्र का नृवैज्ञानिक अध्ययन।",
    "Sumerpur": "सुमेरपुर",
    "Archaeological exploration": "पुरातात्विक अन्वेषण",
    "Exploration to locate and record archaeological sites and material.": "पुरातात्विक स्थलों और सामग्री को खोजने और दर्ज करने के लिए अन्वेषण।",
    "Hazaribagh, Jharkhand": "हज़ारीबाग, झारखंड",
    "Rock art documentation": "शैलचित्र प्रलेखन",
    "Digitisation and documentation of rock art in the Hazaribagh region.": "हज़ारीबाग क्षेत्र के शैलचित्रों का डिजिटलीकरण और प्रलेखन।",
    "Dhanbad and Purulia": "धनबाद और पुरुलिया",
    "Temple documentation": "मंदिर प्रलेखन",
    "Documentation of temples in the Dhanbad and Purulia districts.": "धनबाद और पुरुलिया ज़िलों के मंदिरों का प्रलेखन।",
    "Mithila": "मिथिला",
    "Maithili culture": "मैथिली संस्कृति",
    "Documentation and promotion of Maithili culture.": "मैथिली संस्कृति का प्रलेखन और प्रसार।",
    "Teaching and public programmes": "अध्यापन और सार्वजनिक कार्यक्रम",
    "We have taught a certificate course in Prakrit online, and run a series of public talks and online sessions in 2022 and 2023 on archaeology, anthropology, scripts and heritage.":
        "हमने प्राकृत में ऑनलाइन प्रमाणपत्र पाठ्यक्रम पढ़ाया है, और 2022 और 2023 में पुरातत्व, नृविज्ञान, लिपियों और धरोहर पर सार्वजनिक वार्ताओं और ऑनलाइन सत्रों की शृंखला चलाई है।",
    "Students join us as campus ambassadors and interns, and we advise those who want to study or work in the field. Today the same team runs the <a href=\"shop.html\">lectures, workshops, walks and courses</a> listed on this site, and heritage journeys under our travel name, <a href=\"journeys.html\">TALAASHH</a>.":
        "विद्यार्थी हमारे साथ कैंपस एंबेसडर और इंटर्न के रूप में जुड़ते हैं, और इस क्षेत्र में पढ़ना या काम करना चाहने वालों को हम सलाह देते हैं। आज वही दल इस साइट पर दिए गए <a href=\"shop.html\">व्याख्यान, कार्यशालाएँ, भ्रमण और पाठ्यक्रम</a> चलाता है, और हमारे यात्रा नाम <a href=\"journeys.html\">TALAASHH</a> के अंतर्गत धरोहर यात्राएँ भी।",
    "For museums, archives and institutions": "संग्रहालयों, अभिलेखागारों और संस्थानों के लिए",
    "We help museums, archives and collections, public and private, understand what they hold and look after it.":
        "हम सार्वजनिक और निजी संग्रहालयों, अभिलेखागारों और संग्रहों को यह समझने में मदद करते हैं कि उनके पास क्या है, और उसकी देखभाल कैसे हो।",
    "<strong>Research and documentation</strong>Recording sites, monuments, objects and collections to a consistent standard.":
        "<strong>शोध और प्रलेखन</strong>स्थलों, स्मारकों, वस्तुओं और संग्रहों को एक समान मानक पर दर्ज करना।",
    "<strong>Archives and collections</strong>Cataloguing, collection management and digitisation.":
        "<strong>अभिलेखागार और संग्रह</strong>सूचीकरण, संग्रह प्रबंधन और डिजिटलीकरण।",
    "<strong>Conservation</strong>Condition surveys and preventive conservation, with training for the people who look after a collection.":
        "<strong>संरक्षण</strong>स्थिति सर्वेक्षण और निवारक संरक्षण, साथ में संग्रह की देखभाल करने वालों का प्रशिक्षण।",
    "<strong>Exhibitions and galleries</strong>Planning a new display or refurbishing an old one, from content to layout.":
        "<strong>प्रदर्शनियाँ और दीर्घाएँ</strong>नई प्रदर्शनी की योजना या पुरानी का नवीनीकरण, सामग्री से लेकर संयोजन तक।",
    "<strong>Translation and content</strong>Texts translated between Indian languages and English, and content for publications and media.":
        "<strong>अनुवाद और सामग्री</strong>भारतीय भाषाओं और अंग्रेज़ी के बीच पाठों का अनुवाद, और प्रकाशनों व मीडिया के लिए सामग्री।",
    "<strong>Training</strong>Workshops for staff, students and volunteers, at your institution or online.":
        "<strong>प्रशिक्षण</strong>कर्मचारियों, विद्यार्थियों और स्वयंसेवकों के लिए कार्यशालाएँ, आपके संस्थान में या ऑनलाइन।",
    "Tell us about the collection or site and what you need: <a href=\"mailto:talaashheritage@gmail.com?subject=Work%20with%20Talaash%20Heritage\">talaashheritage@gmail.com</a> or WhatsApp +91 7397829282.":
        "संग्रह या स्थल के बारे में और अपनी ज़रूरत हमें बताएँ: <a href=\"mailto:talaashheritage@gmail.com?subject=Work%20with%20Talaash%20Heritage\">talaashheritage@gmail.com</a> या WhatsApp +91 7397829282।",
    "How we work": "हम कैसे काम करते हैं",
    "We start from the evidence: the inscription, the text, the structure, the excavated material. A session on Aśoka begins with the edicts, and a temple survey begins with a measured plan.":
        "हम साक्ष्य से शुरू करते हैं: अभिलेख, ग्रंथ, संरचना, उत्खनन से मिली सामग्री। अशोक पर सत्र उनके शिलालेखों से शुरू होता है, और मंदिर का सर्वेक्षण नापे हुए नक्शे से।",
    "Records are made to a common standard, so that one site or collection can be compared with another. Material is translated so that it can be read in the region it comes from, and the people who care for a site or a collection are trained to keep the work going.":
        "अभिलेख एक समान मानक पर बनाए जाते हैं, ताकि एक स्थल या संग्रह की तुलना दूसरे से की जा सके। सामग्री का अनुवाद किया जाता है ताकि उसे उसी क्षेत्र में पढ़ा जा सके जहाँ से वह आई है, और स्थल या संग्रह की देखभाल करने वालों को प्रशिक्षित किया जाता है ताकि काम चलता रहे।",

    # ---- TALAASHH journeys ------------------------------------------------------
    "TALAASHH: heritage journeys in India with archaeologists": "TALAASHH: पुरातत्वविदों के साथ भारत की धरोहर यात्राएँ",
    "Small-group heritage journeys in India led by archaeologists and historians: Rakhigarhi, central India, Delhi, Agra and Jaipur, Rajasthan, field experiences and private itineraries for visitors from abroad.":
        "पुरातत्वविदों और इतिहासकारों के नेतृत्व में भारत में छोटे समूहों की धरोहर यात्राएँ: राखीगढ़ी, मध्य भारत, दिल्ली, आगरा और जयपुर, राजस्थान, क्षेत्र-कार्य के अनुभव, और विदेश से आने वालों के लिए निजी यात्रा-योजनाएँ।",
    "<span class=\"brand-mark\">TALAASH<span class=\"hh\">H</span></span> Heritage journeys by Talaash Heritage":
        "<span class=\"brand-mark\">TALAASH<span class=\"hh\">H</span></span> Talaash Heritage की धरोहर यात्राएँ",
    "Travel India's past with the people who study it": "भारत के अतीत की यात्रा, उनके साथ जो उसका अध्ययन करते हैं",
    "Small-group journeys to archaeological sites, temples and historic cities, led by archaeologists and historians. Join a public departure on your own, bring your friends, or have a trip planned for you.":
        "पुरातात्विक स्थलों, मंदिरों और ऐतिहासिक नगरों की छोटे समूहों में यात्राएँ, पुरातत्वविदों और इतिहासकारों के नेतृत्व में। किसी सार्वजनिक यात्रा में अकेले जुड़ें, मित्रों को साथ लाएँ, या अपने लिए यात्रा की योजना बनवाएँ।",
    "Plan a journey on WhatsApp": "WhatsApp पर यात्रा की योजना बनाएँ",
    "Plan by email": "ईमेल से योजना बनाएँ",
    "On this page": "इस पृष्ठ पर",
    "Open walks": "सार्वजनिक भ्रमण",
    "Study tours": "अध्ययन यात्राएँ",
    "Field experiences": "क्षेत्र-कार्य के अनुभव",
    "Private and international": "निजी और अंतरराष्ट्रीय",
    "Public walks in Delhi that anyone can join, on their own or with friends. Each date is listed here with its price and the seats left, and is paid for online.":
        "दिल्ली में सार्वजनिक भ्रमण, जिनमें कोई भी अकेले या मित्रों के साथ जुड़ सकता है। हर तिथि यहाँ उसके शुल्क और बची हुई सीटों के साथ दी जाती है, और भुगतान ऑनलाइन होता है।",
    "The first public dates are being set. <a href=\"https://wa.me/917397829282?text=Hello%20TALAASHH%2C%20please%20tell%20me%20when%20public%20walk%20dates%20open.\" target=\"_blank\" rel=\"noopener\">Ask to be told when they open</a>.":
        "पहली सार्वजनिक तिथियाँ तय की जा रही हैं। <a href=\"https://wa.me/917397829282?text=Hello%20TALAASHH%2C%20please%20tell%20me%20when%20public%20walk%20dates%20open.\" target=\"_blank\" rel=\"noopener\">तिथियाँ खुलने पर सूचना पाने के लिए लिखें</a>।",
    "Planning a walk for a school, a college or your own group? Choose any of <a href=\"shop.html?type=walk\">our walks</a> and set the date yourself.":
        "विद्यालय, महाविद्यालय या अपने समूह के लिए भ्रमण की योजना बना रहे हैं? <a href=\"shop.html?type=walk\">हमारे भ्रमणों</a> में से कोई भी चुनें और तिथि स्वयं तय करें।",
    "All day trips": "सभी एक-दिवसीय यात्राएँ",
    "A Harappan city, Tughlaq forts and Mughal gardens within a day of Delhi. Transport, lunch and the start time are arranged with you.":
        "दिल्ली से एक दिन की दूरी पर एक हड़प्पा नगर, तुग़लक़ किले और मुग़ल उद्यान। वाहन, दोपहर का भोजन और प्रस्थान का समय आपके साथ तय किया जाता है।",
    "From two days among the stupas of Sanchi to a week across Rajasthan's hill forts. Each tour comes with a day-by-day itinerary and a quotation before you commit.":
        "साँची के स्तूपों के बीच दो दिन से लेकर राजस्थान के पहाड़ी किलों में एक सप्ताह तक। हर यात्रा के साथ, आपके निर्णय से पहले, दिन-प्रतिदिन का कार्यक्रम और कोटेशन मिलता है।",
    "Walks around India": "भारत भर में भ्रमण",
    "All of them in the catalogue": "सभी, कैटलॉग में",
    "Single sites and neighbourhoods outside Delhi, led by a specialist and arranged through our partners. Add them to a longer journey or book one on its own.":
        "दिल्ली के बाहर के एकल स्थल और मोहल्ले, किसी विशेषज्ञ के नेतृत्व में और हमारे साझेदारों के माध्यम से आयोजित। इन्हें किसी लंबी यात्रा में जोड़ें या अलग से बुक करें।",
    "Odisha": "ओडिशा",
    "Gujarat": "गुजरात",
    "Uttar Pradesh": "उत्तर प्रदेश",
    "Bihar": "बिहार",
    "Tamil Nadu": "तमिलनाडु",
    "Our field projects": "हमारी क्षेत्र परियोजनाएँ",
    "Spend a few days with a field team: survey a landscape, handle stone tools, or record a museum collection, and learn how the record is made. Where you can join depends on the work under way and the permissions it holds, so tell us your dates and interests.":
        "कुछ दिन किसी क्षेत्र दल के साथ बिताएँ: भूदृश्य का सर्वेक्षण करें, पाषाण औज़ारों को हाथ में लेकर देखें, या किसी संग्रहालय संग्रह को दर्ज करें, और जानें कि अभिलेख कैसे बनता है। आप कहाँ जुड़ सकते हैं, यह चल रहे काम और उसकी अनुमतियों पर निर्भर है, इसलिए हमें अपनी तिथियाँ और रुचियाँ बताएँ।",
    "Ask about a field experience on WhatsApp": "क्षेत्र-कार्य के अनुभव के बारे में WhatsApp पर पूछें",
    "Private and international journeys": "निजी और अंतरराष्ट्रीय यात्राएँ",
    "Visiting India from abroad? Every programme on this site is open to you, and any journey can be built around your dates, interests and pace.":
        "विदेश से भारत आ रहे हैं? इस साइट का हर कार्यक्रम आपके लिए खुला है, और कोई भी यात्रा आपकी तिथियों, रुचियों और गति के अनुसार बनाई जा सकती है।",
    "Every journey includes": "हर यात्रा में शामिल",
    "<strong>In your language</strong>Through our partners, guides can work in the language you are most comfortable in. The language and the specialist are confirmed in your quotation.":
        "<strong>आपकी भाषा में</strong>हमारे साझेदारों के माध्यम से गाइड उस भाषा में काम कर सकते हैं जिसमें आप सबसे सहज हैं। भाषा और विशेषज्ञ आपके कोटेशन में पक्के किए जाते हैं।",
    "<strong>A plan before you commit</strong>A day-by-day itinerary and a quotation that states what is covered and what is not, revised until it suits you.":
        "<strong>निर्णय से पहले योजना</strong>दिन-प्रतिदिन का कार्यक्रम और कोटेशन, जिसमें लिखा हो कि क्या शामिल है और क्या नहीं, आपके अनुकूल होने तक संशोधित।",
    "<strong>Your pace and budget</strong>Hotels, transport and the length of each day are arranged to suit you.":
        "<strong>आपकी गति और बजट</strong>होटल, वाहन और हर दिन की अवधि आपके अनुसार तय की जाती है।",
    "<strong>Any group size</strong>From one traveller to a university department.":
        "<strong>समूह किसी भी आकार का</strong>एक यात्री से लेकर विश्वविद्यालय के पूरे विभाग तक।",
    "Plan my trip on WhatsApp": "WhatsApp पर मेरी यात्रा की योजना बनाएँ",
    "How a journey works": "यात्रा कैसे तय होती है",
    "<strong>Tell us</strong>Where you would like to go, when, how many of you, and anything you want to see or avoid.":
        "<strong>हमें बताएँ</strong>आप कहाँ जाना चाहते हैं, कब, कितने लोग हैं, और क्या देखना या छोड़ना चाहते हैं।",
    "<strong>Receive an itinerary and quotation</strong>A day-by-day plan with the specialist who will lead it, and a price that states what is included.":
        "<strong>कार्यक्रम और कोटेशन पाएँ</strong>दिन-प्रतिदिन की योजना, उसका नेतृत्व करने वाले विशेषज्ञ के साथ, और एक मूल्य जिसमें लिखा हो कि क्या शामिल है।",
    "<strong>Confirm</strong>No payment is taken until you approve the plan.":
        "<strong>पुष्टि करें</strong>योजना स्वीकार करने तक कोई भुगतान नहीं लिया जाता।",
    "TALAASH<span class=\"hh\">H</span> is the travel name of Talaash Heritage. <a href=\"about.html#questions\">Common questions</a>":
        "TALAASH<span class=\"hh\">H</span>, Talaash Heritage का यात्रा नाम है। <a href=\"about.html#questions\">सामान्य प्रश्न</a>",
    # ---- page not found -------------------------------------------------------------
    "Lost in the mists of time": "समय की धुंध में खो गया",
    "Nothing at this address": "इस पते पर कुछ नहीं है",
    "That page does not exist.": "वह पृष्ठ मौजूद नहीं है।",
    "The page may have moved, or the link is incomplete.": "पृष्ठ शायद कहीं और चला गया है, या लिंक अधूरा है।",
    "Go to the home page": "मुखपृष्ठ पर जाएँ",
    "Page not found": "पृष्ठ नहीं मिला",
}

# Strings built by the scripts from the pieces above. Written in JavaScript
# because they take values; each returns undefined when it cannot translate
# every piece, so a half-Hindi sentence is never shown.
PATTERNS_JS = r"""
const ENTER = {
  "your full name": "अपना पूरा नाम",
  "a valid email address": "सही ईमेल पता",
  "a 10-digit mobile number": "10 अंकों का मोबाइल नंबर",
  "a valid phone number": "सही फ़ोन नंबर",
  "your city": "अपना शहर",
  "your country": "अपना देश",
  "your country (your phone number is from outside India)": "अपना देश (आपका फ़ोन नंबर भारत के बाहर का है)",
};
const AUDIENCE = {
  schools: "विद्यालयों",
  "colleges and universities": "महाविद्यालयों और विश्वविद्यालयों",
  workplaces: "कार्यस्थलों",
  "individuals and private groups": "व्यक्तियों और निजी समूहों",
};
const COUNT = [
  [/^(\d+) arranged on request$/, (n) => `${n} अनुरोध पर आयोजित`],
  [/^(\d+) available to book$/, (n) => `${n} बुकिंग के लिए उपलब्ध`],
  [/^(\d+) coming soon$/, (n) => `${n} जल्द उपलब्ध`],
];
function counts(list) {
  const out = list.split(", ").map((part) => {
    for (const [re, fn] of COUNT) {
      const m = part.match(re);
      if (m) return fn(m[1]);
    }
    return undefined;
  });
  return out.every(Boolean) ? out.join(", ") : undefined;
}
const PER = { group: "प्रति समूह", session: "प्रति सत्र", learner: "प्रति प्रतिभागी", person: "प्रति व्यक्ति", participant: "प्रति प्रतिभागी" };
// Prices on cards: "From ₹9,000 per group" -> "₹9,000 से, प्रति समूह"
const price = (s) => {
  const m = s !== undefined && s.match(/^From (₹[\d,]+) per (group|session|learner|person|participant)$/);
  return m ? `${m[1]} से, ${PER[m[2]]}` : undefined;
};
const whole = (s) => (s !== undefined && text[s] !== undefined ? text[s] : price(s));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const patterns = [
  // Page titles: "Contact | Talaash Heritage"
  [/^(.+) \| Talaash Heritage$/, (a) => (whole(a) ? `${whole(a)} | Talaash Heritage` : undefined)],
  // Registration and form errors: "Enter your full name, your city."
  [/^Enter (.+)\.$/, (list) => {
    const parts = list.split(", ").map((p) => ENTER[p]);
    return parts.every(Boolean) ? `कृपया लिखें: ${parts.join(", ")}।` : undefined;
  }],
  [/^Registered as (.+)$/, (email) => `${email} से पंजीकृत`],
  [/^Registered\. Welcome, (.+)\.$/, (name) => `पंजीकरण हो गया। स्वागत है, ${name}।`],
  // Catalogue counts: "Suitable for schools: 13 arranged on request, 1 coming soon."
  [/^Suitable for (.+): (.+)\.$/, (who, list) => (AUDIENCE[who] && counts(list) ? `${AUDIENCE[who]} के लिए उपयुक्त: ${counts(list)}।` : undefined)],
  [/^(\d+ [^:]+)\.$/, (list) => (counts(list) ? `${counts(list)}।` : undefined)],
  // Joined pieces: "Heritage walk · On request", "About 3 hours · Mehrauli, Delhi"
  [/^(.+ · .+)$/, (s) => {
    const parts = s.split(" · ").map(whole);
    return parts.every((p) => p !== undefined) ? parts.join(" · ") : undefined;
  }],
  // "Heritage walk, about 3 hours" on the home page
  [/^([^,]+), (.+)$/, (a, b) => (whole(a) && whole(cap(b)) ? `${whole(a)}, ${whole(cap(b))}` : undefined)],
];
"""

TAG = re.compile(r"<[^>]+>")


def check(text):
    problems = []
    for en, hi in text.items():
        if en != " ".join(en.split()):
            problems.append(f"key has extra whitespace: {en!r}")
        if TAG.findall(en) != TAG.findall(hi):
            problems.append(f"markup differs:\n  {en}\n  {hi}")
        if re.search(r"[A-Za-z]{3,}", TAG.sub("", hi)) and not re.search(r"Talaash|TALAASHH|WhatsApp|IST|Instagram|TH|PIN|Team for", hi):
            problems.append(f"English left in the Hindi: {hi}")
        if not re.search(r"[ऀ-ॿ]", hi):
            problems.append(f"no Hindi in: {hi}")
    return problems


def main():
    problems = check(TEXT)
    if problems:
        print("\n".join(problems))
        sys.exit(1)
    out = Path(__file__).resolve().parent.parent / "site/assets/js/hi.js"
    body = json.dumps(TEXT, ensure_ascii=False, indent=1, sort_keys=True)
    out.write_text(
        "// Generated by tools/build_hindi.py. Edit the translations there, not here.\n"
        f"const text = {body};\n"
        f"{PATTERNS_JS.strip()}\n\n"
        "export const HI = { text, patterns };\n",
        encoding="utf-8",
    )
    print(f"{len(TEXT)} strings written to {out}")


if __name__ == "__main__":
    main()
