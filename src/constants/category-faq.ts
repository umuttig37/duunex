// Category-specific FAQ content for enhanced user support
// This extends the main FAQ system with category-specific questions

export interface CategoryFAQItem {
  question: string;
  answer: string;
  category: string;
  subcategory?: string;
  priority: number; // Higher number = more important
}

export const categorySpecificFAQ: CategoryFAQItem[] = [
  // Kokoonpano (Assembly) FAQs
  {
    question: "Mitä työkaluja tarvitsen huonekalujen kokoonpanoa varten?",
    answer: "Useimmat tekijät tuovat omat työkalut mukanaan. Jos haluat auttaa, yleisimmin tarvittavia työkaluja ovat ruuvimeisseli, akkuporakone, vasara ja mittanauha. Kerro tehtävän kuvauksessa mitä työkaluja sinulla on käytössä.",
    category: "kokoonpano",
    priority: 10
  },
  {
    question: "Kuinka kauan IKEA-kaluston kokoonpano kestää?",
    answer: "Kokoonpanoaika riippuu huonekalun koosta ja monimutkaisuudesta. Yksinkertainen hylly 30-60 minuuttia, kaappi 1-3 tuntia, keittiökalusteet voivat kestää useamman päivän. Kokenut tekijä tekee työn yleensä puolessa ajassa verrattuna omatoimiseen kokoonpanoon.",
    category: "kokoonpano",
    priority: 9
  },
  {
    question: "Voiko tekijä tuoda huonekalut mukaan kaupasta?",
    answer: "Monet tekijät voivat hakea huonekalut kaupasta lisämaksusta. Tämä kannattaa sopia etukäteen. Vaihtoehtoisesti voit tilata huonekalut suoraan kotiisi toimitettavaksi ennen tekijän saapumista.",
    category: "kokoonpano", 
    priority: 7
  },
  {
    question: "Entä jos huonekalussa on vikaa tai puuttuvia osia?",
    answer: "Jos huonekalussa on vikoja tai osia puuttuu, tekijä voi auttaa selvittämään tilannetta. IKEA:n kanssa on yleensä helppo tilata puuttuvia osia. Kustannukset puuttuvista osista maksaa asiakas, mutta tekijä voi auttaa niiden tilaamisessa.",
    category: "kokoonpano",
    priority: 6
  },

  // Kotitalous (Household) FAQs  
  {
    question: "Mitä kotitaloustyöt sisältävät?",
    answer: "Kotitaloustyöt voivat sisältää siivousta, järjestelyä, ruoanlaittoa, pyykinpesua, kodin organisointia, pieniä korjauksia ja muita arkisia askareita. Kerro tehtävän kuvauksessa tarkasti mitä apua tarvitset.",
    category: "kotitalous",
    priority: 10
  },
  {
    question: "Tuoko tekijä omat siivousvälineet?",
    answer: "Useimmat tekijät tuovat perussiivousvälineet mukanaan, mutta erikoistuotteet (kuten lattianhoitoaineet) kannattaa sopia etukäteen. Voit myös tarjota omia välineitäsi käyttöön.",
    category: "kotitalous",
    priority: 9
  },
  {
    question: "Voiko tekijä käsitellä ruokia ja käyttää keittiötäni?",
    answer: "Kyllä, jos sovitte ruoanlaitosta, tekijä voi käyttää keittiötäsi. Varmista että tekijä on luotettava ja keskustele hygienia- ja turvallisuusasioista etukäteen. Monet tekijät ovat ammattikeittiöitä kokenneita.",
    category: "kotitalous",
    priority: 8
  },
  {
    question: "Kuinka usein voin tilata samaa kotitaloustyöntekijää?",
    answer: "Voit sopia tekijän kanssa säännöllisestä yhteistyöstä. Monet tarjoavat alennuksia vakioasiakkaille. Säännölliset kotitaloustyöt voidaan sopia viikko-, kahden viikon tai kuukausittain.",
    category: "kotitalous", 
    priority: 7
  },

  // IT-apu (IT Help) FAQs
  {
    question: "Voiko IT-ongelman korjata etänä?",
    answer: "Monet IT-ongelmat voidaan ratkaista etäyhteydellä, mikä on usein nopeampaa ja halvempaa. Etäyhteys vaatii toimivan internetyhteyden ja luottamusta tekijään. Kerro tehtävässä oletko valmis etäapuun.",
    category: "it-apu",
    priority: 10
  },
  {
    question: "Kuinka paljon IT-apu maksaa?",
    answer: "IT-avun hinta vaihtelee ongelman monimutkaisuuden mukaan. Yksinkertaiset ongelmat 30-60€, ohjelmistoasennukset 50-100€, laajemmat projektit neuvoteltavissa. Etäapu on yleensä edullisempaa kuin paikan päällä käynti.",
    category: "it-apu",
    priority: 9
  },
  {
    question: "Menettänkö tiedostoni IT-avun aikana?",
    answer: "Luotettava IT-tekijä varmuuskopioi tärkeät tiedostot ennen työn aloittamista. Pyydä aina tekijää kertomaan mitä hän aikoo tehdä. Jos olet huolissaan, ota itse varmuuskopio ennen tekijän saapumista.",
    category: "it-apu",
    priority: 8
  },
  {
    question: "Opettaako tekijä myös laitteen käyttöä?",
    answer: "Monet IT-tekijät tarjoavat myös käytön opastusta. Tämä kannattaa sopia erikseen, sillä opetus voi vaatia enemmän aikaa. Hyvä tekijä selittää mitä tekee ja antaa vinkkejä vastaavien ongelmien välttämiseen.",
    category: "it-apu",
    priority: 7
  },

  // Siivous FAQs (Enhanced)
  {
    question: "Kuinka usein kotini pitäisi siivota ammattilaisen toimesta?",
    answer: "Riippuu perheen koosta ja elämäntilanteesta. Yleensä 1-2 kertaa kuukaudessa riittää perussiivoukseen. Kiireisillä perheillä viikottaiset käynnit ovat suosittuja. Kertaluonteinen perussiivous on hyvä lähtökohta säännölliselle siivoukselle.",
    category: "siivous",
    priority: 8
  },

  // Korjaukset FAQs (Enhanced)
  {
    question: "Millaiset korjaukset kuuluvat 'pieniin korjauksiin'?",
    answer: "Pieniä korjauksia ovat esim. hanojen tiivisteiden vaihto, sähkökytkimien asennus, reikien paikkaus seinässä, ovien säätö, kaakeleiden kiinnitys. Suuremmat remontit kuten putkien uusiminen tai sähköasennukset vaativat ammattilaiselta lupia.",
    category: "korjaukset",
    priority: 9
  },

  // Muutto FAQs (Enhanced)  
  {
    question: "Tarvitsenko muuttoauton vai tuleeko tekijä omalla autolla?",
    answer: "Riippuu muuton laajuudesta. Pienet muutot onnistuvat henkilöautolla, isommat tarvitsevat pakettiauton tai muuttoauton. Monet tekijät voivat järjestää sopivan auton tai antaa suosituksia autovuokraamoista.",
    category: "muutto",
    priority: 8
  },

  // Puutarha FAQs (Enhanced)
  {
    question: "Milloin on paras aika puutarhatöille?",
    answer: "Riippuu työstä: istutukset keväällä/syksyllä, leikkaukset talvella/keväällä, ruohonleikkuu kasvukaudella, lehtiharavat syksyllä. Kokenut puutarhuri osaa neuvoa parhaita ajankohtia eri töille ilmastovyöhykkeesi mukaan.",
    category: "puutarha",
    priority: 7
  }
];

// Helper functions for FAQ management
export function getFAQByCategory(category: string): CategoryFAQItem[] {
  return categorySpecificFAQ
    .filter(faq => faq.category === category)
    .sort((a, b) => b.priority - a.priority);
}

export function getTopFAQs(limit: number = 10): CategoryFAQItem[] {
  return categorySpecificFAQ
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

export function searchFAQ(query: string): CategoryFAQItem[] {
  const lowercaseQuery = query.toLowerCase();
  return categorySpecificFAQ
    .filter(faq => 
      faq.question.toLowerCase().includes(lowercaseQuery) ||
      faq.answer.toLowerCase().includes(lowercaseQuery) ||
      faq.category.toLowerCase().includes(lowercaseQuery)
    )
    .sort((a, b) => b.priority - a.priority);
}

// Category display names mapping
export const categoryDisplayNames: Record<string, string> = {
  'kokoonpano': 'Kokoonpano',
  'kotitalous': 'Kotitalous', 
  'it-apu': 'IT-apu',
  'siivous': 'Siivous',
  'korjaukset': 'Korjaukset',
  'muutto': 'Muutto',
  'puutarha': 'Puutarha',
  'lemmikinhoito': 'Lemmikinhoito',
  'lastenhoito': 'Lastenhoito',
  'opetus': 'Opetus',
  'valokuvaus': 'Valokuvaus',
  'suunnittelu': 'Suunnittelu',
  'muu': 'Muu'
};