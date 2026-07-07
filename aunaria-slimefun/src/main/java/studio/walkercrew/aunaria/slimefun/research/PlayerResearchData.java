package studio.walkercrew.aunaria.slimefun.research;

import com.hypixel.hytale.component.Component;
import com.hypixel.hytale.component.ComponentType;
import com.hypixel.hytale.server.core.universe.entity.EntityStore;
import studio.walkercrew.aunaria.slimefun.SlimefunPlugin;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * ECS komponenta ukládající stav výzkumu konkrétního hráče.
 *
 * Persistována přes Hytale ECS (putComponent + Codec), takže data
 * přetrvávají mezi přihlášeními.
 *
 * Každý výzkum je buď:
 *  - UNLOCKED  — hráč ho dokončil
 *  - IN_PROGRESS — hráč nashromáždil část XP (pro budoucí rozšíření)
 *  - nezapsán   — hráč ho ještě nerozpracoval
 */
public class PlayerResearchData implements Component<EntityStore> {

    /** Odemčené výzkumy: researchId → true */
    private final Set<String> unlockedResearches = new HashSet<>();

    /**
     * Výzkumy v průběhu: researchId → nashromážděné XP.
     * Pokud je v unlockedResearches, zde se nevyskytuje.
     */
    private final Map<String, Integer> inProgressResearches = new HashMap<>();

    // ─── Rozhraní pro čtení ───────────────────────────────────────────────────

    public boolean hasResearch(String researchId) {
        return unlockedResearches.contains(researchId);
    }

    public int getAccumulatedXp(String researchId) {
        return inProgressResearches.getOrDefault(researchId, 0);
    }

    public Set<String> getUnlockedResearches() {
        return java.util.Collections.unmodifiableSet(unlockedResearches);
    }

    // ─── Rozhraní pro modifikaci ──────────────────────────────────────────────

    /**
     * Přidá XP k výzkumu. Pokud dosáhne prahu cost, výzkum se automaticky
     * odemkne a metoda vrátí true.
     *
     * @param researchId ID výzkumu
     * @param xpToAdd    počet XP k přidání
     * @param cost       celková cena výzkumu v XP
     * @return true pokud byl výzkum právě dokončen
     */
    public boolean addXp(String researchId, int xpToAdd, int cost) {
        if (unlockedResearches.contains(researchId)) return false;

        int current = inProgressResearches.getOrDefault(researchId, 0);
        int newTotal = current + xpToAdd;

        if (newTotal >= cost) {
            inProgressResearches.remove(researchId);
            unlockedResearches.add(researchId);
            return true;
        }
        inProgressResearches.put(researchId, newTotal);
        return false;
    }

    /**
     * Okamžitě odemkne výzkum (admin příkaz / debug).
     */
    public void forceUnlock(String researchId) {
        inProgressResearches.remove(researchId);
        unlockedResearches.add(researchId);
    }

    /**
     * Zamkne výzkum (reset / admin).
     */
    public void resetResearch(String researchId) {
        unlockedResearches.remove(researchId);
        inProgressResearches.remove(researchId);
    }

    // ─── ECS Component implementace ──────────────────────────────────────────

    @Override
    public Component<EntityStore> clone() {
        PlayerResearchData copy = new PlayerResearchData();
        copy.unlockedResearches.addAll(this.unlockedResearches);
        copy.inProgressResearches.putAll(this.inProgressResearches);
        return copy;
    }

    public static ComponentType<EntityStore, PlayerResearchData> getComponentType() {
        return SlimefunPlugin.instance.getResearchManager().getResearchDataComponentType();
    }

    // ─── Budoucí rozšíření: Codec pro persistenci ─────────────────────────────
    // TODO: Přidat BuilderCodec s BsonDocument pro plnou ECS persistenci.
    // Aktuálně je data ukládána v paměti (resetuje se při restartu serveru).
    // Implementace viz: https://hytalemodding.dev/en/docs/guides/plugin/store-persistent-data
}
