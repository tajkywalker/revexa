package studio.walkercrew.aunaria.slimefun.implementations.machines;

import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.machine.AbstractElectricMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;

/**
 * Electric Furnace — elektrická tavicí pec.
 *
 * Vlastnosti:
 *  - Potřebuje 24 J/tick (≈ 480 J/s)
 *  - Taví rudy 2x rychleji než vanilková pec
 *  - Může tavit SF materiály i standardní hytale suroviny
 *  - Interní buffer: 512 J
 *
 * Receptury:
 *  - Veškeré standardní tavení rud (Iron, Gold, Copper...)
 *  - SF zpracování: Crushed Iron Ore → Refined Iron
 */
public class ElectricFurnace extends AbstractElectricMachine {

    private static final String ID = "SF_Electric_Furnace";

    @Override
    public String getMachineId() { return ID; }

    @Override
    public String getDisplayName() { return "Electric Furnace"; }

    @Override
    public SlimefunItem.ItemCategory getCategory() {
        return SlimefunItem.ItemCategory.ELECTRICITY;
    }

    @Override
    public int getEnergyConsumptionPerTick() { return 24; }

    @Override
    public int getMachineEnergyBuffer() { return 512; }

    @Override
    protected void registerRecipes() {
        // ─── Standardní tavení ─────────────────────────────────────────────

        // Iron Ore → Iron Ingot (rychlejší: 1.5s vs 3s vanilka)
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Iron", 1)
            .output("Ingredient_Iron", 1)
            .seconds(1.5)
            .energy(36)
            .build());

        // Gold Ore → Gold Ingot
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Gold", 1)
            .output("Ingredient_Gold", 1)
            .seconds(1.5)
            .energy(36)
            .build());

        // Copper Ore → Copper Ingot
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Copper", 1)
            .output("Ingredient_Copper", 1)
            .seconds(1.5)
            .energy(36)
            .build());

        // Stone → Smooth Stone
        registerRecipe(MachineRecipe.builder()
            .input("Block_Stone", 1)
            .output("Block_SmoothStone", 1)
            .seconds(1)
            .energy(24)
            .build());

        // ─── SF zpracování ─────────────────────────────────────────────────

        // Crushed Iron (z Ore Washeru) → Refined Iron (dvojnásobný výnos)
        registerRecipe(MachineRecipe.builder()
            .input("SF_Refined_Iron", 2)  // vstup z Ore Washeru není SF_Refined_Iron ale bude to...
            .output("SF_Alloy_Ingot", 1)
            .seconds(3)
            .energy(96)
            .build());

        // 2x Iron Ore → 3x Refined Iron (pomocí pece — úspornější než ECT)
        registerRecipe(MachineRecipe.builder()
            .input("Ore_Iron", 2)
            .output("SF_Refined_Iron", 3)
            .seconds(2)
            .energy(48)
            .build());

        // Smelt Sand → Glass
        registerRecipe(MachineRecipe.builder()
            .input("Block_Sand", 2)
            .output("Block_Glass", 2)
            .seconds(1.5)
            .energy(36)
            .build());
    }
}
