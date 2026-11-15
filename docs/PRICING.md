# Talaash Heritage — Pricing principles and price points

Set 15 October 2026. All prices are in INR and **include GST**.

The live prices are in `tools/pricing.py` and the Supabase `products` rows; change them only there, then rebuild. This file records Talaash's own price points, the GST position and the rules for showing prices.

---

## 1. GST position (confirmed items only)

1. **Education services by an unrecognised provider are taxed at 18%.** The GST Council's own flyer says: "private coaching centres or other unrecognized institutions, though self-styled as educational institutions, would not be treated as educational institutions under GST and thus cannot avail exemptions", and "Other services related to education, not covered by the exemption, would be taxed at a standard rate of 18%." The exemption (Entry 66, Notification 12/2017-CT(Rate)) covers only education "as a part of curriculum for obtaining a qualification recognised by any law". Talaash is a proprietorship that does not award legally recognised qualifications, so its lectures, masterclasses, workshops, courses, the certificate course and career counselling fall under the 18% rate. Notification 11/2017 sets Heading 9992 at 9% CGST (plus 9% SGST, 18% in total).
   Sources: https://gstcouncil.gov.in/sites/default/files/e-version-gst-flyers/GST_Education_Services.pdf ; https://cbic-gst.gov.in/hindi/pdf/central-tax-rate/Notification12-CGST.pdf ; https://d23z1tp9il9etb.cloudfront.net/download/gstlaw/NOTIFICATION%20NO.%2011_2017-CENTRAL%20TAX%20(RATE)1724408331.pdf
2. **Tour operator services are taxed at 5% without input tax credit.** Notification 11/2017-CT(Rate), Heading 9985(i), sets 2.5% CGST (2.5% SGST, 5% in total). Two conditions apply. First, no ITC is taken, except ITC on tour-operator services bought from another tour operator. Second, the bill must state that it includes the accommodation and transportation charges for the tour, and it must show the gross amount. A "tour operator" is anyone "engaged in the business of planning, scheduling, organizing, arranging tours (which may include arrangements for accommodation, sightseeing or other similar services)". The Indian Association of Tour Operators (IATO) confirms that after the 56th GST Council meeting, effective 22 Sep 2025, "supply of tour operator services will continue to be taxed @ 5% GST (without ITC)". The same circular says hotel rooms up to ₹7,500 per night moved to 5% without ITC.
   Sources: the Notification 11/2017 PDF above ; https://iato.in/circular-get?id=eyJpdiI6ImlNLzVVdWs1dndzRmgxTlVmK2J3NFE9PSIsInZhbHVlIjoiOTFSdytaMDJhSnRzYnF3YVpKMnFtQT09IiwibWFjIjoiMTdjM2I2MDgzMzdkNDFkYjg2MWE2MWJiNjM4Yjg3YjVmNTY5ZTZiNjE0N2Q0ODVjMzllYTNhZmFkMmZhNzYwZCIsInRhZyI6IiJ9
   - This clearly fits **study tours and private journeys** that are billed as packages including accommodation and transport.
3. **Items that are not confirmed and need a CA's view:**
   - **Walks and museum visits** with no transport or accommodation. They may not meet the 5% tour-operator condition and could be treated as guide or education services at 18%.
   - **Day trips**, which include transport but no accommodation.
   - **Field schools**, where the main supply could be training (18%) or a tour (5%).

   Because every Talaash price below is shown GST-inclusive, the displayed price does not change whichever rate applies; only the net revenue does. The recommendations assume 18% on walks, museum visits, day trips and field schools, which is conservative, and 5% only on multi-day study tours and private journeys.

---

## 2. Recommended Talaash price points (INR, GST-inclusive)

**Change of 15 October 2026.** Private walks, museum visits, workshops and one- or two-day site study tours are priced per person by group size, with no minimum (the bands are in `PRIVATE_BANDS` in `tools/pricing.py`). Cards read "₹1,800 per person for 2, ₹900 each for 10 or more"; programme pages have a group-size calculator, and the size chosen goes into the WhatsApp request. One-day site study tours: 1 person ₹5,000, 2 people ₹3,000 each, 3–4 ₹2,000, 5–9 ₹1,600, 10–25 ₹1,500 (doubled for two days). Day trips stay priced per vehicle and read "₹16,000 for 1 to 4 people, car included". No tier is highlighted any more.

Positioning: Talaash guides are archaeologists and historians, so prices are set for expert-led programmes. Prices are round numbers ending in 0 or 00 (section 3).

### Heritage walk (2–2.5 h; monument tickets extra)
| Product | Price |
|---|---|
| Public walk, per person | **₹900** |
| Public walk, student (with ID) | **₹500** |
| Private, any group size (changed 15 Oct) | **1 person ₹3,000; 2 people ₹1,800 each; 3–4 ₹1,250 each; 5–9 ₹1,000 each; 10–25 ₹900 each**. No minimum. |
| More than 25 | Quoted |
| School group (per-student equivalent) | **₹450 per student**, minimum 30 (₹13,500); 1 teacher free per 10 students |
| Corporate group | **₹1,500 per person**, minimum ₹25,000; includes tea and a short Q&A |

### Museum visit (90–120 min; museum entry extra)
| Product | Price |
|---|---|
| Public, per person | **₹800** |
| Private, any group size (changed 15 Oct) | **1 person ₹2,500; 2 people ₹1,500 each; 3–4 ₹1,000 each; 5–9 ₹850 each; 10–25 ₹800 each** |
| School | **₹400 per student**, minimum 30 |
| Corporate | **₹1,500 per person**, minimum ₹25,000 |

### Lecture (60–90 min)
| Product | Price |
|---|---|
| Public ticket, online | **₹300** |
| Public ticket, at venue | **₹500** |
| Institution booking, online (school or college) | **₹12,000 per session** |
| Institution booking, on-site in Delhi NCR | **₹18,000 per session** (travel outside NCR extra) |
| Corporate | **₹30,000 per session** |

### Masterclass (2.5–3 h, small cohort, with reading pack)
| Product | Price |
|---|---|
| Public, online / in person | **₹1,500 / ₹2,000 per learner** |
| Institution, online / on-site | **₹25,000 / ₹40,000 per session** |
| Corporate | **₹50,000 per session** |

### Discussion (moderated, 60–90 min)
| Product | Price |
|---|---|
| Public | **₹300** per person (₹200 for students) |
| Institution | **₹10,000** per session |
| Corporate | **₹20,000** per session |

### Hands-on workshop (mock excavation, pottery, Brahmi, conservation; about 2 h; materials included)
| Product | Price |
|---|---|
| Public, per person | **₹1,500** |
| Private, any group size (changed 15 Oct) | **1 person ₹3,500; 2 people ₹2,200 each; 3–4 ₹1,600 each; 5–9 ₹1,300 each; 10–25 ₹1,200 each** |
| School | **₹700 per student**, minimum 25 (₹17,500); materials included |
| Corporate | **₹2,000 per person**, minimum ₹30,000 |

### Online language and script courses (Prakrit, Pali, Sharada, Brahmi, temple architecture; evening sessions of 60–75 min)
| Product | Price |
|---|---|
| 4 sessions | **₹1,500 per learner** |
| 6 sessions | **₹2,000 per learner** |
| 8 sessions | **₹2,500 per learner** |
| 10 sessions | **₹3,000 per learner** |
| Early bird | **₹300 off** for the first 20 seats or until 14 days before start |
| Student price | **20% off** with ID |
| Private batch for an institution (up to 30 learners) | **₹5,000 per session** (4 sessions ₹20,000, 8 sessions ₹40,000, 10 sessions ₹50,000) |
| 3-month remote sensing certificate | **₹9,000 per learner**; early bird ₹7,500 |

### Career sessions
| Product | Price |
|---|---|
| 1:1 career session (archaeology, history or museum careers; 60 min with written next steps) | **₹1,500** |
| 1:1 MA/PhD/scholarship application clinic (60 min plus written review of SOP and CV) | **₹3,000** |
| CV review, written | **₹1,000** |
| Group session, public (90 min online) | **₹300 per learner** |
| Group session for an institution | **₹15,000 online** (up to 100) / **₹25,000 on-site in NCR** |

### 2-session weekend-evening career course (2 × 2 h, online)
- **₹1,000 per learner**, with an early bird price of **₹800**.
- **25 seats per batch** (to keep it interactive); run the batch at **10 or more** learners.

### Day trip from Delhi (for example Rakhigarhi; archaeologist with the group all day; tickets and meals extra unless stated)
| Product | Price |
|---|---|
| Private, up to 4 guests (sedan) | **₹16,000 per group** |
| Private, up to 7 guests (Innova-class SUV) | **₹22,000 per group** |
| Scheduled public departure (tempo traveller, lunch included) | **₹2,500 per person** |
| School | **from ₹1,600 per student**, minimum 40; coach, entries and lunch included |
| Corporate | **₹4,500 per person**, minimum 15 |

### Study tour, 5–8 days (group, twin-sharing, 3-star, coach or tempo traveller, archaeologist-led)
- **₹6,500 per person per day.** For example, 6 days costs ₹39,000. The single supplement is quoted separately.
- **School version:** **₹4,000 per student per day** (all-inclusive, 3-star or equivalent, 1 teacher free per 15 students).
- **Corporate or college offsite:** **₹8,000 per person per day.**

### Private journey (Golden Triangle, Rajasthan forts, Madhya Pradesh; private car, 4-star, scholar escort)
- **₹12,000 per person per day**, twin-sharing, minimum 2 guests. Display it as "from".

### Field school
- **₹3,000 per participant per day, residential.** A 5-day field school is ₹15,000 and includes stay, meals, field kit and certificate.
- **UG students:** ₹12,500 for 5 days.
- **Non-residential (day) option:** ₹1,800 per day.

### Summary of multipliers
- **Schools** pay about 50% of the public per-head price, with a minimum headcount.
- **Corporates** pay about 1.5–2× the public per-head price, with a minimum booking value.
- **Private groups** are priced so that the per-head price at full capacity equals the public seat price. Any smaller private group pays more per head, which keeps scheduled public departures attractive.

---

## 3. Display rules

1. **Always show the GST-inclusive single figure.** For example: "₹900 per person, incl. GST".
   - The Consumer Protection (E-Commerce) Rules 2020 require the "total price in single figure of any good or service, along with the breakup price ... showing all the compulsory and voluntary charges ... and the applicable tax". Source: https://thc.nic.in/Central%20Governmental%20Rules/Consumer%20Protection%20(E-Commerce)%20Rules,%202020.pdf
   - The CCPA's 2023 dark-patterns guidelines prohibit "drip pricing", where "elements of prices are not revealed upfront". Source: https://www.nls.ac.in/wp-content/uploads/2021/04/Dark-Patterns.pdf
   - The Legal Metrology "inclusive of all taxes" retail-sale-price definition applies to **packaged commodities**, not services. Cite it as a consumer expectation, not as the governing rule. Source: https://consumeraffairs.gov.in/public/upload/admin/cmsfiles/whatsnews/Book_on_Legal_Metrology_Packaged_Commodities_Rules%2C2011_with_all_amendments_whatsnews.pdf
   - At checkout and on the invoice, show the break-up: base amount + GST (18% or 5%) = total.
2. **Cards (listing view):** show one anchor price, with a unit and a "from" where the price varies.
   - Walks: "From ₹900 / person · Private groups ₹9,000".
   - Courses: "₹2,500 / learner · 8 evening sessions".
   - Tours: "From ₹6,500 / person / day".
   - Keep only one number in large type.
3. **Detail pages:** show three tiers side by side, with the middle option highlighted:
   - Walks: Public seat / Private group (up to 10) / Schools & corporates (per head, with minimum).
   - Courses: Early bird / Standard / Institution batch.

   This uses the compromise (middle-option) effect described in the decoy and three-tier pricing literature (https://www.simon-kucher.com/en/insights/positioning-decoy-pricing-shape-how-customers-perceive-value ; https://yukaichou.com/behavioral-analysis/decoy-effect-huber-payne-puto-asymmetric-dominance-pricing/).
4. **Use round prices**, not charm prices like ₹999. Wadhwa & Zhang (Journal of Consumer Research, 2015) found that rounded prices suit feeling-driven purchases. A 2001 study found that "99" endings hurt quality image for higher-quality sellers (https://www.beyondcostplus.com/blog/rounded-vs-non-rounded-charm-prices-new-research). Exception: limited-time offers may use precise numbers.
5. **Units to use, consistently:**
   - "per person" (walks, public)
   - "per group (up to N)" (private)
   - "per student, minimum N" (schools)
   - "per learner" and "per batch (up to 30)" (courses)
   - "per session" (institution lectures)
   - "per person per day, twin sharing" (tours)
6. **Minimums, stated beside the price:**
   - Schools: 30 students for walks and museum visits; 25 for workshops; 40 for day trips.
   - Corporate: minimum booking value.
   - Private journeys: 2 guests.
   - Courses: the batch runs at 10 or more learners. Otherwise Talaash gives a full refund or a transfer.
7. **Inclusions and exclusions on every page:**
   - Walks and museum visits: monument and museum tickets and camera fees are excluded and paid on site.
   - Workshops: materials included.
   - Day trips: state whether vehicle, tolls, parking, driver allowance, lunch and entries are included.
   - Tours: hotel category, sharing basis, meals, transport, entries, the expert escort, and the single supplement.
8. **Students, teachers and children:** show the student price next to the adult price. State the teacher ratio (1 free per 10 students for walks and visits, 1 per 15 for multi-day tours) and the children's age policy.
9. **Early bird:** show it as a struck-through standard price with a deadline or seat count. For example: "~~₹2,500~~ ₹2,200 till 1 Nov or first 20 seats." Never show an expired early-bird price.
10. **Institutions want a quote line.** Add "Request a school or corporate quote" with the per-head figure shown, because schools and companies budget per student or per employee. On request, provide a GST invoice that shows Talaash's GSTIN.
11. **Cancellation and rescheduling:** keep the terms short and next to the price.
