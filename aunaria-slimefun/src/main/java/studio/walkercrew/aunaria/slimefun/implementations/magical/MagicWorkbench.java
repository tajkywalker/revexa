package studio.walkercrew.aunaria.slimefun.implementations.magical;

import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;

/**
 * Magic Workbench — srdce magického řemesla Aunaria Slimefun 2.0.
 *
 * ════════════════════════════════════════════
 *  MODEL: Propracovaný dřevěno-kamenný stůl
 *   • Otevřená grimoáře (spell book) nahoře
 *   • Amethystové krystaly na rozích
 *   • Závěsné magické svítilny
 *   • Fialové runové symboly na přední stěně
 *  GUI: Arcane themed — tmavé pozadí, zlaté okraje,
 *       fialové slot-ramy, animovaný arcane kruh
 * ════════════════════════════════════════════
 *
 * Výroba:
 *  - Mana Crystal + <materiály> → magické předměty
 *  - Vytváří Tier-1 a Tier-2 magické komponenty
 *  - Produkuje Enchanted Steel, Arcane Tools a další
 *
 * Každá receptura potřebuje MANA_CRYSTAL jako katalyzátor.
 */
public class MagicWorkbench extends AbstractMagicalMachine {

    private static final String ID = "SF_Magic_Workbench";

    @Override
    public String getMachineId() { return ID; }

    @Override
    public String getDisplayName() { return "Magic Workbench"; }

    @Override
    public SlimefunItem.ItemCategory getCategory() {
        return SlimefunItem.ItemCategory.MAGIC;
    }

    @Override
    protected void registerRecipes() {
        // ─── Tier 1 — magické základní materiály ──────────────────────────

        // Mana Crystal + Iron → Enchanted Steel
        registerRecipe(MachineRecipe.builder()
            .input(MANA_CRYSTAL_ID, 1)
            .input("SF_Refined_Iron", 2)
            .output("SF_Enchanted_Steel", 1)
            .seconds(6)
            .build());

        // Mana Crystal + Dust → Arcane Dust
        registerRecipe(MachineRecipe.builder()
            .input(MANA_CRYSTAL_ID, 2)
            .input("SF_Refined_Iron", 1)
            .input("Block_Stone", 3)
            .output("SF_Arcane_Dust", 4)
            .seconds(5)
            .build());

        // Mana Crystal + Soul component → Soul Ember
        // Soul Ember: sbírá se ze speciálních Hytale mobů
        registerRecipe(MachineRecipe.builder()
            .input(MANA_CRYSTAL_ID, 3)
            .input("SF_Arcane_Dust", 2)
            .output("SF_Soul_Ember", 1)
            .seconds(10)
            .build());

        // Ancient Rune: Mana Crystal + Alloy + Arcane Dust
        registerRecipe(MachineRecipe.builder()
            .input(MANA_CRYSTAL_ID, 2)
            .input("SF_Alloy_Ingot", 1)
            .input("SF_Arcane_Dust", 3)
            .output("SF_Ancient_Rune", 1)
            .seconds(12)
            .build());

        // ─── Tier 2 — pokročilé magické komponenty ─────────────────────────

        // Void Essence (náročná receptura — vyžaduje vzácné ingredience)
        registerRecipe(MachineRecipe.builder()
            .input(MANA_CRYSTAL_ID, 5)
            .input("SF_Soul_Ember", 2)
            .input("SF_Arcane_Dust", 4)
            .output("SF_Void_Essence", 1)
            .seconds(20)
            .build());

        // Enchanted Armor Plate
        registerRecipe(MachineRecipe.builder()
            .input(MANA_CRYSTAL_ID, 3)
            .input("SF_Enchanted_Steel", 4)
            .input("SF_Ancient_Rune", 1)
            .output("SF_Enchanted_Armor_Plate", 1)
            .seconds(15)
            .build());

        // ─── Tier 3 — Arcane Forge stavba ─────────────────────────────────

        // Arcane Forge samo vyžaduje Magic Workbench k postavení
        registerRecipe(MachineRecipe.builder()
            .input(MANA_CRYSTAL_ID, 8)
            .input("SF_Enchanted_Steel", 6)
            .input("SF_Ancient_Rune", 3)
            .input("SF_Alloy_Ingot", 4)
            .output("SF_Arcane_Forge", 1)
            .seconds(30)
            .build());

        // Crystal Infuser
        registerRecipe(MachineRecipe.builder()
            .input(MANA_CRYSTAL_ID, 6)
            .input("SF_Enchanted_Steel", 4)
            .input("SF_Void_Essence", 2)
            .output("SF_Crystal_Infuser", 1)
            .seconds(25)
            .build());

        // Alchemist's Cauldron
        registerRecipe(MachineRecipe.builder()
            .input(MANA_CRYSTAL_ID, 4)
            .input("SF_Alloy_Ingot", 3)
            .input("SF_Arcane_Dust", 5)
            .output("SF_Alchemist_Cauldron", 1)
            .seconds(20)
            .build());
    }
}
