package studio.walkercrew.aunaria.slimefun.research;

import com.hypixel.hytale.component.ComponentType;
import com.hypixel.hytale.server.core.universe.entity.EntityStore;
import studio.walkercrew.aunaria.slimefun.SlimefunPlugin;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Správce výzkumného stromu Slimefun 2.0.
 *
 * Registruje všechny výzkumy a poskytuje rozhraní pro:
 *  - odemykání výzkumu hráčem
 *  - dotazování na stav výzkumu
 *  - správu ECS komponent playerResearchData
 */
public class ResearchManager {

    private final SlimefunPlugin plugin;

    /** researchId → SlimefunResearch */
    private final Map<String, SlimefunResearch> researches = new ConcurrentHashMap<>();

    /** ECS ComponentType pro persistenci dat hráče */
    private ComponentType<EntityStore, PlayerResearchData> researchDataComponentType;

    public ResearchManager(SlimefunPlugin plugin) {
        this.plugin = plugin;

        // Registrace ECS komponenty pro data hráče
        this.researchDataComponentType = plugin.getEntityStoreRegistry().registerComponent(
            PlayerResearchData.class,
            "SFPlayerResearchData",
            null  // TODO: Přidat BuilderCodec pro plnou persistenci přes BSON
        );
    }

    // ─── Registrace výzkumů ───────────────────────────────────────────────────

    /**
     * Registruje všechny výzkumné stromy hry.
     * Voláno jednou při startu pluginu.
     */
    public void registerAll() {
        // Tier 0 — základní technologie (výchozí odemčeno)
        register(new SlimefunResearch(
            "sf_basic_tech",
            "Základní technologie",
            "Odemkne Enhanced Crafting Table — základ veškeré SF výroby.",
            0, true
        ));

        // Tier 1 — elektřina
        SlimefunResearch electric = new SlimefunResearch(
            "sf_electrical_machines",
            "Elektrické stroje",
            "Odemkne Electric Furnace, Coal Generator a Energy Capacitor.",
            150, false
        );
        electric.addPrerequisite("sf_basic_tech");
        register(electric);

        // Tier 1 — pokročilé zpracování
        SlimefunResearch advanced = new SlimefunResearch(
            "sf_advanced_processing",
            "Pokročilé zpracování",
            "Odemkne Ore Washer a Solar Generator.",
            200, false
        );
        advanced.addPrerequisite("sf_electrical_machines");
        register(advanced);

        // Tier 2 — průmyslová automatizace
        SlimefunResearch industrial = new SlimefunResearch(
            "sf_industrial_automation",
            "Průmyslová automatizace",
            "Odemkne pokročilé stroje Tier 2.",
            500, false
        );
        industrial.addPrerequisite("sf_advanced_processing");
        register(industrial);

        // ─── Magická větev ────────────────────────────────────────────────

        // Arcane Arts Tier 1 — Magic Workbench + Cauldron
        SlimefunResearch arcaneArts = new SlimefunResearch(
            "sf_arcane_arts",
            "Arcane Arts",
            "Odemkne Magic Workbench a Alchemist's Cauldron. Vstup do magické větve SF 2.0.",
            350, false
        );
        arcaneArts.addPrerequisite("sf_advanced_processing");
        register(arcaneArts);

        // Arcane Mastery Tier 3 — Arcane Forge + Crystal Infuser
        SlimefunResearch arcaneMastery = new SlimefunResearch(
            "sf_arcane_mastery",
            "Arcane Mastery",
            "Odemkne Arcane Forge a Crystal Infuser — nejsilnější magické stroje.",
            800, false
        );
        arcaneMastery.addPrerequisite("sf_arcane_arts");
        arcaneMastery.addPrerequisite("sf_industrial_automation");
        register(arcaneMastery);

        plugin.getSlimefunLogger().info(
            "Výzkumný strom: registrováno " + researches.size() + " výzkumů."
        );
    }

    private void register(SlimefunResearch research) {
        researches.put(research.getResearchId(), research);
    }

    // ─── Odemykání výzkumu ────────────────────────────────────────────────────

    /**
     * Hráč si přidá XP k výzkumu. Pokud dosáhne ceny, výzkum se odemkne.
     *
     * @param data       data hráče
     * @param researchId cílový výzkum
     * @param xp         přidávaný počet XP
     * @return true pokud byl výzkum dokončen
     */
    public boolean contributeXp(PlayerResearchData data, String researchId, int xp) {
        SlimefunResearch research = researches.get(researchId);
        if (research == null) return false;

        // Zkontroluj prerekvizity
        for (String prereq : research.getPrerequisites()) {
            if (!data.hasResearch(prereq)) return false;
        }

        return data.addXp(researchId, xp, research.getXpCost());
    }

    /**
     * Okamžité odemčení (admin / debug).
     */
    public void forceUnlock(PlayerResearchData data, String researchId) {
        data.forceUnlock(researchId);
    }

    // ─── Dotazování ───────────────────────────────────────────────────────────

    public SlimefunResearch getResearch(String researchId) {
        return researches.get(researchId);
    }

    public Collection<SlimefunResearch> getAllResearches() {
        return Collections.unmodifiableCollection(researches.values());
    }

    /**
     * Vrátí true pokud hráč odemkl výzkum nutný pro daný stroj/item.
     */
    public boolean hasUnlockedItem(PlayerResearchData data, String itemId) {
        // Najdi výzkum který odemyká daný item
        for (SlimefunResearch research : researches.values()) {
            if (research.getUnlockedMachines().contains(itemId)) {
                if (!research.isUnlockedBy(data)) return false;
            }
        }
        return true; // nenalezeno = volně dostupné
    }

    // ─── ECS ──────────────────────────────────────────────────────────────────

    public ComponentType<EntityStore, PlayerResearchData> getResearchDataComponentType() {
        return researchDataComponentType;
    }
}
