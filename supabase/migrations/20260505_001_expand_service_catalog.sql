-- Expand Duunex service catalog with production-ready categories and subcategories.

DO $$
DECLARE
  top_level jsonb := $json$
  [
    {"slug":"siivous","name_fi":"Siivous","name_en":"Cleaning","description_fi":"Kodin, toimiston ja muuttotilanteiden siivouspalvelut yhdestä paikasta."},
    {"slug":"kotitalous","name_fi":"Kotitalous","name_en":"Household Help","description_fi":"Arjen sujuvoittamiseen tarkoitettu käytännön apu kodissa ja kotona asumisen tueksi."},
    {"slug":"kokoonpano","name_fi":"Kokoonpano","name_en":"Assembly","description_fi":"Huonekalujen, säilytysratkaisujen ja laitteiden kokoaminen turvallisesti ja siististi."},
    {"slug":"asennus","name_fi":"Asennus","name_en":"Installation","description_fi":"Valaisimet, verhokiskot, peilit ja muut kodin kiinnitykset paikoilleen huolellisesti."},
    {"slug":"korjaukset","name_fi":"Korjaukset","name_en":"Repairs","description_fi":"Pienet korjaukset, säädöt ja huollot, joilla koti pysyy käyttökunnossa."},
    {"slug":"maalaus","name_fi":"Maalaus","name_en":"Painting","description_fi":"Sisä- ja ulkopintojen maalaus sekä kevyt pintojen ehostus pienempiin projekteihin."},
    {"slug":"muutto","name_fi":"Muutto","name_en":"Moving","description_fi":"Muuttojen kantaminen, purku ja pakkausapu yksittäisestä huonekalusta koko asuntoon."},
    {"slug":"kuljetus","name_fi":"Kuljetus","name_en":"Delivery","description_fi":"Pienkuljetukset, noudot, kierrätyskuormat ja tavaroiden toimitus joustavasti."},
    {"slug":"puutarha","name_fi":"Puutarha","name_en":"Garden","description_fi":"Pihan hoito, kausityöt ja pienet ulkotyöt keväästä talveen."},
    {"slug":"it-apu","name_fi":"IT-apu","name_en":"IT Support","description_fi":"Tietokoneet, verkot ja laitteet käyttökuntoon kotona tai pienessä toimistossa."},
    {"slug":"lastenhoito","name_fi":"Lastenhoito","name_en":"Childcare","description_fi":"Arjen lastenhoito, iltavuorot ja satunnaiset apukäynnit perheiden tueksi."},
    {"slug":"lemmikinhoito","name_fi":"Lemmikinhoito","name_en":"Pet Care","description_fi":"Koirien ulkoilutus, kotikäynnit ja lemmikkien hoito silloin kun itse et ehdi."},
    {"slug":"opetus","name_fi":"Opetus","name_en":"Teaching","description_fi":"Yksityisopetus, läksyapu ja käytännön digituki lapsille, nuorille ja aikuisille."},
    {"slug":"valokuvaus","name_fi":"Valokuvaus","name_en":"Photography","description_fi":"Kuvauspalvelut perheille, tapahtumiin, asuntoihin ja pienyritysten tarpeisiin."},
    {"slug":"suunnittelu","name_fi":"Suunnittelu","name_en":"Design","description_fi":"Kevyt graafinen suunnittelu, somepohjat, logot ja pienet sisältöprojektit."},
    {"slug":"asiointiapu","name_fi":"Asiointiapu","name_en":"Errand Help","description_fi":"Kauppa-apu, noudot, saattaminen ja muut käytännön arjen asiat silloin kun itse et ehdi."},
    {"slug":"juhlat","name_fi":"Juhlat ja tapahtumat","name_en":"Events","description_fi":"Koristelu, tarjoiluapu, valmistelu ja purku yksityisiin juhliin tai pieniin tilaisuuksiin."},
    {"slug":"muu","name_fi":"Muu apu","name_en":"Other Help","description_fi":"Yksilölliset tehtävät, yhdistelmätyöt ja vaikeasti luokiteltavat toimeksiannot."}
  ]
  $json$::jsonb;
  subcategories jsonb := $json$
  [
    {"parent_slug":"siivous","slug":"kotisiivous","name_fi":"Kotisiivous","description_fi":"Perussiivous kotiin tai asuntoon."},
    {"parent_slug":"siivous","slug":"muuttosiivous","name_fi":"Muuttosiivous","description_fi":"Huolellinen siivous ennen luovutusta tai muuton jälkeen."},
    {"parent_slug":"siivous","slug":"ikkunanpesu","name_fi":"Ikkunanpesu","description_fi":"Ikkunat, puitteet ja karmit puhtaaksi."},
    {"parent_slug":"siivous","slug":"toimistosiivous","name_fi":"Toimistosiivous","description_fi":"Pienen toimiston tai työtilan siistiminen."},

    {"parent_slug":"kotitalous","slug":"kodin-jarjestely","name_fi":"Kodin järjestely","description_fi":"Kaapit, varastot ja huoneet hallintaan."},
    {"parent_slug":"kotitalous","slug":"pyykkihuolto","name_fi":"Pyykkihuolto","description_fi":"Pyykinpesu, kuivaus, viikkaus ja silitys."},
    {"parent_slug":"kotitalous","slug":"ruoanlaittoapu","name_fi":"Ruoanlaittoapu","description_fi":"Arjen ruoanlaitto tai aterioiden esivalmistelu."},
    {"parent_slug":"kotitalous","slug":"seniori-apu","name_fi":"Seniori-apu","description_fi":"Kevyt tuki kotona asumiseen ja arkeen."},

    {"parent_slug":"kokoonpano","slug":"ikea-kokoonpano","name_fi":"IKEA-kokoonpano","description_fi":"IKEA-kalusteiden kokoaminen ohjeiden mukaan."},
    {"parent_slug":"kokoonpano","slug":"toimistokalusteet","name_fi":"Toimistokalusteet","description_fi":"Työpisteet, sähköpöydät ja kaapit käyttövalmiiksi."},
    {"parent_slug":"kokoonpano","slug":"sanky-ja-sailytys","name_fi":"Sängyt ja säilytys","description_fi":"Sängyt, komerot, hyllyt ja lipastot paikoilleen."},
    {"parent_slug":"kokoonpano","slug":"kuntolaitteet","name_fi":"Kuntolaitteet","description_fi":"Kotikäyttöiset treenilaitteet koottuna turvallisesti."},

    {"parent_slug":"asennus","slug":"valaisinasennus","name_fi":"Valaisinasennus","description_fi":"Katto- ja seinävalaisimien kiinnitys paikoilleen."},
    {"parent_slug":"asennus","slug":"verhokiskot","name_fi":"Verhokiskot ja tangot","description_fi":"Verhokiskot, tangot ja kaihtimet paikoilleen."},
    {"parent_slug":"asennus","slug":"peilit-ja-naulakot","name_fi":"Peilit ja naulakot","description_fi":"Peilit, naulakot ja muut seinäkiinnitykset."},
    {"parent_slug":"asennus","slug":"kodinkoneet","name_fi":"Pienet kodinkoneasennukset","description_fi":"Mikrojen, tv-telineiden ja kevyiden laitteiden asennus."},

    {"parent_slug":"korjaukset","slug":"seinankiinnitykset","name_fi":"Seinäkiinnitykset","description_fi":"Hyllyt, taulut ja pienet seinäkiinnitykset."},
    {"parent_slug":"korjaukset","slug":"ovien-ja-kaappien-saadot","name_fi":"Ovien ja kaappien säädöt","description_fi":"Saranoiden kiristys ja ovien oikaisu."},
    {"parent_slug":"korjaukset","slug":"silikonisaumat","name_fi":"Silikonisaumat","description_fi":"Keittiön ja kylpyhuoneen silikonien uusinta."},
    {"parent_slug":"korjaukset","slug":"pienet-putkityot","name_fi":"Pienet putkityöt","description_fi":"Vuotavat liitokset, tiivisteet ja hanat."},

    {"parent_slug":"maalaus","slug":"sisamaalaus","name_fi":"Sisämaalaus","description_fi":"Huoneen tai seinäpinnan maalaus sisätiloissa."},
    {"parent_slug":"maalaus","slug":"paikkamaalaus","name_fi":"Paikkamaalaus","description_fi":"Pienet kolhut, kulumat ja maalipinnan korjaukset."},
    {"parent_slug":"maalaus","slug":"listat-ja-ovet","name_fi":"Listat ja ovet","description_fi":"Listojen, karmien ja ovien maalaus."},
    {"parent_slug":"maalaus","slug":"ulkomaalaus","name_fi":"Ulkomaalaus","description_fi":"Pienet ulkopinnat, aidat ja terassit."},

    {"parent_slug":"muutto","slug":"kantoapu","name_fi":"Kantoapu","description_fi":"Laatikot ja huonekalut autoon tai kotiin."},
    {"parent_slug":"muutto","slug":"pakkausapu","name_fi":"Pakkausapu","description_fi":"Tavaroiden suojaus, pakkaus ja merkintä."},
    {"parent_slug":"muutto","slug":"purkuapu","name_fi":"Purkuapu","description_fi":"Tavaroiden purku uuteen asuntoon."},
    {"parent_slug":"muutto","slug":"raskaat-esineet","name_fi":"Raskaat esineet","description_fi":"Sohvat, kaapit, pesukoneet ja muut painavat tavarat."},

    {"parent_slug":"kuljetus","slug":"pikkukuljetus","name_fi":"Pikkukuljetus","description_fi":"Nopea tavaran siirto paikasta toiseen."},
    {"parent_slug":"kuljetus","slug":"nouto-ja-toimitus","name_fi":"Nouto ja toimitus","description_fi":"Myymälä- tai verkkokauppanouto kotiin."},
    {"parent_slug":"kuljetus","slug":"kierratyskuorma","name_fi":"Kierrätyskuorma","description_fi":"Tarpeettomien tavaroiden kuljetus kierrätykseen."},
    {"parent_slug":"kuljetus","slug":"huonekalukuljetus","name_fi":"Huonekalukuljetus","description_fi":"Yksittäinen sohva, pöytä tai muu isompi tavara."},

    {"parent_slug":"puutarha","slug":"nurmikonleikkuu","name_fi":"Nurmikon leikkuu","description_fi":"Nurmikko, reunat ja kevyt siistiminen."},
    {"parent_slug":"puutarha","slug":"haravointi","name_fi":"Haravointi","description_fi":"Lehdet, oksat ja pihan yleissiivous."},
    {"parent_slug":"puutarha","slug":"pensaiden-leikkaus","name_fi":"Pensaiden leikkaus","description_fi":"Pensasaidat ja koristepensaat kuntoon."},
    {"parent_slug":"puutarha","slug":"lumityot","name_fi":"Lumityöt","description_fi":"Lumityöt, hiekoitus ja kulkuväylien avaaminen."},

    {"parent_slug":"it-apu","slug":"tietokoneen-kayttoonotto","name_fi":"Tietokoneen käyttöönotto","description_fi":"Uusi laite valmiiksi käyttöön."},
    {"parent_slug":"it-apu","slug":"wifi-vianhaku","name_fi":"WiFi-vianhaku","description_fi":"Hitaan tai pätkivän verkon selvitys."},
    {"parent_slug":"it-apu","slug":"tulostin-ja-oheislaitteet","name_fi":"Tulostin ja oheislaitteet","description_fi":"Tulostimet, näytöt ja muut oheislaitteet käyttöön."},
    {"parent_slug":"it-apu","slug":"puhelinopastus","name_fi":"Puhelinopastus","description_fi":"Älypuhelimen tai tabletin perusopastus."},

    {"parent_slug":"lastenhoito","slug":"iltahoito","name_fi":"Iltahoito","description_fi":"Lastenvahti illaksi tai viikonlopuksi."},
    {"parent_slug":"lastenhoito","slug":"iltapaivahoito","name_fi":"Iltapäivähoito","description_fi":"Koulun tai päiväkodin jälkeinen apu."},
    {"parent_slug":"lastenhoito","slug":"harrastuksiin-vienti","name_fi":"Harrastuksiin vienti","description_fi":"Saattaminen harrastuksiin ja takaisin."},
    {"parent_slug":"lastenhoito","slug":"perheen-arki","name_fi":"Perheen arkiapu","description_fi":"Yhdistelmä lastenhoitoa ja kevyttä kotiapua."},

    {"parent_slug":"lemmikinhoito","slug":"koiran-ulkoilutus","name_fi":"Koiran ulkoilutus","description_fi":"Säännöllinen tai kertaluonteinen ulkoilutus."},
    {"parent_slug":"lemmikinhoito","slug":"kissan-kotikaynti","name_fi":"Kissan kotikäynti","description_fi":"Ruokinta, hiekkalaatikko ja seurustelu."},
    {"parent_slug":"lemmikinhoito","slug":"lemmikkivahti","name_fi":"Lemmikkivahti","description_fi":"Useamman tunnin tai päivän hoitojärjestely."},
    {"parent_slug":"lemmikinhoito","slug":"lemmikin-kuljetus","name_fi":"Lemmikin kuljetus","description_fi":"Kuljetus eläinlääkäriin tai hoitopaikkaan."},

    {"parent_slug":"opetus","slug":"matematiikka","name_fi":"Matematiikka","description_fi":"Tukiopetus alakoulusta lukioon."},
    {"parent_slug":"opetus","slug":"kielet","name_fi":"Kielet","description_fi":"Englanti, ruotsi ja muut kielet."},
    {"parent_slug":"opetus","slug":"digituki","name_fi":"Digituki","description_fi":"Tietokoneen, puhelimen ja verkkoasioinnin perusopastus."},
    {"parent_slug":"opetus","slug":"ohjelmisto-opastus","name_fi":"Ohjelmisto-opastus","description_fi":"Toimisto-ohjelmat, etäpalaverit ja perussovellukset."},

    {"parent_slug":"valokuvaus","slug":"perhekuvaus","name_fi":"Perhekuvaus","description_fi":"Perhe- ja parikuvaukset luonnollisesti."},
    {"parent_slug":"valokuvaus","slug":"tapahtumakuvaus","name_fi":"Tapahtumakuvaus","description_fi":"Juhlat, valmistujaiset ja pienet tapahtumat."},
    {"parent_slug":"valokuvaus","slug":"tuotekuvaus","name_fi":"Tuotekuvaus","description_fi":"Verkkokaupan tai somen tuotekuvat."},
    {"parent_slug":"valokuvaus","slug":"asuntokuvaus","name_fi":"Asuntokuvaus","description_fi":"Asunnon tai tilan myynti- ja vuokrakuvat."},

    {"parent_slug":"suunnittelu","slug":"logot-ja-ilme","name_fi":"Logot ja ilme","description_fi":"Logo, värit ja perusbrändi alkuun."},
    {"parent_slug":"suunnittelu","slug":"somepohjat","name_fi":"Somepohjat","description_fi":"Instagram-, Facebook- ja mainospohjat."},
    {"parent_slug":"suunnittelu","slug":"esitteet-ja-flyerit","name_fi":"Esitteet ja flyerit","description_fi":"Paino- tai pdf-materiaalit käyttövalmiiksi."},
    {"parent_slug":"suunnittelu","slug":"cv-ja-portfolio","name_fi":"CV ja portfolio","description_fi":"Selkeä ja moderni työnhakumateriaali."},

    {"parent_slug":"asiointiapu","slug":"kauppa-apu","name_fi":"Kauppa-apu","description_fi":"Ruokaostokset tai päivittäiset hankinnat puolestasi."},
    {"parent_slug":"asiointiapu","slug":"noutopalvelu","name_fi":"Noutopalvelu","description_fi":"Tavaroiden, tilausten tai asiakirjojen nouto."},
    {"parent_slug":"asiointiapu","slug":"saattaja-apu","name_fi":"Saattaja-apu","description_fi":"Saattaminen asioille, tapaamisiin tai palveluihin."},
    {"parent_slug":"asiointiapu","slug":"apteekki-ja-posti","name_fi":"Apteekki ja posti","description_fi":"Kevyt asiointi virastoissa, apteekissa tai postissa."},

    {"parent_slug":"juhlat","slug":"koristelu","name_fi":"Koristelu","description_fi":"Tilojen koristelu ja valmistelu juhlaan."},
    {"parent_slug":"juhlat","slug":"tarjoiluapu","name_fi":"Tarjoiluapu","description_fi":"Apu tarjoiluun, kattaukseen ja keittiöön."},
    {"parent_slug":"juhlat","slug":"purku-ja-siivous","name_fi":"Purku ja siivous","description_fi":"Jälkien siivous ja tilan palautus."},
    {"parent_slug":"juhlat","slug":"juhlapaikan-jarjestely","name_fi":"Tilan järjestely","description_fi":"Pöydät, tuolit ja somistus paikoilleen."},

    {"parent_slug":"muu","slug":"yhdistelmatyo","name_fi":"Yhdistelmätyö","description_fi":"Useita pieniä tehtäviä samassa käynnissä."},
    {"parent_slug":"muu","slug":"erikoispyynto","name_fi":"Erikoispyyntö","description_fi":"Tavallisuudesta poikkeava tai yksilöllinen tehtävä."},
    {"parent_slug":"muu","slug":"pikainen-apu","name_fi":"Pikainen apu","description_fi":"Nopea apu yksittäiseen tilanteeseen."},
    {"parent_slug":"muu","slug":"selvitettava-tyo","name_fi":"Selvitettävä työ","description_fi":"Työ, jonka laajuus tarkentuu keskustelussa."}
  ]
  $json$::jsonb;
  item jsonb;
  parent_id uuid;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(top_level)
  LOOP
    INSERT INTO categories (
      name,
      name_fi,
      name_en,
      slug,
      description,
      description_fi,
      icon_url,
      parent_category_id
    )
    VALUES (
      item->>'name_fi',
      item->>'name_fi',
      item->>'name_en',
      item->>'slug',
      item->>'description_fi',
      item->>'description_fi',
      NULL,
      NULL
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      name_fi = EXCLUDED.name_fi,
      name_en = EXCLUDED.name_en,
      description = EXCLUDED.description,
      description_fi = EXCLUDED.description_fi,
      parent_category_id = NULL;
  END LOOP;

  FOR item IN SELECT * FROM jsonb_array_elements(subcategories)
  LOOP
    SELECT id INTO parent_id
    FROM categories
    WHERE slug = item->>'parent_slug'
    LIMIT 1;

    IF parent_id IS NOT NULL THEN
      INSERT INTO categories (
        name,
        name_fi,
        name_en,
        slug,
        description,
        description_fi,
        icon_url,
        parent_category_id
      )
      VALUES (
        item->>'name_fi',
        item->>'name_fi',
        NULL,
        item->>'slug',
        item->>'description_fi',
        item->>'description_fi',
        NULL,
        parent_id
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        name_fi = EXCLUDED.name_fi,
        description = EXCLUDED.description,
        description_fi = EXCLUDED.description_fi,
        parent_category_id = EXCLUDED.parent_category_id;
    END IF;
  END LOOP;
END $$;
