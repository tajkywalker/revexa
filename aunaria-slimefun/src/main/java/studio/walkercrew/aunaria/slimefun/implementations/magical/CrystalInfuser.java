package studio.walkercrew.aunaria.slimefun.implementations.magical;

import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.energy.IEnergyNode;
import studio.walkercrew.aunaria.slimefun.machine.AbstractElectricMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

/**
 * Crystal Infuser — infuzér energie přes krystaly.
 *
 * ════════════════════════════════════════════
 *  MODEL: Válcový sloup s rotujícími krystaly
 *         na větvích, elektromagická cívka
 *         uvnitř, fialové/modré kruhy energie
 *         spirálově stoupají kolem modelu
 *  GUI: Krystalické/modré téma, rotující
 *       krystalová animace uprostřed,
 *       INPUT slot (materiál) + CRYSTAL slot
 *       (typ krystalu určuje transformaci) +
 *       OUTPUT slot
 * ════════════════════════════════════════════
 *
 * Unikátní mechanikou Crystal Infuseru je systém CRYSTAL TYPES:
 *  - Vložení různého krystalu do "Crystal Slot" změní výstupní
 *    transformaci (jedna základní receptura, různé výstupy)
 *
 * Energetický příkon: 48 J/tick
 * Interní buffer: 1024 J
 *
 * Crystal typy a jejich efekty:
 *  - Amethyst Crystal → přidá magické vlastnosti (arcane transformation)
 *  - Fire Crystal     → tepelná transformace (smelting upgrade)
 *  - Void Crystal     → void transmutation
 *  - Life Crystal     → organická transformace (bio alchemy)
 */
public class CrystalInfuser extends AbstractElectricMachine {

    private static final String ID = "SF_Crystal_Infuser";

    @Override
    public String getMachineId() { return ID; }

    @Override
    public String getDisplayName() { return "Crystal Infuser"; }

    @Override
    public SlimefunItem.ItemCategory getCategory() {
        return SlimefunItem.ItemCategory.MAGIC;
    }

    @Override
    public int getEnergyConsumptionPerTick() { return 48; }

    @Override
    public int getMachineEnergyBuffer() { return 1024; }

    @Override
    protected void registerRecipes() {
        // ─── AMETHYST infuze — arcane transformation ───────────────────────

        // Iron + Amethyst → Enchanted Steel
        registerRecipe(MachineRecipe.builder()
            .input("SF_Refined_Iron", 3)
            .input("SF_Amethyst_Crystal", 1)       // crystal catalyst
            .output("SF_Enchanted_Steel", 2)
            .seconds(8)
            .energy(384)
            .build());

        // Alloy + Amethyst → Void Alloy (preview — plná verze v Arcane Forge)
        registerRecipe(MachineRecipe.builder()
            .input("SF_Alloy_Ingot", 4)
            .input("SF_Amethyst_Crystal", 2)
            .input(AbstractMagicalMachine.MANA_CRYSTAL_ID, 2)
            .output("SF_Void_Alloy", 1)
            .seconds(15)
            .energy(720)
            .build());

        // ─── FIRE infuze — tepelná transformace ───────────────────────────

        // Circuit Board + Fire Crystal → High-Speed Circuit (produkuje 2x více)
        registerRecipe(MachineRecipe.builder()
            .input("SF_Circuit_Board", 3)
            .input("SF_Fire_Crystal", 1)
            .output("SF_High_Speed_Circuit", 2)
            .seconds(10)
            .energy(480)
            .build());

        // Stone + Fire Crystal → Obsidian (alt. získat bez lávového farming)
        registerRecipe(MachineRecipe.builder()
            .input("Block_Stone", 6)
            .input("SF_Fire_Crystal", 1)
            .output("Block_Obsidian", 2)
            .seconds(12)
            .energy(576)
            .build());

        // ─── VOID infuze — void transmutation ────────────────────────────

        // Arcane Dust + Void Crystal → Pure Void Dust
        registerRecipe(MachineRecipe.builder()
            .input("SF_Arcane_Dust", 6)
            .input("SF_Void_Crystal", 1)
            .output("SF_Pure_Void_Dust", 3)
            .seconds(14)
            .energy(672)
            .build());

        // Mana Crystal + Void Crystal → Prismatic Shard
        registerRecipe(MachineRecipe.builder()
            .input(AbstractMagicalMachine.MANA_CRYSTAL_ID, 4)
            .input("SF_Void_Crystal", 2)
            .output("SF_Prismatic_Shard", 2)
            .seconds(18)
            .energy(864)
            .build());

        // ─── LIFE infuze — bio alchemy ─────────────────────────────────────

        // Arcane Dust + Life Crystal → Rejuvenation Powder
        registerRecipe(MachineRecipe.builder()
            .input("SF_Arcane_Dust", 4)
            .input("SF_Life_Crystal", 1)
            .output("SF_Rejuvenation_Powder", 2)
            .seconds(9)
            .energy(432)
            .build());

        // Prismatic Core creation via Life Crystal
        registerRecipe(MachineRecipe.builder()
            .input("SF_Prismatic_Shard", 4)
            .input("SF_Life_Crystal", 1)
            .input("SF_Soul_Ember", 1)
            .output("SF_Prismatic_Core", 1)
            .seconds(20)
            .energy(960)
            .build());
    }

    @Override
    protected void sendStatusMessage(Player player, MachineState state) {
        StringBuilder sb = new StringBuilder();
        sb.append("§b◈ §9Crystal Infuser §b◈§r\n");
        sb.append("§7Energie: §b").append(state.getStoredEnergy()).append(" J")
          .append(state.isPoweredLastTick() ? " §a✓" : " §c✗").append("\n");

        if (state.isProcessing()) {
            int pct = (int) (state.getProgressPercent() * 100);
            // Krystalický progress
            int gems = pct / 10;
            String gemBar = "§b" + "◆".repeat(gems) + "§8" + "◇".repeat(10 - gems);
            sb.append("§7Infuze: ").append(gemBar).append(" §9").append(pct).append("%");
        } else {
            sb.append("§7Vlož: §8[materiál] + [typ krystalu]\n");
            sb.append("§8Crystaly: §bAmethyst §8/ §cFire §8/ §5Void §8/ §aLife");
        }

        player.sendMessage(Player.Message.raw(sb.toString()));
    }
}
