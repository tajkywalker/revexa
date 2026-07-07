package studio.walkercrew.aunaria.slimefun.machine;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Runtime stav jednoho stroje umístěného ve světě.
 *
 * Každý placed stroj má svůj MachineState identifikovaný pozicí.
 * State drží:
 *  - aktuálně zpracovávanou recepturu
 *  - zbývající ticky do dokončení
 *  - inventář vstupních/výstupních slotů
 *  - energetický stav (pro elektrické stroje)
 *
 * Persistováno do JSON pro přežití restartu serveru.
 */
public class MachineState {

    private final String machineId;    // ID stroje (= Hytale block itemId)
    private final String positionKey;  // "worldId:x:y:z"

    /** Aktuálně probíhající receptura, případně null pokud nic nezpracovává */
    private MachineRecipe currentRecipe;

    /** Zbývající ticky do dokončení zpracování */
    private int ticksRemaining = 0;

    /** Vstupní slot: seznam ingrediencí vložených hráčem */
    private final List<MachineRecipe.Ingredient> inputInventory = new ArrayList<>();

    /** Výstupní slot: dokončené výstupy čekající na odebrání */
    private final List<MachineRecipe.Ingredient> outputInventory = new ArrayList<>();

    /** Uložená energie pro elektrické stroje [J] */
    private int storedEnergy = 0;

    /** Maximální kapacita energie interního bufferu [J] */
    private int maxEnergyBuffer = 0;

    /** true pokud stroj právě zpracovává */
    private boolean processing = false;

    /** true pokud byl stroj v posledním ticku zásoben energií */
    private boolean poweredLastTick = false;

    public MachineState(String machineId, String positionKey) {
        this.machineId = machineId;
        this.positionKey = positionKey;
    }

    // ─── Zpracování ───────────────────────────────────────────────────────────

    /**
     * Zahájí zpracování dané receptury.
     * Spotřebuje vstupy z inputInventory.
     */
    public void startProcessing(MachineRecipe recipe) {
        this.currentRecipe = recipe;
        this.ticksRemaining = recipe.getProcessingTicks();
        this.processing = true;

        // Spotřebuj vstupy
        for (MachineRecipe.Ingredient input : recipe.getInputs()) {
            consumeFromInput(input.itemId(), input.quantity());
        }
    }

    /**
     * Posune zpracování o jeden tick.
     * Vrátí true pokud bylo zpracování dokončeno.
     */
    public boolean tick() {
        if (!processing || currentRecipe == null) return false;

        ticksRemaining--;
        if (ticksRemaining <= 0) {
            // Přidej výstupy do output inventáře
            for (MachineRecipe.Ingredient output : currentRecipe.getOutputs()) {
                addToOutput(output);
            }
            currentRecipe = null;
            processing = false;
            ticksRemaining = 0;
            return true;
        }
        return false;
    }

    // ─── Inventář ─────────────────────────────────────────────────────────────

    public void addToInput(MachineRecipe.Ingredient ingredient) {
        inputInventory.add(ingredient);
    }

    public void addToOutput(MachineRecipe.Ingredient ingredient) {
        outputInventory.add(ingredient);
    }

    private void consumeFromInput(String itemId, int quantity) {
        int remaining = quantity;
        for (var iter = inputInventory.iterator(); iter.hasNext() && remaining > 0;) {
            MachineRecipe.Ingredient ing = iter.next();
            if (ing.itemId().equals(itemId)) {
                if (ing.quantity() <= remaining) {
                    remaining -= ing.quantity();
                    iter.remove();
                } else {
                    // Pokud existoval record (immutable), nahraďme sníženou hodnotou
                    iter.remove();
                    inputInventory.add(new MachineRecipe.Ingredient(itemId, ing.quantity() - remaining));
                    remaining = 0;
                }
            }
        }
    }

    public boolean hasInputFor(MachineRecipe recipe) {
        return recipe.matches(inputInventory);
    }

    public boolean hasOutputSpace() {
        return outputInventory.size() < 12; // max 12 stacků ve výstupu
    }

    public List<MachineRecipe.Ingredient> clearOutput() {
        var result = new ArrayList<>(outputInventory);
        outputInventory.clear();
        return result;
    }

    // ─── Energie ─────────────────────────────────────────────────────────────

    public void chargeEnergy(int joules) {
        storedEnergy = Math.min(storedEnergy + joules, maxEnergyBuffer);
    }

    public boolean consumeEnergy(int joules) {
        if (storedEnergy < joules) return false;
        storedEnergy -= joules;
        return true;
    }

    // ─── Gettery / Settery ────────────────────────────────────────────────────

    public String getMachineId() { return machineId; }
    public String getPositionKey() { return positionKey; }
    public MachineRecipe getCurrentRecipe() { return currentRecipe; }
    public int getTicksRemaining() { return ticksRemaining; }
    public boolean isProcessing() { return processing; }
    public int getStoredEnergy() { return storedEnergy; }
    public int getMaxEnergyBuffer() { return maxEnergyBuffer; }
    public void setMaxEnergyBuffer(int max) { this.maxEnergyBuffer = max; }
    public boolean isPoweredLastTick() { return poweredLastTick; }
    public void setPoweredLastTick(boolean powered) { this.poweredLastTick = powered; }
    public List<MachineRecipe.Ingredient> getInputInventory() { return Collections.unmodifiableList(inputInventory); }
    public List<MachineRecipe.Ingredient> getOutputInventory() { return Collections.unmodifiableList(outputInventory); }

    /** Procento zpracování (0.0 – 1.0) */
    public double getProgressPercent() {
        if (!processing || currentRecipe == null) return 0.0;
        int total = currentRecipe.getProcessingTicks();
        return total > 0 ? 1.0 - ((double) ticksRemaining / total) : 0.0;
    }
}
