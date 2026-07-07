package studio.walkercrew.aunaria.slimefun.implementations.generators;

import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.energy.IEnergyNode;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

import java.util.Map;

/**
 * Coal Generator — generátor energie spalováním uhlí.
 *
 * Vlastnosti:
 *  - Produkuje 16 J/tick (320 J/s)
 *  - Paliva: Coal (uhlí), Charcoal, Coal Block, Wood
 *  - Každý kus uhlí vydrží 80 ticků (4 sekundy)
 *  - Bez paliva generátor neprodukuje energii
 *
 * Paliva a délka hoření (v tickách):
 *  - Coal       → 80 ticků
 *  - Coal Block → 800 ticků (9x uhlí)
 *  - Wood       → 30 ticků
 */
public class CoalGenerator extends AbstractMachine {

    private static final String ID = "SF_Coal_Generator";
    private static final int OUTPUT_PER_TICK = 16;

    /** Délka hoření paliv v tickách */
    private static final Map<String, Integer> BURN_TIMES = Map.of(
        "Ingredient_Coal",    80,
        "Block_CoalOre",      800,
        "Ingredient_Charcoal", 60,
        "Block_Wood",         30
    );

    @Override
    public String getMachineId() { return ID; }

    @Override
    public String getDisplayName() { return "Coal Generator"; }

    @Override
    public SlimefunItem.ItemCategory getCategory() {
        return SlimefunItem.ItemCategory.ELECTRICITY;
    }

    @Override
    public IEnergyNode.NodeType getNodeType() {
        return IEnergyNode.NodeType.GENERATOR;
    }

    @Override
    public int getEnergyOutputPerTick() { return OUTPUT_PER_TICK; }

    @Override
    protected void registerRecipes() {
        // Generátory nemají receptury v klasickém smyslu — definujeme paliva
        // jako "receptury" kde vstup = palivo a výstup = "energy" (symbolické)
        for (Map.Entry<String, Integer> fuel : BURN_TIMES.entrySet()) {
            registerRecipe(MachineRecipe.builder()
                .input(fuel.getKey(), 1)
                .output("SF_Generator_Energy_Output", 1)  // symbolický výstup
                .ticks(fuel.getValue())
                .build());
        }
    }

    /**
     * Tick generátoru — pokud má palivo, generuje energii.
     * Energie je distribuována přes EnergyNetworkManager.
     */
    @Override
    public boolean onMachineTick(MachineState state, boolean powered) {
        if (state.isProcessing()) {
            // Probíhá spalování paliva
            state.tick();
            return true; // generátor aktivní
        }

        // Pokus se zahájit spalování dalšího paliva
        for (MachineRecipe recipe : getRecipes()) {
            if (state.hasInputFor(recipe)) {
                state.startProcessing(recipe);
                return true;
            }
        }

        return false; // žádné palivo
    }

    @Override
    public void onInteract(Player player, MachineState state) {
        StringBuilder sb = new StringBuilder();
        sb.append("§6[Coal Generator]§r\n");
        sb.append("§7Výstup: §e").append(OUTPUT_PER_TICK).append(" J/tick§7\n");

        if (state.isProcessing()) {
            int pct = (int) (state.getProgressPercent() * 100);
            sb.append("§7Spalování: §e").append(pct).append("%§7 (zbývá §e")
              .append(state.getTicksRemaining()).append(" ticků)");
        } else {
            sb.append("§7Stav: §cNeaktivní — vlož palivo (uhlí, dřevo...)");
        }

        player.sendMessage(Player.Message.raw(sb.toString()));
    }
}
