package studio.walkercrew.aunaria.slimefun.core;

import studio.walkercrew.aunaria.slimefun.SlimefunPlugin;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Centrální registr všech Slimefun 2.0 položek a strojů.
 *
 * Slouží jako jediný bod pravdy — všechny stroje, receptury a položky
 * jsou registrovány zde a vyhledávány přes itemId.
 */
public class SlimefunRegistry {

    private final SlimefunPlugin plugin;

    /** itemId → SlimefunItem */
    private final Map<String, SlimefunItem> items = new ConcurrentHashMap<>();

    /** itemId → AbstractMachine (stroje jsou zároveň SlimefunItem) */
    private final Map<String, AbstractMachine> machines = new ConcurrentHashMap<>();

    public SlimefunRegistry(SlimefunPlugin plugin) {
        this.plugin = plugin;
    }

    // ─── Registrace ───────────────────────────────────────────────────────────

    /**
     * Registruje SF položku.
     * @param item položka k registraci
     */
    public void registerItem(SlimefunItem item) {
        if (items.containsKey(item.getItemId())) {
            plugin.getSlimefunLogger().warning(
                "Slimefun: Duplicitní registrace položky '" + item.getItemId() + "' ignorována."
            );
            return;
        }
        items.put(item.getItemId(), item);
    }

    /**
     * Registruje SF stroj (automaticky registruje i jako SlimefunItem).
     * @param machine stroj k registraci
     */
    public void registerMachine(AbstractMachine machine) {
        if (machines.containsKey(machine.getMachineId())) {
            plugin.getSlimefunLogger().warning(
                "Slimefun: Duplicitní registrace stroje '" + machine.getMachineId() + "' ignorována."
            );
            return;
        }
        machines.put(machine.getMachineId(), machine);
        items.put(machine.getMachineId(), machine.asSlimefunItem());

        plugin.getSlimefunLogger().fine(
            "Registrován stroj: " + machine.getMachineId()
        );
    }

    // ─── Vyhledávání ──────────────────────────────────────────────────────────

    /**
     * Vrátí SlimefunItem pro dané itemId, nebo null pokud neexistuje.
     */
    public SlimefunItem getItem(String itemId) {
        return items.get(itemId);
    }

    /**
     * Vrátí AbstractMachine pro dané machineId (= itemId bloku), nebo null.
     */
    public AbstractMachine getMachine(String machineId) {
        return machines.get(machineId);
    }

    /**
     * Vrátí true pokud je dané itemId registrovaný stroj.
     */
    public boolean isMachine(String itemId) {
        return machines.containsKey(itemId);
    }

    /**
     * Vrátí true pokud je dané itemId registrovaná SF položka.
     */
    public boolean isSlimefunItem(String itemId) {
        return items.containsKey(itemId);
    }

    // ─── Kolekce ─────────────────────────────────────────────────────────────

    public Collection<SlimefunItem> getAllItems() {
        return Collections.unmodifiableCollection(items.values());
    }

    public Collection<AbstractMachine> getAllMachines() {
        return Collections.unmodifiableCollection(machines.values());
    }

    public List<SlimefunItem> getItemsByCategory(SlimefunItem.ItemCategory category) {
        return items.values().stream()
            .filter(i -> i.getCategory() == category)
            .toList();
    }

    public int getItemCount()    { return items.size(); }
    public int getMachineCount() { return machines.size(); }
}
