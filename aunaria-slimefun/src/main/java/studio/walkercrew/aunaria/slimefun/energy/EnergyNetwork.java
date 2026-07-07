package studio.walkercrew.aunaria.slimefun.energy;

import java.util.*;

/**
 * Energetická síť — propojená skupina generátorů, spotřebitelů a kapacitorů.
 *
 * Síť funguje každý tick takto:
 * 1. Každý generátor přidá svůj výstup do "pool" sítě
 * 2. Kapacitory přidají svůj aktuálně uložený náboj (do limitu) anebo uloží přebytek
 * 3. Energie se distribuuje spotřebitelům v pořadí priority
 * 4. Zbývající energie se uloží do kapacitorů
 *
 * Kapacita přenosu za tick závisí na `tickEnergyMultiplier` — ve výchozím stavu
 * 1 tick = 1/20 sekundy.
 */
public class EnergyNetwork {

    private final String networkId;

    /** Generátory v síti: pozice → výstup J/tick */
    private final Map<MachinePosition, Integer> generators = new HashMap<>();

    /** Spotřebiče v síti: pozice → požadovaný příkon J/tick */
    private final Map<MachinePosition, Integer> consumers = new HashMap<>();

    /** Kapacitory v síti: pozice → (aktuálně uloženo, kapacita) */
    private final Map<MachinePosition, long[]> storageNodes = new HashMap<>();

    /** Celková aktuálně dostupná energie v síti [J] */
    private long availableEnergy = 0;

    /** Celková kapacita všech kapacitorů v síti [J] */
    private long totalStorageCapacity = 0;

    public EnergyNetwork(String networkId) {
        this.networkId = networkId;
    }

    // ─── Registrace nodů ────────────────────────────────────────────────────

    public void addGenerator(MachinePosition pos, int outputPerTick) {
        generators.put(pos, outputPerTick);
    }

    public void addConsumer(MachinePosition pos, int consumptionPerTick) {
        consumers.put(pos, consumptionPerTick);
    }

    /**
     * @param pos         pozice kapacitoru
     * @param storedEnergy aktuálně uložená energie [J]
     * @param maxCapacity  maximální kapacita [J]
     */
    public void addStorage(MachinePosition pos, long storedEnergy, long maxCapacity) {
        storageNodes.put(pos, new long[]{ storedEnergy, maxCapacity });
        availableEnergy += storedEnergy;
        totalStorageCapacity += maxCapacity;
    }

    public void removeNode(MachinePosition pos) {
        generators.remove(pos);
        consumers.remove(pos);
        long[] storage = storageNodes.remove(pos);
        if (storage != null) {
            availableEnergy -= storage[0];
            totalStorageCapacity -= storage[1];
        }
    }

    // ─── Tick logika ─────────────────────────────────────────────────────────

    /**
     * Ticker sítě — voláno každý SF tick (20x/s).
     * Vrátí mapu pozic spotřebičů → true/false (zda dostaly energii).
     *
     * @return mapa: consumerPos → byl zásoben energií
     */
    public Map<MachinePosition, Boolean> tick() {
        // 1. Seber energii od generátorů
        long produced = generators.values().stream().mapToLong(Integer::longValue).sum();
        availableEnergy += produced;

        // 2. Seber energii z kapacitorů (max tolik kolik spotřebiče potřebují)
        long totalDemand = consumers.values().stream().mapToLong(Integer::longValue).sum();
        long maxDraw = Math.max(0, totalDemand - availableEnergy + produced);

        if (maxDraw > 0 && !storageNodes.isEmpty()) {
            availableEnergy += drawFromStorage(maxDraw);
        }

        // 3. Distribuuj energii spotřebičům
        Map<MachinePosition, Boolean> result = new HashMap<>();
        for (Map.Entry<MachinePosition, Integer> entry : consumers.entrySet()) {
            int demand = entry.getValue();
            if (availableEnergy >= demand) {
                availableEnergy -= demand;
                result.put(entry.getKey(), true);
            } else {
                result.put(entry.getKey(), false);
            }
        }

        // 4. Ulož přebytek do kapacitorů
        if (availableEnergy > 0 && !storageNodes.isEmpty()) {
            availableEnergy -= storeToStorage(availableEnergy);
        }

        return result;
    }

    private long drawFromStorage(long amount) {
        long drawn = 0;
        for (long[] storage : storageNodes.values()) {
            if (drawn >= amount) break;
            long canDraw = Math.min(storage[0], amount - drawn);
            storage[0] -= canDraw;
            drawn += canDraw;
        }
        return drawn;
    }

    private long storeToStorage(long amount) {
        long stored = 0;
        for (long[] storage : storageNodes.values()) {
            long free = storage[1] - storage[0];
            if (free <= 0) continue;
            long canStore = Math.min(free, amount - stored);
            storage[0] += canStore;
            stored += canStore;
            if (stored >= amount) break;
        }
        return stored;
    }

    // ─── Stav ────────────────────────────────────────────────────────────────

    public long getAvailableEnergy() { return availableEnergy; }
    public long getTotalStorageCapacity() { return totalStorageCapacity; }
    public int getGeneratorCount() { return generators.size(); }
    public int getConsumerCount() { return consumers.size(); }
    public int getStorageCount() { return storageNodes.size(); }
    public String getNetworkId() { return networkId; }

    /** J/tick celkem generátory produkují */
    public int getTotalProductionPerTick() {
        return generators.values().stream().mapToInt(Integer::intValue).sum();
    }

    /** J/tick celkem spotřebiče požadují */
    public int getTotalConsumptionPerTick() {
        return consumers.values().stream().mapToInt(Integer::intValue).sum();
    }

    public boolean isEmpty() {
        return generators.isEmpty() && consumers.isEmpty() && storageNodes.isEmpty();
    }

    /**
     * Vrátí uloženou energii konkrétního storage nodu (aktualizovanou po každém tick).
     */
    public long getStoredEnergy(MachinePosition pos) {
        long[] data = storageNodes.get(pos);
        return data != null ? data[0] : 0;
    }

    @Override
    public String toString() {
        return "EnergyNetwork{id='" + networkId +
               "', generators=" + generators.size() +
               ", consumers=" + consumers.size() +
               ", stored=" + availableEnergy + "J}";
    }
}
