package studio.walkercrew.aunaria.slimefun.implementations.magical;

import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.energy.IEnergyNode;
import studio.walkercrew.aunaria.slimefun.machine.AbstractElectricMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

/**
 * Arcane Forge — magický tavicí stroj Tier 3.
 *
 * ════════════════════════════════════════════
 *  MODEL: Masivní kovaná kovárna s magickými
 *         portálovými rubíny a runami,
 *         zlatý kovadlín s purpurovými
 *         magickými plameny, mechanické
 *         měchy na bocích
 *  GUI: Ohnivě-zlaté téma, spalující animace,
 *       slot pro Runy (katalyzátor), výstupní
 *       slot s magickým zábleskem při dokončení
 * ════════════════════════════════════════════
 *
 * Vlastnosti:
 *  - KOMBINUJE elektřinu (96 J/tick) + Mana Crystal (katalyzátor)
 *  - Infuzuje kovové předměty magickými vlastnostmi
 *  - Vytváří Tier-3 materiály: Void Alloy, Soul Steel, Enchanted Arms
 *  - Interní buffer: 2048 J
 *
 * Arcane Forge je elitní výrobní stanice — výsledky jsou
 * daleko výkonnější než obyčejné SF materiály.
 */
public class ArcaneForge extends AbstractElectricMachine {

    private static final String ID = "SF_Arcane_Forge";

    @Override
    public String getMachineId() { return ID; }

    @Override
    public String getDisplayName() { return "Arcane Forge"; }

    @Override
    public SlimefunItem.ItemCategory getCategory() {
        return SlimefunItem.ItemCategory.MAGIC;
    }

    @Override
    public int getEnergyConsumptionPerTick() { return 96; }

    @Override
    public int getMachineEnergyBuffer() { return 2048; }

    @Override
    protected void registerRecipes() {
        // ─── Tier 3 — kombinace elektra + magie ───────────────────────────

        // Void Alloy: Mana + Alloy + Void Essence → ultimátní kov
        registerRecipe(MachineRecipe.builder()
            .input(AbstractMagicalMachine.MANA_CRYSTAL_ID, 4)
            .input("SF_Alloy_Ingot", 4)
            .input("SF_Void_Essence", 1)
            .output("SF_Void_Alloy", 2)
            .seconds(20)
            .energy(1920)
            .build());

        // Soul Steel: Mana + Enchanted Steel + Soul Ember
        registerRecipe(MachineRecipe.builder()
            .input(AbstractMagicalMachine.MANA_CRYSTAL_ID, 3)
            .input("SF_Enchanted_Steel", 3)
            .input("SF_Soul_Ember", 2)
            .output("SF_Soul_Steel", 2)
            .seconds(18)
            .energy(1728)
            .build());

        // Arcane Circuit: pro ultra-stroje Tier 4
        registerRecipe(MachineRecipe.builder()
            .input(AbstractMagicalMachine.MANA_CRYSTAL_ID, 5)
            .input("SF_Circuit_Board", 4)
            .input("SF_Ancient_Rune", 2)
            .input("SF_Liquid_Arcane", 1)
            .output("SF_Arcane_Circuit", 2)
            .seconds(25)
            .energy(2400)
            .build());

        // ─── Vylepšení standardního materiálu ──────────────────────────────

        // Void Alloy → Ultra Dense Block (stavební materiál pro Tier 4 stroje)
        registerRecipe(MachineRecipe.builder()
            .input(AbstractMagicalMachine.MANA_CRYSTAL_ID, 2)
            .input("SF_Void_Alloy", 4)
            .input("SF_Ancient_Rune", 1)
            .output("SF_Ultra_Dense_Block", 2)
            .seconds(30)
            .energy(2880)
            .build());

        // Enchanted Sword Blank: základní pro magické zbraně
        registerRecipe(MachineRecipe.builder()
            .input(AbstractMagicalMachine.MANA_CRYSTAL_ID, 6)
            .input("SF_Soul_Steel", 3)
            .input("SF_Ancient_Rune", 2)
            .output("SF_Enchanted_Sword_Blank", 1)
            .seconds(35)
            .energy(3360)
            .build());

        // Prismatic Core: základní komponent pro Crystal Infuser upgrady
        registerRecipe(MachineRecipe.builder()
            .input(AbstractMagicalMachine.MANA_CRYSTAL_ID, 4)
            .input("SF_Void_Essence", 2)
            .input("SF_Arcane_Dust", 6)
            .output("SF_Prismatic_Core", 1)
            .seconds(28)
            .energy(2688)
            .build());
    }
}
