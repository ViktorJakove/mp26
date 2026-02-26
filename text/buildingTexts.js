export const BUILDING_TEXTS = {
    "hq": {
        text: [
            "Sídlo společnosti Pacific Railroad",
            "Zde se rozhoduje o osudu železnice",
            "Zde se rozhoduje o osudu železnice"
        ],
        sprite: [0, 1, "S"],
        spritePos: ["L", "C", "P"]
        //unused
    },
    "sheriff": {
        text: [
            "Jsi tu novej?",
            "Sheriff Nadledvinka... A ty jsi?",
            "Od železnice? No výborně-",
            "Bál jsem se, že dorazíš, až když bude pozdě...",
            "Jako JEDINÝ doopravdový Sheriff Rudé Skály tě budu muset chránit a varovat, zelenáči.",
            "Mezi náma, kašlat na rudochy, ale nepotřebuju, aby mi sem přišli vykuchat manželku.",
            "Takže navrhuji!",
            "Nestav nic přes indiánská území a neznepřátel si ani jejich obyvatele, ani mě!",
            "Někdy se zastav. Salut, Greenhorne!"
        ],
        sprite: [0, 1, 2],
        spritePos: ["L", "C", "P"]
    },
    "bank": {
        text: [
            "Ovšem dobrý den...",
            "Přišel jste si půjčit?",
            "Samozřejmě že dorazil, konkurenci jsme zlikvidovali :D",
            "Jaké blaho je ten monopol, není-liž pravda?",
            "Představte si, mezi kolika lháři a podvodníky byste musel vybírat!",
            "Kdybych tu nebyl já totiž, žeano!!!",
            "Vrhneme se na věc?"
        ],
        afterTransaction: {
            text: [
                "Díky za vaše peníze!",
                "Milujeme peníze.",
                "Máme jich hodně. A to je dobře."
            ],
            sprite: [1, 1, 1],
            spritePos: ["C", "C", "C"]
        },
        sprite: [0, 1, "S", 1,0,0,1],
        spritePos: ["C", "C", "C", "C", "C", "C", "C"],
        transaction: {
            type: "bank",
            cost: 0,
            failText: "Uh-uh, transakce zrušena.",
            questionSprite: "S",
            questionSpritePos: "C",
            successSprite: "S",
            successSpritePos: "C",
            failSprite: 1,
            failSpritePos: "C",
            question: "Kolik si půjčíme?",
            bankOptions: {
                maxLoan: 5000,
                interestRate: 2,
                repaymentTime:5
            }
        }
    },
    "graveyard": {
        text: [
            "Uff... Ufff...",
            "Nohy bolí, ruce chřadnou... Nedostal já dlouho almužnu žádnou!",
            "Tenhle malý hřbitov hnije, a mně koleno samou bolestí-",
            "už roky a staletí, utrpením krev snad pije!",
            "Stáří to je zlo a hrůza, fakt že jo-",
            "metla, jež přebije kdejaká mužstva",
            "Francouze, Turka i Bělorusa-",
            "nebo",
            "Jana Husa, Jana Žižku, Karla Husa,",
            "ehh",
            "...",
            "Karla Žižku",
            "fakt že jo!",
            "ALmužničku? Vyměním za všelijaká moudra!"
        ],
        afterTransaction: {
            text: [
                "Nestavěl bych nějak blízko jezerům- stoletá voda spláchne koleje dobrákům i mizerům...",
                "Půjčky,půjčky... Ředitel banky je silák. Zvedá jednoručky. Osobně ti vytrhá koleje, když nezaplatíš včas, haha!",
                "V Evropě i v Koreji se obejdou bez kolejí (typu-T)! (knedlíky kynu-T!)",
                "Pro kontakt s osobou daného města nemusíš mít aktivní kolejové spojení! (rýmová resignace)",
                "Olda možná pije, ale ví kdy a která bije! Poslechni ho.",
                "Dobré skutky občas taky něco stojí. Občas dost a občas víc."
            ],
            sprite: [0, 1, 1, 0, 1, 0],
            spritePos: ["C", "C", "C", "C", "C", "C"]
        },
        sprite: [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
        spritePos: ["P", "P", "P", "P","C","C", "P", "P", "P", "P", "P", "P", "P", "C"],
        transaction: {
            cost: 67,
            failText: "Nemáš dost peněz na příspěvek.",
            questionSprite: 1,
            questionSpritePos: "C",
            failSprite: 0,
            failSpritePos: "C",
            question: "Vyslechneš si moudro??",
            randomAfterText: true
        }
    },
    "olda": {
        text: [
            "GYAHAHAHAHAHAHAH",
            "-tady Olda-",
            "...........",
            "cítim z tebe....",
            "hmmmm.....",
            "DOBRODRUŽSTVÍ!!!",
            "BAHAHAHAHAHAHAH!!!",
            "c í t i m  t v o j e  p o h n o j e n ý  g a t ě",
            "troubo! bahaahahaha!",
            "jestliže děláš ty koleje... mohli bychom si navzájem pomoct!",
            "protože tahle winchestrovka moc ráda střílí",
            "moc ráda střílí a moc moc moc!",
            "kdybys byl od tý dobroty a stavěl koleje kolem bizonů, mohli bychom z toho udělat velkou zábavu a trhnout velký prachy!",
            "za malej příspěvek do toho s tebou milerád pujdu. co ty na to?",
            "jeiltokpytoplatíto?!"
        ],
        afterTransaction: {
            text: [
                "výborně! a táta říkal,že to nikam nedotáhnu!",
                "BAHAHAHAHA"
            ],
            sprite: [0, 0],
            spritePos: ["C", "C"]
        },
        sprite: [0, 1, 0, 0, 0, 1,0,1,0,0,0,0,0,0,1],
        spritePos: ["C", "C", "C","C","C", "C", "C","C","C", "C", "C","C","C", "C", "C"],
        transaction: {
            type: "unlock_bison",
            cost: 100,
            successText: "Stav koleje podél bizoních oblastí. NE PŘES! pro svůj podíl se kdykoli stav!",
            failText: "Nemáš dostatek financí.",
            question: "Uzavřít dohodu s Oldou?",
            questionSprite: 1,
            questionSpritePos: "C",
            successSprite: 1,
            successSpritePos: "C",
            failSprite: 0,
            failSpritePos: "C",
        }
    },
    "gallery": {
        text: [
            "Místní galerie a kulturní centrum",
            "Obrazy krajin a portréty významných občanů",
            "Schází se zde umělci z širokého okolí"
        ],
        sprite: [0, 0, "S"],
        spritePos: ["P", "P", "C"]
    },
    "shop": {
        text: [
            "Vítej!!! Mám tu toho dost!"
        ],
        sprite: [0],
        spritePos: ["L"]
    },
    "barber": {
        text: [
            "Holičství a kadeřnictví v jednom",
            "Pánové zde probírají novinky z města",
            "Výloha s hřebeny a mastičkami"
        ],
        sprite: [0, 1, 2],
        spritePos: ["C", "C", "P"]
    },
    "marco": {
        text: [
            "Obuvnictví mistra Marka",
            "Regály plné bot všech velikostí",
            "Vzorníky kůže na každém stole"
        ],
        sprite: [0, 1, 0],
        spritePos: ["C", "C", "C"]
    },"bussiness": {
    text: [
        "Depo a opravna vlaků",
        "Sklad náhradních dílů a kol",
        "Strojvedoucí zde probírají trasy"
    ],
    afterTransaction: {
        text: [
            "Děkujeme za investici!",
            "Díky tvé pomoci můžeme modernizovat vybavení.",
            "Přijď se podívat na novou lokomotivu!"
        ],
        sprite: [0, "S", 0],
        spritePos: ["C", "C", "C"]
    },
    sprite: [0, "S", 0],
    spritePos: ["C", "C", "C"],
    transaction: {
        type: "unlock_speed",
        cost: 300,
        successText: "Investice přijata! Město ti děkuje.",
        failText: "Nemáš dostatek financí.",
        questionSprite: "S",
        questionSpritePos: "C",
        successSprite: "S",
        successSpritePos: "C",
        failSprite: 0,
        failSpritePos: "C",
        question: "Pořídit naprosto zdravotně nezávadné uhlí pro dvojnásobný výkon lokomotiv?"
    }
},
    "mech": {
        text: [
            "Depo a opravna vlaků",
            "Sklad náhradních dílů a kol",
            "Strojvedoucí zde probírají trasy"
        ],
        sprite: [0, 1, "S"],
        spritePos: ["L", "L", "C"],
        transaction: {
            type: "unlock_tracks", 
            cost: 500,
            successText: "Děkujeme za nákup! Nová lokomotiva brzy dorazí.",
            failText: "Nemáš dost peněz, příteli.",
            questionSprite: 0,
            questionSpritePos: "C",
            successSprite: "S",
            question: "Pořídit naprosto přírodní uhlí pro dvojnásobný výkon lokomotiv?"
        }
    },
    "church": {
        text: [
            "Místní kostel a duchovní centrum",
            "Barevné vitráže a staré lavice",
            "Zvony zvoní každou neděli"
        ],
        sprite: [0, 0, 0],
        spritePos: ["C", "C", "C"]
    },
    "none": {
        text: [
            "error"
        ],
        sprite: [0, 1, 2],
        spritePos: ["L", "C", "P"]
    }
};

export const DEFAULT_BUILDING_TEXT = {
    text: [
        "Běžná městská zástavba",
        "Žije zde pracovitý lid",
        "Ulice plné života a obchodu"
    ],
    sprite: [0, 1, 2]
};