package studio.walkercrew.aunaria.slimefun.gui;

import com.hypixel.hytale.server.builtin.ui.InteractiveCustomUIPage;
import com.hypixel.hytale.server.builtin.ui.UICommandBuilder;
import com.hypixel.hytale.server.builtin.ui.UIDataEvent;
import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineRecipe;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

import java.util.List;

/**
 * Hytale Custom UI stránka pro stroj Slimefun 2.0.
 *
 * Implementuje InteractiveCustomUIPage — otevírá se přes
 * player.openPage(new MachineGuiPage(...)).
 *
 * Architektura:
 *  - Java posílá UICommand "append/set/clear" zprávy klientovi
 *  - Klient parsuje .ui markup a vykresluje elementy
 *  - Kliknutí hráče vrací DataEvent zpět do handleDataEvent()
 *
 * GUI elementy targetovány pomocí #selectors z .ui souboru:
 *  - #MachineName, #MachineSubtitle    — textové pole v header
 *  - #InputSlot0 ... #InputSlot5       — vstupní sloty
 *  - #OutputSlot0 ... #OutputSlot3     — výstupní sloty
 *  - #ProgressFillBar, #ProgressLabel  — progress bar
 *  - #StatusText / #FooterStatus        — stavový text
 *  - #EnergyFill, #EnergyText           — energetický bar (electric)
 *  - #PowerIndicator #PowerLabel        — power status (electric)
 *  - #ManaCrystalIndicator #CrystalCount — mana crystals (magic)
 */
public class MachineGuiPage extends InteractiveCustomUIPage {

    private final AbstractMachine machine;
    private MachineState state;
    private final Player player;
    private final MachineGuiTheme theme;

    /** Panel width pro výpočet energy bar fill šířky */
    private static final int ENERGY_BAR_WIDTH = 680;
    /** Progress bar šířka v pixelech */
    private static final int PROGRESS_BAR_WIDTH = 132;

    public MachineGuiPage(AbstractMachine machine, MachineState state,
                          Player player, MachineGuiTheme theme) {
        super(theme.getUiPageId());
        this.machine = machine;
        this.state = state;
        this.player = player;
        this.theme = theme;
    }

    // ─── Počáteční vykreslení ─────────────────────────────────────────────────

    @Override
    protected void build(UICommandBuilder builder) {
        // Header — název stroje
        builder.set("#MachineName.Text", machine.getDisplayName().toUpperCase());
        builder.set("#MachineSubtitle.Text", getSubtitleForTheme());

        // Vstupní sloty
        renderInputSlots(builder);

        // Výstupní sloty
        renderOutputSlots(builder);

        // Progress bar
        renderProgress(builder);

        // Status text
        renderStatus(builder);

        // Téma-specifické elementy
        if (theme == MachineGuiTheme.ELECTRIC) {
            renderEnergyBar(builder);
        } else if (theme == MachineGuiTheme.MAGICAL) {
            renderManaCrystalCount(builder);
        }
    }

    // ─── Aktualizace (voláno z MachineGuiManager každý tick) ─────────────────

    /**
     * Aktualizuje GUI bez znovuotevření stránky.
     * Volat z MachineTickSystem každé 2 ticky (0.1s) pro plynulý progress.
     */
    public void update(UICommandBuilder builder, MachineState freshState) {
        this.state = freshState;

        renderProgress(builder);
        renderStatus(builder);
        renderOutputSlots(builder);

        if (theme == MachineGuiTheme.ELECTRIC) {
            renderEnergyBar(builder);
        } else if (theme == MachineGuiTheme.MAGICAL) {
            renderManaCrystalCount(builder);
        }
    }

    // ─── Handling kliknutí hráče ──────────────────────────────────────────────

    @Override
    protected void handleDataEvent(UIDataEvent event, UICommandBuilder builder) {
        String eventId = event.getEventId();

        switch (eventId) {
            case "sf_close_gui" -> {
                player.closePage();
            }

            case "sf_collect_output" -> {
                collectOutput(builder);
            }

            case "sf_open_recipes" -> {
                openRecipeBrowser(builder);
            }

            // Vstupní slot kliknutí
            default -> {
                if (eventId.startsWith("sf_input_slot_")) {
                    int slotIndex = Integer.parseInt(eventId.substring("sf_input_slot_".length()));
                    handleInputSlotClick(slotIndex, builder);
                } else if (eventId.startsWith("sf_output_slot_")) {
                    int slotIndex = Integer.parseInt(eventId.substring("sf_output_slot_".length()));
                    handleOutputSlotClick(slotIndex, builder);
                }
            }
        }
    }

    // ─── Interní vykreslovací metody ──────────────────────────────────────────

    private void renderInputSlots(UICommandBuilder builder) {
        List<MachineRecipe.Ingredient> inputs = state.getInputInventory();
        for (int i = 0; i < 6; i++) {
            String slotId = "#InputSlot" + i;
            if (i < inputs.size()) {
                MachineRecipe.Ingredient ing = inputs.get(i);
                // Zobraz ikonu itemu
                builder.set(slotId + " #SlotIcon.Path", "Icons/ItemsGenerated/" +
                    ing.itemId().toLowerCase() + ".png");
                builder.set(slotId + " #SlotIcon.Visible", "true");
                builder.set(slotId + " #SlotQty.Text",
                    ing.quantity() > 1 ? String.valueOf(ing.quantity()) : "");
            } else {
                // Prázdný slot
                builder.set(slotId + " #SlotIcon.Visible", "false");
                builder.set(slotId + " #SlotQty.Text", "");
            }
        }
    }

    private void renderOutputSlots(UICommandBuilder builder) {
        List<MachineRecipe.Ingredient> outputs = state.getOutputInventory();
        for (int i = 0; i < 4; i++) {
            String slotId = "#OutputSlot" + i;
            if (i < outputs.size()) {
                MachineRecipe.Ingredient ing = outputs.get(i);
                builder.set(slotId + " #SlotIcon.Path", "Icons/ItemsGenerated/" +
                    ing.itemId().toLowerCase() + ".png");
                builder.set(slotId + " #SlotIcon.Visible", "true");
                builder.set(slotId + " #SlotQty.Text",
                    ing.quantity() > 1 ? String.valueOf(ing.quantity()) : "");
            } else {
                builder.set(slotId + " #SlotIcon.Visible", "false");
                builder.set(slotId + " #SlotQty.Text", "");
            }
        }
    }

    private void renderProgress(UICommandBuilder builder) {
        if (state.isProcessing()) {
            int pct = (int) (state.getProgressPercent() * 100);
            int fillWidth = (int) (PROGRESS_BAR_WIDTH * state.getProgressPercent());

            builder.set("#ProgressFillBar.Anchor",
                "(Left: 2, Top: 2, Bottom: 2, Width: " + fillWidth + ")");
            builder.set("#ProgressLabel.Text", pct + "%");

            // Název receptury
            MachineRecipe recipe = state.getCurrentRecipe();
            if (recipe != null && !recipe.getOutputs().isEmpty()) {
                String output = recipe.getOutputs().get(0).itemId();
                int secs = state.getTicksRemaining() / 20;
                builder.set("#RecipeInfo.Text", "→ " + output + "\n" + secs + "s remaining");
            }
        } else {
            builder.set("#ProgressFillBar.Anchor", "(Left: 2, Top: 2, Bottom: 2, Width: 0)");
            builder.set("#ProgressLabel.Text", "Idle");
            builder.set("#RecipeInfo.Text", "");
        }
    }

    private void renderStatus(UICommandBuilder builder) {
        String statusSelector = theme == MachineGuiTheme.MAGICAL ? "#FooterStatus.Text" : "#StatusText.Text";

        if (state.isProcessing()) {
            int pct = (int) (state.getProgressPercent() * 100);
            builder.set(statusSelector, "Processing — " + pct + "% complete");
        } else if (!state.getOutputInventory().isEmpty()) {
            builder.set(statusSelector, "Output ready — " + state.getOutputInventory().size() + " stacks to collect");
        } else {
            builder.set(statusSelector, "Idle — insert materials to begin");
        }
    }

    private void renderEnergyBar(UICommandBuilder builder) {
        int stored = state.getStoredEnergy();
        int max = state.getMaxEnergyBuffer();
        double pct = max > 0 ? (double) stored / max : 0;
        int fillWidth = (int) (ENERGY_BAR_WIDTH * pct);

        builder.set("#EnergyFill.Anchor", "(Left: 0, Top: 4, Bottom: 4, Width: " + fillWidth + ")");
        builder.set("#EnergyText.Text", stored + " / " + max + " J");

        boolean powered = state.isPoweredLastTick();
        builder.set("#PowerDot.Background", powered ? "#4ade80" : "#ef4444");
        builder.set("#PowerLabel.Text", powered ? "POWERED" : "NO POWER");
        builder.set("#PowerLabel.Style.Color", powered ? "#4ade80" : "#ef4444");

        int rate = machine.getEnergyConsumptionPerTick();
        builder.set("#EnergyRate.Text", powered ? "−" + rate + " J/tick" : "▲ searching...");
    }

    private void renderManaCrystalCount(UICommandBuilder builder) {
        long crystalCount = state.getInputInventory().stream()
            .filter(ing -> ing.itemId().equals("SF_Mana_Crystal"))
            .mapToLong(MachineRecipe.Ingredient::quantity)
            .sum();

        builder.set("#CrystalCount.Text", crystalCount + "x Mana Crystal");
    }

    private void collectOutput(UICommandBuilder builder) {
        // TODO: Přidat do inventáře hráče přes ItemContainer API
        // Viz: https://hytalemodding.dev/en/docs/guides/plugin/inventory-management
        var collected = state.clearOutput();
        if (collected.isEmpty()) {
            builder.set("#FooterStatus.Text", "Nothing to collect.");
            return;
        }
        renderOutputSlots(builder);
        renderStatus(builder);
        player.sendMessage(Player.Message.raw(
            "§a[Slimefun 2.0] Sebrán výstup: §e" + collected.size() + " stacků."
        ));
    }

    private void openRecipeBrowser(UICommandBuilder builder) {
        // TODO: Otevřít RecipeBrowserPage s recepturami tohoto stroje
        // Pro teď zobrazí seznam v chatu
        StringBuilder sb = new StringBuilder("§b═ Receptury " + machine.getDisplayName() + " ═\n");
        for (MachineRecipe r : machine.getRecipes()) {
            sb.append("§7").append(r.getInputs())
              .append(" §e→§7 ").append(r.getOutputs())
              .append(" §8(").append(r.getProcessingTicks() / 20).append("s)\n");
        }
        player.sendMessage(Player.Message.raw(sb.toString()));
    }

    private void handleInputSlotClick(int slotIndex, UICommandBuilder builder) {
        // TODO: Přesun item z hráčova hotbaru do stroje
    }

    private void handleOutputSlotClick(int slotIndex, UICommandBuilder builder) {
        // TODO: Přesun konkrétního outputu do inventáře hráče
    }

    private String getSubtitleForTheme() {
        return switch (theme) {
            case ELECTRIC -> "Electric Machine • " + machine.getEnergyConsumptionPerTick() + " J/tick";
            case MAGICAL  -> "Magic Station • Requires Mana Crystals";
            default       -> "Slimefun 2.0";
        };
    }
}
