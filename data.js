/* =========================================================
   DADES · Codi 3 del SEM (font: "CODI 3. Codificació pròpia del SEM")
   + Codi INTERCO (alfabet fonètic internacional)
   Camps de cada codi:
     c  = codi tal com s'escriu
     m  = significat oficial
     s  = situació d'exemple (per a preguntes d'escenari)
     k  = paraules clau per corregir el significat escrit (grups; | = alternatives)
     nk = paraules que NO hi poden sortir
     h  = pista / mnemotècnia
     a  = altres maneres acceptades d'escriure el codi
   ========================================================= */

const C3_UNITS = [
  {
    id: 'u1', icon: '🚑', name: 'El flux del servei',
    desc: "Els codis que faràs servir a cada servei, de principi a fi.",
    pista: "Segueix l'ordre d'un servei: 3.3 operatiu → 3.4 arribo al lloc → 3.5 informo → 3.6 finalitzo → 3.10 torno a base. Si el cancel·len: 3.11.",
    items: [
      { c: '3.3', m: 'Recurs operatiu', s: "Heu acabat el descans i la unitat torna a estar disponible per a nous serveis.", k: ['operatiu|operativa|disponible'], nk: ['no', 'finalitz', 'truc', 'telef', 'assist', 'cobr', 'fora', 'inoperativ'] },
      { c: '3.4', m: "Arribada al lloc de l'incident", s: "Acabeu d'arribar a l'adreça on us han activat.", k: ['arrib'], nk: ['temps', 'estimat', 'trobada', 'segur'], h: "Ordre del servei: 3.3 operatiu → 3.4 arribo." },
      { c: '3.5', m: "Informació de la situació o dades de l'afectat", s: "Voleu transmetre al CECOS com està el pacient i les seves dades.", k: ['informa|dades|situacio'], nk: ['polic', 'risc', 'coorden', 'localitz', 'atent', 'espera', 'imv', 'imvi', 'unitats'] },
      { c: '3.6', m: 'Finalització del servei. La unitat es troba operativa', s: "Heu deixat el pacient a l'hospital, el servei s'ha acabat i torneu a estar operatius.", k: ['finalitz|acaba|fi|final'], nk: ['emocional', 'impacte', 'inoperativ'] },
      { c: '3.10', m: 'Retorn a Base', s: "Sense cap servei pendent, us dirigiu cap a la vostra base.", k: ['retorn|torn|tornada', 'base'], h: "3.10 (u-zero) és Retorn a Base. No el confonguis amb 3.1 O (lletra O, trucada Operativa)." },
      { c: '3.11', m: 'Anul·lació del servei', s: "El CECOS us comunica que el servei queda cancel·lat.", k: ['anul|cancel'] },
    ],
  },
  {
    id: 'u2', icon: '☎️', name: 'Trucades',
    desc: "Totes les variants de 3.1: quan cal parlar per telèfon.",
    pista: "3.1 = telèfon. La lletra diu el tipus: O = Operativa · S = Sanitària · M = suport Mèdic · E = a tres amb l'ECO · MC = Metge de Crítics.",
    items: [
      { c: '3.1', m: 'Trucada telefònica', s: "Necessiteu parlar per telèfon amb el CECOS (sense especificar el motiu).", k: ['truc|telef'], nk: ['operativ', 'sanitar', 'critic', 'eco', 'suport', 'metge', 'medic'] },
      { c: '3.1 O', m: 'Trucada telefònica Operativa', s: "Voleu una trucada per resoldre un tema operatiu: logística, adreça, recursos...", k: ['truc|telef', 'operativ'], h: "Lletra O d'Operativa, NO un zero! (3.10 és Retorn a Base)." },
      { c: '3.1 S', m: 'Trucada telefònica Sanitària', s: "Voleu una trucada per comentar un tema sanitari del pacient.", k: ['truc|telef', 'sanitar'] },
      { c: '3.1 M', m: 'Trucada telefònica suport mèdic des de CECOS', s: "Necessiteu que un metge del CECOS us doni suport per telèfon.", k: ['truc|telef|suport', 'metge|medic'], nk: ['critic', 'alta', 'trasllat'] },
      { c: '3.1 E', m: 'Trucada a 3 amb CECOS i ECO', s: "Cal una trucada a tres bandes: vosaltres, el CECOS i l'ECO.", k: ['eco'], h: "E d'ECO: trucada a tres." },
      { c: '3.1 MC', m: 'Trucada a metge de CECOS de crítics adult / pediàtric', s: "Teniu un pacient crític (adult o pediàtric) i necessiteu parlar amb el metge de crítics del CECOS.", k: ['critic'], h: "MC = Metge de Crítics." },
    ],
  },
  {
    id: 'u3', icon: '💔', name: 'Aturada cardiorespiratòria',
    desc: "La família del 3.0 i l'èxitus.",
    pista: "3.0 = el cor a zero. 3.01 recuperada (u: torna a bategar) · 3.02 no recuperada · 3.03 perllongada / Cor Aturat · 3.05 RCP extracorpòria. Si mor: 3.8 Èxitus.",
    items: [
      { c: '3.0', m: 'Aturada cardiorespiratòria', s: "Trobeu el pacient en aturada: no respira i no té pols.", k: ['aturada|parada|acr|cardiorespirat'], nk: ['recuper', 'perllong', 'prolong', 'extracorp'] },
      { c: '3.01', m: 'Aturada cardiorespiratòria Recuperada', s: "Després de la RCP, el pacient recupera el pols.", k: ['recuper'], nk: ['no', 'sense'], h: "01 → u: el cor torna a bategar." },
      { c: '3.02', m: 'Aturada cardiorespiratòria No Recuperada', s: "Malgrat les maniobres de RCP, el pacient no recupera el pols.", k: ['no|sense', 'recuper'] },
      { c: '3.03', m: 'ACR perllongada. Activació del Protocol de Cor Aturat', s: "La RCP s'allarga i s'activa el Protocol de Cor Aturat.", k: ['perllong|prolong|cor aturat'] },
      { c: '3.05', m: 'ACR amb criteris de RCP extracorpòria', s: "El pacient en ACR compleix criteris per a RCP extracorpòria.", k: ['extracorp|ecmo'] },
      { c: '3.8', m: 'Èxitus', s: "Es constata la defunció del pacient.", k: ['exitus|mort|defuncio|mor'], h: "El 8 tombat és ∞: l'eternitat → èxitus." },
    ],
  },
  {
    id: 'u4', icon: '⛔', name: 'Recurs no operatiu',
    desc: "Per què la unitat deixa d'estar disponible.",
    pista: "NO operatiu per: 3.2 descans · 3.9 accident (F = personal Ferit) · 3.16 combustible · 3.17 material sanitari · 3.60 temps de disposició lliure · 3.62 impacte emocional.",
    items: [
      { c: '3.2', m: 'Recurs no operatiu per descans', s: "L'equip ha de fer el descans i la unitat deixa d'estar operativa.", k: ['descans'] },
      { c: '3.9', m: 'Recurs no operatiu per accident', s: "La vostra ambulància ha tingut un accident i no pot continuar (ningú de l'equip ferit).", k: ['accident'], nk: ['lesion', 'ferit', 'transit'] },
      { c: '3.9 F', m: 'Recurs no operatiu per accident amb personal assistencial lesionat', s: "L'ambulància ha tingut un accident i un membre de l'equip ha resultat ferit.", k: ['accident|lesion|ferit', 'lesion|ferit|personal'], h: "F de Ferit." },
      { c: '3.16', m: 'Recurs no operatiu per reposar combustible', s: "Us queda poc combustible i heu d'anar a repostar.", k: ['combust|benzin|gasoil|diesel|repostar'], nk: ['material'] },
      { c: '3.17', m: 'Recurs no operatiu per reposar material sanitari', s: "Us heu quedat sense material sanitari i l'heu de reposar.", k: ['material'] },
      { c: '3.60', m: 'La Unitat sol·licita temps de disposició lliure', s: "La unitat demana una estona de temps de disposició lliure.", k: ['lliure|disposicio'] },
      { c: '3.62', m: "Unitat finalitza servei i resta inoperativa temporalment per contingut d'alt impacte emocional", s: "Després d'un servei molt dur emocionalment, l'equip queda temporalment inoperatiu.", k: ['emocional|impacte'] },
    ],
  },
  {
    id: 'u5', icon: '🚓', name: 'Policia i seguretat',
    desc: "La família del 3.7: quan cal ajut policial.",
    pista: "3.7 = policia. GU/PL = Guàrdia Urbana / Policia Local · ME = Mossos d'Esquadra · 3.70 = URGENT, risc físic (el zero és la sirena!) · 3.71 = violència sexual · 3.73 = punt de seguretat amb la policia.",
    items: [
      { c: '3.7', m: 'Es precisa ajut policial', s: "Necessiteu presència policial al lloc (sense especificar el cos).", k: ['polic'], nk: ['urgent', 'mossos', 'urbana', 'local', 'risc', 'seguretat', 'trobada'] },
      { c: '3.7 GU/PL', m: 'Es precisa ajut policial - Guàrdia Urbana Local / Policia local', s: "Necessiteu la Guàrdia Urbana o la Policia Local.", k: ['urbana|policia local|gu|pl'], a: ['3.7GU', '3.7PL', '3.7 GU', '3.7 PL'], h: "GU = Guàrdia Urbana · PL = Policia Local." },
      { c: '3.7 ME', m: "Es precisa ajut policial - Mossos d'Esquadra", s: "Necessiteu els Mossos d'Esquadra.", k: ['mossos|esquadra|me'], h: "ME = Mossos d'Esquadra." },
      { c: '3.70', m: 'Es precisa ajut policial URGENT. Situació de risc físic', s: "Us estan agredint o hi ha un risc físic per a l'equip: necessiteu policia URGENT.", k: ['urgent|risc'], nk: ['toxic', 'intoxicat', 'assistencials'], h: "El 0 és la sirena: 3.7 policia → 3.70 policia URGENT." },
      { c: '3.71', m: 'Incident amb possible afectat per violència sexual', s: "Ateneu una persona que podria haver patit violència sexual.", k: ['sexual'] },
      { c: '3.73', m: 'Punt de Seguretat indicat per CECOS. Trobada amb cossos policials', s: "El CECOS us indica un punt de seguretat on trobar-vos amb els cossos policials.", k: ['seguretat|punt', 'polic|cossos|seguretat'] },
    ],
  },
  {
    id: 'u6', icon: '📡', name: 'Ajuts i ràdio',
    desc: "Demanar més recursos i gestionar la comunicació.",
    pista: "3.13 ràdio · 3.14 una altra unitat · 3.15 relleu de l'equip · 3.18 Bombers · 3.19 USVB · 3.20 resteu atents (espereu dades) · 3.21 doneu coordenades.",
    items: [
      { c: '3.13', m: "Fer ús correcte de l'equip de ràdio", s: "Algú fa un mal ús del canal i se li recorda que utilitzi correctament la ràdio.", k: ['radio|emisora|canal'] },
      { c: '3.14', m: "Es precisa ajut d'una altra Unitat (s'especificarà el tipus)", s: "Necessiteu una altra unitat de suport (cal especificar de quin tipus).", k: ['altr|mes', 'unitat|recurs|ambulanc|suport|ajut'], nk: ['usvb', 'bomber'] },
      { c: '3.15', m: "Relleu de l'equip assistencial", s: "Arriba el canvi de torn i l'equip assistencial és rellevat.", k: ['relleu|rellev|canvi'] },
      { c: '3.18', m: 'Es precisa ajut de Bombers', s: "Hi ha un incendi o una persona atrapada: necessiteu Bombers.", k: ['bomber'] },
      { c: '3.19', m: 'Es precisa una Unitat de Transport Sanitari (USVB)', s: "Necessiteu una ambulància de Suport Vital Bàsic (USVB) per a un trasllat.", k: ['usvb|transport|basic'] },
      { c: '3.20', m: 'Resteu atents en espera de noves dades o informació', s: "El CECOS us demana que us quedeu atents perquè arribaran més dades.", k: ['atent|espera|pendent'] },
      { c: '3.21', m: 'Donar coordenades de situació o localització de la unitat', s: "El CECOS us demana on sou exactament.", k: ['coorden|localitz|ubicacio|on som|on sou'] },
    ],
  },
  {
    id: 'u7', icon: '🩹', name: 'El pacient (I)',
    desc: "Del 3.23 al 3.29: què li passa al pacient.",
    pista: "3.23 trànsit · 3.24 indigent / sociopatia · 3.25 intoxicació enòlica (alcohol) · 3.26 sobredosi de drogues · 3.28 psiquiàtric agitat · 3.29 caiguda / trauma.",
    items: [
      { c: '3.23', m: 'Accident de trànsit', s: "Col·lisió entre dos vehicles a la carretera.", k: ['transit|trafic|cotxe|vehicle|collisio'] },
      { c: '3.24', m: 'Indigent / Sociopatia', s: "Persona sense llar amb una problemàtica social.", k: ['indigent|sociopat|social|sense llar'] },
      { c: '3.25', m: 'Intoxicació enòlica', s: "Jove molt begut, amb intoxicació per alcohol.", k: ['enolic|alcohol|etilic|begut|borrat'] },
      { c: '3.26', m: 'Sobredosi per drogues', s: "Pacient amb una sobredosi de drogues.", k: ['sobredos|drog'] },
      { c: '3.28', m: 'Pacient amb patologia psiquiàtrica. Es troba agitat', s: "Pacient amb patologia psiquiàtrica que està molt agitat.", k: ['psiquiatr|agitat'] },
      { c: '3.29', m: 'Caiguda / Trauma a via pública / domicili', s: "Persona gran que ha caigut a casa seva.", k: ['caigud|caigut|trauma'] },
    ],
  },
  {
    id: 'u8', icon: '🫀', name: 'El pacient (II)',
    desc: "Del 3.30 al 3.35: més situacions clíniques.",
    pista: "3.30 IAM / angor · 3.31 intent d'autòlisi · 3.32 inconscient · 3.33 dispnea aguda · 3.34 intoxicat amb risc per a l'equip · 3.35 mobilització.",
    items: [
      { c: '3.30', m: 'IAM / Angor', s: "Dolor toràcic opressiu: sospita d'infart.", k: ['iam|angor|infart|angina'] },
      { c: '3.31', m: "Intent d'autòlisi", s: "Pacient que ha intentat treure's la vida.", k: ['autolisi|suicid'] },
      { c: '3.32', m: 'Pacient inconscient', s: "Pacient que no respon als estímuls, però respira.", k: ['inconscient'] },
      { c: '3.33', m: 'Pacient amb dispnea aguda', s: "Pacient amb molta dificultat per respirar.", k: ['dispnea|respir|ofeg'] },
      { c: '3.34', m: 'Pacient intoxicat. Exposició potencial a tòxics de risc pels assistencials', s: "Pacient intoxicat per un producte que també pot afectar l'equip (gas, pesticides...).", k: ['toxic|intoxicat'], nk: ['enolic', 'alcohol', 'drog'] },
      { c: '3.35', m: 'Mobilització', s: "Comuniqueu una mobilització.", k: ['mobilitz'] },
    ],
  },
  {
    id: 'u9', icon: '🏥', name: 'Alta, trasllat i estat',
    desc: "Altes, trasllats i estat de la unitat durant el servei.",
    pista: "3.22 = alta (M = Mèdica; sense lletra = voluntària / rebuig). 3.5x: 3.50 temps estimat d'arribada · 3.51 trasllat AMB metge/infermer · 3.52 SENSE · 3.53 assistint però operativa · 3.54 cobrint zona fora de base.",
    items: [
      { c: '3.22 M', m: 'Alta mèdica', s: "El metge dona l'alta al pacient al mateix lloc: no cal trasllat.", k: ['alta', 'medic'], h: "M de Mèdica: ho decideix el metge." },
      { c: '3.22', m: 'Alta voluntària / Rebuig assistència', s: "El pacient es nega a ser atès o traslladat.", k: ['voluntar|rebuig|rebutj|nega'], h: "Sense lletra: ho decideix el pacient (voluntària / rebuig)." },
      { c: '3.50', m: "Indiqueu el temps estimat per arribar al lloc de l'incident", s: "El CECOS vol saber quant trigareu a arribar al lloc.", k: ['temps|estimat|eta|trig'], nk: ['lliure', 'disposicio'] },
      { c: '3.51', m: 'Trasllat assistit per metge / infermer', s: "El pacient va a l'hospital acompanyat per metge o infermer.", k: ['trasllat|transport|assistit', 'metge|infermer|assistit'], nk: ['no', 'sense', 'noves', 'operativ'], h: "51: trasllat AMB metge / infermer. 52: SENSE." },
      { c: '3.52', m: 'Trasllat no assistit per metge / infermer', s: "Trasllat a l'hospital només amb els tècnics, sense metge ni infermer.", k: ['no|sense', 'trasllat|assistit|metge|infermer'] },
      { c: '3.53', m: 'Unitat assistint i operativa per a noves necessitats servei', s: "Esteu atenent un pacient però podeu assumir noves necessitats del servei.", k: ['assist|atenent', 'operativ|noves|disponible'], nk: ['fora', 'no', 'accident', 'lesion'] },
      { c: '3.54', m: 'Unitat operativa, cobrint zona fora de base habitual', s: "Esteu operatius però cobrint una zona fora de la vostra base habitual.", k: ['fora|cobr|zona'] },
    ],
  },
  {
    id: 'u10', icon: '🚨', name: 'Emergència i IMV',
    desc: "Silenci a la xarxa, punts de trobada i incidents de múltiples víctimes.",
    pista: "3.40 = silenci a la xarxa (comunicat d'emergència) · 3.43 = arribada a punt de trobada segur · 3.78 = avís d'activació per incident IMV · 3.79 = avís per incident IMVi.",
    items: [
      { c: '3.40', m: "Silenci a la xarxa, comunicat d'emergència", s: "Hi ha un comunicat d'emergència: tothom ha de deixar el canal en silenci.", k: ['silenci'] },
      { c: '3.43', m: 'Arribada Unitat a punt de trobada segur', s: "La vostra unitat ha arribat al punt de trobada segur.", k: ['trobada|punt|arrib', 'segur'], nk: ['seguretat', 'polic'] },
      { c: '3.78', m: "S'informa a les unitats d'activació per incident IMV", s: "El CECOS informa les unitats activades per un incident de múltiples víctimes (IMV).", k: ['imv|multiples'], nk: ['imvi'] },
      { c: '3.79', m: "S'informa a les unitats per incident IMVi", s: "El CECOS informa les unitats d'un incident IMVi.", k: ['imvi'] },
    ],
  },
];

/* Grups de codis que es confonen fàcilment (s'usen com a distractors) */
const C3_CONFUSABLE = [
  ['1O', '10', '1'], ['22', '22M'], ['9', '9F'], ['7', '70', '7ME', '7GUPL'],
  ['0', '01', '02', '03', '05'], ['51', '52'], ['2', '3', '60'], ['43', '73'],
  ['78', '79'], ['53', '54', '6'], ['60', '62'], ['25', '26', '34'], ['32', '0'],
  ['1M', '1MC', '1S', '1E'], ['14', '19', '18'], ['20', '21', '50'], ['4', '43'],
];

const IC_UNITS = [
  {
    id: 'i1', icon: '🅰️', name: 'INTERCO · A a H',
    desc: "Les primeres vuit lletres de l'alfabet fonètic.",
    pista: "Alfa, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel. Digues-les en veu alta com una cançó!",
    items: [
      { l: 'A', w: 'Alfa', a: ['Alpha'], p: 'AL-fa' },
      { l: 'B', w: 'Bravo', p: 'BRA-vo' },
      { l: 'C', w: 'Charlie', a: ['Charly', 'Charli'], p: 'TXAR-li' },
      { l: 'D', w: 'Delta', p: 'DEL-ta' },
      { l: 'E', w: 'Echo', a: ['Eco', 'Eko'], p: 'E-ko' },
      { l: 'F', w: 'Foxtrot', a: ['Foxtrott'], p: 'FOKS-trot' },
      { l: 'G', w: 'Golf', p: 'GOLF' },
      { l: 'H', w: 'Hotel', p: 'ho-TEL' },
    ],
  },
  {
    id: 'i2', icon: '🔤', name: 'INTERCO · I a P',
    desc: "De la I a la P.",
    pista: "India, Juliett, Kilo, Lima, Mike, November, Oscar, Papa. Truc: India-Juliett-Kilo-Lima → un viatge (Índia, una noia, un quilo, Lima).",
    items: [
      { l: 'I', w: 'India', p: 'IN-dia' },
      { l: 'J', w: 'Juliett', a: ['Juliet', 'Julieta'], p: 'DJU-li-et' },
      { l: 'K', w: 'Kilo', a: ['Quilo'], p: 'KI-lo' },
      { l: 'L', w: 'Lima', p: 'LI-ma' },
      { l: 'M', w: 'Mike', a: ['Maik'], p: 'MAIK' },
      { l: 'N', w: 'November', a: ['Noviembre'], p: 'no-VEM-ber' },
      { l: 'O', w: 'Oscar', p: 'OS-kar' },
      { l: 'P', w: 'Papa', p: 'pa-PA' },
    ],
  },
  {
    id: 'i3', icon: '🔠', name: 'INTERCO · Q a Z',
    desc: "Les darreres deu lletres.",
    pista: "Quebec, Romeo, Sierra, Tango, Uniform, Victor, Whiskey, X-ray, Yankee, Zulu. Romeo balla un Tango a Sierra...",
    items: [
      { l: 'Q', w: 'Quebec', a: ['Kebec', 'Quebek'], p: 'ke-BEK' },
      { l: 'R', w: 'Romeo', p: 'RO-meo' },
      { l: 'S', w: 'Sierra', p: 'si-E-rra' },
      { l: 'T', w: 'Tango', p: 'TAN-go' },
      { l: 'U', w: 'Uniform', a: ['Uniforme'], p: 'IU-ni-form' },
      { l: 'V', w: 'Victor', a: ['Víctor', 'Viktor'], p: 'VIK-tor' },
      { l: 'W', w: 'Whiskey', a: ['Whisky', 'Wiski', 'Wisky'], p: 'UIS-ki' },
      { l: 'X', w: 'X-ray', a: ['Xray', 'Exray', 'Eksrei'], p: 'EKS-rei' },
      { l: 'Y', w: 'Yankee', a: ['Yanki', 'Yankie'], p: 'IAN-ki' },
      { l: 'Z', w: 'Zulu', p: 'ZU-lu' },
    ],
  },
  {
    id: 'i4', icon: '🔢', name: 'Números INTERCO (extra)',
    desc: "Els números del Codi Internacional de Senyals.",
    pista: "Prefix + número en anglès: Nada-zero, Una-one, Bisso-two, Terra-three, Karte-four, Panta-five, Soxi-six, Sette-seven, Okto-eight, Nove-nine.",
    items: [
      { l: '0', w: 'Nadazero', a: ['Nada zero'], p: 'NA-da-ZE-ro' },
      { l: '1', w: 'Unaone', a: ['Una one'], p: 'U-na-UAN' },
      { l: '2', w: 'Bissotwo', a: ['Bisso two'], p: 'BI-so-TU' },
      { l: '3', w: 'Terrathree', a: ['Terra three'], p: 'TE-rra-TRI' },
      { l: '4', w: 'Kartefour', a: ['Karte four'], p: 'KAR-te-FOR' },
      { l: '5', w: 'Pantafive', a: ['Panta five'], p: 'PAN-ta-FAIV' },
      { l: '6', w: 'Soxisix', a: ['Soxi six'], p: 'SOK-si-SIKS' },
      { l: '7', w: 'Setteseven', a: ['Sette seven'], p: 'SE-te-SE-ven' },
      { l: '8', w: 'Oktoeight', a: ['Okto eight'], p: 'OK-to-EIT' },
      { l: '9', w: 'Novenine', a: ['Nove nine'], p: 'NO-ve-NAIN' },
    ],
  },
];

/* Paraules per deletrejar (INTERCO) */
const SPELL_WORDS = [
  'SEM', 'CECOS', 'USVB', 'USVA', 'IMV', 'ACR', 'RCP', 'ECO', 'BOMBERS', 'MOSSOS',
  'GIRONA', 'LLEIDA', 'TARRAGONA', 'REUS', 'VIC', 'OLOT', 'MANRESA', 'BLANES', 'FIGUERES',
  'HOSPITAL', 'TRAUMA', 'DISPNEA', 'ANGOR', 'EXITUS', 'RELLEU', 'SIRENA', 'CAMILLA',
  'OXIGEN', 'GLUCOSA', 'BASE', 'RADIO', 'XARXA', 'ZONA', 'KILO', 'JOVE', 'QUIMIC',
  'WIFI', 'YOGA', 'HOTEL', 'VALL', 'PLAÇA', 'FAX', 'JAQUE', 'ZOOM', 'BOX', 'QUAD',
].map(w => w.replace('Ç', 'C'));

/* Torns de guàrdia: històries completes on cal dir cada codi */
const STORIES = [
  {
    t: 'Caiguda a domicili', icon: '🏠',
    steps: [
      { t: "Acabeu el descans. Comuniqueu al CECOS que torneu a estar disponibles.", c: '3.3' },
      { t: "Us activen. El CECOS us pregunta quant trigareu a arribar al lloc.", c: '3.50' },
      { t: "Arribeu al domicili.", c: '3.4' },
      { t: "Una dona gran ha caigut a casa i es queixa del maluc. Quin codi descriu el cas?", c: '3.29' },
      { t: "Transmeteu al CECOS la situació i les dades de la pacient.", c: '3.5' },
      { t: "La traslladeu a l'hospital només vosaltres, sense metge ni infermer.", c: '3.52' },
      { t: "Transferiu la pacient a urgències. Servei acabat i unitat operativa.", c: '3.6' },
      { t: "Torneu cap a la vostra base.", c: '3.10' },
    ],
  },
  {
    t: 'Aturada al carrer', icon: '💔',
    steps: [
      { t: "Arribeu al lloc de l'incident.", c: '3.4' },
      { t: "Un home és a terra: no respira i no té pols.", c: '3.0' },
      { t: "Necessiteu una altra unitat de suport (especificareu el tipus).", c: '3.14' },
      { t: "Després de diverses descàrregues, el pacient recupera el pols!", c: '3.01' },
      { t: "El traslladeu a l'hospital acompanyats per metge i infermer.", c: '3.51' },
      { t: "Servei finalitzat. La unitat torna a estar operativa.", c: '3.6' },
    ],
  },
  {
    t: 'Nit agitada', icon: '🌙',
    steps: [
      { t: "El CECOS us demana les coordenades de la vostra localització.", c: '3.21' },
      { t: "Arribeu al lloc de l'incident.", c: '3.4' },
      { t: "Home amb patologia psiquiàtrica, molt agitat.", c: '3.28' },
      { t: "La situació es complica: demaneu els Mossos d'Esquadra.", c: '3.7 ME' },
      { t: "El pacient treu un ganivet. Risc físic per a l'equip!", c: '3.70' },
      { t: "El CECOS us indica un punt de seguretat per trobar-vos amb la policia.", c: '3.73' },
      { t: "Arribeu al punt de trobada segur.", c: '3.43' },
    ],
  },
  {
    t: "Accident a l'autopista", icon: '🚗',
    steps: [
      { t: "Arribeu al lloc de l'incident.", c: '3.4' },
      { t: "Col·lisió entre tres vehicles. Quin codi descriu el cas?", c: '3.23' },
      { t: "Un conductor ha quedat atrapat dins del cotxe.", c: '3.18' },
      { t: "Hi ha més ferits lleus: cal una ambulància de transport sanitari (USVB).", c: '3.19' },
      { t: "El CECOS informa les unitats activades: és un incident de múltiples víctimes.", c: '3.78' },
      { t: "Hi ha un comunicat d'emergència: cal silenci a la xarxa.", c: '3.40' },
      { t: "El CECOS us demana que resteu atents a noves dades.", c: '3.20' },
    ],
  },
  {
    t: 'Torn complicat', icon: '🔧',
    steps: [
      { t: "Comenceu el torn i us adoneu que no teniu prou material sanitari.", c: '3.17' },
      { t: "També us cal anar a posar combustible.", c: '3.16' },
      { t: "Un vehicle us envesteix. Ningú de l'equip ha resultat ferit, però l'ambulància no pot continuar.", c: '3.9' },
      { t: "Al cap d'una estona, un company nota dolor al coll: hi ha personal assistencial lesionat.", c: '3.9 F' },
      { t: "Arriba l'equip que us substitueix.", c: '3.15' },
    ],
  },
  {
    t: 'Un servei dur', icon: '🕯️',
    steps: [
      { t: "Arribeu al lloc de l'incident.", c: '3.4' },
      { t: "La pacient està en aturada cardiorespiratòria.", c: '3.0' },
      { t: "La RCP s'allarga: s'activa el Protocol de Cor Aturat.", c: '3.03' },
      { t: "Malgrat tot, la pacient no recupera el pols.", c: '3.02' },
      { t: "Es constata la defunció.", c: '3.8' },
      { t: "L'equip queda molt afectat i resta inoperatiu temporalment.", c: '3.62' },
    ],
  },
  {
    t: 'Trucades al CECOS', icon: '☎️',
    steps: [
      { t: "Heu de resoldre per telèfon un tema de logística de l'adreça.", c: '3.1 O' },
      { t: "Voleu comentar per telèfon un dubte sanitari del pacient.", c: '3.1 S' },
      { t: "Necessiteu suport mèdic telefònic des del CECOS.", c: '3.1 M' },
      { t: "El pacient és un nen en estat crític: voleu parlar amb el metge de crítics.", c: '3.1 MC' },
      { t: "Cal una trucada a tres amb el CECOS i l'ECO.", c: '3.1 E' },
      { t: "Simplement necessiteu una trucada telefònica.", c: '3.1' },
    ],
  },
  {
    t: 'Altes i canvis de pla', icon: '📝',
    steps: [
      { t: "Arribeu al lloc de l'incident.", c: '3.4' },
      { t: "Jove amb una intoxicació per alcohol.", c: '3.25' },
      { t: "No vol ser atès i rebutja l'assistència.", c: '3.22' },
      { t: "En el servei següent, el metge valora el pacient i li dona l'alta al lloc.", c: '3.22 M' },
      { t: "De camí a un altre servei, el CECOS l'anul·la.", c: '3.11' },
      { t: "Quedeu operatius però cobrint una zona fora de la vostra base.", c: '3.54' },
    ],
  },
];
