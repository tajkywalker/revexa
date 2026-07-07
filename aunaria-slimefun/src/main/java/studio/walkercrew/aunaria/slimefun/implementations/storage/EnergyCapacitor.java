package studio.walkercrew.aunaria.slimefun.implementations.storage;

import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.energy.IEnergyNode;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

/**
 * Energy Capacitor — úložiště energie v energetické síti.
 *
 * Vlastnosti:
 *  - Kapacita: 1024 J
 *  - Automaticky ukládá přebytečnou energii ze sítě
 *  - Automaticky doplňuje energii spotřebičům když generátory nestačí
 *  - Vizuální indikátor nabití (barva modelu podle % nabití)
 *
 * Tiery kapacitorů (pro budoucí rozšíření):
 *  - Basic Capacitor:    1 024 J
 *  - Advanced Capacitor: 8 192 J
 *  - Flux Capacitor:    65 536 J
 */
public class EnergyCapacitor extends AbstractMachine {

    private static final String ID = "SF_Energy_Capacitor";
    private static final long CAPACITY = 1_024L;

    @Override
    public String getMachineId() { return ID; }

    @Override
    public String getDisplayName() { return "Energy Capacitor"; }

    @Override
    public SlimefunItem.ItemCategory getCategory() {
        return SlimefunItem.ItemCategory.ELECTRICITY;
    }

    @Override
    public IEnergyNode.NodeType getNodeType() {
        return IEnergyNode.NodeType.STORAGE;
    }

    /**
     * Vrátí kapacitu tohoto kapacitoru.
     * Používáno při registraci do EnergyNetworkManager.
     */
    public long getCapacity() { return CAPACITY; }

    @Override
    protected void registerRecipes() {
        // Kapacitor nemá zpracovací receptury
    }

    @Override
    public boolean onMachineTick(MachineState state, boolean powered) {
        // Kapacitor nemá vlastní tick logiku — energie je spravována EnergyNetwork
        return false;
    }

    @Override
    public void onInteract(Player player, MachineState state) {
        long stored = state.getStoredEnergy();
        double percent = CAPACITY > 0 ? (double) stored / CAPACITY * 100 : 0;

        // Vizuální progress bar (20 znaků)
        int filled = (int) (percent / 5);
        String bar = "§a" + "█".repeat(filled) + "§8" + "░".repeat(20 - filled);

        StringBuilder sb = new StringBuilder();
        sb.append("§b[Energy Capacitor]§r\n");
        sb.append("§7Uloženo: §e").append(stored).append(" J §7/ §e").append(CAPACITY).append(" J\n");
        sb.append(bar).append("\n");
        sb.append(String.format("§7Nabití: §e%.1f%%", percent));

        player.sendMessage(Player.Message.raw(sb.toString()));
    }
}
