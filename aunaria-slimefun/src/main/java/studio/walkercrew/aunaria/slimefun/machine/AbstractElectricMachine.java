package studio.walkercrew.aunaria.slimefun.machine;

import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.energy.IEnergyNode;

/**
 * Základní třída pro elektrické stroje (spotřebiče energie).
 *
 * Elektrické stroje:
 *  1. Potřebují energii za každý tick zpracování
 *  2. Pokud nemají energii, zpracování se zastaví
 *  3. Mají interní energetický buffer (malý zásobník energie)
 *
 * Podtřídy musí definovat:
 *  - getEnergyConsumptionPerTick() — kolik J/tick spotřebují
 *  - (volitelně) getMachineEnergyBuffer() — velikost interního bufferu
 */
public abstract class AbstractElectricMachine extends AbstractMachine {

    @Override
    public IEnergyNode.NodeType getNodeType() {
        return IEnergyNode.NodeType.CONSUMER;
    }

    /**
     * Interní energetický buffer [J].
     * Umožňuje stroji fungovat krátce bez připojené sítě.
     * Výchozí: 0 (žádný buffer).
     */
    public int getMachineEnergyBuffer() { return 0; }

    /**
     * Přepis tick logiky — kontroluje dostupnost energie.
     *
     * Stroj zpracovává pouze pokud:
     *  1. Je zásobován z energetické sítě NEBO
     *  2. Má dostatek energie v interním bufferu
     */
    @Override
    public boolean onMachineTick(MachineState state, boolean powered) {
        // Nastav maximální buffer při prvním tiku
        if (state.getMaxEnergyBuffer() == 0 && getMachineEnergyBuffer() > 0) {
            state.setMaxEnergyBuffer(getMachineEnergyBuffer());
        }

        state.setPoweredLastTick(powered);

        if (state.isProcessing()) {
            // Potřebujeme energii pro pokračování
            int energyPerTick = getEnergyConsumptionPerTick();
            boolean hasEnergy = powered || state.consumeEnergy(energyPerTick);

            if (!hasEnergy) {
                // Nedostatek energie — zpracování se výstrahou zastaví
                // Receptura zůstane aktuální, tiký se nepočítají
                return false;
            }

            return state.tick();
        }

        // Zkus zahájit zpracování (pouze pokud je energie)
        if (!powered && state.getStoredEnergy() < getEnergyConsumptionPerTick()) {
            return false;
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

    /**
     * Přepis statusové zprávy — zobrazuje energetické informace.
     */
    @Override
    protected void sendStatusMessage(Player player, MachineState state) {
        StringBuilder sb = new StringBuilder();
        sb.append("§b[").append(getDisplayName()).append("]§r\n");

        // Energie
        sb.append("§7Energie: §e")
          .append(state.getStoredEnergy()).append(" J")
          .append(state.isPoweredLastTick() ? " §a(zásobováno)" : " §c(bez napájení)");
        sb.append("\n");

        // Stav zpracování
        if (state.isProcessing()) {
            int pct = (int) (state.getProgressPercent() * 100);
            sb.append("§7Zpracování: §e").append(pct).append("%");
        } else {
            sb.append("§7Stav: §7Nečinný — vlož materiály");
        }

        player.sendMessage(com.hypixel.hytale.server.core.universe.player.Player.Message.raw(sb.toString()));
    }
}
