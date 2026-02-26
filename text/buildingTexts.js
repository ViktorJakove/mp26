export const BUILDING_TEXTS = {
    "hq": {
        text: [
            "Sídlo společnosti Pacific Railroad",
            "Zde se rozhoduje o osudu železnice",
            "Zde se rozhoduje o osudu železnice"
        ],
        sprite: [0, 1, "S"],
        spritePos: ["L", "C", "P"]
    },
    "sheriff": {
        text: [
            "Místní vězení a úřad šerifa",
            "Zdi pamatují nejednoho desperáta",
            "Před budovou visí hledané listy"
        ],
        sprite: [0, 1, 2],
        spritePos: ["L", "C", "P"]
    },
    "bank": {
        text: [
            "Nejbezpečnější místo ve městě",
            "Zde se ukládají peníze z vlaků",
            "Těžké dubové dveře a ocelový trezor"
        ],
        afterTransaction: {
            text: [
                "Děkujeme za splacení dluhu!",
                "Úspěšně jsi vrátil peníze i s úrokem.",
                "Tvá důvěryhodnost u banky stoupla."
            ],
            sprite: [1, 1, 1],
            spritePos: ["C", "C", "C"]
        },
        sprite: [0, 1, "S"],
        spritePos: ["P", "P", "C"],
        transaction: {
            type: "bank",
            cost: 0,
            failText: "Transakce zrušena.",
            questionSprite: 1,
            questionSpritePos: "C",
            successSprite: "S",
            successSpritePos: "C",
            failSprite: 0,
            failSpritePos: "C",
            question: "Co si přejete udělat?",
            bankOptions: {
                maxLoan: 5000,
                interestRate: 2,
                repaymentTime:5
            }
        }
    },
    "graveyard": {
        text: [
            "Poslední odpočinek místních obyvatel",
            "Nápisy na náhrobcích vyprávějí příběhy",
            "Stromy šumí nad starými hroby"
        ],
        afterTransaction: {
            text: [
                "Hřbitov bude nyní udržovaný díky tvému daru",
                "Náhrobky jsou očištěné a cesty upravené",
                "Místní rodiny ti jsou vděčné za tvou štědrost",
                "Starý hřbitov získal nový nádech",
                "Díky tvému daru byl opraven plot kolem hřbitova",
                "Na hrobech se objevily čerstvé květiny"
            ],
            sprite: [1, 1, 1, 1, 1, 0],
            spritePos: ["C", "C", "C", "C", "C", "C"]
        },
        sprite: [0, 1, 0],
        spritePos: ["P", "C", "P"],
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
            "zdar brop",
            "tady Olda",
            "pico tak co?"
        ],
        afterTransaction: {
            text: [
                "Děkujeme za investici! Máš nastřádáno $${profit} z bizonů, tady to máš!",
                "Díky tvé pomoci můžeme modernizovat vybavení.",
                "Přijď se podívat na novou lokomotivu!"
            ],
            sprite: [0, "1", 0],
            spritePos: ["C", "C", "C"]
        },
        sprite: [0, "1", 0],
        spritePos: ["C", "C", "C"],
        transaction: {
            type: "unlock_bison",
            cost: 100,
            successText: "Stav koleje podél.",
            failText: "Nemáš dostatek financí.",
            question: "Chceš se naučit, jak stavět koleje kolem bizonů?",
            questionSprite: 1,
            questionSpritePos: "C",
            successSprite: 1,
            successSpritePos: "C",
            failSprite: 0,
            failSpritePos: "C",
            question: "Zjisti tajemství?"
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
            "Obchod se vším, co potřebujete",
            "Sudy, bedny a regály plné zboží",
            "Vůně koření a sušeného masa"
        ],
        sprite: [0, 0, 0],
        spritePos: ["L", "L", "P"]
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