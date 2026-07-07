package studio.walkercrew.aunaria.slimefun.implementations.machines;

import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

/**
 * Enhanced Crafting Table — základní stůl pro výrobu Slimefun 2.0 předmětů.
 *
 * Vlastnosti:
 *  - Nevyžaduje energii (manuální stroj)
 *  - Produkuje pokročilé materiály z běžných surovin
 *  - Zpracování trvá 2 sekundy (40 ticků)
 *  - Hráč musí být přítomný a kliknout pro zahájení výroby
 *
 * Základní receptury:
 *  - 3x Iron + 3x Wood → Circuit Board
 *  - 2x Iron + 1x Coal → Refined Iron
 *  - 4x Refined Iron + 2x gold_ingot → Alloy Ingot
 *  - Sestavy pro základní SF stroje
 */
public class EnhancedCraftingTable extends AbstractMachine {

    private static final String ID = "SF_Enhanced_Crafting_Table";

    @Override
    public String getMachineId() { return ID; }

    @Override
    public String getDisplayName() { return "Enhanced Crafting Table"; }

    @Override
    public SlimefunItem.ItemCategory getCategory() {
        return SlimefunItem.ItemCategory.BASIC_MACHINES;
    }

    @Override
    protected void registerRecipes() {
        // ─── Základní materiály ────────────────────────────────────────────

        // Circuit Board: 3x Iron Ore + 3x Fibre
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Iron", 3)
            .input("Ingredient_Fibre", 3)
            .output("SF_Circuit_Board", 2)
            .seconds(2)
            .build());

        // Refined Iron: 2x Iron + 1x Coal
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Iron", 2)
            .input("Ingredient_Coal", 1)
            .output("SF_Refined_Iron", 3)
            .seconds(2)
            .build());

        // Alloy Ingot: 4x Refined Iron + 2x Gold
        registerRecipe(MachineRecipe.builder()
            .input("SF_Refined_Iron", 4)
            .input("Ore_Gold", 2)
            .output("SF_Alloy_Ingot", 2)
            .seconds(3)
            .build());

        // ─── Sestavy strojů ────────────────────────────────────────────────

        // Electric Furnace: 2x Alloy Ingot + 4x Circuit Board + 1x Iron Ore
        registerRecipe(MachineRecipe.builder()
            .input("SF_Alloy_Ingot", 2)
            .input("SF_Circuit_Board", 4)
            .input("Ore_Iron", 4)
            .output("SF_Electric_Furnace", 1)
            .seconds(5)
            .build());

        // Coal Generator: 3x Iron Ore + 2x Stone + 1x Coal
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Iron", 3)
            .input("Block_Stone", 2)
            .input("Ingredient_Coal", 1)
            .output("SF_Coal_Generator", 1)
            .seconds(4)
            .build());

        // Energy Capacitor: 4x Circuit Board + 2x Alloy Ingot
        registerRecipe(MachineRecipe.builder()
            .input("SF_Circuit_Board", 4)
            .input("SF_Alloy_Ingot", 2)
            .output("SF_Energy_Capacitor", 1)
            .seconds(5)
            .build());

        // Ore Washer: 3x Alloy Ingot + 2x Circuit Board + water bucket
        registerRecipe(MachineRecipe.builder()
            .input("SF_Alloy_Ingot", 3)
            .input("SF_Circuit_Board", 2)
            .output("SF_Ore_Washer", 1)
            .seconds(6)
            .build());

        // Solar Generator: 4x Alloy Ingot + 2x Glass + 4x Circuit Board
        registerRecipe(MachineRecipe.builder()
            .input("SF_Alloy_Ingot", 4)
            .input("Block_Glass", 2)
            .input("SF_Circuit_Board", 4)
            .output("SF_Solar_Generator", 1)
            .seconds(7)
            .build());
    }

    /**
     * Interakce se stolem — pokud hráč drží odpovídající materiál,
     * automaticky zahájí výrobu.
     */
    @Override
    public void onInteract(Player player, MachineState state) {
        if (state.isProcessing()) {
            int pct = (int) (state.getProgressPercent() * 100);
            player.sendMessage(Player.Message.raw(
                "§b[Enhanced Crafting Table] §7Výroba probíhá: §e" + pct + "%"
            ));
            return;
        }

        if (!state.getOutputInventory().isEmpty()) {
            player.sendMessage(Player.Message.raw(
                "§b[Enhanced Crafting Table] §7Výstup čeká na odebrání: §e"
                + state.getOutputInventory().size() + " položek. §7Použij /sf pickup."
            ));
            return;
        }

        player.sendMessage(Player.Message.raw(
            "§b[Enhanced Crafting Table]§r\n" +
            "§7Vlož materiály příkazem §e/sf insert <itemId> <množství>§7\n" +
            "§7nebo otevři průvodce §e/sf guide §7pro seznam receptur."
        ));
    }
}
