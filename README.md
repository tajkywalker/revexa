# REVEXA - Centralizovaná databáze spalinových cest

Mobilní aplikace pro Xiaomi Pad Pro 5G (HyperOS/Android) určená pro kominíky.

## Funkce

- **Zakázky** — seznam, detail, filtrování, full-text vyhledávání
- **Kalendář** — vizuální přehled zakázek dle dní, měsíční navigace
- **Zákazníci** — databáze zákazníků s adresami a komíny
- **Kontrola spalinové cesty** — klikací checklist (průchodnost, spalinotěsnost, CO měření atd.)
- **Elektronický podpis** — zákazník podepíše prstem/tužkou přímo na tabletu
- **PDF protokol** — automatické generování protokolu z kontroly
- **E-mail** — odeslání kopie zákazníkovi
- **Offline first** — vše funguje bez internetu (lokální SQLite databáze)
- **Katalog** — referenční informace o typech komínů, lhůtách kontrol
- **Statistiky** — přehled výkonnosti, měsíční trend

## Instalace (vývojáři)

### Požadavky
- Node.js 18+
- Expo CLI: `npm install -g expo-cli eas-cli`
- Android Studio nebo fyzický tablet

### Rychlý start

```bash
cd revexa
npm install
npx expo start --android
```

### Build APK pro tablet

```bash
# Nainstalovat EAS CLI
npm install -g eas-cli

# Přihlásit se na Expo
eas login

# Build APK (testovací)
eas build --platform android --profile preview

# Nebo lokálně (vyžaduje Android SDK)
npx expo run:android
```

### Přímá instalace na tablet (Expo Go)

1. Nainstalujte **Expo Go** z Google Play na Xiaomi tablet
2. Spusťte `npx expo start`
3. Naskenujte QR kód Expo Go aplikací

## Struktura projektu

```
revexa/
├── app/                    # Expo Router stránky
│   ├── _layout.tsx         # Root layout
│   └── index.tsx           # Hlavní vstupní bod
├── src/
│   ├── components/
│   │   ├── common/         # Button, Card, TextInput, StatusBadge
│   │   ├── layout/         # Sidebar, BottomBar
│   │   ├── orders/         # OrderDetailPanel, NewOrderModal
│   │   └── reports/        # InspectionReportModal (podpis, checklist)
│   ├── database/
│   │   └── database.ts     # SQLite databáze, CRUD operace
│   ├── screens/            # Přehled, Zakázky, Kalendář, Zákazníci, ...
│   ├── store/
│   │   └── appStore.ts     # Zustand global state
│   ├── types/
│   │   └── index.ts        # TypeScript typy
│   └── utils/
│       ├── theme.ts        # Barvy, typografie, spacing
│       ├── helpers.ts      # Datum utility, ID generátor
│       └── pdfGenerator.ts # HTML→PDF generátor protokolu
├── app.json                # Expo konfigurace
├── eas.json                # EAS Build konfigurace
└── package.json
```

## Technologie

- **React Native** + **Expo SDK 51** — cross-platform
- **Expo Router** — file-based navigace
- **expo-sqlite** — lokální SQLite databáze
- **expo-print** — generování PDF
- **expo-mail-composer** — odesílání e-mailů
- **react-native-webview** — HTML canvas pro podpis
- **zustand** — state management
- **date-fns** — práce s daty (čeština)
- **TypeScript** — type safety

## Design

Tmavý theme (#111111 pozadí), oranžová akcent (#E8651A) — přizpůsobeno pro tablet
v landscape orientaci s postranní navigací.

## Demo data

Po prvním spuštění jsou automaticky načtena demo data:
- 3 zákazníci (Novák, Procházková, Svoboda)
- 3 adresy s komíny
- 3 zakázky na dnešní den
- 1 dokončená zpráva z kontroly

## Rozšíření do budoucna

- [ ] Synchronizace s cloud backendem
- [ ] Víceúčetní přístup (firma + kominíci)
- [ ] Fotodokumentace přímo z kamery
- [ ] QR kód na komíně → přímý přístup k historii
- [ ] Export do Excelu
- [ ] Automatické připomínky lhůt kontrol
