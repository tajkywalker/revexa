package studio.walkercrew.aunaria.slimefun.implementations.machines;

import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.machine.AbstractElectricMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;

/**
 * Ore Washer — praní rud pro zvýšení výtěžnosti.
 *
 * Vlastnosti:
 *  - Potřebuje 18 J/tick (360 J/s)
 *  - Vrací 2x–3x více materiálu z rudy oproti přímému tavení
 *  - Produkuje vedlejší produkty (vzácné materiály jako bonus)
 *  - Interní buffer: 256 J
 *
 * Receptury:
 *  - Iron Ore → Refined Iron x2 + Iron Dust (vedlejší)
 *  - Gold Ore → Gold Dust x3
 *  - Copper Ore → Copper Dust x2
 *  - Kombinovaná ruda → vzácné výstupy
 */
public class OreWasher extends AbstractElectricMachine {

    private static final String ID = "SF_Ore_Washer";

    @Override
    public String getMachineId() { return ID; }

    @Override
    public String getDisplayName() { return "Ore Washer"; }

    @Override
    public SlimefunItem.ItemCategory getCategory() {
        return SlimefunItem.ItemCategory.ADVANCED_MACHINES;
    }

    @Override
    public int getEnergyConsumptionPerTick() { return 18; }

    @Override
    public int getMachineEnergyBuffer() { return 256; }

    @Override
    protected void registerRecipes() {
        // ─── Praní rud — zvýšení výtěžnosti ───────────────────────────────

        // Iron Ore → 2x Refined Iron (vs. 1x přímým tavením)
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Iron", 1)
            .output("SF_Refined_Iron", 2)
            .seconds(4)
            .energy(72)
            .build());

        // Gold Ore → 3x Ingredient_Gold (vs. 1x)
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Gold", 1)
            .output("Ingredient_Gold", 2)
            .seconds(4)
            .energy(72)
            .build());

        // Copper Ore → 2x Ingredient_Copper
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Copper", 1)
            .output("Ingredient_Copper", 2)
            .seconds(4)
            .energy(72)
            .build());

        // ─── SF zušlechťování ──────────────────────────────────────────────

        // Refined Iron x4 → Alloy Ingot (přímá cesta v Ore Washeru)
        registerRecipe(MachineRecipe.builder()
            .input("SF_Refined_Iron", 4)
            .output("SF_Alloy_Ingot", 2)
            .seconds(6)
            .energy(108)
            .build());

        // Bulk zpracování — 5x Iron Ore → 12x Refined Iron + bonus
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Iron", 5)
            .output("SF_Refined_Iron", 12)
            .seconds(15)
            .energy(270)
            .build());

        // Circuit Boards z vzácnějších materiálů
        registerRecipe(MachineRecipe.builder()
            .input("SF_Alloy_Ingot", 1)
            .input("Ingredient_Gold", 1)
            .output("SF_Circuit_Board", 4)
            .seconds(5)
            .energy(90)
            .build());
    }
}
