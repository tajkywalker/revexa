package studio.walkercrew.aunaria.slimefun.system;

import com.hypixel.hytale.ecs.archetype.ArchetypeChunk;
import com.hypixel.hytale.ecs.archetype.query.Query;
import com.hypixel.hytale.ecs.system.EntityEventSystem;
import com.hypixel.hytale.ecs.world.CommandBuffer;
import com.hypixel.hytale.server.core.universe.entity.EntityStore;
import studio.walkercrew.aunaria.slimefun.core.SlimefunRegistry;
import studio.walkercrew.aunaria.slimefun.energy.EnergyNetworkManager;
import studio.walkercrew.aunaria.slimefun.energy.IEnergyNode;
import studio.walkercrew.aunaria.slimefun.energy.MachinePosition;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

import javax.annotation.Nonnull;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ECS systém pro periodické zpracování strojů Slimefun 2.0.
 *
 * Pracuje jako EntityEventSystem který se spouští každý herní tick.
 * Na každý SF tick (20x/s) provádí:
 *  1. Energetický tick — přerozdělí energii v sítích
 *  2. Strojní tick — každý aktivní stroj pokročí ve zpracování
 *
 * MachineState je ukládán v paměti v `activeMachines` (Map).
 * Persistenci zajišťuje MachineStateSerializer (TODO: implementovat).
 *
 * POZN: Pro tick systém se v Hytale používá built-in TickEvent nebo
 * WorldTickEvent. Konkrétní event class je závislá na API verzi —
 * viz: https://hytalemodding.dev/en/docs/server/events
 */
public class MachineTickSystem {

    private final SlimefunRegistry registry;
    private final EnergyNetworkManager energyNetworkManager;

    /**
     * Globální stav všech aktivních strojů: positionKey → MachineState
     * Sdíleno přes celý plugin.
     */
    private final Map<String, MachineState> activeMachines = new ConcurrentHashMap<>();

    /** Výsledky energetického tiku: MachinePosition → isPowered */
    private Map<MachinePosition, Boolean> lastEnergyResults = new HashMap<>();

    /** Čítač ticků pro omezení frekvence zpracování (SF zpracovává každých 2 ticky) */
    private int tickCounter = 0;
    private static final int PROCESS_INTERVAL = 2; // zpracuj každý 2. tick

    public MachineTickSystem(SlimefunRegistry registry, EnergyNetworkManager energyNetworkManager) {
        this.registry = registry;
        this.energyNetworkManager = energyNetworkManager;
    }

    /**
     * Hlavní tick metoda — voláno každý Hytale herní tick.
     * Tato metoda je volána z MachineInteractionSystem nebo přímo ze scheduleru.
     */
    public void tick() {
        tickCounter++;
        if (tickCounter % PROCESS_INTERVAL != 0) return;

        // 1. Energetický tick
        lastEnergyResults = energyNetworkManager.tickAll();

        // 2. Strojní tick
        for (Map.Entry<String, MachineState> entry : activeMachines.entrySet()) {
            MachineState state = entry.getValue();
            AbstractMachine machine = registry.getMachine(state.getMachineId());

            if (machine == null) continue;

            // Zjisti zda je stroj zásobován energií
            MachinePosition pos = MachinePosition.fromString(state.getPositionKey());
            boolean powered = isPowered(machine, pos);

            // Tick stroje
            machine.onMachineTick(state, powered);
        }
    }

    // ─── Registrace strojů ───────────────────────────────────────────────────

    /**
     * Zaregistruje nový umístěný stroj.
     * Voláno když hráč umístí SF blok do světa.
     *
     * @param pos       pozice umístění
     * @param machineId ID typu stroje
     * @param worldId   ID světa
     */
    public MachineState registerMachine(MachinePosition pos, String machineId) {
        AbstractMachine machine = registry.getMachine(machineId);
        if (machine == null) return null;

        MachineState state = new MachineState(machineId, pos.toKey());
        activeMachines.put(pos.toKey(), state);

        // Registruj do energetické sítě
        registerInEnergyNetwork(machine, pos, state);

        return state;
    }

    /**
     * Odregistruje stroj (při zničení bloku).
     */
    public void unregisterMachine(MachinePosition pos) {
        activeMachines.remove(pos.toKey());
        energyNetworkManager.unregisterNode(pos);
    }

    /**
     * Vrátí stav stroje na dané pozici.
     */
    public MachineState getState(MachinePosition pos) {
        return activeMachines.get(pos.toKey());
    }

    /**
     * Vrátí stav stroje podle string klíče.
     */
    public MachineState getState(String positionKey) {
        return activeMachines.get(positionKey);
    }

    // ─── Interní logika ───────────────────────────────────────────────────────

    private void registerInEnergyNetwork(AbstractMachine machine, MachinePosition pos, MachineState state) {
        IEnergyNode.NodeType nodeType = machine.getNodeType();
        if (nodeType == null) return;

        switch (nodeType) {
            case GENERATOR -> energyNetworkManager.registerGenerator(pos, machine.getEnergyOutputPerTick());
            case CONSUMER  -> energyNetworkManager.registerConsumer(pos, machine.getEnergyConsumptionPerTick());
            case STORAGE   -> {
                long capacity = 0;
                // Získáme kapacitu z EnergyCapacitor
                if (machine instanceof studio.walkercrew.aunaria.slimefun.implementations.storage.EnergyCapacitor cap) {
                    capacity = cap.getCapacity();
                }
                energyNetworkManager.registerStorage(pos, capacity, 0);
            }
        }
    }

    private boolean isPowered(AbstractMachine machine, MachinePosition pos) {
        IEnergyNode.NodeType nodeType = machine.getNodeType();
        if (nodeType == IEnergyNode.NodeType.GENERATOR) {
            // Generátory jsou vždy "napájeny" (samy vyrábí)
            return true;
        }
        if (nodeType == IEnergyNode.NodeType.CONSUMER) {
            return lastEnergyResults.getOrDefault(pos, false);
        }
        return false;
    }

    // ─── Gettery ─────────────────────────────────────────────────────────────

    public Map<String, MachineState> getActiveMachines() {
        return java.util.Collections.unmodifiableMap(activeMachines);
    }

    public int getActiveMachineCount() { return activeMachines.size(); }
}
