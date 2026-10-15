"""Builds site/data/catalogue.json: Talaash Heritage's on-request programmes,
plus how the existing database listings are shown (hidden, or enquiry-only).
Run: python3 build_catalogue.py <path to site/data/catalogue.json>
"""
import json, os, re, sys, unicodedata
from pricing import pricing as price_block, inr

LANG = "English, Hindi or both. Other languages on request, through our partners."

# Second paragraph of every description: how the programme bends to the group.
FLEX = {
    "lecture": "Length, level and language are agreed with you. The lecture can be given online or at your venue, for a single class, a department or a whole organisation.",
    "workshop": "All materials are provided. The session is adapted to your space, your timetable and the age of the participants.",
    "walk": "The date, start time, pace and language are arranged to suit your group.",
    "visit": "The gallery, date, pace and language are arranged to suit your group.",
    "course": "The course is run for your batch on dates you choose. Timings, pace and assessment are agreed before it begins.",
    "field": "Dates, location and syllabus are agreed with your institution. A day-by-day plan and a quotation are shared before you commit.",
    "tour": "A day-by-day itinerary and a quotation are shared before you commit. Route, pace, accommodation and budget are adjusted to suit your group.",
    "trip": "Transport from Delhi, the start time, meals and pace are arranged with you, and the quotation states exactly what is included.",
    "masterclass": "Length, level and language are agreed with you. It can be given online or at your venue, as a single session or as part of a series.",
    "career": "It can be booked by one person or by a class. A short form before the session lets the mentor prepare for you.",
    "discussion": "It is run as a guided conversation, online or on your campus, and works best with a group that is ready to argue a point.",
    "journey": "Everything is arranged privately for you: dates, pace, hotels, transport and the language you are guided in. You receive a day-by-day itinerary and an itemised quotation before you commit.",
}
KIND = {"lecture": "Lecture", "workshop": "Workshop", "walk": "Heritage walk", "visit": "Museum visit", "course": "Course", "field": "Field school",
        "tour": "Study tour", "trip": "Day trip", "masterclass": "Masterclass", "career": "Career session", "discussion": "Discussion",
        "journey": "Private journey"}
TYPE = {"lecture": "live", "workshop": "experience", "walk": "walk", "visit": "experience", "course": "course", "field": "experience", "tour": "experience",
        "trip": "walk", "masterclass": "live", "career": "counselling", "discussion": "live", "journey": "walk"}
BASE = {"walk": 100, "visit": 100, "lecture": 200, "workshop": 300, "course": 400, "field": 500, "tour": 500,
        "trip": 150, "masterclass": 250, "career": 600, "discussion": 270, "journey": 550}

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
 ("tour", "Three capitals: Delhi, Agra and Jaipur", "The Golden Triangle as a study tour", "An archaeologist travels with the group and uses Delhi's Sultanate monuments, Mughal Agra and Fatehpur Sikri, and eighteenth-century Jaipur to show how three courts built their capitals.", "Schools, colleges, companies and the public", "5 to 6 days", "Delhi, Agra and Jaipur", "An archaeologist", 12, []),
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

# Public name, subtitle and opening paragraph for each programme, keyed by its internal title.
# Subtitles always open with the format, so a lecture, a workshop and a course cannot be confused.
COPY = {
 "Mehrauli Archaeological Park": ("Mehrauli Archaeological Park",
   "A guided heritage walk through ten centuries of building, from the Sultanate to the British period",
   "The park holds standing remains from the eleventh century to the nineteenth, among them Rajon ki Baoli, the tomb of Balban and the mosque and tomb of Jamali Kamali. An archaeologist shows how masonry, arches and decoration distinguish one period from the next."),
 "The Qutb complex": ("The Qutb complex",
   "A guided heritage walk through a World Heritage Site, read from its inscriptions and masonry",
   "The Qutb Minar stands beside a mosque built with reused temple pillars, an iron pillar of the Gupta period and the Alai Darwaza of 1311. The walk uses the inscriptions and the joints in the masonry to trace how the complex grew under successive rulers."),
 "Purana Qila": ("Purana Qila",
   "A guided heritage walk around a sixteenth-century fort and the excavations within it",
   "The fort was built under Humayun and Sher Shah Suri. Excavations inside it since the 1950s have found settlement going back more than two thousand years. The walk covers the walls, gateways and mosque, and what each excavation revealed."),
 "Hauz Khas": ("Hauz Khas",
   "A guided heritage walk around a fourteenth-century madrasa, tomb and reservoir",
   "Alauddin Khalji had the reservoir dug for his city of Siri. Firoz Shah Tughlaq later built a madrasa along its edge and his own tomb at the corner. The walk explains how the madrasa functioned and how to recognise Tughlaq architecture."),
 "Museum morning with an archaeologist": ("Museum gallery study",
   "A guided museum visit that studies one gallery in depth, object by object",
   "Rather than a rapid tour of a whole museum, this visit concentrates on a single gallery chosen with you. An archaeologist takes the group through about a dozen objects: what each is, how it was made and found, and what it tells us."),

 "Culture and heritage: what we inherit and why it matters": ("Culture and heritage",
   "An illustrated lecture on tangible and intangible heritage, and on who protects it",
   "The lecture explains what counts as culture and what counts as heritage, and how the two differ. It works through tangible and intangible heritage with Indian examples, then looks at the institutions and communities that protect it, from UNESCO and the Archaeological Survey of India to the people who live beside a monument."),
 "What archaeologists actually do": ("Archaeology in practice",
   "An illustrated lecture on how sites are found, excavated, recorded and cared for",
   "The lecture follows an archaeological site from the first survey to the museum shelf: how a site is located, how a trench is laid out and recorded, what happens to finds in the laboratory, and what becomes of a site once excavation ends."),
 "From stone tools to the first villages": ("From stone tools to the first villages",
   "An illustrated lecture on human origins and the Stone Age in South Asia",
   "The lecture traces how early people lived in the subcontinent through the tools they left behind, from handaxes to microliths to the first farming settlements, using photographs of excavated material."),
 "The first cities: Harappa among the early civilisations": ("The first cities: the Indus and its contemporaries",
   "An illustrated lecture comparing the Indus cities with Mesopotamia, Egypt and early China",
   "The lecture examines what made a city more than four thousand years ago: planning, drainage, standard weights, seals and trade. Setting the Harappan cities beside their contemporaries shows what the early civilisations shared and what was distinctive to the Indus."),
 "Reading India's scripts: Brāhmī to Śāradā": ("India's scripts: from Brāhmī to Śāradā",
   "An illustrated lecture, with a reading demonstration, on the Brāhmī family of scripts",
   "Most scripts used in India today descend from Brāhmī, the script of most of Aśoka's edicts. The lecture traces that family, reads a line of an edict with the audience, and shows how epigraphists date an inscription from the shapes of its letters."),
 "How to read a temple": ("Reading a temple",
   "A single illustrated lecture on the Nāgara, Drāviḍa and Vesara traditions",
   "A plan, an elevation and a small set of terms are enough to begin reading a temple. The lecture compares the northern, southern and Deccan traditions through photographs and drawings. For a fuller treatment, see the four-session course on Indian temple architecture."),
 "India's linguistic heritage": ("India's linguistic heritage",
   "An illustrated lecture on the language families of the subcontinent and their history",
   "India's languages belong to several families that have influenced one another for thousands of years. The lecture maps those families, explains how linguists reconstruct their history, and considers what is lost when a language ceases to be spoken."),
 "Rock art of India": ("Rock art of India",
   "An illustrated lecture on India's painted shelters and rock engravings",
   "India has one of the world's largest bodies of rock art, from the painted shelters of Bhimbetka to the engravings of the Konkan coast. The lecture looks at what the images depict, how they are dated, and how researchers document them before they fade."),
 "The goddess in text and image: the Devīmāhātmya": ("The Devīmāhātmya: the Goddess in text and image",
   "An illustrated lecture on the Devīmāhātmya and the Śākta tradition",
   "The Devīmāhātmya is the best-known Sanskrit text on the Goddess and is still recited during Navarātri. The lecture reads key passages in translation and sets them beside sculpture and painting to show how the Śākta tradition took shape."),
 "Careers in archaeology, museums and heritage": ("Careers in archaeology, museums and heritage",
   "A guidance lecture for students choosing what to study",
   "The lecture sets out what the work involves, which degrees lead to it and where the employment is. Students leave with an outline of courses, entrance routes and first steps, and time is given to their own questions."),

 "Mock trench: a practice excavation": ("Mock excavation",
   "A hands-on workshop in which students excavate and record a prepared trench",
   "A trench is prepared in advance with layers and planted finds. Students excavate it with real tools, record each find and its position, and then interpret what happened at the site."),
 "Clay and the past: a pottery workshop": ("Pottery: making and identification",
   "A hands-on workshop in shaping pottery and in sorting sherds as archaeologists do",
   "Pottery is the most common find on an excavation. Participants shape a vessel by hand, then sort replica sherds by fabric, form and decoration, as archaeologists do in the field."),
 "Reading sculpture": ("Identifying sculpture",
   "A half-day workshop combining a short lecture, a gallery or temple visit and a quiz",
   "After a short illustrated lecture on how figures are identified, participants study sculpture in a museum gallery or at a temple, identify figures from their attributes and dress, and finish with a quiz."),
 "Write like Aśoka's scribes: a Brāhmī workshop": ("Introduction to Brāhmī script",
   "A hands-on workshop in reading and writing the script of Aśoka's edicts",
   "Brāhmī is more than two thousand years old and can be learnt to a basic level in a single session. Participants learn the letters, write their own names, and read a few words from an Aśokan edict."),
 "Recording the past: a documentation workshop": ("Archaeological documentation",
   "A hands-on workshop in recording sites and objects to a professional standard",
   "A find without a record is only an old object. Participants complete a context sheet, draw and photograph an object to scale, and write a catalogue entry, using the formats applied in field and museum practice."),
 "Caring for collections: preventive conservation basics": ("Preventive conservation",
   "A one- or two-day workshop on caring for paper, textiles and metal",
   "Most damage to a collection is caused by light, damp, pests and handling, and much of it can be prevented at little cost. A conservator shows how to assess, store and handle paper, textiles and metal, with practice on sample materials."),
 "Stone tools up close": ("Stone tools: making and classification",
   "A hands-on workshop on how prehistoric stone tools were made, used and classified",
   "A prehistorian demonstrates how stone tools were struck and what the scars on them reveal. Participants sort tool types, handle replicas and learn the first steps of lithic analysis."),
 "The dig: an archaeology team challenge": ("Team excavation challenge",
   "A half-day hands-on workshop for workplace teams",
   "Teams excavate, record and interpret a prepared trench, then present their reading of the evidence. The exercise rewards careful observation and clear reporting rather than speed."),

 "Prakrit: a first course": ("Introductory Prakrit",
   "An online course of six sessions in Prakrit grammar and reading",
   "Prakrit was the everyday speech of much of ancient India and the language of Aśoka's edicts. The course covers the essentials of grammar, with guided reading of short passages."),
 "Pali: a first course": ("Introductory Pali",
   "An online course in Pali pronunciation, grammar and reading",
   "Pali is the language of the Theravāda Buddhist canon. The course covers pronunciation, basic grammar and the reading of short passages, and ends with an optional assessment."),
 "Śāradā script": ("Reading Śāradā script",
   "An online course of about ten sessions in reading Śāradā manuscripts",
   "Śāradā was the principal script of Kashmir for centuries, and many manuscripts from the region are written in it. Participants learn the alphabet, conjuncts and numerals, practise transliteration, and read from manuscript pages."),
 "Understanding Indian temple architecture": ("Understanding Indian temple architecture",
   "An online course of four sessions on the forms and development of the Indian temple",
   "An introduction to the parts of a temple, the regional styles and their chronology, and the methods scholars use to study architecture. A certificate of completion can be issued."),
 "Remote sensing in archaeology and heritage management": ("Remote sensing in archaeology and heritage management",
   "A three-month online certificate course, taught in live weekend sessions",
   "The course covers how satellite imagery, aerial photographs and mapping software are used to find, map and monitor sites. Each live session is recorded for participants who miss it."),
 "Martial arts and society": ("Martial arts and society",
   "An online course of three sessions on wrestling and combat in Indian history",
   "The course examines what sculpture, texts and living traditions reveal about wrestling and combat sports in India, and what they meant to those who practised and patronised them."),

 "Museum field school: documentation and conservation": ("Museum field school: documentation and conservation",
   "A week-long field school of supervised work on a museum collection",
   "Participants document, clean and rehouse objects from a museum collection under the supervision of conservators and documentation specialists, with daily laboratory sessions, lectures and visits to nearby sites. It is suited to students of conservation, museology, archaeology and related subjects."),
 "Prehistory field workshop": ("Prehistory field school",
   "A three-day field school in survey, stone tools, rock art and megaliths",
   "A field introduction to prehistory: reading the local landscape, locating and classifying stone tools, documenting rock art and megaliths, and taking samples."),
 "Three capitals: Delhi, Agra and Jaipur": ("Three capitals: Delhi, Agra and Jaipur",
   "A study tour of five to six days, led by an archaeologist",
   "An archaeologist travels with the group and uses the Sultanate monuments of Delhi, Mughal Agra and Fatehpur Sikri, and eighteenth-century Jaipur to show how three courts planned and built their capitals."),
 "Forts of Rajasthan": ("Forts of Rajasthan",
   "A study tour of six to eight days, accompanied by a historian",
   "Six of Rajasthan's hill forts are inscribed together as a World Heritage Site. The tour examines how the forts were sited, supplied with water and defended, with a historian accompanying the group throughout."),
 "Stupas, caves and temples of central India": ("Stupas, caves and temples of central India",
   "A study tour of six to seven days to Bhimbetka, Sanchi, Udayagiri and Khajuraho",
   "Four sites in Madhya Pradesh that together span prehistoric rock art, early Buddhist architecture, Gupta sculpture and the medieval temple at its height. An archaeologist leads the tour, and reading is sent in advance."),
 "A study tour built for your group": ("Study tour to a region of your choice",
   "A study tour planned around your region and syllabus",
   "For schools, colleges and societies interested in other regions, such as Gujarat, Odisha, Varanasi and Sarnath, the Deccan or the south. The route is designed around what your group is studying, and an expert in that period accompanies you."),
}

# What the programme finder matches on, keyed by internal title.
# topics:  heritage, monuments, archaeology, ancient, scripts, art, museums, careers
# places:  delhi (a Delhi site or museum), local (your venue, or a site near you), online, travel (a trip of several days)
# lengths: short (up to about 2 hours), half (about half a day), long (a full day or more), series (several sessions)
FIND = {
 "Mehrauli Archaeological Park": (["monuments"], ["delhi"], ["half"]),
 "The Qutb complex": (["monuments"], ["delhi"], ["half"]),
 "Purana Qila": (["monuments", "archaeology"], ["delhi"], ["half"]),
 "Hauz Khas": (["monuments"], ["delhi"], ["short"]),
 "Museum morning with an archaeologist": (["museums", "art"], ["delhi"], ["half"]),
 "Culture and heritage: what we inherit and why it matters": (["heritage"], ["local", "online"], ["short"]),
 "What archaeologists actually do": (["archaeology"], ["local", "online"], ["short"]),
 "From stone tools to the first villages": (["ancient", "archaeology"], ["local", "online"], ["short"]),
 "The first cities: Harappa among the early civilisations": (["ancient", "archaeology"], ["local", "online"], ["short"]),
 "Reading India's scripts: Brāhmī to Śāradā": (["scripts"], ["local", "online"], ["short"]),
 "How to read a temple": (["monuments", "art"], ["local", "online"], ["short"]),
 "India's linguistic heritage": (["scripts", "heritage"], ["local", "online"], ["short"]),
 "Rock art of India": (["ancient", "art"], ["local", "online"], ["short"]),
 "The goddess in text and image: the Devīmāhātmya": (["art", "scripts"], ["local", "online"], ["short"]),
 "Careers in archaeology, museums and heritage": (["careers"], ["local", "online"], ["short"]),
 "Mock trench: a practice excavation": (["archaeology"], ["local"], ["half"]),
 "Clay and the past: a pottery workshop": (["archaeology", "art"], ["local"], ["half"]),
 "Reading sculpture": (["art", "museums"], ["local"], ["half"]),
 "Write like Aśoka's scribes: a Brāhmī workshop": (["scripts"], ["local", "online"], ["short"]),
 "Recording the past: a documentation workshop": (["archaeology", "museums"], ["local"], ["half", "long"]),
 "Caring for collections: preventive conservation basics": (["museums"], ["local"], ["long"]),
 "Stone tools up close": (["ancient", "archaeology"], ["local"], ["half"]),
 "The dig: an archaeology team challenge": (["archaeology"], ["local"], ["half"]),
 "Prakrit: a first course": (["scripts"], ["online"], ["series"]),
 "Pali: a first course": (["scripts"], ["online"], ["series"]),
 "Śāradā script": (["scripts"], ["online"], ["series"]),
 "Understanding Indian temple architecture": (["monuments", "art"], ["online"], ["series"]),
 "Remote sensing in archaeology and heritage management": (["archaeology", "careers"], ["online"], ["series"]),
 "Martial arts and society": (["heritage"], ["online"], ["series"]),
 "Museum field school: documentation and conservation": (["museums", "archaeology"], ["travel"], ["long"]),
 "Prehistory field workshop": (["ancient", "archaeology"], ["travel"], ["long"]),
 "Three capitals: Delhi, Agra and Jaipur": (["monuments"], ["travel"], ["long"]),
 "Forts of Rajasthan": (["monuments"], ["travel"], ["long"]),
 "Stupas, caves and temples of central India": (["monuments", "art", "ancient"], ["travel"], ["long"]),
 "A study tour built for your group": (["monuments", "art", "ancient", "heritage"], ["travel"], ["long"]),
}
TOPICS = {"heritage", "monuments", "archaeology", "ancient", "scripts", "art", "museums", "careers"}
PLACES = {"delhi", "local", "online", "travel"}
LENGTHS = {"short", "half", "long", "series"}

# Practical rows shown under each programme, by format.
MEET = "Agreed with you. A map location is shared once the date is confirmed."
COVERED = "The quotation states exactly what is included."
PRACTICAL = {
    "walk": {"When": "Any day you choose. Early morning is best in the warmer months.", "Meeting point": MEET,
             "What to bring": "Comfortable shoes, water and a hat. The ground is uneven in places.",
             "Entry fees": "Monument entry fees, where charged, are not included."},
    "visit": {"When": "Any day the museum is open. Its weekly closing day is checked before the date is fixed.", "Meeting point": MEET,
              "Entry fees": "Museum entry fees are not included."},
    "lecture": {"When": "Any date you choose, daytime or evening.",
                "You arrange": "At your venue, a room with a screen or projector. Online, nothing; the link is sent to you."},
    "workshop": {"When": "Any date you choose.", "We provide": "All materials, for the confirmed number of participants.",
                 "You arrange": "A room or open space with tables. Exact requirements are confirmed once the group is known."},
    "course": {"When": "Dates and timings are set with your batch.", "You need": "A computer or phone with a stable internet connection."},
    "field": {"When": "Dates agreed with your institution.", "Itinerary": "A day-by-day plan is shared before you commit.",
              "Travel, stay and meals": COVERED},
    "trip": {"When": "Any day you choose. October to March is the most comfortable season.", "Starting point": "Delhi, or wherever you are staying in the region.",
             "What to bring": "Comfortable shoes, water, a hat and sun protection. Much of the day is outdoors.",
             "Travel, meals and entry fees": COVERED},
    "masterclass": {"When": "Any date you choose, daytime or evening.",
                    "You arrange": "At your venue, a room with a screen or projector. Online, nothing; the link is sent to you."},
    "career": {"When": "A time agreed with you.", "Before the session": "A short form about your studies and plans."},
    "discussion": {"When": "Any date you choose.", "You arrange": "At your campus, a room where the group can face each other. Online, nothing; the link is sent to you."},
    "journey": {"When": "Any dates you choose. October to March is the most comfortable season for most of India.",
                "Itinerary": "A day-by-day plan is shared before you commit.", "Hotels, transport and meals": COVERED},
    "tour": {"When": "Any dates you choose. October to March is the most comfortable season for this route.",
             "Itinerary": "A day-by-day plan is shared before you commit.", "Travel, stay and meals": COVERED},
}
# Where one programme differs from the rest of its format.
PRACTICAL_FOR = {
    "Mock trench: a practice excavation": {"You arrange": "An open area of ground, or a room if sand trays are used."},
    "The dig: an archaeology team challenge": {"You arrange": "An open area of ground, or a room if sand trays are used."},
    "Reading sculpture": {"You arrange": "A room with a screen for the lecture. Entry fees for the visit, where charged, are not included."},
    "Write like Aśoka's scribes: a Brāhmī workshop": {"You arrange": "A room with tables and a screen. Online, nothing; the link is sent to you."},
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


IMG_DIR = "assets/img/programmes"


def illustration(out_path, slug):
    """Path of the programme's illustration, if the file is in the site folder."""
    site = os.path.dirname(os.path.dirname(os.path.abspath(out_path)))
    rel = f"{IMG_DIR}/{slug}.jpg"
    return rel if os.path.exists(os.path.join(site, rel)) else None


def programme(i, row):
    f, key, _sub, _desc, aud, length, where, by, group, extra = row
    slug = slugify(key)  # from the internal title, so links and image files stay stable
    title, sub, desc = COPY[key]
    title_for_lookup = key
    practical = {**PRACTICAL[f], **PRACTICAL_FOR.get(title_for_lookup, {})}
    details = {"For": aud, "Length": length, "When": practical.pop("When"), "Led by": by, "Language": LANG,
               "Group size": f"About {group} is suggested. Smaller and larger groups are welcome.",
               **practical, "Price": "Quoted for your group"}
    return {
        "id": f"req-{slug}", "slug": slug, "page": f"{slug}.html", "title": title, "subtitle": sub,
        "description": f"{desc}\n\n{FLEX[f]}",
        "type": TYPE[f], "kind": KIND[f], "price_paise": 0, "compare_at_paise": None, "currency": "INR",
        "stock": None, "requires_shipping": False, "image_url": illustration(sys.argv[1], slug), "starts_at": None, "duration_minutes": None,
        "speaker": None, "venue": where, "details": details,
        "highlights": H[title_for_lookup], "audience": audiences(aud),
        "find": dict(zip(("topics", "places", "lengths"), FIND[title_for_lookup])),
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
            "image_url": illustration(sys.argv[1], "counselling-archaeology-careers"),
            "title": "Career counselling in archaeology and heritage",
            "subtitle": "A private online session on study and career choices",
            "description": "A one-to-one conversation about your next step: which master's or doctoral programmes suit you, how entrance examinations and fieldwork applications work, and what roles exist in museums, survey, conservation and heritage management.\n\nThe session is held online at a time agreed with you. Its length and fee are confirmed when you enquire.",
            "duration_minutes": None, "speaker": None, "venue": "Online video call",
            "audience": ["college", "public"],
            "find": {"topics": ["careers"], "places": ["online"], "lengths": ["short"]},
            "details": {"For": "Students and early-career professionals", "Language": "English or Hindi",
                        "Scheduling": "A time is agreed with you", "Length and fee": "Confirmed when you enquire"},
        },
        "sakta-ethos-devimahatmya-recording": {
            "image_url": illustration(sys.argv[1], "sakta-ethos-devimahatmya-recording"),
            "tags": ["coming-soon"], "is_featured": False, "sort_order": 910,
            "title": "The Śākta ethos in the Devīmāhātmya",
            "subtitle": "A lecture recording on the Goddess and the Śākta tradition",
            "description": "A lecture on how the Devīmāhātmya presents the Goddess, and what the text reveals about the Śākta and tantric traditions that developed around it.",
            "duration_minutes": None, "speaker": None, "venue": "Online", "details": {},
        },
        "brahmi-script-chart-a3": {
            "image_url": illustration(sys.argv[1], "brahmi-script-chart-a3"),
            "tags": ["coming-soon"], "is_featured": False, "sort_order": 920,
            "title": "Brāhmī script chart", "subtitle": "A wall chart of Aśokan Brāhmī with Devanāgarī and roman equivalents",
            "description": "Each letter of Aśokan Brāhmī set beside its Devanāgarī and IAST equivalent, at a size that can be read across a classroom.",
            "details": {"Size": "A3"},
        },
        "trench-field-notebook": {
            "image_url": illustration(sys.argv[1], "trench-field-notebook"),
            "tags": ["coming-soon"], "is_featured": False, "sort_order": 930,
            "title": "Field notebook", "subtitle": "A gridded pocket notebook for site visits",
            "description": "A pocket notebook for site visits, with gridded pages for plans and sections and a printed scale along the cover edge.",
            "details": {"Size": "A6"},
        },
        "monuments-postcard-set": {
            "image_url": illustration(sys.argv[1], "monuments-postcard-set"),
            "tags": ["coming-soon"], "is_featured": False, "sort_order": 940,
            "title": "Indian monuments postcard set", "subtitle": "Twelve postcards of measured monument drawings",
            "description": "Twelve postcards, each with a measured elevation drawing of an Indian monument on the front and a short note on its date and features on the back.",
            "details": {"Contents": "12 postcards"},
        },
        "harappan-seals-reading-pack": {
            "image_url": illustration(sys.argv[1], "harappan-seals-reading-pack"),
            "tags": ["coming-soon"], "is_featured": False, "sort_order": 950,
            "title": "Harappan seals reading pack", "subtitle": "A printed booklet with a recorded introduction",
            "description": "A booklet on how Harappan seals were made, used and excavated, illustrated with drawings of seals, accompanied by a recorded introduction.",
            "details": {},
        },
    },
    "programmes": [programme(i, row) for i, row in enumerate(P)],
}

slugs = [p["slug"] for p in catalogue["programmes"]]
assert len(slugs) == len(set(slugs)) == 35, (len(slugs), len(set(slugs)))
HAND_WRITTEN = len(slugs)
assert sum(p["is_featured"] for p in catalogue["programmes"]) == 1
assert set(H) == {row[1] for row in P}, set(H) ^ {row[1] for row in P}
assert set(COPY) == {row[1] for row in P}, set(COPY) ^ {row[1] for row in P}
assert set(FIND) == {row[1] for row in P}, set(FIND) ^ {row[1] for row in P}
for _t, _p, _l in FIND.values():
    assert _t and _p and _l and set(_t) <= TOPICS and set(_p) <= PLACES and set(_l) <= LENGTHS, (_t, _p, _l)
assert all(sub.split()[0] in ("A", "An") for _, sub, _ in COPY.values())
assert len({t for t, _, _ in COPY.values()}) == len(COPY)
assert set(PRACTICAL_FOR) <= set(H)
assert all(p["audience"] and 3 <= len(p["highlights"]) <= 4 for p in catalogue["programmes"])

# ---------------------------------------------------------------------------
# The programme bank: a plan for each programme above, and the programmes that
# came from the bank (tools/bank.json, made by tools/import_bank.py).
BANK = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "bank.json"), encoding="utf-8"))


def region_from_places(places):
    return "delhi" if "delhi" in places else "india" if "travel" in places else "anywhere"


for p in catalogue["programmes"]:
    p["region"] = region_from_places(p["find"]["places"])
    p.update(BANK["plans"].get(p["slug"], {}))

# Day-by-day outlines for the three study tours, written to match their stated length.
TOUR_DAYS = {
    "three-capitals-delhi-agra-and-jaipur": [
        ("Day 1: Sultanate Delhi", "The Qutb complex and Mehrauli: how Delhi's first Sultanate capitals were built."),
        ("Day 2: Mughal Delhi", "Humayun's Tomb in the morning; the Red Fort and the streets of Shahjahanabad in the afternoon."),
        ("Day 3: Agra", "Drive to Agra. Agra Fort, and the Taj Mahal from across the river at sunset."),
        ("Day 4: The Taj Mahal and Fatehpur Sikri", "The Taj Mahal at opening, then Akbar's city at Fatehpur Sikri on the way to Jaipur."),
        ("Day 5: Jaipur", "Amber Fort, the City Palace and Jantar Mantar: a planned city of the eighteenth century."),
        ("Day 6: Departure or an extra day", "A museum, a second fort, or a slower start before you leave."),
    ],
    "forts-of-rajasthan": [
        ("Day 1: Jaipur", "Arrival, and an introduction to how and why Rajasthan's forts were built where they are."),
        ("Day 2: Amber and Jaigarh", "A palace-fort and the fortress above it: defence, water supply and court life."),
        ("Day 3: To Chittorgarh", "A long road day, broken with a stop on the way."),
        ("Day 4: Chittorgarh", "The largest of the hill forts: gates, reservoirs, palaces and towers."),
        ("Day 5: To Kumbhalgarh", "The drive through the Aravalli hills, and the fort walls at dusk."),
        ("Day 6: Kumbhalgarh", "The walls, the gateways and the temples inside them."),
        ("Days 7 and 8: Udaipur, or an extension", "Departure from Udaipur, or on to Ranthambore, Gagron or Jaisalmer to complete the set of six."),
    ],
    "stupas-caves-and-temples-of-central-india": [
        ("Day 1: Bhopal", "Arrival, and the State Museum for the region's archaeology in one place."),
        ("Day 2: Bhimbetka and Bhojpur", "Painted rock shelters in the morning; the unfinished Bhojeshwar temple in the afternoon."),
        ("Day 3: Sanchi", "The Great Stupa, its four gateways and the monasteries on the hill."),
        ("Day 4: Udayagiri and Vidisha", "Gupta-period rock-cut caves and the old city beside them."),
        ("Day 5: To Khajuraho", "A long road day across Madhya Pradesh."),
        ("Day 6: Khajuraho", "The Western Group of Chandella temples: plans, towers and sculpture."),
        ("Day 7: Khajuraho and departure", "The Eastern and Southern groups, then the flight or train home."),
    ],
}
TOUR_DAYS["museum-field-school-documentation-and-conservation"] = [
    ("Day 1: Arrival and induction", "The host museum, its collection and the rules for handling objects safely."),
    ("Days 2 to 5: Supervised work on the collection", "Documenting, cleaning and rehousing objects with conservators and documentation specialists, with a laboratory session and a lecture each day."),
    ("Day 6: Nearby sites", "Visits to sites connected with the collection."),
    ("Day 7: Reporting and departure", "Each participant presents the records they made, and the work is handed over to the museum."),
]
TOUR_DAYS["prehistory-field-workshop"] = [
    ("Day 1: Reading the landscape", "Maps, geology and survey: how prehistorians decide where to look."),
    ("Day 2: Stone tools", "Finding, recording and classifying stone tools, and what their scars tell us."),
    ("Day 3: Rock art and megaliths", "Documenting rock art and megalithic monuments, and how samples are taken and labelled."),
]
STEPS = {"a-study-tour-built-for-your-group": [
    ("Tell us the region and the syllabus", "Where your group wants to go, what it is studying, how many days you have and how many of you there are."),
    ("We propose a route and an expert", "A route built around the syllabus, with a specialist in the period or region."),
    ("You receive an itinerary and a quotation", "Day by day, with what is included and what is not, revised until it suits you."),
    ("You travel with the expert", "The specialist leads the group throughout, with reading sent in advance."),
]}
for p in catalogue["programmes"]:
    if p["slug"] in STEPS:
        p["plan"] = [{"title": t, "detail": d} for t, d in STEPS[p["slug"]]]
        p["plan_kind"] = "steps"
for p in catalogue["programmes"]:
    if p["slug"] in TOUR_DAYS:
        p["plan"] = [{"title": t, "detail": d} for t, d in TOUR_DAYS[p["slug"]]]
        p["plan_kind"] = "days"
        p.pop("objectives", None)
# The central India tour matches its day plan: Khajuraho is reached from Bhopal by road.
for p in catalogue["programmes"]:
    if p["slug"] == "stupas-caves-and-temples-of-central-india":
        p["highlights"] = ["Bhimbetka: painted rock shelters", "Bhojpur and Sanchi: an unfinished temple and the Great Stupa",
                           "Udayagiri: rock-cut caves of the Gupta period", "Khajuraho: the Chandella temples"]


def bank_programme(i, b):
    f = b["f"]
    details = {"For": b["for"], "Length": b["length"], "When": PRACTICAL[f]["When"], "Led by": b["led_by"], "Language": LANG,
               "Group size": "Agreed with you. A single person or a small group is welcome." if f == "career" else "Agreed with you. Smaller and larger groups are welcome.",
               **{k: v for k, v in PRACTICAL[f].items() if k != "When"}, "Price": "Quoted for your group"}
    return {
        "id": f"req-{b['slug']}", "slug": b["slug"], "page": f"{b['slug']}.html", "title": b["title"], "subtitle": b["subtitle"],
        "description": f"{b['description']}\n\n{FLEX[f]}", "type": TYPE[f], "kind": KIND[f], "price_paise": 0, "compare_at_paise": None,
        "currency": "INR", "stock": None, "requires_shipping": False, "image_url": illustration(sys.argv[1], b["slug"]),
        "starts_at": None, "duration_minutes": None, "speaker": None, "venue": b["venue"], "details": details,
        "highlights": b["highlights"], "audience": b["audience"], "find": b["find"], "region": b["region"],
        "plan": b["plan"], "plan_kind": b["plan_kind"], "takeaway": b["takeaway"], **({"objectives": b["objectives"]} if b.get("objectives") else {}),
        "tags": ["on-request", f], "is_active": True, "is_featured": False, "sort_order": BASE[f] * 10 + i,
    }


HARAPPA_IMG = illustration(sys.argv[1], "the-first-cities-harappa-among-the-early-civilisations")
for i, b in enumerate(BANK["programmes"]):
    p = bank_programme(i, b)
    if b["bank_id"] == "TH-031":
        # The flagship day, written by hand from the Rakhigarhi operations plan.
        p.update({
            "slug": "rakhigarhi", "id": "req-rakhigarhi", "page": "rakhigarhi.html", "image_url": HARAPPA_IMG,
            "title": "Rakhigarhi: a Harappan city and a living village",
            "subtitle": "A day trip from Delhi to one of the largest Harappan sites, with an archaeologist",
            "description": "Rakhigarhi, in Hisar district of Haryana, is one of the largest settlements of the Harappan civilisation. "
                           "An archaeologist walks you through the mounds and the published evidence for its streets, crafts, drains and burials, "
                           "and a local host shows you the village that stands beside them today.\n\n"
                           "The day is designed to be worth the journey even when no trench is open and the museum is closed. "
                           "A visit to a live excavation or a gallery can be added only when it is confirmed for your date.\n\n" + FLEX["trip"],
            "highlights": ["The mounds and what excavation has found in them", "Published finds, pottery and burials, with reproductions",
                           "Lunch with a local host", "The village today, in conversation with the people who live there"],
            "plan": [
                {"title": "Arrival and briefing", "minutes": 35, "detail": "What a mound is, where Rakhigarhi sits in the Harappan story, and how to behave on a protected site."},
                {"title": "The archaeological landscape", "minutes": 75, "detail": "The accessible parts of selected mounds, read against the published evidence for streets, craft areas, drains and burial grounds.", "activity": "Annotate a site map in your field notebook"},
                {"title": "Finds and methods", "minutes": 45, "detail": "Excavation photographs, pottery types and burials, with reproductions: what each tells us and what it does not.", "activity": "Sort evidence from reconstruction"},
                {"title": "Lunch", "minutes": 60, "detail": "A meal arranged with a local host, or a restaurant or packed lunch. Dietary needs are confirmed when you book."},
                {"title": "The village today", "minutes": 65, "detail": "A walk or a conversation about food and crafts, led by a local host who has agreed to it. No uninvited visits, and photographs only with permission."},
                {"title": "Wrap-up", "minutes": 30, "detail": "The ancient city and the present village as two different histories, your questions, and options for a second day."},
            ],
            "options": [
                ("A live excavation", "Only when a dig is under way on your date and the site team agrees to a supervised visit."),
                ("A museum or interpretation centre", "Only if it is open on your date; otherwise a printed research pack."),
                ("A pottery and craft demonstration", "With a craftsperson, quoted for your group."),
                ("A research seminar", "With a scholar, for college and research groups."),
                ("A photography and field-recording workshop", "With permission for every photograph taken."),
                ("An overnight stay", "A resort, hotel or heritage lodging nearby, quoted by room. Some lodgings have age rules for school groups."),
                ("A second day nearby", "Hisar, Hansi or Agroha, or a seminar comparing Harappan sites."),
            ],
            "notes": [
                "Travel time from Delhi is added at both ends of the day and depends on where you start.",
                "We never promise an open trench or a find. The day is planned to be worthwhile without them.",
                "We do not claim that the people of the village today descend directly from the Harappans. The two histories are told separately.",
            ],
            "takeaway": "A field journal and a comparison sheet from the day",
            "find": {"topics": ["archaeology", "ancient", "heritage"], "places": ["travel"], "lengths": ["long"]},
            "audience": ["school", "college", "work", "public"], "tags": ["on-request", "trip", "home"], "sort_order": 1490,
            "details": {**p["details"], "Length": "A full day at the site, plus travel from Delhi", "Led by": "An archaeologist, with a local cultural host",
                        "For": "Schools, colleges, families, researchers and private groups, including visitors from abroad"},
        })
    catalogue["programmes"].append(p)

# Private journeys for visitors from abroad (and anyone else), from the international experience book.
JOURNEYS = [
    ("delhi-through-seven-cities", "Delhi through seven cities", "A three-day private journey through Delhi's historic cities", "Delhi", "3 days",
     "Delhi is a sequence of cities built beside one another over a thousand years. This journey reads them in order, with no more than two major monuments a day.",
     [("Day 1: The Qutb complex", "Arrival, rest, and an unhurried reading of the Qutb complex."),
      ("Day 2: Mehrauli and Humayun's Tomb", "Mehrauli Archaeological Park in the morning, Humayun's Tomb in the afternoon, with lunch between."),
      ("Day 3: Shahjahanabad", "Old Delhi and the Red Fort, then a flexible departure.")],
     ["the-qutb-complex", "mehrauli-archaeological-park", "humayuns-tomb", "jama-masjid-shahjahanabad", "red-fort-complex"], ["delhi", "travel"]),
    ("delhi-and-rakhigarhi-the-harappan-world", "Delhi and Rakhigarhi: the Harappan world", "A two-day private journey from a Delhi museum to a Harappan city", "Delhi and Haryana", "2 days",
     "An introduction to the Harappan civilisation in Delhi, then a day at Rakhigarhi, one of its largest cities.",
     [("Day 1: Delhi", "A short introduction to Harappan archaeology, and a museum gallery if it is open."),
      ("Day 2: Rakhigarhi", "An early start for the archaeological landscape, lunch and the village today. Return to Delhi, or stay the night.")],
     ["rakhigarhi", "museum-morning-with-an-archaeologist", "the-first-cities-harappa-among-the-early-civilisations"], ["delhi", "travel"]),
    ("the-golden-triangle-with-an-archaeologist", "The Golden Triangle with an archaeologist", "A six-day private journey through Delhi, Agra and Jaipur", "Delhi, Agra and Jaipur", "6 days",
     "The classic route, paced for understanding rather than ticking off: Sultanate and Mughal Delhi, Agra and Fatehpur Sikri, and the planned city of Jaipur.",
     [("Day 1: Arrive in Delhi", "A briefing and time to rest."),
      ("Day 2: Qutb and Mehrauli, or Humayun's Tomb", "Two monuments at a private pace."),
      ("Day 3: Old Delhi", "The architecture and history of Shahjahanabad."),
      ("Day 4: To Agra", "The drive to Agra, then its monuments after time to settle in."),
      ("Day 5: Fatehpur Sikri and on to Jaipur", "Akbar's city on the way."),
      ("Day 6: Jaipur", "The planned city and Jantar Mantar, then departure.")],
     ["three-capitals-delhi-agra-and-jaipur", "the-qutb-complex", "humayuns-tomb", "jama-masjid-shahjahanabad", "fatehpur-sikri-mughal-urban-vision"], ["travel"]),
    ("central-india-rock-art-and-buddhist-archaeology", "Central India: rock art and Buddhist archaeology", "A five-day private journey based in Bhopal", "Bhopal, Madhya Pradesh", "5 days",
     "Prehistoric painted shelters, an unfinished temple, the stupas of Sanchi and the Gupta caves of Udayagiri, one at a time.",
     [("Day 1: Bhopal", "Arrival, the lake and the old city."),
      ("Day 2: Bhimbetka", "The prehistoric painted shelters, with time to rest."),
      ("Day 3: Bhojpur", "The Bhojeshwar temple and what its stones show about how it was built."),
      ("Day 4: Sanchi", "The Buddhist monuments on the hill."),
      ("Day 5: Udayagiri and Vidisha", "The caves and the old city, then departure.")],
     ["old-bhopal-markets-water-and-city-identity", "bhimbetka-painted-shelters-and-prehistoric-landscapes", "bhojpur-bhojeshwar-temple-the-unfinished-monument", "sanchi-stupas-gateways-and-buddhist-art", "udayagiri-caves-gupta-period-sacred-art"], ["travel"]),
    ("mumbai-caves-city-and-living-traditions", "Mumbai: caves, city and living traditions", "A four-day private journey in Mumbai", "Mumbai", "4 days",
     "A port city read through its colonial streets, its rock-cut caves and its living neighbourhoods.",
     [("Day 1: The Fort precinct", "Arrival, and the architecture of the old Fort area."),
      ("Day 2: Victorian Gothic and Art Deco", "Two centuries of building along South Mumbai's streets."),
      ("Day 3: Elephanta", "The island caves, if the ferry is running that day."),
      ("Day 4: Banganga and Bhuleshwar, or Kanheri", "A sacred tank and a market quarter, or the Buddhist caves in the national park.")],
     ["mumbai-fort-precinct-colonial-urban-form", "mumbai-art-deco-and-victorian-gothic-walk", "elephanta-shiva-and-rock-cut-architecture", "banganga-tank-sacred-water-and-neighbourhood", "bhuleshwar-living-religious-streetscape", "kanheri-caves-monastic-landscapes"], ["travel"]),
    ("temples-of-eastern-india", "Temples of eastern India", "A five-day private journey from Bhubaneswar to Konark", "Bhubaneswar, Odisha", "5 days",
     "Odisha's temple architecture from the old town of Bhubaneswar to the Sun Temple at Konark, with the Jain caves between.",
     [("Day 1: Bhubaneswar", "Arrival, and how to read a Kalinga temple."),
      ("Day 2: The Ekamra temples", "The old town and its sacred landscape."),
      ("Day 3: Udayagiri and Khandagiri", "The Jain caves on the twin hills."),
      ("Day 4: Konark", "The Sun Temple, then rest by the coast."),
      ("Day 5: Iconography and departure", "A session comparing the sculpture you have seen.")],
     ["bhubaneswar-ekamra-temples-and-urban-sacred-landscape", "udayagiri-khandagiri-caves-jain-heritage", "konark-sun-temple-architecture-and-astronomy", "kalinga-temple-architecture"], ["travel"]),
    ("harappan-gujarat-cities-water-and-trade", "Harappan Gujarat: cities, water and trade", "A six-day private journey to Lothal and Dholavira", "Ahmedabad and Kachchh, Gujarat", "6 days",
     "Two of the best-known Harappan sites: the dock town of Lothal and the walled city of Dholavira with its reservoirs. The distances are long, so the nights are planned around them.",
     [("Day 1: Ahmedabad", "Arrival and a briefing on the evidence."),
      ("Day 2: Lothal", "The site and its interpretations, then back to Ahmedabad."),
      ("Day 3: To Kachchh", "A travel day with an overnight stop."),
      ("Day 4: Dholavira", "A full day at the city, its gates and its water system."),
      ("Day 5: Landscape and crafts", "Water and settlement in Kachchh, and local crafts with makers who have agreed to host you."),
      ("Day 6: Return", "The drive back and departure.")],
     ["lothal-harappan-trade-and-its-interpretations", "dholavira-harappan-urbanism-in-kachchh", "the-first-cities-harappa-among-the-early-civilisations"], ["travel"]),
    ("south-india-temple-architecture", "South India temple architecture", "A six-day private journey from Chennai", "Chennai and Tamil Nadu", "6 days",
     "From the Pallava rock-cut monuments at Mamallapuram to the temple towns beyond, with time to understand how the southern temple took shape.",
     [("Day 1: Chennai", "Arrival and an introduction to Pallava art."),
      ("Day 2: Mamallapuram", "Rock-cut and structural monuments by the sea."),
      ("Day 3: Kanchipuram", "The temple town, with a local partner."),
      ("Day 4: Travel or rest", "On to another temple region if you choose one."),
      ("Day 5: Plans, patrons and inscriptions", "A seminar, or a visit led by a partner specialist."),
      ("Day 6: Departure", "A session on recording what you saw, then departure.")],
     ["mamallapuram-rock-cut-and-structural-temples", "dravida-temple-architecture", "understanding-indian-temple-architecture"], ["travel"]),
]
known = {p["slug"] for p in catalogue["programmes"]}
for i, (slug, title, sub, venue, days, desc, plan, related, places) in enumerate(JOURNEYS):
    missing = [r for r in related if r not in known]
    assert not missing, (slug, missing)
    catalogue["programmes"].append({
        "id": f"req-{slug}", "slug": slug, "page": f"{slug}.html", "title": title, "subtitle": sub,
        "description": f"{desc}\n\n{FLEX['journey']}", "type": TYPE["journey"], "kind": KIND["journey"], "price_paise": 0, "compare_at_paise": None,
        "currency": "INR", "stock": None, "requires_shipping": False, "image_url": illustration(sys.argv[1], slug), "starts_at": None,
        "duration_minutes": None, "speaker": None, "venue": venue,
        "details": {"For": "Visitors from abroad, families and private groups", "Length": days.replace("days", "days, adjusted to you"),
                    "Led by": "An archaeologist or historian, with partner guides in your language", "Language": LANG,
                    "Group size": "From one traveller upwards", **PRACTICAL["journey"], "Price": "Quoted for your group"},
        "highlights": [t.split(": ", 1)[1] if ": " in t else t for t, _ in plan][:4],
        "plan": [{"title": t, "detail": d} for t, d in plan], "plan_kind": "days", "related": related,
        "audience": ["public", "college"], "find": {"topics": ["monuments", "heritage"], "places": places, "lengths": ["long"]},
        "region": "india", "tags": ["on-request", "journey", "international"], "is_active": True, "is_featured": False,
        "sort_order": BASE["journey"] * 10 + i,
    })

slugs = [p["slug"] for p in catalogue["programmes"]]
assert len(slugs) == len(set(slugs)), [x for x in slugs if slugs.count(x) > 1]
for p in catalogue["programmes"]:
    assert p["find"]["topics"] and p["find"]["places"] and p["find"]["lengths"], p["slug"]
    assert set(p["find"]["topics"]) <= TOPICS and set(p["find"]["places"]) <= PLACES and set(p["find"]["lengths"]) <= LENGTHS, p["slug"]
    assert p["audience"] and p["highlights"], p["slug"]
# Prices (tools/pricing.py) and photographs (content/media.json, licensed
# photos from Wikimedia Commons with credits) for every programme.
MEDIA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "content", "media.json")
MEDIA = json.load(open(MEDIA_PATH, encoding="utf-8")) if os.path.exists(MEDIA_PATH) else {}


def attach(p):
    pb = price_block(p)
    if pb:
        p["pricing"] = pb
        p["price_paise"] = pb["from_paise"]
        if "Price" in p.get("details", {}):
            p["details"]["Price"] = pb["card"] + ", including GST"
    m = MEDIA.get(p["slug"])
    if m:
        p["image_url"], p["image_small"], p["image_alt"] = m["src"], m["small"], m["alt"]
        p["image_credit"] = {"by": m["credit"], "license": m["license"], "license_url": m["license_url"], "page": m["page"]}
        # Tall photos (a minaret, a manuscript folio) are shown whole instead of cropped through the middle.
        if m.get("portrait"):
            p["image_fit"] = "contain"


for p in catalogue["programmes"]:
    attach(p)
for slug, ov in catalogue["overrides"].items():
    if ov.get("kind") == "One-to-one counselling":
        ov["slug"] = slug
        attach(ov)
        ov.pop("slug")
        if "Length and fee" in ov.get("details", {}):
            ov["details"]["Length and fee"] = "About 60 minutes. " + ov["pricing"]["card"] + ", including GST"
        ov["description"] = ov["description"].replace(" Its length and fee are confirmed when you enquire.", "")

# Career courses sold through the cart and booked for a weekend evening (rows in the products table):
# a display name and a credited photograph for each.
CAREER_COURSES = {
    "career-course-weekend": "ba-ma-archaeology-pathways",
    "career-course-one-evening": "asi-museums-public-heritage-careers",
}
for slug, photo in CAREER_COURSES.items():
    m = MEDIA[photo]
    catalogue["overrides"][slug] = {
        "kind": "Career course", "image_url": m["src"], "image_small": m["small"], "image_alt": m["alt"],
        "image_credit": {"by": m["credit"], "license": m["license"], "license_url": m["license_url"], "page": m["page"]},
    }

# A few bank outcomes name the programme where they mean the place ("Situate Hansi Asigarh Fort
# Heritage Visit within..."); use the place from the venue instead.
for p in catalogue["programmes"]:
    place = (p.get("venue") or "").split(",")[0].strip()
    if p.get("objectives") and place:
        p["objectives"] = [re.sub(r"^Situate .+? within its regional", "Situate " + place + " within its regional", o) for o in p["objectives"]]

# Learning outcomes and take-aways written for programmes that had none (content/outcomes.json).
OUTCOMES = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "content", "outcomes.json"), encoding="utf-8"))
for p in catalogue["programmes"]:
    extra = OUTCOMES.get(p["slug"], {})
    if extra.get("objectives") and not p.get("objectives"):
        p["objectives"] = extra["objectives"]
    if extra.get("takeaway") and not p.get("takeaway"):
        p["takeaway"] = extra["takeaway"]

out = sys.argv[1]
with open(out, "w", encoding="utf-8") as fh:
    json.dump(catalogue, fh, ensure_ascii=False, indent=1)
    fh.write("\n")


# ---------------------------------------------------------------------------
# Static copies for readers that do not run JavaScript (search engines, link
# previews). The shop page ships with every programme card already in its HTML;
# the page script replaces it with the full, filterable catalogue on load.
from html import escape as h

SITE_URL = "https://talaash-heritage.pages.dev/"
ACTION = {"Heritage walk": "Enquire about this walk", "Museum visit": "Enquire about this visit", "Lecture": "Request this lecture",
          "Workshop": "Request this workshop", "Course": "Request this course", "Field school": "Enquire about this field school",
          "Study tour": "Plan this study tour", "Day trip": "Plan this day trip", "Masterclass": "Request this masterclass",
          "Career session": "Request a session", "Discussion": "Request this discussion", "Private journey": "Plan this journey"}  # same wording as requestAction() in assets/js/ui.js
SIZES = "(min-width: 1000px) 25vw, (min-width: 560px) 33vw, 50vw"


def fit_attr(p):
    return ' class="fit-contain"' if p.get("image_fit") == "contain" else ""


def meta_description(text, limit=158):
    """Search results show about 155 to 160 characters; end on a full sentence where one fits."""
    if len(text) <= limit:
        return text
    cut = text[:limit]
    stop = cut.rfind(". ")
    if stop >= 90:
        return cut[:stop + 1]
    return cut[:limit - 1].rsplit(" ", 1)[0].rstrip(",;:") + "…"


def card_art(p, sizes):
    """Picture markup shared by cards and pages: a credited photograph, or our own illustration."""
    if p.get("image_small"):
        return (f'<img src="{h(p["image_small"])}" srcset="{h(p["image_small"])} 500w, {h(p["image_url"])} 960w" sizes="{sizes}" '
                f'alt="{h(p["image_alt"])}" loading="lazy" width="960" height="720"{fit_attr(p)}>')
    if p["image_url"]:
        small = p["image_url"].replace(".jpg", "-s.jpg")
        return (f'<img src="{h(small)}" srcset="{h(small)} 560w, {h(p["image_url"])} 1040w" sizes="{sizes}" '
                f'alt="{h("Illustration for " + p["title"])}" loading="lazy" width="1040" height="780">')
    return ""


def type_line(p):
    return f'{p["kind"]} · {p["pricing"]["card"]}' if p.get("pricing") else f'{p["kind"]} · On request'


def static_card(p):
    href = p["page"]
    meta = " · ".join(x for x in (p["details"].get("Length"), p["venue"]) if x)
    art = card_art(p, SIZES)
    if art:
        art, cls = f'<a class="card-art" href="{h(href)}" tabindex="-1" aria-hidden="true">{art}</a>', "card"
    else:
        cls = "card card-text"
    return (f'<article class="{cls}">{art}'
            f'<p class="card-type">{h(type_line(p))}</p><h3><a href="{h(href)}">{h(p["title"])}</a></h3>'
            f'<p class="card-meta">{h(meta)}</p><p class="visually-hidden">{h(p["subtitle"])}</p>'
            f'<div class="card-foot card-foot-wide"><a class="btn btn-outline btn-small" href="{h(href)}">{h(ACTION[p["kind"]])}</a></div></article>')


def band_label(b):
    """Mirrors bandLabel() in assets/js/ui.js."""
    if b["from"] == b["to"]:
        return f'{b["from"]} {"person" if b["from"] == 1 else "people"}', inr(b["each"]) + ("" if b["from"] == 1 else " each")
    return f'{b["from"]} to {b["to"]} people', inr(b["each"]) + " each"


def bands_html(bands):
    if not bands:
        return ""
    rows = "".join(f"<li><span>{h(a)}</span><span>{h(b)}</span></li>" for a, b in map(band_label, bands))
    return f'<ul class="ptier-bands">{rows}</ul>'


def calc_html(bands):
    """The group-size picker inside the private price. Mirrors calcHtml() in assets/js/ui.js."""
    if not bands:
        return ""
    opts = "".join(f'<option value="{n}"{" selected" if n == 2 else ""}>{n}</option>' for n in range(1, 26)) + '<option value="26">More than 25</option>'
    return (f'<div class="pcalc"><label for="pcalc-size">How many people?</label> <select id="pcalc-size" data-pcalc>{opts}</select>'
            f'<p class="pcalc-out" aria-live="polite">{h(group_total(bands, 2))}</p></div>')


def group_total(bands, n):
    """Mirrors groupTotal() in assets/js/ui.js."""
    each = next(b["each"] for b in bands if b["from"] <= n <= b["to"])
    total = each * n
    return f"1 person: {inr(total)} in total" if n == 1 else f"{n} people: {inr(total)} in total ({inr(each)} each)"


def pricing_html(p):
    """The price table on a programme page. Mirrors pricingHtml() in assets/js/ui.js."""
    pb = p.get("pricing")
    if not pb:
        return ""
    cells = "".join(
        f'<li class="ptier{" ptier-wide" if t.get("bands") else ""}"><p class="ptier-label">{h(t["label"])}</p>'
        f'<p class="ptier-price">{h(t["amount"])}</p><p class="ptier-unit">{h(t["unit"])}</p>'
        + bands_html(t.get("bands"))
        + (f'<p class="ptier-note">{h(t["note"])}</p>' if t["note"] else "") + calc_html(t.get("bands")) + "</li>"
        for t in pb["tiers"])
    notes = "".join(f"<li>{h(n)}</li>" for n in pb["notes"] + [pb["gst"]])
    return f'<section class="pricing" aria-label="Prices"><ul class="ptiers ptiers-{len(pb["tiers"])}">{cells}</ul><ul class="pricing-notes">{notes}</ul></section>'


def credit_html(p):
    c = p.get("image_credit")
    if not c:
        return ""
    return (f'<p class="photo-credit">Photo: <a href="{h(c["page"])}" rel="noopener">{h(c["by"])}</a>, '
            f'<a href="{h(c["license_url"])}" rel="license noopener">{h(c["license"])}</a>, via Wikimedia Commons</p>')


site = os.path.dirname(os.path.dirname(os.path.abspath(out)))
shop_path = os.path.join(site, "shop.html")
START, END = "<!-- catalogue:start -->", "<!-- catalogue:end -->"
shop = open(shop_path, encoding="utf-8").read()
assert shop.count(START) == 1 and shop.count(END) == 1, "shop.html must contain the catalogue markers once"
cards = "\n".join(static_card(p) for p in catalogue["programmes"])
block = f'{START}\n<section class="shop-block"><h2>All programmes</h2><div class="grid">\n{cards}\n</div></section>\n{END}'
shop = shop[:shop.index(START)] + block + shop[shop.index(END) + len(END):]
open(shop_path, "w", encoding="utf-8").write(shop)

# The Journeys page (TALAASHH) lists the travel programmes in blocks between markers.
journeys_path = os.path.join(site, "journeys.html")
jp = open(journeys_path, encoding="utf-8").read()
progs = catalogue["programmes"]
grid = lambda items: '<div class="grid">\n' + "\n".join(static_card(x) for x in items) + "\n</div>"
blocks = {
    "trips": sorted([x for x in progs if x["kind"] == "Day trip"], key=lambda x: x["sort_order"]),
    "tours": [x for x in progs if x["kind"] == "Study tour"],
    "field": [x for x in progs if x["kind"] == "Field school"],
    "private": [x for x in progs if x["kind"] == "Private journey"],
}
STATE_ORDER = ["Madhya Pradesh", "Mumbai", "Odisha", "Gujarat", "Rajasthan", "Uttar Pradesh", "Bihar", "Tamil Nadu", "Karnataka"]
by_state = {}
for x in progs:
    if x.get("region") == "india" and x["kind"] in ("Heritage walk", "Museum visit"):
        state = x["venue"].split(", ")[-1]
        by_state.setdefault("Mumbai" if "Mumbai" in state else state, []).append(x)
assert set(by_state) <= set(STATE_ORDER), set(by_state) - set(STATE_ORDER)
india = "\n".join(f'<h3 class="journey-sub">{h(st)}</h3>\n{grid(by_state[st])}' for st in STATE_ORDER if st in by_state)
for key in ["trips", "tours", "field", "private", "india"]:
    a, b = f"<!-- journeys:{key} -->", f"<!-- /journeys:{key} -->"
    assert jp.count(a) == 1 and jp.count(b) == 1, key
    body = india if key == "india" else grid(blocks[key])
    jp = jp[:jp.index(a) + len(a)] + "\n" + body + "\n" + jp[jp.index(b):]
open(journeys_path, "w", encoding="utf-8").write(jp)

# One static page per programme, named after its slug, so that search engines
# and link previews see the programme's own title, picture and text. The page
# script then draws the live version over it.
from urllib.parse import quote
MARK = "<!-- generated by tools/build_catalogue.py: edit the programme there, not here -->"
HAND_MADE = {f for f in os.listdir(site) if f.endswith(".html") and MARK not in open(os.path.join(site, f), encoding="utf-8").read()}
assert not {p["page"] for p in catalogue["programmes"]} & HAND_MADE, "a programme slug clashes with a page of the site"
WA_NUMBER = "917397829282"  # CONFIG.whatsappNumber in assets/js/config.js


PLAN_HEAD = {"timed": "How the time is spent", "days": "Day by day", "outline": "Course outline", "steps": "How it is planned"}
PLAN_NOTE = {"timed": "Timings are a guide. The plan is confirmed with your quotation.",
             "days": "Days can be added, removed or reordered. The final itinerary comes with your quotation.",
             "outline": "The number and length of sessions are agreed with your batch."}
TITLES = {p["slug"]: (p["title"], p["page"]) for p in catalogue["programmes"]}


def extras_html(p):
    """The sections under a programme's description: plan, aims, take-away, options, notes, related programmes.
    Mirrors extrasHtml() in assets/js/pages/product.js."""
    out = []
    if p.get("plan"):
        kind = p.get("plan_kind", "timed")
        items = []
        for st in p["plan"]:
            time = f' <span class="plan-time">{st["minutes"]} min</span>' if st.get("minutes") else ""
            detail = f'<p>{h(st["detail"])}</p>' if st.get("detail") else ""
            act = f'<p class="plan-do">You: {h(lower(st["activity"]))}</p>' if st.get("activity") else ""
            items.append(f'<li><p class="plan-head"><strong>{h(st["title"])}</strong>{time}</p>{detail}{act}</li>')
        note = f'<p class="small muted">{PLAN_NOTE[kind]}</p>' if kind in PLAN_NOTE else ""
        out.append(f'<h2 class="covers-title">{PLAN_HEAD[kind]}</h2><ol class="plan plan-{kind}">{"".join(items)}</ol>{note}')
    if p.get("objectives"):
        out.append('<h2 class="covers-title">By the end you can</h2><ul class="covers">' +
                   "".join(f"<li>{h(o)}</li>" for o in p["objectives"]) + "</ul>")
    if p.get("takeaway"):
        out.append(f'<h2 class="covers-title">You take away</h2><p>{h(p["takeaway"])}.</p>')
    if p.get("options"):
        out.append('<h2 class="covers-title">Options you can add</h2><ul class="options">' +
                   "".join(f"<li><strong>{h(t)}.</strong> {h(n)}</li>" for t, n in p["options"]) + "</ul>")
    if p.get("notes"):
        out.append('<h2 class="covers-title">Good to know</h2><ul class="covers">' + "".join(f"<li>{h(n)}</li>" for n in p["notes"]) + "</ul>")
    if p.get("related"):
        out.append('<h2 class="covers-title">Programmes in this journey</h2><ul class="covers">' +
                   "".join(f'<li><a href="{h(TITLES[r][1])}">{h(TITLES[r][0])}</a></li>' for r in p["related"]) + "</ul>")
    return "".join(out)


# Cross-selling on programme pages, from the guides in content/guides:
# which guides recommend this programme, and which programmes pair with it.
GUIDE_DIR = os.path.join(os.path.dirname(site), "content", "guides")
GUIDE_FOR, PAIRS, PLACE_GUIDES = {}, {}, []
if os.path.isdir(GUIDE_DIR):
    for f in sorted(os.listdir(GUIDE_DIR)):
        if not f.endswith(".json"):
            continue
        g = json.load(open(os.path.join(GUIDE_DIR, f), encoding="utf-8"))
        name = g["title"].split(":")[0]
        if g["type"] in ("city", "state"):
            PLACE_GUIDES.append((g["slug"], name, g["type"], g.get("city"), g.get("state")))
        for page in g.get("related_programmes", []) + g.get("bundle", {}).get("items", []):
            GUIDE_FOR.setdefault(page, {})[g["slug"]] = (name, g["type"])
        items = g.get("bundle", {}).get("items", [])
        for a in items:
            for b in items:
                if a != b:
                    PAIRS.setdefault(a, []).append(b)
BY_PAGE = {p["page"]: p for p in catalogue["programmes"]}
GUIDE_RANK = {"city": 0, "state": 1, "pillar": 2, "list": 2, "explainer": 3}


def xsell_html(p):
    """Guides to read and programmes to add, shown under the programme. It sits outside
    #product-root, so the live redraw by product.js leaves it in place."""
    found = dict(GUIDE_FOR.get(p["page"], {}))
    venue = p["venue"]
    cities = [c for slug, n, t, c, st in PLACE_GUIDES if t == "city" and c and re.search(r"\b" + re.escape(c) + r"\b", venue)]
    for slug, n, t, c, st in PLACE_GUIDES:
        if (t == "city" and c in cities) or (t == "state" and st and (re.search(r"\b" + re.escape(st) + r"\b", venue) or
                any(st == st2 for s2, n2, t2, c2, st2 in PLACE_GUIDES if t2 == "city" and c2 in cities))):
            found.setdefault(slug, (n, t))
    reads = sorted(found.items(), key=lambda kv: (GUIDE_RANK.get(kv[1][1], 9), kv[1][0]))[:8]
    pairs = []
    for x in PAIRS.get(p["page"], []):
        if x in BY_PAGE and x not in pairs and x != p["page"]:
            pairs.append(x)
    if len(pairs) < 4:
        same = [q["page"] for q in catalogue["programmes"] if q["page"] != p["page"] and q["page"] not in pairs and q.get("region") == p.get("region") and q.get("region")]
        other_kind = [x for x in same if BY_PAGE[x]["kind"] != p["kind"]] + [x for x in same if BY_PAGE[x]["kind"] == p["kind"]]
        pairs += other_kind[: 4 - len(pairs)]
    pairs = pairs[:4]
    out = []
    if pairs:
        out.append('<div class="section-head"><h2>Pairs well with</h2><a href="shop.html">Everything we offer</a></div><div class="grid">' +
                   "".join(static_card(BY_PAGE[x]) for x in pairs) + "</div>")
    if reads:
        out.append('<h2>Read before you go</h2><ul class="xsell-reads">' + "".join(f'<li><a href="{s}.html">{h(n)}</a></li>' for s, (n, t) in reads) + "</ul>")
    return f'<section class="wrap xsell" aria-label="More to explore">{"".join(out)}</section>' if out else ""


TRIP_KINDS = {"Heritage walk", "Museum visit", "Day trip", "Study tour", "Private journey", "Field school"}


def programme_ld(p, url, image):
    org = {"@type": "Organization", "@id": SITE_URL + "#org", "name": "Talaash Heritage", "url": SITE_URL}
    desc = p["description"].split("\n\n")[0]
    if p["kind"] in TRIP_KINDS:
        main = {"@type": "TouristTrip", "name": p["title"], "description": desc, "url": url, "image": image, "provider": org,
                "touristType": [a.capitalize() for a in p.get("audience", [])] or None}
        if p.get("highlights"):
            main["itinerary"] = {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": x} for i, x in enumerate(p["highlights"])]}
    else:
        main = {"@type": "Course", "name": p["title"], "description": desc, "url": url, "image": image, "provider": org,
                "inLanguage": ["en", "hi"],
                "hasCourseInstance": {"@type": "CourseInstance", "courseMode": "Online" if "Online" in p["venue"] and "venue" not in p["venue"] else "Blended",
                                      "location": p["venue"]}}
    if p.get("pricing"):
        main["offers"] = {"@type": "Offer", "price": str(p["pricing"]["from_paise"] // 100), "priceCurrency": "INR",
                          "description": p["pricing"]["card"] + ", including GST", "availability": "https://schema.org/InStock", "url": url,
                          "seller": {"@id": SITE_URL + "#org"}}
        if main["@type"] == "Course":
            main["offers"]["category"] = "Paid"
    main = {k: v for k, v in main.items() if v}
    crumbs = {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Everything we offer", "item": SITE_URL + "shop.html"},
        {"@type": "ListItem", "position": 2, "name": p["title"], "item": url}]}
    return json.dumps({"@context": "https://schema.org", "@graph": [main, crumbs]}, ensure_ascii=False).replace("</", "<\\/")


def lower(x):
    return x[0].lower() + x[1:] if x and not x[:2].isupper() else x


def static_page(p):
    text = (f'Hello Talaash Heritage, I would like to request "{p["title"]}".\n\nWho it is for (school, college, workplace or private group): '
            "\nGroup size: \nPreferred dates: \nCity or online: \nAnything you would like changed: ")
    wa = f"https://wa.me/{WA_NUMBER}?text={quote(text, safe='')}"
    mail = f"mailto:talaashheritage@gmail.com?subject={quote('Request: ' + p['title'], safe='')}&body={quote(text, safe='')}"
    image = p["image_url"] if (p["image_url"] or "").startswith("http") else SITE_URL + (p["image_url"] or "assets/img/logo-badge.png")
    url = SITE_URL + p["page"]
    desc = p["subtitle"].rstrip(".") + ". " + p["description"].split("\n\n")[0]
    desc = meta_description(desc)
    art = card_art(p, "(min-width: 760px) 50vw, 100vw")
    spec = "".join(f"<div><dt>{h(k)}</dt><dd>{h(v)}</dd></div>" for k, v in [("Where", p["venue"]), *p["details"].items()] if v)
    prose = "".join(f"<p>{h(x)}</p>" for x in p["description"].split("\n\n"))
    covers = "".join(f"<li>{h(x)}</li>" for x in p["highlights"])
    travels = any(t in p["tags"] for t in ("tour", "field", "trip", "journey"))
    how = ("Send your preferred dates, group size and starting point. We prepare a day-by-day itinerary and a quotation, and revise both until they suit you. The suggested group size is a guide, not a requirement."
           if travels else "Send your preferred dates, group size and location. We adapt the length, level and language, and prepare a quotation. The suggested group size is a guide, not a requirement.")
    return f"""<!doctype html>
{MARK}
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script src="assets/js/theme.js"></script>
<title>{h(p["title"])} | Talaash Heritage</title>
<meta name="description" content="{h(desc)}">
<link rel="canonical" href="{h(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Talaash Heritage">
<meta property="og:url" content="{h(url)}">
<meta property="og:title" content="{h(p["title"])}">
<meta property="og:description" content="{h(p["subtitle"])}">
<meta property="og:image" content="{h(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2a2926">
<link rel="icon" href="assets/img/favicon-64.png" type="image/png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Talaash">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+Devanagari:wght@400;600&family=Tiro+Devanagari+Sanskrit:ital@0;1&display=swap">
<link rel="stylesheet" href="assets/css/styles.css">
<script type="application/ld+json">{programme_ld(p, url, image)}</script>
</head>
<body data-gate="open" data-slug="{h(p["slug"])}">
<div id="site-header"></div>
<main id="main">
<div class="wrap" id="product-root">
  <p class="crumbs"><a href="shop.html">Everything we offer</a> / {h(p["kind"])}</p>
  <div class="product">
    <div><div class="product-art">{art}</div>{credit_html(p)}</div>
    <div>
      <h1>{h(p["title"])}</h1>
      <p class="product-sub">{h(p["subtitle"])}</p>
      <p class="product-price">{h(p["pricing"]["card"]) if p.get("pricing") else "On request"}</p>
      {pricing_html(p)}
      <div class="request">
        <p><strong>Arranged for your group.</strong> {h(how)}</p>
        <div class="buy-row">
          <a class="btn btn-primary" href="{h(wa)}" target="_blank" rel="noopener">Request on WhatsApp</a>
          <a class="btn btn-outline" href="{h(mail)}">Request by email</a>
        </div>
        <p class="small muted">No payment is taken until you approve the plan. <a href="about.html#questions">Common questions</a></p>
      </div>
      <div class="prose">{prose}</div>
      <h2 class="covers-title">What it covers</h2><ul class="covers">{covers}</ul>
      {extras_html(p)}
      <dl class="spec">{spec}</dl>
    </div>
  </div>
</div>
{xsell_html(p)}
</main>
<div id="site-footer"></div>
<script type="application/json" id="programme-data">{page_data(p)}</script>
<script type="module" src="assets/js/layout.js"></script>
<script type="module" src="assets/js/pages/product.js"></script>
</body>
</html>
"""


BY_SLUG = {x["slug"]: x for x in catalogue["programmes"]}


def page_data(p):
    """The programme's own record, embedded in its page, so product.js draws the page without
    downloading the whole catalogue. Related programmes carry just the title and link."""
    d = dict(p)
    d["related_items"] = [{"slug": r, "title": BY_SLUG[r]["title"], "page": BY_SLUG[r]["page"]} for r in p.get("related") or [] if r in BY_SLUG]
    return json.dumps(d, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


# Database listings shown at product.html?slug= need only the hide list and the overrides,
# not the 160 programmes, so they get a small file of their own.
with open(os.path.join(os.path.dirname(out), "overrides.json"), "w", encoding="utf-8") as fh:
    json.dump({"hide": catalogue.get("hide", []), "overrides": catalogue.get("overrides", {})}, fh, ensure_ascii=False, separators=(",", ":"))


written = set()
for p in catalogue["programmes"]:
    open(os.path.join(site, p["page"]), "w", encoding="utf-8").write(static_page(p))
    written.add(p["page"])
# Remove pages of programmes that have left the catalogue.
for f in os.listdir(site):
    if f.endswith(".html") and f not in written and f not in HAND_MADE:
        os.remove(os.path.join(site, f))
        print("removed", f)

pages = ["", "shop.html", "finder.html", "journeys.html", "indian-culture-classes-for-kids-online.html", "work.html", "about.html", "archaeologywala.html", "contact.html", "sell.html", "privacy.html", "terms.html", "shipping-returns.html"]
urls = [SITE_URL + x for x in pages] + [SITE_URL + p["page"] for p in catalogue["programmes"]] + \
    [f"{SITE_URL}product.html?slug={x}" for x in catalogue["overrides"]]
assert all("&" not in u and "<" not in u for u in urls)
sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + \
    "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n"
open(os.path.join(site, "sitemap.xml"), "w", encoding="utf-8").write(sitemap)
print(len(slugs), "programmes written to", out)
print("home picks:", [p["title"] for p in catalogue["programmes"] if "home" in p["tags"]])
