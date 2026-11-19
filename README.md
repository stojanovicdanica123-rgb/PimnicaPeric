# Pimnica Perić — redizajn sajta (prototip)

Statički sajt (HTML + CSS + JavaScript, bez build koraka) za porodičnu vinariju Pimnica Perić u Rajačkim pimnicama kod Negotina.
Stil „kamen i zemlja“, srpski, engleski i rumunski jezik, vina, smeštaj i doživljaji.

Svi fajlovi (stranice, stilovi, skripte i slike) su namerno u **jednom folderu, bez podfoldera**,
da bi upload preko github.com radio bez obzira na to kako se fajlovi prevuku.

## Stranice

| Fajl | Sadržaj |
|---|---|
| `index.html` | Početna: naslovna, tri stuba (vina, smeštaj, doživljaj), priča, utisci |
| `o-nama.html` | Porodica Perić, šest generacija, pimnica iz 1887. |
| `vina.html` | Vina i rakije, vinski vodič, presek podruma |
| `smestaj.html` | Apartmani Perić: 5 soba, 14 gostiju |
| `dozivljaji.html` | Degustacije, trpeza, skupovi, godina u vinogradu |
| `galerija.html` | Galerija fotografija |
| `kontakt.html` | Kontakt, mape pimnice i smeštaja |

Stilovi su u `style.css`, ponašanje u `app.js`, a prevodi (EN i RO) u `i18n.js`. Ikonice su u `icons.svg`.

## Objavljivanje na GitHub Pages

1. Na github.com napravite novi repozitorijum (npr. `pimnica-peric`).
2. Kliknite **Add file → Upload files**, označite **sve fajlove** iz ovog foldera (Ctrl+A) i prevucite ih.
3. Kliknite **Commit changes**.
4. **Settings → Pages** → **Deploy from a branch**, grana `main`, folder `/ (root)` → **Save**.
5. Posle 1–2 minuta sajt je na `https://<korisničko-ime>.github.io/<ime-repozitorijuma>/`.

## Pre puštanja u rad

- **Indeksiranje:** svaka stranica ima `<meta name="robots" content="noindex, nofollow">` da prototip ne bi ušao u Google pored pravog sajta. Uklonite tu liniju kada sajt postane zvaničan.
- **Rezervacije** idu telefonom, Viberom ili WhatsAppom (+381 64 1943 065). Treba potvrditi da je broj na Viberu i WhatsAppu.
- **Prevodi:** engleski i rumunski treba da pregleda izvorni govornik.
- **Fotografije:** slike sa starog sajta su male rezolucije; za naslovne slike preporučuju se veće verzije.
