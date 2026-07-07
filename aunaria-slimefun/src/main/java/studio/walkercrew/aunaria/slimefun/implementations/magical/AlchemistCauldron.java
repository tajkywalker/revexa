package studio.walkercrew.aunaria.slimefun.implementations.magical;

import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

/**
 * Alchemist's Cauldron — magický kotlík alchymisty.
 *
 * ════════════════════════════════════════════
 *  MODEL: Velký kamenný kotlík s bubbly,
 *         zlaté runy na okraji, bublající
 *         fialová/zelená kapalina uvnitř,
 *         dřevěné míchátko
 *  GUI: Zeleno-fialové téma, animované bubliny,
 *       slot pro "heat source" (palivo), output
 *       jsou speciální flakonky/láhve
 * ════════════════════════════════════════════
 *
 * Vlastnosti:
 *  - Vaří různé alchymistické výtvory z herbálních a magických surovin
 *  - Systém TEPLOT: potřebuje palivo (Soul Ember = high-temp, Coal = low-temp)
 *  - Výstupy: elixíry, magické esence, speciální bonusy
 *  - Náhodné "byproducts" — šance na vzácný výstup při vaření
 *
 * Kategorie alchymie:
 *  - LOW HEAT (Soul Coal / Coal): základní výtvory
 *  - HIGH HEAT (Soul Ember): pokročilé elixíry
 *  - VOID HEAT (Void Essence): Tier-3 transmutace
 */
public class AlchemistCauldron extends AbstractMagicalMachine {

    private static final String ID = "SF_Alchemist_Cauldron";

    @Override
    public String getMachineId() { return ID; }

    @Override
    public String getDisplayName() { return "Alchemist's Cauldron"; }

    @Override
    public SlimefunItem.ItemCategory getCategory() {
        return SlimefunItem.ItemCategory.MAGIC;
    }

    @Override
    protected void registerRecipes() {
        // ─── LOW HEAT — základní alchymie (Coal) ──────────────────────────

        // Healing Salve: byliny + voda
        registerRecipe(MachineRecipe.builder()
            .input("Ingredient_Coal", 1)      // palivo (low heat)
            .input(MANA_CRYSTAL_ID, 1)
            .input("SF_Arcane_Dust", 2)
            .output("SF_Healing_Salve", 2)
            .seconds(8)
            .build());

        // Strength Elixir: iron + soul ember + crystals
        registerRecipe(MachineRecipe.builder()
            .input("Ingredient_Coal", 1)
            .input(MANA_CRYSTAL_ID, 2)
            .input("SF_Refined_Iron", 1)
            .output("SF_Strength_Elixir", 1)
            .seconds(12)
            .build());

        // Mana Potion: crystal + arcane dust
        registerRecipe(MachineRecipe.builder()
            .input("Ingredient_Coal", 1)
            .input(MANA_CRYSTAL_ID, 3)
            .output("SF_Mana_Potion", 2)
            .seconds(10)
            .build());

        // ─── HIGH HEAT — pokročilá alchymie (Soul Ember) ──────────────────

        // Liquid Arcane: Soul Ember + 4x Mana Crystal (základní magická kapalina)
        registerRecipe(MachineRecipe.builder()
            .input("SF_Soul_Ember", 1)        // palivo (high heat)
            .input(MANA_CRYSTAL_ID, 4)
            .output("SF_Liquid_Arcane", 3)
            .seconds(15)
            .build());

        // Void Oil: Soul Ember + Void Essence (lubrikant pro pokročilé stroje)
        registerRecipe(MachineRecipe.builder()
            .input("SF_Soul_Ember", 2)
            .input("SF_Void_Essence", 1)
            .input("SF_Arcane_Dust", 3)
            .output("SF_Void_Oil", 2)
            .seconds(20)
            .build());

        // Philosopher's Extract: vzácný výtvor
        registerRecipe(MachineRecipe.builder()
            .input("SF_Soul_Ember", 3)
            .input(MANA_CRYSTAL_ID, 6)
            .input("SF_Ancient_Rune", 1)
            .output("SF_Philosophers_Extract", 1)
            .seconds(30)
            .build());

        // ─── VOID HEAT — Tier 3 transmutace (Void Essence) ────────────────

        // Stone → rarertní ores (transmutace hmoty)
        registerRecipe(MachineRecipe.builder()
            .input("SF_Void_Essence", 1)
            .input("Block_Stone", 8)
            .input(MANA_CRYSTAL_ID, 4)
            .output("Ore_Gold", 2)
            .output("Ore_Iron", 3)
            .seconds(25)
            .build());

        // Essence of Power: ultravzácná esence
        registerRecipe(MachineRecipe.builder()
            .input("SF_Void_Essence", 2)
            .input("SF_Philosophers_Extract", 1)
            .input("SF_Soul_Ember", 3)
            .output("SF_Essence_Of_Power", 1)
            .seconds(45)
            .build());
    }

    @Override
    protected void sendStatusMessage(Player player, MachineState state) {
        StringBuilder sb = new StringBuilder();
        sb.append("§2⚗ §aCauldron — §2Alchemist's Kettle §2⚗§r\n");

        if (state.isProcessing()) {
            int pct = (int) (state.getProgressPercent() * 100);
            // Animovaný bubble progress
            String bubbles = pct > 66 ? "§a♒♒♒" : pct > 33 ? "§2♒♒§8♒" : "§2♒§8♒♒";
            sb.append("§7Vaří se: ").append(bubbles).append(" §a").append(pct).append("%\n");
            sb.append("§7Čas: §e").append(state.getTicksRemaining() / 20).append("s zbývá");
        } else {
            sb.append("§7Kotlík je prázdný — vlož recepturu\n");
            sb.append("§8Palivo: §7Coal §8(basic) §7/ Soul Ember §8(adv.) §7/ Void Essence §8(tier3)");
        }

        player.sendMessage(Player.Message.raw(sb.toString()));
    }
}
