package studio.walkercrew.aunaria.slimefun.command;

import com.hypixel.hytale.ecs.world.Store;
import com.hypixel.hytale.server.builtin.command.AbstractPlayerCommand;
import com.hypixel.hytale.server.core.command.CommandContext;
import com.hypixel.hytale.server.core.universe.entity.EntityStore;
import com.hypixel.hytale.server.core.universe.player.Player;
import com.hypixel.hytale.server.core.universe.player.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.World;
import studio.walkercrew.aunaria.slimefun.SlimefunPlugin;
import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.core.SlimefunRegistry;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.research.PlayerResearchData;
import studio.walkercrew.aunaria.slimefun.research.ResearchManager;
import studio.walkercrew.aunaria.slimefun.research.SlimefunResearch;

import javax.annotation.Nonnull;
import java.util.Comparator;
import java.util.List;

/**
 * Hlavní příkaz Slimefun 2.0 — /sf
 *
 * Podpříkazy:
 *  /sf guide                — zobrazí SF průvodce (kategorie → položky)
 *  /sf research             — zobrazí výzkumný strom a stav hráče
 *  /sf research unlock <id> — odemkne výzkum (admin: /sf admin unlock <id> <player>)
 *  /sf machines             — zobrazí registrované stroje a jejich stav
 *  /sf info <machineId>     — info o konkrétním stroji/položce
 *  /sf admin <subcommand>   — admin příkazy (op only)
 */
public class SlimefunCommand extends AbstractPlayerCommand {

    private final SlimefunRegistry registry;
    private final ResearchManager researchManager;

    public SlimefunCommand(SlimefunRegistry registry, ResearchManager researchManager) {
        super("sf", "Main Slimefun 2.0 command. Use /sf guide for help.");
        this.registry = registry;
        this.researchManager = researchManager;
    }

    @Override
    protected void execute(
        @Nonnull CommandContext context,
        @Nonnull Store<EntityStore> store,
        @Nonnull com.hypixel.hytale.ecs.world.Ref<EntityStore> ref,
        @Nonnull PlayerRef playerRef,
        @Nonnull World world
    ) {
        Player player = store.getComponent(ref, Player.getComponentType());
        if (player == null) return;

        String[] args = context.getArgs();

        if (args.length == 0) {
            sendHelp(player);
            return;
        }

        switch (args[0].toLowerCase()) {
            case "guide"    -> sendGuide(player, args);
            case "research" -> handleResearch(player, store, ref, args);
            case "machines" -> sendMachines(player);
            case "info"     -> sendInfo(player, args);
            case "admin"    -> handleAdmin(player, store, ref, args);
            default         -> {
                player.sendMessage(Player.Message.raw("§cNeznámý podpříkaz. Použij §e/sf §cpro nápovědu."));
                sendHelp(player);
            }
        }
    }

    // ─── /sf — nápověda ───────────────────────────────────────────────────────

    private void sendHelp(Player player) {
        String msg =
            "§b═══════ §eSlimefun 2.0 §b═══════\n" +
            "§e/sf guide §7— Průvodce recepturami\n" +
            "§e/sf research §7— Výzkumný strom\n" +
            "§e/sf machines §7— Aktivní stroje\n" +
            "§e/sf info <id> §7— Info o položce\n" +
            "§b═══════════════════════";
        player.sendMessage(Player.Message.raw(msg));
    }

    // ─── /sf guide ────────────────────────────────────────────────────────────

    private void sendGuide(Player player, String[] args) {
        if (args.length == 1) {
            // Ukaž kategorie
            StringBuilder sb = new StringBuilder("§b═══ §eSlimefun 2.0 Průvodce §b═══\n");
            for (SlimefunItem.ItemCategory category : SlimefunItem.ItemCategory.values()) {
                long count = registry.getAllItems().stream()
                    .filter(i -> i.getCategory() == category).count();
                if (count > 0) {
                    sb.append(category.getColorCode())
                      .append("▶ ").append(category.getDisplay())
                      .append(" §7(").append(count).append(" položek)\n");
                }
            }
            sb.append("§7Použij §e/sf guide <kategorie> §7pro detail.");
            player.sendMessage(Player.Message.raw(sb.toString()));
            return;
        }

        // Zobraz položky kategorie
        String catName = args[1].toLowerCase();
        SlimefunItem.ItemCategory targetCat = null;
        for (SlimefunItem.ItemCategory cat : SlimefunItem.ItemCategory.values()) {
            if (cat.name().toLowerCase().contains(catName) ||
                cat.getDisplay().toLowerCase().contains(catName)) {
                targetCat = cat;
                break;
            }
        }

        if (targetCat == null) {
            player.sendMessage(Player.Message.raw("§cKategorie nenalezena: " + args[1]));
            return;
        }

        List<SlimefunItem> items = registry.getItemsByCategory(targetCat);
        StringBuilder sb = new StringBuilder("§b═══ §e" + targetCat.getDisplay() + " §b═══\n");
        for (SlimefunItem item : items) {
            sb.append(targetCat.getColorCode()).append("• ").append(item.getDisplayName())
              .append(" §8(").append(item.getItemId()).append(")\n");
        }
        player.sendMessage(Player.Message.raw(sb.toString()));
    }

    // ─── /sf research ─────────────────────────────────────────────────────────

    private void handleResearch(Player player, Store<EntityStore> store,
                                 com.hypixel.hytale.ecs.world.Ref<EntityStore> ref, String[] args) {
        PlayerResearchData data = store.ensureAndGetComponent(ref,
            researchManager.getResearchDataComponentType());

        if (args.length == 1) {
            // Zobraz přehled výzkumu
            sendResearchOverview(player, data);
            return;
        }

        if (args[1].equalsIgnoreCase("unlock") && args.length >= 3) {
            String researchId = args[2];
            SlimefunResearch research = researchManager.getResearch(researchId);
            if (research == null) {
                player.sendMessage(Player.Message.raw("§cVýzkum nenalezen: §e" + researchId));
                return;
            }
            if (research.isUnlockedBy(data)) {
                player.sendMessage(Player.Message.raw("§7Výzkum §e" + research.getDisplayName() + " §7je již odemčen."));
                return;
            }
            // Zkus přidat XP z hráčova levelu — 100 XP za pokus
            boolean unlocked = researchManager.contributeXp(data, researchId, 100);
            if (unlocked) {
                player.sendMessage(Player.Message.raw(
                    "§a✔ Výzkum §e" + research.getDisplayName() + " §aodemčen! " +
                    "Odemčeno: " + research.getUnlockedMachines().size() + " položek."
                ));
            } else {
                int current = data.getAccumulatedXp(researchId);
                int cost = research.getXpCost();
                player.sendMessage(Player.Message.raw(
                    "§7Výzkum §e" + research.getDisplayName() + "§7: §e" +
                    current + " §7/ §e" + cost + " XP §7(+100 XP přidáno)"
                ));
            }
        }
    }

    private void sendResearchOverview(Player player, PlayerResearchData data) {
        StringBuilder sb = new StringBuilder("§b═══ §eVýzkumný strom §b═══\n");
        for (SlimefunResearch research : researchManager.getAllResearches()) {
            boolean unlocked = research.isUnlockedBy(data);
            String status = unlocked ? "§a✔" : "§c✗";
            sb.append(status).append(" §e").append(research.getDisplayName());
            if (!unlocked && !research.isDefaultUnlocked()) {
                int current = data.getAccumulatedXp(research.getResearchId());
                sb.append(" §8(").append(current).append("/").append(research.getXpCost()).append(" XP)");
            }
            sb.append("\n");
        }
        sb.append("§7Odemkni výzkum: §e/sf research unlock <id>");
        player.sendMessage(Player.Message.raw(sb.toString()));
    }

    // ─── /sf machines ─────────────────────────────────────────────────────────

    private void sendMachines(Player player) {
        var tickSystem = SlimefunPlugin.instance.getMachineTickSystem();
        int count = tickSystem.getActiveMachineCount();

        if (count == 0) {
            player.sendMessage(Player.Message.raw("§7Žádné aktivní SF stroje ve světě."));
            return;
        }

        StringBuilder sb = new StringBuilder("§b═══ §eAktivní stroje (§e" + count + "§b) §b═══\n");
        for (var entry : tickSystem.getActiveMachines().entrySet()) {
            var state = entry.getValue();
            AbstractMachine machine = registry.getMachine(state.getMachineId());
            String name = machine != null ? machine.getDisplayName() : state.getMachineId();
            String status = state.isProcessing()
                ? "§a" + (int)(state.getProgressPercent() * 100) + "%"
                : "§7idle";
            sb.append("§7• §e").append(name).append(" §8[").append(entry.getKey()).append("] ").append(status).append("\n");
        }
        player.sendMessage(Player.Message.raw(sb.toString()));
    }

    // ─── /sf info ─────────────────────────────────────────────────────────────

    private void sendInfo(Player player, String[] args) {
        if (args.length < 2) {
            player.sendMessage(Player.Message.raw("§cPoužití: §e/sf info <machineId>"));
            return;
        }
        String id = args[1];
        AbstractMachine machine = registry.getMachine(id);
        if (machine == null) {
            player.sendMessage(Player.Message.raw("§cStroj nenalezen: §e" + id));
            return;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("§b═══ §e").append(machine.getDisplayName()).append(" §b═══\n");
        sb.append("§7ID: §e").append(machine.getMachineId()).append("\n");
        sb.append("§7Kategorie: §e").append(machine.getCategory().getDisplay()).append("\n");
        if (machine.getEnergyConsumptionPerTick() > 0) {
            sb.append("§7Příkon: §e").append(machine.getEnergyConsumptionPerTick()).append(" J/tick\n");
        }
        if (machine.getEnergyOutputPerTick() > 0) {
            sb.append("§7Výstup: §e").append(machine.getEnergyOutputPerTick()).append(" J/tick\n");
        }
        sb.append("§7Receptury: §e").append(machine.getRecipes().size()).append("\n");
        for (var recipe : machine.getRecipes()) {
            sb.append("  §8→ §7").append(recipe.getInputs()).append(" → ").append(recipe.getOutputs())
              .append(" (").append(recipe.getProcessingTicks()).append(" ticků)\n");
        }
        player.sendMessage(Player.Message.raw(sb.toString()));
    }

    // ─── /sf admin ────────────────────────────────────────────────────────────

    private void handleAdmin(Player player, Store<EntityStore> store,
                              com.hypixel.hytale.ecs.world.Ref<EntityStore> ref, String[] args) {
        // TODO: Zkontrolovat admin oprávnění pomocí Hytale Permission API
        // Viz: https://hytalemodding.dev/en/docs/guides/plugin/permission-management
        if (args.length < 2) {
            player.sendMessage(Player.Message.raw("§e/sf admin unlock <researchId> §7— Okamžitě odemkne výzkum"));
            return;
        }
        if (args[1].equalsIgnoreCase("unlock") && args.length >= 3) {
            PlayerResearchData data = store.ensureAndGetComponent(ref,
                researchManager.getResearchDataComponentType());
            researchManager.forceUnlock(data, args[2]);
            player.sendMessage(Player.Message.raw("§a[Admin] Výzkum §e" + args[2] + " §aodemčen."));
        }
    }
}
