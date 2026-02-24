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
        sprite: [0, 1, "S"],
        spritePos: ["P", "P", "C"]
    },
    "graveyard": {
        text: [
            "Poslední odpočinek místních obyvatel",
            "Nápisy na náhrobcích vyprávějí příběhy",
            "Stromy šumí nad starými hroby"
        ],
        sprite: [0, 1, 0],
        spritePos: ["P", "C", "P"]
    },
    "olda": {
        text: [
            "Usedlost bývalého lovce bizonů",
            "Stěny zdobí paroží a kůže",
            "Vůně kouře a vydělané kůže"
        ],
        sprite: [0, 0, 1],
        spritePos: ["L", "L", "C"]
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
    },
    "trains": {
        text: [
            "Depo a opravna vlaků",
            "Sklad náhradních dílů a kol",
            "Strojvedoucí zde probírají trasy"
        ],
        sprite: [0, 1, 2],
        spritePos: ["L", "C", "P"]
    },
    "mech": {
        text: [
            "Depo a opravna vlaků",
            "Sklad náhradních dílů a kol",
            "Strojvedoucí zde probírají trasy"
        ],
        sprite: [0, 1, "S"],
        spritePos: ["L", "L", "C"]
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

// Default text if building type not found
export const DEFAULT_BUILDING_TEXT = {
    text: [
        "Běžná městská zástavba",
        "Žije zde pracovitý lid",
        "Ulice plné života a obchodu"
    ],
    sprite: [0, 1, 2]
};