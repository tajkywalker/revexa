package studio.walkercrew.aunaria.slimefun.implementations.magical;

import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.energy.IEnergyNode;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

/**
 * Základní třída pro magické stroje Slimefun 2.0.
 *
 * Magické stroje NEMAJÍ klasický elektrický příkon (joule).
 * Místo toho spotřebovávají:
 *  - Mana Crystaly jako přísady (spotřebovány ze vstupu)
 *  - Nebo jsou pasivní a fungují bez zdroje energie
 *
 * Klíčové rozdíly od elektrických strojů:
 *  - Mají vlastní gravitaci zpracování (pomalejší, více výstupů)
 *  - Spotřeba Mana Crystal je zahrnutá v receptuře jako vstup
 *  - Vizuálně: tmavá/fialová témata, magické animace v GUI
 *  - Mohou produkovat "byproducts" — vedlejší magické výstupy
 *
 * Magické stroje jsou součástí výzkumné větve "sf_arcane_arts".
 */
public abstract class AbstractMagicalMachine extends AbstractMachine {

    public static final String MANA_CRYSTAL_ID = "SF_Mana_Crystal";

    @Override
    public IEnergyNode.NodeType getNodeType() {
        return null; // Magické stroje nejsou součástí energetické sítě
    }

    /**
     * Magické stroje zpracovávají recepty standardně — Mana Crystal
     * ale musí být součástí každé receptury jako vstupní přísada,
     * čímž je automaticky spotřebována.
     *
     * Podtřídy mohou přepsat pro speciální chování (kauldron, forge...).
     */
    @Override
    public boolean onMachineTick(MachineState state, boolean powered) {
        if (state.isProcessing()) {
            return state.tick();
        }

        if (!state.hasOutputSpace()) return false;

        for (MachineRecipe recipe : getRecipes()) {
            if (state.hasInputFor(recipe)) {
                state.startProcessing(recipe);
                return true;
            }
        }
        return false;
    }

    @Override
    protected void sendStatusMessage(Player player, MachineState state) {
        StringBuilder sb = new StringBuilder();
        sb.append("§5✦ §d").append(getDisplayName()).append(" §5✦§r\n");

        if (state.isProcessing()) {
            int pct = (int) (state.getProgressPercent() * 100);
            // Magický progress bar (fialový)
            int filled = pct / 5;
            String bar = "§5" + "▓".repeat(filled) + "§8" + "░".repeat(20 - filled);
            sb.append("§7Probíhá: ").append(bar).append(" §d").append(pct).append("%\n");
        } else if (!state.getOutputInventory().isEmpty()) {
            sb.append("§7Výstup připraven: §d")
              .append(state.getOutputInventory().size()).append(" stacků\n");
            sb.append("§7Použi §e/sf pickup §7pro odebrání.");
        } else {
            sb.append("§7Stav: §8Čeká na přísady...\n");
            sb.append("§7Vlož materiály: §e/sf insert <id> <množství>");
        }

        player.sendMessage(Player.Message.raw(sb.toString()));
    }
}
