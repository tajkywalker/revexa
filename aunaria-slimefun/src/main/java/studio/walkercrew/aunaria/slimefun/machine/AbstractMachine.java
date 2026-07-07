package studio.walkercrew.aunaria.slimefun.machine;

import com.hypixel.hytale.server.core.universe.player.Player;
import studio.walkercrew.aunaria.slimefun.core.SlimefunItem;
import studio.walkercrew.aunaria.slimefun.energy.IEnergyNode;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Základní třída pro všechny Slimefun 2.0 stroje.
 *
 * Stroje jsou zároveň SlimefunItem (umísťovatelný blok) a definují
 * receptury pro zpracování.
 *
 * Podtřídy musí implementovat:
 *  - getMachineId()    — Hytale item ID bloku (musí odpovídat JSON)
 *  - getDisplayName()  — zobrazovaný název
 *  - getCategory()     — SF kategorie
 *  - registerRecipes() — definice receptur
 *
 * Volitelně přepsat:
 *  - onMachineTick()   — vlastní logika každý tick
 *  - onInteract()      — logika při kliknutí hráče na stroj
 *  - getNodeType()     — zda stroj participuje v energetické síti
 */
public abstract class AbstractMachine {

    private final List<MachineRecipe> recipes = new ArrayList<>();

    // ─── Povinné metody ───────────────────────────────────────────────────────

    /** Hytale item ID tohoto stroje (musí odpovídat JSON "Id") */
    public abstract String getMachineId();

    /** Zobrazovaný název stroje */
    public abstract String getDisplayName();

    /** Kategorie v SF průvodci */
    public abstract SlimefunItem.ItemCategory getCategory();

    /**
     * Zaregistruje receptury tohoto stroje.
     * Voláno jednou při inicializaci — použij registerRecipe().
     */
    protected abstract void registerRecipes();

    // ─── Životní cyklus ───────────────────────────────────────────────────────

    /**
     * Voláno při každém SF tiku stroje.
     * Výchozí implementace zpracovává dostupné receptury.
     *
     * @param state   aktuální stav stroje
     * @param powered zda je stroj zásobován energií
     * @return true pokud stroj provedl nějakou akci
     */
    public boolean onMachineTick(MachineState state, boolean powered) {
        if (state.isProcessing()) {
            // Pokračuj v probíhajícím zpracování
            return state.tick();
        }

        // Zkus najít pasující recepturu a zahájit zpracování
        if (!state.hasOutputSpace()) return false;

        for (MachineRecipe recipe : recipes) {
            if (state.hasInputFor(recipe)) {
                state.startProcessing(recipe);
                return true;
            }
        }
        return false;
    }

    /**
     * Voláno když hráč klikne pravým tlačítkem na stroj.
     * Výchozí implementace otevře grafické Hytale UI (MachineGuiPage).
     * Podtřídy mohou přepsat pro vlastní chování.
     *
     * @param player hráč
     * @param state  aktuální stav stroje
     */
    public void onInteract(Player player, MachineState state) {
        // Otevři grafické GUI přes MachineGuiManager
        studio.walkercrew.aunaria.slimefun.SlimefunPlugin.instance
            .getMachineGuiManager()
            .openGui(player, this, state);
    }

    // ─── Receptury ────────────────────────────────────────────────────────────

    protected void registerRecipe(MachineRecipe recipe) {
        recipes.add(recipe);
    }

    public List<MachineRecipe> getRecipes() {
        return Collections.unmodifiableList(recipes);
    }

    /**
     * Inicializuje stroj — voláno jednou registry při registraci.
     */
    public final void initialize() {
        registerRecipes();
    }

    // ─── Energetická síť ─────────────────────────────────────────────────────

    /**
     * Vrátí typ energetického uzlu, nebo null pokud stroj nevyužívá energii.
     */
    public IEnergyNode.NodeType getNodeType() {
        return null; // výchozí: bez energie
    }

    /**
     * Vrátí spotřebu energie za tick [J].
     * Přepsat v AbstractElectricMachine.
     */
    public int getEnergyConsumptionPerTick() { return 0; }

    /**
     * Vrátí výstup energie za tick [J] (pro generátory).
     */
    public int getEnergyOutputPerTick() { return 0; }

    // ─── Pomocné metody ───────────────────────────────────────────────────────

    /**
     * Zobrazí stav stroje hráči přes chat.
     * Podtřídy mohou přepsat pro vlastní formátování.
     */
    protected void sendStatusMessage(Player player, MachineState state) {
        String status;
        if (state.isProcessing()) {
            int pct = (int) (state.getProgressPercent() * 100);
            status = "§a[" + getDisplayName() + "] §7Zpracování: §e" + pct + "%";
        } else if (!state.getOutputInventory().isEmpty()) {
            status = "§a[" + getDisplayName() + "] §7Výstup: §e" + state.getOutputInventory().size() + " položek";
        } else {
            status = "§7[" + getDisplayName() + "] Nečinný — vlož materiály.";
        }
        player.sendMessage(com.hypixel.hytale.server.core.universe.player.Player.Message.raw(status));
    }

    /**
     * Vrátí SlimefunItem reprezentaci tohoto stroje.
     * Používá se pro registraci v SlimefunRegistry.
     */
    public SlimefunItem asSlimefunItem() {
        return new SlimefunItem(getMachineId(), getDisplayName(), getCategory());
    }

    @Override
    public String toString() {
        return "Machine{id='" + getMachineId() + "', recipes=" + recipes.size() + "}";
    }
}
