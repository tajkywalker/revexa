package studio.walkercrew.aunaria.slimefun;

import com.hypixel.hytale.server.core.plugin.JavaPlugin;
import com.hypixel.hytale.server.core.plugin.JavaPluginInit;
import studio.walkercrew.aunaria.slimefun.command.SlimefunCommand;
import studio.walkercrew.aunaria.slimefun.core.SlimefunRegistry;
import studio.walkercrew.aunaria.slimefun.energy.EnergyNetworkManager;
import studio.walkercrew.aunaria.slimefun.implementations.generators.CoalGenerator;
import studio.walkercrew.aunaria.slimefun.implementations.generators.SolarGenerator;
import studio.walkercrew.aunaria.slimefun.implementations.machines.ElectricFurnace;
import studio.walkercrew.aunaria.slimefun.implementations.machines.EnhancedCraftingTable;
import studio.walkercrew.aunaria.slimefun.implementations.machines.OreWasher;
import studio.walkercrew.aunaria.slimefun.implementations.storage.EnergyCapacitor;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.research.ResearchManager;
import studio.walkercrew.aunaria.slimefun.research.SlimefunResearch;
import studio.walkercrew.aunaria.slimefun.system.MachineInteractionSystem;
import studio.walkercrew.aunaria.slimefun.system.MachineTickSystem;

import javax.annotation.Nonnull;
import java.nio.file.Path;
import java.util.logging.Logger;

/**
 * Hlavní třída Aunaria Slimefun 2.0 pluginu.
 *
 * Systémy registrované v setup():
 *  - SlimefunRegistry      — centrální registr všech SF položek a strojů
 *  - ResearchManager       — výzkumný strom hráče (persistovaný přes ECS komponenty)
 *  - EnergyNetworkManager  — energetické sítě propojující generátory, stroje, kapacitory
 *  - MachineTickSystem     — ECS systém periodicky zpracovávající stroje
 *  - MachineInteractionSystem — zpracování interakcí hráče se stroji
 *  - SlimefunCommand       — příkaz /sf
 */
public class SlimefunPlugin extends JavaPlugin {

    /** Singleton instance přístupný z celého pluginu */
    public static SlimefunPlugin instance;

    private final Logger logger = Logger.getLogger("Slimefun2");

    private SlimefunRegistry registry;
    private ResearchManager researchManager;
    private EnergyNetworkManager energyNetworkManager;
    private MachineTickSystem machineTickSystem;

    public SlimefunPlugin(@Nonnull JavaPluginInit init) {
        super(init);
        instance = this;
    }

    @Override
    protected void setup() {
        logger.info("▶ Aunaria Slimefun 2.0 se spouští...");

        // 1. Inicializace registry
        registry = new SlimefunRegistry(this);

        // 2. Výzkumný systém (ECS komponenty pro hráče)
        researchManager = new ResearchManager(this);
        researchManager.registerAll();

        // 3. Energetická síť
        energyNetworkManager = new EnergyNetworkManager();

        // 4. Strojní tick systém
        machineTickSystem = new MachineTickSystem(registry, energyNetworkManager);

        // 5. Interakční systém (ECS) — zpracovává klikání na stroje
        this.getEntityStoreRegistry().registerSystem(new MachineInteractionSystem(registry));
        this.getEntityStoreRegistry().registerSystem(machineTickSystem);

        // 6. Registrace strojů a položek
        registerAllContent();

        // 7. Příkaz /sf
        this.getCommandManager().register(new SlimefunCommand(registry, researchManager));

        logger.info("✔ Aunaria Slimefun 2.0 spuštěn. Registrováno " + registry.getMachineCount() + " strojů.");
    }

    // ─── Registrace veškerého SF obsahu ────────────────────────────────────────

    private void registerAllContent() {
        // Stroje
        registry.registerMachine(new EnhancedCraftingTable());
        registry.registerMachine(new ElectricFurnace());
        registry.registerMachine(new OreWasher());

        // Generátory
        registry.registerMachine(new CoalGenerator());
        registry.registerMachine(new SolarGenerator());

        // Úložiště energie
        registry.registerMachine(new EnergyCapacitor());

        // Výzkumné stromy přiřazené ke strojům
        assignResearch();
    }

    private void assignResearch() {
        // Základní technologie — automaticky odemčeno
        SlimefunResearch basicResearch = researchManager.getResearch("sf_basic_tech");
        if (basicResearch != null) {
            basicResearch.addUnlockedMachine("SF_Enhanced_Crafting_Table");
        }

        // Elektrická pec — vyžaduje výzkum
        SlimefunResearch electricResearch = researchManager.getResearch("sf_electrical_machines");
        if (electricResearch != null) {
            electricResearch.addUnlockedMachine("SF_Electric_Furnace");
            electricResearch.addUnlockedMachine("SF_Coal_Generator");
            electricResearch.addUnlockedMachine("SF_Energy_Capacitor");
        }

        // Pokročilé zpracování
        SlimefunResearch advancedResearch = researchManager.getResearch("sf_advanced_processing");
        if (advancedResearch != null) {
            advancedResearch.addUnlockedMachine("SF_Ore_Washer");
            advancedResearch.addUnlockedMachine("SF_Solar_Generator");
        }
    }

    // ─── Gettery ───────────────────────────────────────────────────────────────

    public SlimefunRegistry getRegistry() { return registry; }

    public ResearchManager getResearchManager() { return researchManager; }

    public EnergyNetworkManager getEnergyNetworkManager() { return energyNetworkManager; }

    public MachineTickSystem getMachineTickSystem() { return machineTickSystem; }

    /** Cesta k adresáři pluginu pro ukládání dat strojů */
    public Path getDataDirectory() {
        return this.getFile().getParent().resolve("slimefun-data");
    }

    public Logger getSlimefunLogger() { return logger; }
}
