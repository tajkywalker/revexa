# REVEXA 🔥
### Centralizovaná databáze spalinových cest pro kominíky

> Aplikace pro Xiaomi Pad Pro 5G · Xiaomi HyperOS (Android)

---

## Co aplikace umí

- **Databáze zákazníků** – jméno, adresa, telefon, email, poznámky
- **Spalinové cesty (komíny)** – každý zákazník může mít více komínů s typem a palivem
- **Zakázky** – plánování, stav (Nová / Probíhající / Dokončená / Zrušená), propojení na zákazníka
- **Kalendář** – přehled zakázek podle dní
- **Zpráva z kontroly** – kompletní formulář s kontrolním checklistem, měřením CO, poznámkami
- **Podpis zákazníka** – elektronický podpis přímo na tabletu prstem / tužkou
- **Statistiky** – přehled počtu zakázek a výnosů
- **Offline** – vše uloženo lokálně v SQLite databázi na zařízení, internet není potřeba

---

## Jak spustit aplikaci na tabletu (krok za krokem)

### Co budete potřebovat (na počítači)
1. **Node.js** – stáhněte z [nodejs.org](https://nodejs.org/en) (LTS verze)
2. **Git** – stáhněte z [git-scm.com](https://git-scm.com/)
3. **Na tabletu:** Stáhněte aplikaci **Expo Go** z Google Play Store

### Kroky

**1. Stáhněte projekt**
```bash
git clone https://github.com/tajkywalker/revexa2.git
cd revexa2
```

**2. Nainstalujte závislosti**
```bash
npm install
```

**3. Spusťte vývojový server**
```bash
npx expo start
```

**4. Připojte tablet**
- Otevřete **Expo Go** na tabletu
- Naskenujte QR kód, který se zobrazí v terminálu
- Aplikace se automaticky spustí!

> Počítač a tablet musí být na **stejné Wi-Fi síti**.

---

## Jak sestavit APK pro instalaci přímo na tablet

Pokud chcete nainstalovat aplikaci bez Expo Go jako plnohodnotnou APK:

```bash
# Nainstalujte EAS CLI
npm install -g eas-cli

# Přihlaste se na expo.dev (vytvořte si bezplatný účet)
eas login

# Sestavte APK
eas build --platform android --profile preview
```

Odkaz ke stažení APK dostanete emailem nebo na [expo.dev](https://expo.dev).

---

## Struktura projektu

```
revexa/
├── src/
│   ├── App.tsx                  → Hlavní vstupní bod, navigace
│   ├── theme.ts                 → Barvy, velikosti písma
│   ├── utils.ts                 → Pomocné funkce (datum, formátování)
│   ├── db/
│   │   └── database.ts          → SQLite databáze (všechny funkce)
│   └── screens/
│       ├── OrdersScreen.tsx     → Seznam zakázek (výchozí: Dnes)
│       ├── OrderDetailScreen.tsx → Detail zakázky + zákazník + komíny + poslední zpráva
│       ├── InspectionScreen.tsx  → Formulář zprávy z kontroly + podpis
│       ├── CustomersScreen.tsx   → Seznam zákazníků
│       ├── CustomerDetailScreen.tsx → Detail zákazníka + komíny + historie
│       ├── CalendarScreen.tsx    → Kalendář zakázek
│       └── StatsScreen.tsx       → Statistiky
├── app.json                     → Nastavení Expo (orientace, barvy, balíček)
└── package.json                 → Závislosti
```

---

## Databáze

Aplikace ukládá data do **SQLite** databáze přímo na zařízení. Po první spuštění se vytvoří automaticky s ukázkovými daty (Jan Novák, Marie Svobodová).

Tabulky:
- `customers` – zákazníci
- `chimneys` – spalinové cesty / komíny
- `orders` – zakázky
- `inspections` – zprávy z kontrol

---

## Verze 1.0 – Prototyp

Toto je první prototyp. Záměrně **není** implementováno:
- Převod zprávy do PDF
- Odeslání emailem zákazníkovi
- Synchronizace do cloudu / více zařízení
- Fotky z kontroly
- QR kódy

Tyto funkce budou přidány v dalších verzích.

---

*REVEXA © 2025 – Pro kominíky*
