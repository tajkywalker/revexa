package studio.walkercrew.aunaria.slimefun.core;

import studio.walkercrew.aunaria.slimefun.research.SlimefunResearch;

/**
 * Reprezentuje Slimefun 2.0 položku (item) — obal nad Hytale item ID.
 *
 * Každá SF položka má:
 *  - itemId      — odpovídá "Id" v JSON definici (např. "SF_Circuit_Board")
 *  - displayName — zobrazované jméno v GUI a průvodci
 *  - category    — kategorie v SF průvodci (Zdroje, Stroje, Nástroje, ...)
 *  - research    — výzkum nutný k odemčení receptury (null = odemčeno od začátku)
 */
public class SlimefunItem {

    private final String itemId;
    private final String displayName;
    private final ItemCategory category;
    private SlimefunResearch research;

    public SlimefunItem(String itemId, String displayName, ItemCategory category) {
        this.itemId = itemId;
        this.displayName = displayName;
        this.category = category;
    }

    // ─── Gettery / Settery ────────────────────────────────────────────────────

    public String getItemId() { return itemId; }

    public String getDisplayName() { return displayName; }

    public ItemCategory getCategory() { return category; }

    public SlimefunResearch getResearch() { return research; }

    public void setResearch(SlimefunResearch research) { this.research = research; }

    /**
     * Vrátí true pokud tato položka vyžaduje výzkum před použitím.
     */
    public boolean requiresResearch() { return research != null; }

    @Override
    public String toString() {
        return "SlimefunItem{id='" + itemId + "', category=" + category + "}";
    }

    // ─── Kategorie ────────────────────────────────────────────────────────────

    public enum ItemCategory {
        MATERIALS      ("Materiály",     "§7"),
        BASIC_MACHINES ("Základní stroje","§a"),
        ELECTRICITY    ("Elektřina",     "§e"),
        ADVANCED_MACHINES("Pokročilé stroje","§6"),
        WEAPONS        ("Zbraně",        "§c"),
        TOOLS          ("Nástroje",      "§b"),
        FOOD           ("Potraviny",     "§2"),
        MAGIC          ("Magie",         "§d"),
        CARGO          ("Cargo",         "§3"),
        MISC           ("Různé",         "§8");

        private final String display;
        private final String colorCode;

        ItemCategory(String display, String colorCode) {
            this.display = display;
            this.colorCode = colorCode;
        }

        public String getDisplay() { return display; }
        public String getColorCode() { return colorCode; }
    }
}
