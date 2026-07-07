package studio.walkercrew.aunaria.slimefun.gui;

import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.implementations.magical.AbstractMagicalMachine;
import studio.walkercrew.aunaria.slimefun.machine.AbstractElectricMachine;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Správce GUI stroje Slimefun 2.0.
 *
 * Zodpovídá za:
 *  1. Otevření správného GUI (téma podle typu stroje)
 *  2. Sledování otevřených GUI per hráč
 *  3. Periodickou aktualizaci otevřených GUI (tick)
 *  4. Zavření GUI při odchodu hráče
 *
 * Propojení s AbstractMachine.onInteract():
 *  Místo sendStatusMessage() v chatu teď voláme
 *  MachineGuiManager.openGui(player, machine, state).
 */
public class MachineGuiManager {

    /** playerId → otevřená GUI stránka */
    private final Map<UUID, MachineGuiPage> openPages = new ConcurrentHashMap<>();

    /** playerId → MachineState pro daný otevřený GUI */
    private final Map<UUID, MachineState> openStates = new ConcurrentHashMap<>();

    // ─── Otevření GUI ─────────────────────────────────────────────────────────

    /**
     * Otevře machine GUI pro hráče.
     * Automaticky vybere správné téma podle typu stroje.
     *
     * @param player  hráč
     * @param machine stroj
     * @param state   aktuální stav stroje
     */
    public void openGui(Player player, AbstractMachine machine, MachineState state) {
        MachineGuiTheme theme = determineTheme(machine);

        MachineGuiPage page = new MachineGuiPage(machine, state, player, theme);
        UUID playerId = getPlayerId(player);

        openPages.put(playerId, page);
        openStates.put(playerId, state);

        // Otevři GUI u klienta
        // Hytale API: player.openPage(page)
        player.openPage(page);
    }

    /**
     * Zavře GUI pro hráče.
     */
    public void closeGui(Player player) {
        UUID playerId = getPlayerId(player);
        openPages.remove(playerId);
        openStates.remove(playerId);
    }

    // ─── Tick aktualizace ────────────────────────────────────────────────────

    /**
     * Aktualizuje všechna otevřená GUI.
     * Voláno periodicky z MachineTickSystem (každé 4 ticky = 0.2s).
     */
    public void tickUpdate() {
        for (Map.Entry<UUID, MachineGuiPage> entry : openPages.entrySet()) {
            MachineGuiPage page = entry.getValue();
            MachineState state = openStates.get(entry.getKey());

            if (state == null) {
                openPages.remove(entry.getKey());
                continue;
            }

            // Aktualizuj GUI přes UICommandBuilder
            // Toto odešle diff update klientovi (jen změněné elementy)
            page.sendUpdate(builder -> page.update(builder, state));
        }
    }

    // ─── Interní ─────────────────────────────────────────────────────────────

    /**
     * Výběr GUI tématu dle typu stroje:
     *  - Elektrickéstroje → ELECTRIC (modrá/žlutá s energy bar)
     *  - Magické stroje   → MAGICAL (tmavé fialovo-zlaté)
     *  - Ostatní          → BASE (neutrální fialové)
     */
    private MachineGuiTheme determineTheme(AbstractMachine machine) {
        if (machine instanceof AbstractMagicalMachine) {
            return MachineGuiTheme.MAGICAL;
        }
        if (machine instanceof AbstractElectricMachine) {
            return MachineGuiTheme.ELECTRIC;
        }
        return MachineGuiTheme.BASE;
    }

    /**
     * Zjistí UUID hráče.
     * TODO: Player.getUUID() — ověřit přesný název metody v Hytale API.
     */
    private UUID getPlayerId(Player player) {
        // Hytale Player UUID
        try {
            return player.getUUID();
        } catch (Exception e) {
            // Fallback pokud metoda má jiný název
            return UUID.nameUUIDFromBytes(player.getDisplayName().getBytes());
        }
    }

    public boolean isGuiOpen(Player player) {
        return openPages.containsKey(getPlayerId(player));
    }

    public int getOpenCount() { return openPages.size(); }
}
