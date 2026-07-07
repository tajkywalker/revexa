package studio.walkercrew.aunaria.slimefun.machine;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Receptura stroje Slimefun 2.0.
 *
 * Definuje:
 *  - vstupní materiály (itemId + množství)
 *  - výstupní materiály (itemId + množství, může být více)
 *  - čas zpracování v tickách (20 ticků = 1 sekunda)
 *  - energetickou cenu zpracování [J] (pro elektrické stroje)
 */
public class MachineRecipe {

    private final List<Ingredient> inputs;
    private final List<Ingredient> outputs;

    /** Jak dlouho trvá zpracování v tickách (20 tps → 20 = 1s) */
    private final int processingTicks;

    /** Celkový příkon energie na jedno zpracování [J] */
    private final int energyCost;

    private MachineRecipe(Builder builder) {
        this.inputs = List.copyOf(builder.inputs);
        this.outputs = List.copyOf(builder.outputs);
        this.processingTicks = builder.processingTicks;
        this.energyCost = builder.energyCost;
    }

    // ─── Gettery ──────────────────────────────────────────────────────────────

    public List<Ingredient> getInputs() { return inputs; }

    public List<Ingredient> getOutputs() { return outputs; }

    public int getProcessingTicks() { return processingTicks; }

    public int getEnergyCost() { return energyCost; }

    /**
     * Vrátí true pokud daný seznam vstupů odpovídá receptuře.
     * (Kontrola itemId + dostatečné množství.)
     */
    public boolean matches(List<Ingredient> available) {
        for (Ingredient required : inputs) {
            boolean found = available.stream()
                .anyMatch(a -> a.itemId().equals(required.itemId())
                            && a.quantity() >= required.quantity());
            if (!found) return false;
        }
        return true;
    }

    // ─── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final List<Ingredient> inputs = new ArrayList<>();
        private final List<Ingredient> outputs = new ArrayList<>();
        private int processingTicks = 20;  // výchozí: 1 sekunda
        private int energyCost = 0;

        public Builder input(String itemId, int quantity) {
            inputs.add(new Ingredient(itemId, quantity));
            return this;
        }

        public Builder output(String itemId, int quantity) {
            outputs.add(new Ingredient(itemId, quantity));
            return this;
        }

        /** Nastavit dobu zpracování v tickách */
        public Builder ticks(int ticks) {
            this.processingTicks = ticks;
            return this;
        }

        /** Nastavit dobu zpracování v sekundách (konvertuje na ticky) */
        public Builder seconds(double seconds) {
            this.processingTicks = (int) (seconds * 20);
            return this;
        }

        /** Cena energie za jedno zpracování */
        public Builder energy(int joules) {
            this.energyCost = joules;
            return this;
        }

        public MachineRecipe build() {
            if (inputs.isEmpty()) throw new IllegalStateException("Receptura musí mít alespoň jeden vstup.");
            if (outputs.isEmpty()) throw new IllegalStateException("Receptura musí mít alespoň jeden výstup.");
            return new MachineRecipe(this);
        }
    }

    // ─── Ingredience ─────────────────────────────────────────────────────────

    /**
     * Jedna ingredience receptury (input nebo output).
     * @param itemId   Hytale item ID (např. "Iron" nebo "SF_Refined_Iron")
     * @param quantity počet kusů
     */
    public record Ingredient(String itemId, int quantity) {
        public Ingredient {
            if (itemId == null || itemId.isBlank()) throw new IllegalArgumentException("itemId nesmí být prázdné.");
            if (quantity <= 0) throw new IllegalArgumentException("Množství musí být > 0.");
        }
    }

    @Override
    public String toString() {
        return "MachineRecipe{inputs=" + inputs + ", outputs=" + outputs +
               ", ticks=" + processingTicks + ", energy=" + energyCost + "J}";
    }
}
