package studio.walkercrew.aunaria.slimefun.implementations.generators;

import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.energy.IEnergyNode;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

/**
 * Solar Generator — solární generátor energie.
 *
 * Vlastnosti:
 *  - Produkuje 6 J/tick (120 J/s) ve dne
 *  - Nefunguje v noci, v jeskyni nebo za špatného počasí
 *  - Vyžaduje přímý výhled na oblohu (Y nad nejvyšším blokem)
 *  - Nevyžaduje palivo
 *  - Teaser Tier 2: Advanced Solar Panel → 24 J/tick (odemčeno výzkumem)
 *
 * Podmínky pro fungování (kontrolovány tick systémem):
 *  1. Je den (time < 12000 nebo time > 23000 v Hytale)
 *  2. Blok nad generátorem je vzduch (výhled na oblohu)
 *  3. Není déšť / bouřka
 */
public class SolarGenerator extends AbstractMachine {

    private static final String ID = "SF_Solar_Generator";
    private static final int DAY_OUTPUT_PER_TICK = 6;
    private static final int NIGHT_OUTPUT_PER_TICK = 0;

    @Override
    public String getMachineId() { return ID; }

    @Override
    public String getDisplayName() { return "Solar Generator"; }

    @Override
    public SlimefunItem.ItemCategory getCategory() {
        return SlimefunItem.ItemCategory.ELECTRICITY;
    }

    @Override
    public IEnergyNode.NodeType getNodeType() {
        return IEnergyNode.NodeType.GENERATOR;
    }

    @Override
    public int getEnergyOutputPerTick() { return DAY_OUTPUT_PER_TICK; }

    @Override
    protected void registerRecipes() {
        // Solární generátor nemá vstupní receptury — vyrábí energii z denního světla
        // Prázdná implementace záměrně
    }

    /**
     * Tick solárního generátoru.
     * Parametr `powered` je přijat z MachineTickSystem, který kontroluje světlo.
     * Pokud je den a výhled na oblohu: powered = true (speciální flag pro slunce).
     */
    @Override
    public boolean onMachineTick(MachineState state, boolean powered) {
        // `powered` zde = je denní světlo a výhled na oblohu
        // EnergyNetworkManager přijme výstup automaticky pokud generátor funguje
        return powered;
    }

    @Override
    public void onInteract(Player player, MachineState state) {
        boolean active = state.isPoweredLastTick();

        StringBuilder sb = new StringBuilder();
        sb.append("§e[Solar Generator]§r\n");
        sb.append("§7Výstup: §e").append(DAY_OUTPUT_PER_TICK).append(" J/tick §7(ve dne)\n");
        sb.append("§7Stav: ").append(active
            ? "§aProdukuje energii"
            : "§cNeaktivní (noc nebo zakrytý)");

        player.sendMessage(Player.Message.raw(sb.toString()));
    }
}
