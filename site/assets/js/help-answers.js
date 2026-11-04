// The fixed answers shown in the help panel, and used word for word by the site assistant
// (functions/api/assist.ts) for payment and refund questions. Change a policy here and both follow.
// No browser-only code in this file: the server imports it too.

export const ANSWERS = {
  en: [
    ["How do I pay?",
      "By card, netbanking or UPI through Razorpay, and your booking is confirmed at once. You can also pay by UPI directly, or send the order on WhatsApp and pay when we reply. All prices include GST, and a GST invoice is issued on request."],
    ["Can I cancel or change my booking?",
      `Lectures, courses and career courses: full refund if you cancel 48 hours or more before the start. Heritage walks and experiences: full refund 72 hours or more before. One-to-one counselling: move your slot free up to 24 hours before. If we cancel, you choose a new date or a full refund. <a href="shipping-returns.html">Full policy</a>.`],
    ["How do online sessions work?",
      "They are live, so you can ask questions as you go. Once your payment is confirmed, the joining link appears on your order page. For career courses, a calendar invitation with the link also reaches your email within an hour. If you cannot find it, message us."],
    ["Can you arrange this for my school, college or company?",
      "Yes. Walks, lectures, workshops and trips can be arranged for your group on your dates. Schools get a per-student rate on walks, workshops and day trips. Send your group size, dates and city, and we reply with a plan and a quotation. You pay nothing until you approve it."],
    ["Which programme suits me?",
      `Answer a few quick questions and the <a href="finder.html">programme finder</a> suggests the right walk, course or trip. Or tell us on WhatsApp what you are looking for.`],
    ["Which language are sessions in?",
      "Programmes arranged for your group are taught in English or Hindi, as you prefer. For dated courses, the language is listed on the programme page."],
    ["Who teaches?",
      `The Talaash Heritage team of archaeologists and historians. Career courses are taught by <a href="archaeologywala.html">@archaeologywala</a>, an archaeologist trained at Deccan College, Pune.`],
  ],
  hi: [
    ["भुगतान कैसे करें?",
      "Razorpay के माध्यम से कार्ड, नेटबैंकिंग या UPI से भुगतान करें, आपकी बुकिंग तुरंत पक्की हो जाती है। आप सीधे UPI से भी भुगतान कर सकते हैं, या WhatsApp पर ऑर्डर भेजकर हमारे उत्तर के बाद भुगतान कर सकते हैं। सभी मूल्यों में GST शामिल है, और माँगने पर GST बिल दिया जाता है।"],
    ["क्या मैं बुकिंग रद्द या बदल सकता हूँ?",
      `व्याख्यान, पाठ्यक्रम और करियर पाठ्यक्रम: आरंभ से 48 घंटे या उससे पहले रद्द करने पर पूरी राशि वापस। धरोहर भ्रमण और अनुभव: 72 घंटे या उससे पहले रद्द करने पर पूरी राशि वापस। व्यक्तिगत परामर्श: 24 घंटे पहले तक समय निःशुल्क बदलें। यदि हम कार्यक्रम रद्द करें, तो आप नई तिथि या पूरी राशि वापसी चुन सकते हैं। <a href="shipping-returns.html">पूरी नीति</a>।`],
    ["ऑनलाइन सत्र कैसे होते हैं?",
      "सत्र लाइव होते हैं, इसलिए आप बीच में प्रश्न पूछ सकते हैं। भुगतान की पुष्टि होते ही जुड़ने का लिंक आपके ऑर्डर पृष्ठ पर दिखता है। करियर पाठ्यक्रमों के लिए, लिंक सहित कैलेंडर निमंत्रण भी एक घंटे के भीतर आपके ईमेल पर आता है। लिंक न मिले, तो हमें संदेश भेजें।"],
    ["क्या आप इसे मेरे विद्यालय, महाविद्यालय या कंपनी के लिए आयोजित कर सकते हैं?",
      "हाँ। भ्रमण, व्याख्यान, कार्यशालाएँ और यात्राएँ आपकी तिथियों पर आपके समूह के लिए आयोजित की जा सकती हैं। भ्रमण, कार्यशालाओं और एक दिन की यात्राओं पर विद्यालयों के लिए प्रति विद्यार्थी दर है। समूह का आकार, तिथियाँ और शहर भेजें, हम योजना और कोटेशन भेजेंगे। आपकी स्वीकृति तक कोई भुगतान नहीं।"],
    ["मेरे लिए कौन सा कार्यक्रम सही है?",
      `कुछ आसान प्रश्नों के उत्तर दें, <a href="finder.html">कार्यक्रम खोजक</a> आपके लिए सही भ्रमण, पाठ्यक्रम या यात्रा सुझाएगा। या WhatsApp पर बताएँ कि आप क्या खोज रहे हैं।`],
    ["सत्र किस भाषा में होते हैं?",
      "आपके समूह के लिए आयोजित कार्यक्रम अंग्रेज़ी या हिन्दी में, आपकी पसंद के अनुसार होते हैं। निश्चित तिथि वाले पाठ्यक्रमों की भाषा कार्यक्रम के पृष्ठ पर दी गई है।"],
    ["कौन पढ़ाता है?",
      `Talaash Heritage के पुरातत्वविदों और इतिहासकारों की टीम। करियर पाठ्यक्रम <a href="archaeologywala.html">@archaeologywala</a> पढ़ाते हैं, जिन्होंने डेक्कन कॉलेज, पुणे से पुरातत्व की शिक्षा ली है।`],
  ],
};
