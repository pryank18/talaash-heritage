"""Builds site/data/catalogue.json: Talaash Heritage's on-request programmes,
plus how the existing database listings are shown (hidden, or enquiry-only).
Run: python3 build_catalogue.py <path to site/data/catalogue.json>
"""
import json, re, sys, unicodedata

LANG = "English, Hindi or both"

# Second paragraph of every description: how the programme bends to the group.
FLEX = {
    "lecture": "Length, level and language are set with you. It runs online or at your venue, for a class, a department or a whole team.",
    "workshop": "We bring the materials and fit the session to your space, your timetable and the age of the group.",
    "walk": "Give us your date and your group, and we set the start time, the pace and the language to suit.",
    "visit": "Give us your date and your group, and we choose the gallery, the pace and the language to suit.",
    "course": "We run it for your batch on dates you choose. Timing, pace and assessment are agreed before it starts.",
    "field": "Dates, location and syllabus are agreed with your institution. You receive a day-by-day plan and a quotation before you commit.",
    "tour": "You receive a day-by-day itinerary and a quotation before you commit. Route, pace, stay and budget are adjusted until they suit your group.",
}
KIND = {"lecture": "Lecture", "workshop": "Workshop", "walk": "Heritage walk", "visit": "Museum visit", "course": "Course", "field": "Field school", "tour": "Study tour"}
TYPE = {"lecture": "live", "workshop": "experience", "walk": "walk", "visit": "experience", "course": "course", "field": "experience", "tour": "experience"}
BASE = {"walk": 100, "visit": 100, "lecture": 200, "workshop": 300, "course": 400, "field": 500, "tour": 500}

# f, title, subtitle, description, audiences, length, where, led by, suggested group, extra tags
P = [
 ("walk", "Mehrauli Archaeological Park", "A thousand years of building in one walk", "From Rajon ki Baoli to Balban's tomb and Jamali Kamali, the park holds remains from the eleventh century to the British period. An archaeologist shows you how to tell one period's masonry and arches from another's.", "Schools, colleges, companies and the public", "About 3 hours", "Mehrauli, Delhi", "An archaeologist", 10, ["featured"]),
 ("walk", "The Qutb complex", "Reading a World Heritage Site stone by stone", "The Qutb Minar stands beside a mosque built with reused temple pillars, an iron pillar of the Gupta period, and the Alai Darwaza of 1311. We read the inscriptions and the joints in the masonry to follow how the complex grew.", "Schools, colleges, companies and the public", "2 to 3 hours", "Mehrauli, Delhi", "An archaeologist", 10, ["home"]),
 ("walk", "Purana Qila", "A sixteenth-century fort and the dig beneath it", "Humayun and Sher Shah built the fort. Archaeologists have excavated inside it several times since the 1950s and found settlement going back more than two thousand years. We walk the walls and look at what came out of the trenches.", "Schools, colleges and the public", "2 to 3 hours", "Purana Qila, Delhi", "An archaeologist", 10, []),
 ("walk", "Hauz Khas", "A medieval college beside a royal reservoir", "Alauddin Khalji dug the reservoir for his city of Siri. Firoz Shah Tughlaq later built a madrasa along its edge and his own tomb at the corner. The walk covers how the college worked and how to recognise Tughlaq building.", "Schools, colleges, companies and the public", "About 2 hours", "Hauz Khas, Delhi", "A historian", 10, []),
 ("visit", "Museum morning with an archaeologist", "One gallery, looked at properly", "Most visitors pass a thousand objects in an hour and remember none. We choose one gallery with you and spend the morning on a dozen objects: what each is, how it was made and found, and what it tells us.", "Schools, colleges, companies and the public", "About 3 hours", "A Delhi museum chosen with you", "An archaeologist", 10, []),

 ("lecture", "Culture and heritage: what we inherit and why it matters", "An illustrated talk for students and teams new to the subject", "What counts as culture, what counts as heritage, and how the two differ. We work through tangible and intangible heritage with Indian examples, then look at who protects it: UNESCO, the Archaeological Survey of India, and the people who live beside a monument.", "Schools, colleges and companies", "About 75 minutes", "Online or at your venue", "A heritage educator", 25, ["home"]),
 ("lecture", "What archaeologists actually do", "How a site is found, dug, recorded and looked after", "From the first survey to the museum shelf. Students see how a site is located, how a trench is laid out and recorded, what happens to finds in the laboratory, and what becomes of a site once the dig is over.", "Schools and colleges", "60 to 75 minutes", "Online or at your venue", "A field archaeologist", 25, []),
 ("lecture", "From stone tools to the first villages", "Human origins and the Stone Age in South Asia", "How early people lived in the subcontinent, told through the tools they left behind. We follow the story from handaxes to microliths to the first farming settlements, using photographs of real finds.", "Schools and colleges", "60 to 75 minutes", "Online or at your venue", "A prehistorian", 25, []),
 ("lecture", "The first cities: Harappa among the early civilisations", "Mesopotamia, Egypt, China and the Indus compared", "What made a city more than four thousand years ago: planning, drains, weights, seals and trade. We set the Harappan cities beside Mesopotamia, Egypt and early China, so students see what the four shared and what belonged to the Indus world alone.", "Schools and colleges", "60 to 75 minutes", "Online or at your venue", "An archaeologist", 25, []),
 ("lecture", "Reading India's scripts: Brāhmī to Śāradā", "A lecture and demonstration with real inscriptions", "Most scripts used in India today descend from Brāhmī, the script of Aśoka's edicts. We trace that family on screen, read a line of an edict together, and show how epigraphists date an inscription from the shape of its letters.", "Colleges, schools and the public", "About 90 minutes", "Online or at your venue", "An epigraphist", 25, []),
 ("lecture", "How to read a temple", "Nāgara, Drāviḍa and Vesara in one evening", "A plan, an elevation and a handful of terms are enough to start reading a temple. We compare the northern, southern and Deccan traditions with photographs and drawings, so the next temple you visit makes sense from the gateway to the sanctum.", "Colleges, companies and the public", "About 90 minutes", "Online or at your venue", "An art historian", 25, []),
 ("lecture", "India's linguistic heritage", "The language families of the subcontinent and how they met", "India's languages belong to several families that have borrowed from one another for thousands of years. This talk maps them, explains how linguists reconstruct their history, and looks at what is lost when a language stops being spoken.", "Schools, colleges and companies", "60 to 75 minutes", "Online or at your venue", "A linguist", 25, []),
 ("lecture", "Rock art of India", "Painted shelters and engraved rocks, and how they are recorded", "From the painted shelters of Bhimbetka to the engravings of the Konkan coast, India is rich in rock art. We look at what the images show, how they are dated, and how researchers document them before they fade.", "Schools, colleges and the public", "60 to 75 minutes", "Online or at your venue", "A rock art researcher", 25, []),
 ("lecture", "The goddess in text and image: the Devīmāhātmya", "The text behind Navarātri", "The Devīmāhātmya is the best-known Sanskrit text on the Goddess and is still recited every Navarātri. We read key passages in translation and set them beside sculpture and painting to see how the Śākta tradition took shape.", "Colleges and the public", "About 90 minutes", "Online or at your venue", "An Indologist", 25, []),
 ("lecture", "Careers in archaeology, museums and heritage", "A group session for students choosing what to study", "What the work is, which degrees lead to it, and where the jobs are. Students leave with a map of courses, entrance routes and first steps, and there is time for their own questions.", "Schools and colleges", "About 60 minutes", "Online or at your venue", "A Talaash Heritage counsellor", 25, []),

 ("workshop", "Mock trench: a practice excavation", "Students dig, record and interpret a prepared trench", "We build a trench with layers and planted finds. Students excavate with real tools, record what they find and where, and then argue out what happened at the site.", "Schools and colleges", "About 3 hours", "Your campus, outdoors or in sand trays", "A field archaeologist", 20, ["home"]),
 ("workshop", "Clay and the past: a pottery workshop", "Make a pot, then learn to read one", "Pottery is the most common find on an excavation. Participants shape clay by hand, then sort replica sherds the way archaeologists do: by fabric, form and decoration.", "Schools, colleges and companies", "2 to 3 hours", "Your campus or office", "An archaeologist, with a potter", 20, []),
 ("workshop", "Reading sculpture", "A talk, a gallery or temple visit, and a quiz", "Who is this figure, and how do we know? After a short illustrated talk, students study sculpture in a museum gallery or at a temple, identify figures from what they hold and wear, and finish with a quiz.", "Schools and colleges", "Half a day", "A museum or temple near you", "An art historian", 20, []),
 ("workshop", "Write like Aśoka's scribes: a Brāhmī workshop", "Learn the letters and write your own name", "Brāhmī is more than two thousand years old and simple enough to begin in an afternoon. Participants learn the letters, write their names, and read a few words from a real edict.", "Schools, colleges, companies and the public", "About 2 hours", "Your campus or office, or online", "An epigraphist", 20, ["home"]),
 ("workshop", "Recording the past: a documentation workshop", "How to record a site and an object properly", "A find without a record is only an old object. Participants fill in a context sheet, draw and photograph an object to scale, and write a catalogue entry, using the formats we use in our own projects.", "Colleges, museums and archives", "Half a day or a full day", "Your campus or collection", "A documentation specialist", 20, []),
 ("workshop", "Caring for collections: preventive conservation basics", "Paper, textiles and metal, for anyone who looks after old things", "Most damage to a collection comes from light, damp, pests and handling, and most of it can be prevented cheaply. A conservator shows how to assess, store and handle paper, textiles and metal, with practice on sample materials.", "Colleges, museums, archives and company collections", "1 to 2 days", "Your museum, archive or office", "A conservator", 20, []),
 ("workshop", "Stone tools up close", "How early tools were made, used and classified", "A prehistorian demonstrates how stone tools were struck and what the scars on them mean. Participants sort tool types, handle replicas and learn the first steps of lithic analysis.", "Colleges and senior school students", "2 to 3 hours", "Your campus", "A prehistorian", 20, []),
 ("workshop", "The dig: an archaeology team challenge", "A half-day team activity for workplaces", "Teams compete to excavate, record and interpret a prepared trench, then present their reading of the evidence. It rewards careful observation and clear reporting more than speed.", "Companies and organisations", "About 3 hours", "Your office or an offsite venue", "A field archaeologist", 20, []),

 ("course", "Prakrit: a first course", "Read the language of India's earliest inscriptions", "Prakrit was the everyday speech of much of ancient India and the language of Aśoka's edicts. The course covers the basics of grammar and guided reading of short passages.", "Colleges, study circles and the public", "Six sessions", "Online", "A Prakrit scholar", 15, []),
 ("course", "Pali: a first course", "Begin reading the language of the Theravāda Buddhist canon", "The course covers pronunciation, basic grammar and the reading of short passages, and ends with a test for those who want one.", "Colleges, study circles and the public", "Evening sessions, number agreed with you", "Online", "A Pali scholar", 15, []),
 ("course", "Śāradā script", "Learn to read the script of Kashmir's manuscripts", "Participants learn the alphabet, conjuncts and numerals, practise transliteration, and read from manuscript pages.", "Colleges, study circles and the public", "About ten evening sessions", "Online", "A manuscript scholar", 15, []),
 ("course", "Understanding Indian temple architecture", "Four evenings on temple forms and how they developed", "A basic introduction: the parts of a temple, the regional styles and their antiquity, and the ways scholars approach architecture. A certificate of completion can be issued.", "Colleges, study circles and the public", "Four sessions, about 4.5 hours in all", "Online", "An art historian", 15, ["home"]),
 ("course", "Remote sensing in archaeology and heritage management", "A three-month certificate course", "How satellite images, aerial photographs and mapping software are used to find, map and monitor sites. Live weekend sessions, with recordings for anyone who misses one.", "Colleges, departments and working professionals", "Three months of weekend sessions", "Online", "A remote sensing specialist", 15, []),
 ("course", "Martial arts and society", "Three evenings on wrestling, combat and culture in Indian history", "What sculpture, texts and living traditions tell us about wrestling and combat sports in India, and what they meant to the people who practised and paid for them.", "Colleges, study circles and the public", "Three evenings, 90 minutes each", "Online", "A historian of sport", 15, []),

 ("field", "Museum field school: documentation and conservation", "A week of supervised work on a real collection", "Participants document, clean and rehouse objects from a museum collection under conservators and documentation specialists, with daily laboratory sessions, lectures and visits to nearby sites. It suits students of conservation, museology, archaeology and related fields.", "Colleges and university departments", "About 7 days, plus travel", "At a host museum", "Conservators and documentation specialists", 35, []),
 ("field", "Prehistory field workshop", "Three days of survey, stone tools, rock art and megaliths", "A field introduction to prehistory: reading the local landscape, finding and classifying stone tools, documenting rock art and megaliths, and taking samples.", "Colleges and university departments", "About 3 days", "A field area agreed with you", "Prehistorians", 25, []),
 ("tour", "Three capitals: Delhi, Agra and Jaipur", "The Golden Triangle as a study tour", "An archaeologist travels with the group and uses Delhi's Sultanate monuments, Mughal Agra and Fatehpur Sikri, and eighteenth-century Jaipur to show how three courts built their capitals.", "Schools, colleges, companies and the public", "5 to 6 days", "Delhi, Agra and Jaipur", "An archaeologist", 12, ["home"]),
 ("tour", "Forts of Rajasthan", "A study tour of the hill forts and the states that built them", "Six of Rajasthan's hill forts are on the World Heritage list. The tour covers how the forts were sited, supplied with water and defended, with a historian travelling alongside.", "Schools, colleges and the public", "6 to 8 days", "Rajasthan", "A historian", 12, []),
 ("tour", "Stupas, caves and temples of central India", "Sanchi, Udayagiri, Bhimbetka and Khajuraho", "Four sites in Madhya Pradesh that cover rock art, early Buddhist architecture, Gupta sculpture and the medieval temple at its height. An archaeologist leads, and reading is sent in advance.", "Colleges and the public", "6 to 7 days", "Madhya Pradesh", "An archaeologist", 12, []),
 ("tour", "A study tour built for your group", "Tell us the region and the syllabus", "For schools, colleges and societies that want another region: Gujarat, Odisha, Varanasi and Sarnath, the Deccan or the south. We design the route around what your group is studying and send an expert in that period.", "Schools, colleges and societies", "As long as you need", "Anywhere in India", "An expert chosen for the region", 12, []),
]

# What each programme covers, in three or four plain lines. Keyed by title.
H = {
 "Mehrauli Archaeological Park": ["Rajon ki Baoli, a Lodi-period stepwell with its mosque and tomb", "Balban's tomb, with one of the earliest true arches in India", "The mosque and tomb of Jamali Kamali, from the first years of Mughal rule", "Quli Khan's tomb, which a British official turned into a country house"],
 "The Qutb complex": ["The Quwwat-ul-Islam mosque and its reused temple pillars", "The Iron Pillar and its Gupta-period Sanskrit inscription", "The Qutb Minar storey by storey, and who built which", "The Alai Darwaza, Iltutmish's tomb and the unfinished Alai Minar"],
 "Purana Qila": ["The three gateways and the walls of the sixteenth-century fort", "The Qila-i-Kuhna mosque and the Sher Mandal", "The excavations from the 1950s to the most recent seasons, and what each layer held", "How archaeologists date a site lived on for more than two thousand years"],
 "Hauz Khas": ["The reservoir Alauddin Khalji had dug for his city of Siri", "Firoz Shah Tughlaq's madrasa, hall by hall", "Firoz Shah's tomb and the pavilions in the garden", "How to recognise Tughlaq building: sloping walls, plain stone, little ornament"],
 "Museum morning with an archaeologist": ["One gallery, chosen with you beforehand", "About a dozen objects, each looked at slowly", "How to read a museum label, and what it leaves out", "Questions you can carry into any other gallery"],

 "Culture and heritage: what we inherit and why it matters": ["Culture and heritage: the difference, with Indian examples", "Tangible and intangible heritage", "Who protects heritage: UNESCO, the Archaeological Survey of India and local communities", "Time for the group's own questions"],
 "What archaeologists actually do": ["How sites are found", "How a trench is laid out, dug and recorded", "What happens to finds in the laboratory", "What becomes of a site after the dig"],
 "From stone tools to the first villages": ["The oldest stone tools found in the subcontinent", "Handaxes, flake tools and microliths: what changed and why", "The first farming villages", "How archaeologists date finds this old"],
 "The first cities: Harappa among the early civilisations": ["What makes a settlement a city", "Planning, drains, weights and seals in the Indus cities", "Mesopotamia, Egypt and early China beside the Indus", "The Indus script, which no one has yet read"],
 "Reading India's scripts: Brāhmī to Śāradā": ["Brāhmī, the script of most of Aśoka's edicts", "How Brāhmī grew into the scripts of north and south India", "A line of an edict, read together", "Dating an inscription from the shape of its letters"],
 "How to read a temple": ["The parts of a temple, from gateway to sanctum", "Nāgara, Drāviḍa and Vesara: how to tell them apart", "Reading a plan and an elevation", "Examples from north India, the south and the Deccan"],
 "India's linguistic heritage": ["The language families of India: Indo-Aryan, Dravidian, Austroasiatic, Tibeto-Burman and others", "How neighbouring languages borrow from one another", "How linguists reconstruct a language's history", "Endangered languages, and what is lost with them"],
 "Rock art of India": ["The painted shelters of Bhimbetka and central India", "The rock engravings of the Konkan coast", "How rock art is dated", "How it is recorded and protected"],
 "The goddess in text and image: the Devīmāhātmya": ["Where the text sits in the Mārkaṇḍeya Purāṇa", "Its three episodes: Madhu and Kaiṭabha, Mahiṣāsura, Śumbha and Niśumbha", "Key passages read in translation", "The Goddess in sculpture and painting"],
 "Careers in archaeology, museums and heritage": ["What the work is, in the field, the museum and the archive", "Which degrees lead to it, and how to get in", "Where the jobs are", "The students' own questions"],

 "Mock trench: a practice excavation": ["Laying out a trench and digging it layer by layer", "Recording each find and where it lay", "Working out, as a team, what happened at the site"],
 "Clay and the past: a pottery workshop": ["Shaping a pot by hand", "Sorting sherds by fabric, form and decoration", "What pottery tells an archaeologist about date and daily life"],
 "Reading sculpture": ["A short illustrated talk on how figures are identified", "Study in a gallery or at a temple: what each figure holds and wears", "A quiz to finish"],
 "Write like Aśoka's scribes: a Brāhmī workshop": ["The vowels and consonants of Brāhmī", "Writing your own name", "Reading a few words from an Aśokan edict"],
 "Recording the past: a documentation workshop": ["Filling in a context sheet", "Drawing and photographing an object to scale", "Writing a catalogue entry"],
 "Caring for collections: preventive conservation basics": ["What damages a collection: light, damp, pests and handling", "Assessing the condition of an object", "Storing and handling paper, textiles and metal", "Practice on sample materials"],
 "Stone tools up close": ["A demonstration of how stone tools were struck", "Reading the scars on a tool", "Sorting tool types and handling replicas"],
 "The dig: an archaeology team challenge": ["Teams excavate a prepared trench", "They record their finds as they go", "Each team presents its reading of the evidence", "Careful observation and clear reporting win, not speed"],

 "Prakrit: a first course": ["The sounds and basic grammar of Prakrit", "Guided reading of short passages", "Where Prakrit is found: inscriptions, drama and Jain texts"],
 "Pali: a first course": ["Pronunciation and basic grammar", "Reading short passages", "A test at the end, for those who want one"],
 "Śāradā script": ["The alphabet, conjuncts and numerals", "Practice in transliteration", "Reading from manuscript pages"],
 "Understanding Indian temple architecture": ["The parts of a temple and their names", "The regional styles and how old each is", "The ways scholars study architecture", "A certificate of completion, if you want one"],
 "Remote sensing in archaeology and heritage management": ["Satellite images and aerial photographs as sources", "Using mapping software to find and map sites", "Monitoring how a site changes over time", "Live weekend sessions, with recordings of each"],
 "Martial arts and society": ["Wrestling and combat in sculpture and texts", "Traditions that are still practised", "What these sports meant to those who practised and paid for them"],

 "Museum field school: documentation and conservation": ["Documenting objects from a museum collection", "Cleaning and rehousing them under supervision", "Daily laboratory sessions and lectures", "Visits to nearby sites"],
 "Prehistory field workshop": ["Reading the local landscape", "Finding and classifying stone tools", "Documenting rock art and megaliths", "Taking samples"],
 "Three capitals: Delhi, Agra and Jaipur": ["Delhi: the monuments of the Sultanate", "Agra and Fatehpur Sikri: the Mughal court", "Jaipur: a planned city of the eighteenth century", "An archaeologist with the group throughout"],
 "Forts of Rajasthan": ["Forts chosen with you from the six on the World Heritage list: Chittorgarh, Kumbhalgarh, Ranthambore, Gagron, Amber and Jaisalmer", "How each was sited, supplied with water and defended", "A historian with the group throughout"],
 "Stupas, caves and temples of central India": ["Bhimbetka: painted rock shelters", "Sanchi: the Great Stupa and its gateways", "Udayagiri: rock-cut caves of the Gupta period", "Khajuraho: the Chandella temples"],
 "A study tour built for your group": ["A region you choose", "A route built around what your group is studying", "An expert in that period travelling with you", "An itinerary and a quotation before you commit"],
}

# Practical rows shown under each programme, by format.
MEET = "Agreed with you and sent with a map pin once the date is fixed."
COVERED = "Your quotation states exactly what is covered."
PRACTICAL = {
    "walk": {"When": "Any day you choose. Early morning is best in the warmer months.", "Meeting point": MEET,
             "Bring": "Comfortable shoes, water and a cap. The ground is uneven in places.",
             "Tickets": "Entry tickets, where the site charges them, are not part of our fee."},
    "visit": {"When": "Any day the museum is open. We check its weekly closing day before fixing the date.", "Meeting point": MEET,
              "Tickets": "Museum entry is not part of our fee."},
    "lecture": {"When": "Any date you choose, in the daytime or the evening.",
                "You arrange": "At your venue, a room with a screen or projector. Online, nothing: we send the link."},
    "workshop": {"When": "Any date you choose.", "We bring": "What the session needs, for the number of people you confirm.",
                 "You arrange": "A room or open space with tables. We tell you exactly what is needed once we know the group."},
    "course": {"When": "Dates and timings are set with your batch.", "You need": "A computer or phone with a steady connection."},
    "field": {"When": "Dates agreed with your institution.", "Itinerary": "A day-by-day plan reaches you before you commit.",
              "Travel, stay and meals": COVERED},
    "tour": {"When": "Any dates you choose. October to March is the most comfortable season for this route.",
             "Itinerary": "A day-by-day plan reaches you before you commit.", "Travel, stay and meals": COVERED},
}
# Where one programme differs from the rest of its format.
PRACTICAL_FOR = {
    "Mock trench: a practice excavation": {"You arrange": "An open patch of ground, or a room if we use sand trays."},
    "The dig: an archaeology team challenge": {"You arrange": "An open patch of ground, or a room if we use sand trays."},
    "Reading sculpture": {"You arrange": "A room with a screen for the talk. Entry tickets for the visit, where charged, are not part of our fee."},
    "Write like Aśoka's scribes: a Brāhmī workshop": {"You arrange": "A room with tables and a screen. Online, nothing: we send the link."},
    "Stone tools up close": {"You arrange": "A room with tables and a screen."},
    "Caring for collections: preventive conservation basics": {"You arrange": "A room with tables and a screen."},
    "Recording the past: a documentation workshop": {"You arrange": "A room with tables and a screen."},
    "A study tour built for your group": {"When": "Any dates you choose. We advise on the best season for the region."},
}
AUDIENCES = {"school": ["school"], "college": ["college", "universit", "department"], "work": ["compan", "organisation", "museum", "archive"],
             "public": ["public", "study circle", "societ", "professional"]}


def audiences(text):
    low = text.lower()
    return [key for key, words in AUDIENCES.items() if any(w in low for w in words)]


def slugify(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def programme(i, row):
    f, title, sub, desc, aud, length, where, by, group, extra = row
    slug = slugify(title)
    practical = {**PRACTICAL[f], **PRACTICAL_FOR.get(title, {})}
    details = {"For": aud, "Length": length, "When": practical.pop("When"), "Led by": by, "Language": LANG,
               "Group size": f"About {group} works well. Smaller and larger groups can be discussed.",
               **practical, "Price": "Quoted for your group"}
    return {
        "id": f"req-{slug}", "slug": slug, "title": title, "subtitle": sub,
        "description": f"{desc}\n\n{FLEX[f]}",
        "type": TYPE[f], "kind": KIND[f], "price_paise": 0, "compare_at_paise": None, "currency": "INR",
        "stock": None, "requires_shipping": False, "image_url": None, "starts_at": None, "duration_minutes": None,
        "speaker": None, "venue": where, "details": details,
        "highlights": H[title], "audience": audiences(aud),
        "tags": ["on-request", f] + [t for t in extra if t != "featured"],
        "is_active": True, "is_featured": "featured" in extra, "sort_order": BASE[f] + i,
    }


catalogue = {
    "_about": "Programmes Talaash Heritage runs on request. Edited in the repository, not in the admin page.",
    # Example listings whose dates were never announced. Hidden until real events are scheduled.
    "hide": ["reading-asokan-edicts-brahmi", "indian-temple-architecture-course", "mehrauli-archaeological-park-walk", "national-museum-harappan-gallery-day"],
    # Database listings that stay visible but are not sold through the cart yet.
    "overrides": {
        "counselling-archaeology-careers": {
            "tags": ["on-request", "counselling"], "kind": "One-to-one counselling", "is_featured": False, "sort_order": 900,
            "details": {"For": "Students and early-career professionals", "Language": "English or Hindi",
                        "How it works": "Tell us what you want to discuss and we agree a time that suits you", "Fee": "Shared when you enquire"},
        },
        "sakta-ethos-devimahatmya-recording": {"tags": ["coming-soon"], "is_featured": False, "sort_order": 910,
            "details": {"Language": "English", "Includes": "Slides and reading list"}},
        "brahmi-script-chart-a3": {"tags": ["coming-soon"], "is_featured": False, "sort_order": 920, "details": {"Size": "A3, 297 × 420 mm", "Paper": "250 gsm matte"}},
        "trench-field-notebook": {"tags": ["coming-soon"], "is_featured": False, "sort_order": 930, "details": {"Size": "A6, 96 pages", "Paper": "100 gsm, 5 mm grid"}},
        "monuments-postcard-set": {"tags": ["coming-soon"], "is_featured": False, "sort_order": 940, "details": {"Contents": "12 postcards, 105 × 148 mm", "Paper": "300 gsm uncoated"}},
        "harappan-seals-reading-pack": {"tags": ["coming-soon"], "is_featured": False, "sort_order": 950, "details": {"Booklet": "48 pages, A5", "Recording": "60 minutes"}},
    },
    "programmes": [programme(i, row) for i, row in enumerate(P)],
}

slugs = [p["slug"] for p in catalogue["programmes"]]
assert len(slugs) == len(set(slugs)) == 35, (len(slugs), len(set(slugs)))
assert sum(p["is_featured"] for p in catalogue["programmes"]) == 1
assert set(H) == {row[1] for row in P}, set(H) ^ {row[1] for row in P}
assert set(PRACTICAL_FOR) <= set(H)
assert all(p["audience"] and 3 <= len(p["highlights"]) <= 4 for p in catalogue["programmes"])
out = sys.argv[1]
with open(out, "w", encoding="utf-8") as fh:
    json.dump(catalogue, fh, ensure_ascii=False, indent=1)
    fh.write("\n")
print(len(slugs), "programmes written to", out)
print("home picks:", [p["title"] for p in catalogue["programmes"] if "home" in p["tags"]])
