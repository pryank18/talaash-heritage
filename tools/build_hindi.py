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
    "Walks and experiences": "भ्रमण और अनुभव",
    "Courses and lectures": "पाठ्यक्रम और व्याख्यान",
    "Counselling": "परामर्श",
    "Everything": "सब कुछ",
    "About": "हमारे बारे में",
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
    "Talaash means search. It also spells out who we are: a Team for Archaeology, Linguistics, Anthropology, Arts, Sanskrit, History and Heritage. We started in 2021 to teach India's past the way it is studied: from inscriptions, texts, monuments and excavated material, with the sources in front of you.":
        "तलाश का अर्थ है खोज। यह नाम यह भी बताता है कि हम कौन हैं: पुरातत्व, भाषाविज्ञान, नृविज्ञान, कला, संस्कृत, इतिहास और धरोहर (Team for Archaeology, Linguistics, Anthropology, Arts, Sanskrit, History and Heritage) के लिए समर्पित दल। हमने 2021 में शुरुआत की, ताकि भारत के अतीत को उसी तरह पढ़ाया जाए जैसे उसका अध्ययन होता है: अभिलेखों, ग्रंथों, स्मारकों और उत्खनन से मिली सामग्री से, स्रोतों को सामने रखकर।",
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
const whole = (s) => (s !== undefined && text[s] !== undefined ? text[s] : undefined);
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
        if re.search(r"[A-Za-z]{3,}", TAG.sub("", hi)) and not re.search(r"Talaash|WhatsApp|IST|Instagram|TH|PIN|Team for", hi):
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
