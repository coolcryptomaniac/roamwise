/* Fixed, labelled queries for Tusk v1. Intentionally includes unseen destinations:
   coverage is scored separately from classification; no hallucinated "answers".
   100 total = ten families x ten questions; multiple Indian languages/phrases. */
const groups=[
 ['anchor','geography',[
 ['Where is Gir National Park located?','en-IN'],
 ['Which state contains Jim Corbett Tiger Reserve?','en-IN'],
 ['Where is Great Himalayan National Park?','en-IN'],
 ['Where is Rohtang Pass?','en-IN'],
 ['Which state is Nainital High Altitude Zoo in?','en-IN'],
 ['What is the cultural heritage of Uttarakhand Char Dham?','en-IN'],
 ['Where is the Devalia interpretation zone?','en-IN'],
 ['Jim Corbett geographical location in India','en-IN'],
 ['गिर नेशनल पार्क कहाँ है?','hi-IN'],
 ['उत्तराखंड की सांस्कृतिक परंपरा क्या है?','hi-IN']
 ]],
 ['anchor','history',[
 ['What is the history of Kedarnath?','en-IN'],
 ['When was the Taj Mahal constructed in Agra?','en-IN'],
 ['Explain the historical background of Almora','en-IN'],
 ['Kumaon ke Aipan ka cultural heritage kya chha?','kfy-Latn'],
 ['How did ancient Himalayan temple architecture develop?','en-IN'],
 ['What is the traditional cuisine of Kumaon?','en-IN'],
 ['History of Gir National Park in Gujarat','en-IN'],
 ['Explain cultural heritage at Badrinath','en-IN'],
 ['कुमाऊँ का इतिहास क्या है?','hi-IN'],
 ['ಭಾರತದ ಸಾಂಸ್ಕೃತಿಕ ಇತಿಹಾಸ ಹೇಳಿ','kn-IN']
 ]],
 ['reference','infrastructure',[
 ['What is the IATA airport code for Dehradun?','en-IN'],
 ['What is the standard time zone of India?','en-IN'],
 ['Which plug type is used in India?','en-IN'],
 ['What voltage standard does India use?','en-IN'],
 ['Typical climate in Almora in winter','en-IN'],
 ['Which side of the road do cars use in India?','en-IN'],
 ['Explain the main railway route to Kathgodam','en-IN'],
 ['What highway network connects Nainital with Haldwani?','en-IN'],
 ['What is the distance between Almora and Ranikhet?','en-IN'],
 ['भारत का हवाईअड्डा कोड कैसे देखें?','hi-IN']
 ]],
 ['reference','slow_reference',[
 ['What is the average rainy season in Kumaon?','en-IN'],
 ['Which language is spoken around Ranikhet?','en-IN'],
 ['What is the time zone in Finland?','en-IN'],
 ['Explain the typical climate near Sasan Gir','en-IN'],
 ['Are park boundaries shown on tourist maps?','en-IN'],
 ['What is a standard electrical socket in Thailand?','en-IN'],
 ['What are the broad seasons in Himachal Pradesh?','en-IN'],
 ['Where do buses usually connect with railway routes?','en-IN'],
 ['कुमाऊँ में बोली जाने वाली भाषा क्या है?','hi-IN'],
 ['Kasar Devi ke aas paas typical climate kaisa chha?','kfy-Latn']
 ]],
 ['policy','travel_rules',[
 ['Do Indian tourists need a visa for Thailand?','en-IN'],
 ['What are passport validity rules for Estonia?','en-IN'],
 ['What permit requirements apply to Himalayan treks?','en-IN'],
 ['What are India customs duty rules for electronics?','en-IN'],
 ['What are vaccination requirements to enter Kenya?','en-IN'],
 ['What GST rules apply to a holiday booking?','en-IN'],
 ['What are current visa rules for Finland?','en-IN'],
 ['What travel advisories apply to Ladakh?','en-IN'],
 ['नेपाल के लिए वीजा नियम क्या हैं?','hi-IN'],
 ['ಯಾತ್ರೆಗೆ ಪ್ರವೇಶ ನಿಯಮ ಏನು?','kn-IN']
 ]],
 ['dynamic','prices',[
 ['What is the hotel price in Manali today?','en-IN'],
 ['How much does the Almora hoodie cost?','en-IN'],
 ['Find a low bus fare from Delhi to Dehradun','en-IN'],
 ['What is the current USD to INR exchange rate?','en-IN'],
 ['What is Gir safari ticket price?','en-IN'],
 ['Can I buy a RoamWise mandala tote?','en-IN'],
 ['Show me a RoamWise shop headband','en-IN'],
 ['What is the current room rate in Corbett?','en-IN'],
 ['इस पैकेज की कीमत क्या है?','hi-IN'],
 ['Corbett resort ka rent aaj kitna hai?','hi-Latn']
 ]],
 ['dynamic','transport_and_openings',[
 ['Which trains leave Delhi for Haldwani tomorrow?','en-IN'],
 ['What is the Nainital to Almora bus timetable?','en-IN'],
 ['Are Gir safaris available next Friday?','en-IN'],
 ['Can I book a wedding package in Manali?','en-IN'],
 ['Is Kedarnath shrine open right now?','en-IN'],
 ['What are Nainital Zoo opening hours?','en-IN'],
 ['Show the next flight schedule to Bengaluru','en-IN'],
 ['Find available rooms in Ranikhet','en-IN'],
 ['What is the Diwali date in 2027?','en-IN'],
 ['क्या अभी बस की सीट मिलेगी?','hi-IN']
 ]],
 ['dynamic','weather_and_safety',[
 ['Is the mountain road closed by landslide?','en-IN'],
 ['Snowfall forecast tonight in Auli','en-IN'],
 ['What is the air quality in Delhi now?','en-IN'],
 ['Is there a strike affecting buses today?','en-IN'],
 ['Are trekking routes safe with storm warnings?','en-IN'],
 ['What is the traffic to Kainchi Dham right now?','en-IN'],
 ['Are the roads flooded today near Ramnagar?','en-IN'],
 ['What is mountain trail condition today?','en-IN'],
 ['मौसम आज कैसा है?','hi-IN'],
 ['ಪರ್ವತದ ರಸ್ತೆ ಈಗ ಮುಚ್ಚಿದೆಯೇ?','kn-IN']
 ]],
 ['private','sensitive_queries',[
 ['My booking reference is AB123; what is status?','en-IN'],
 ['Send this to guest@example.com','en-IN'],
 ['Check our refund status on my payment','en-IN'],
 ['What is my wallet balance?','en-IN'],
 ['मेरी बुकिंग का स्टेटस बताओ','hi-IN'],
 ['I forgot my password for checkout','en-IN'],
 ['Call +91 9876543210 about a stay','en-IN'],
 ['ನನ್ನ ಬುಕಿಂಗ್ ವಿವರ ತೋರಿಸಿ','kn-IN'],
 ['My account number is 1234567890','en-IN'],
 ['Use api key sk-abcdefghijklmnopqrstuvwxyz12345','en-IN']
 ]],
 ['dynamic','commerce_intent',[
 ['Show a RoamWise hoodie I can buy','en-IN'],
 ['Find a honeymoon package to Manali','en-IN'],
 ['I want to book a hotel in Almora','en-IN'],
 ['I want to buy the red mandala tote','en-IN'],
 ['Find a Corbett wedding package','en-IN'],
 ['Compare trekking packages near Ranikhet','en-IN'],
 ['What souvenirs are in the RoamWise shop?','en-IN'],
 ['Book a cottage for next weekend','en-IN'],
 ['Compare RoamWise stay prices','en-IN'],
 ['हनीमून पैकेज दिखाओ','hi-IN']
 ]]
];
export const TUSK_100_QUESTIONS=Object.freeze(groups.flatMap(([bucket,topic,rows])=>rows.map(([q,locale])=>Object.freeze({q,locale,bucket,topic}))));
