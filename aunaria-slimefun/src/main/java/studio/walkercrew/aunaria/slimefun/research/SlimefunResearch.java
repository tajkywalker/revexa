package studio.walkercrew.aunaria.slimefun.research;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Definice jednoho výzkumu v Slimefun 2.0.
 *
 * Výzkum odemyká sadu strojů/položek a vyžaduje ke svému provedení:
 *  - určitý počet XP bodů hráče
 *  - nebo speciální materiál (v budoucí verzi: SF_Research_Token)
 *
 * Každý výzkum má unikátní researchId, zobrazované jméno a ID strojů/položek
 * které odemyká.
 */
public class SlimefunResearch {

    private final String researchId;
    private final String displayName;
    private final String description;

    /** Cena výzkumu v XP bodech */
    private final int xpCost;

    /** ID strojů a položek odemčených tímto výzkumem */
    private final List<String> unlockedMachines = new ArrayList<>();

    /** Výzkumy nutné k odemčení tohoto výzkumu (prerekvizity) */
    private final List<String> prerequisites = new ArrayList<>();

    /** true = výzkum je dostupný od samého začátku (bez prerekvizit a XP cost = 0) */
    private final boolean defaultUnlocked;

    public SlimefunResearch(String researchId, String displayName, String description,
                             int xpCost, boolean defaultUnlocked) {
        this.researchId = researchId;
        this.displayName = displayName;
        this.description = description;
        this.xpCost = xpCost;
        this.defaultUnlocked = defaultUnlocked;
    }

    // ─── Modifikace ───────────────────────────────────────────────────────────

    public void addUnlockedMachine(String machineId) {
        unlockedMachines.add(machineId);
    }

    public void addPrerequisite(String prerequResearchId) {
        prerequisites.add(prerequResearchId);
    }

    // ─── Gettery ──────────────────────────────────────────────────────────────

    public String getResearchId() { return researchId; }

    public String getDisplayName() { return displayName; }

    public String getDescription() { return description; }

    public int getXpCost() { return xpCost; }

    public boolean isDefaultUnlocked() { return defaultUnlocked; }

    public List<String> getUnlockedMachines() {
        return Collections.unmodifiableList(unlockedMachines);
    }

    public List<String> getPrerequisites() {
        return Collections.unmodifiableList(prerequisites);
    }

    /**
     * Vrátí true pokud daný hráč (pomocí jeho ResearchData) má tento výzkum odemčen.
     */
    public boolean isUnlockedBy(PlayerResearchData data) {
        if (defaultUnlocked) return true;
        return data.hasResearch(researchId);
    }

    @Override
    public String toString() {
        return "SlimefunResearch{id='" + researchId + "', cost=" + xpCost + " XP}";
    }
}
