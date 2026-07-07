package studio.walkercrew.aunaria.slimefun.energy;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Správce všech energetických sítí na serveru.
 *
 * Zodpovídá za:
 *  - Vytváření a rušení sítí při umístění/odebrání strojů
 *  - Slučování sítí při propojení dotykových strojů
 *  - Rozdělování sítí při odstranění stroje
 *  - Volání tick() na aktivní sítě
 *
 * Stroje se propojují pokud jsou přímo sousední (Manhattan distance = 1).
 * Pro WiFi připojení se dosah konfiguruje na AbstractMachine.
 */
public class EnergyNetworkManager {

    /** NetworkId → EnergyNetwork */
    private final Map<String, EnergyNetwork> networks = new ConcurrentHashMap<>();

    /** MachinePosition → NetworkId (ke které síti stroj patří) */
    private final Map<MachinePosition, String> positionToNetwork = new ConcurrentHashMap<>();

    /** Metadata o nodech: position → [nodeType, outputOrCapacity, demand] */
    private final Map<MachinePosition, NodeMeta> nodeMetas = new ConcurrentHashMap<>();

    private final AtomicInteger networkIdCounter = new AtomicInteger(0);

    // Metadata záznamy o registrovaných nodech
    private record NodeMeta(IEnergyNode.NodeType type, int generatorOutput,
                             int consumerDemand, long storageCapacity) {}

    // ─── Registrace nodů ────────────────────────────────────────────────────

    /**
     * Zaregistruje generátor na dané pozici.
     * Automaticky propojí do sítě se sousedními nody.
     *
     * @param pos          pozice generátoru
     * @param outputPerTick výstup J/tick
     */
    public void registerGenerator(MachinePosition pos, int outputPerTick) {
        nodeMetas.put(pos, new NodeMeta(IEnergyNode.NodeType.GENERATOR, outputPerTick, 0, 0));
        connectToNetworks(pos);
    }

    /**
     * Zaregistruje spotřebič na dané pozici.
     *
     * @param pos              pozice spotřebiče
     * @param consumptionPerTick příkon J/tick
     */
    public void registerConsumer(MachinePosition pos, int consumptionPerTick) {
        nodeMetas.put(pos, new NodeMeta(IEnergyNode.NodeType.CONSUMER, 0, consumptionPerTick, 0));
        connectToNetworks(pos);
    }

    /**
     * Zaregistruje kapacitor (úložiště energie) na dané pozici.
     *
     * @param pos             pozice kapacitoru
     * @param maxCapacity     maximální kapacita [J]
     * @param initialStored   počáteční uložená energie [J]
     */
    public void registerStorage(MachinePosition pos, long maxCapacity, long initialStored) {
        nodeMetas.put(pos, new NodeMeta(IEnergyNode.NodeType.STORAGE, 0, 0, maxCapacity));
        connectToNetworks(pos);
    }

    /**
     * Odstraní stroj z energetické sítě.
     * Síť se automaticky přepočítá (může rozpadnout na více menších sítí).
     */
    public void unregisterNode(MachinePosition pos) {
        String networkId = positionToNetwork.remove(pos);
        nodeMetas.remove(pos);

        if (networkId != null) {
            // Jednoduchý přístup: zrušíme síť a přestavíme ze zbývajících nodů
            EnergyNetwork oldNetwork = networks.remove(networkId);
            if (oldNetwork != null) {
                rebuildNetworksFrom(getPositionsInNetwork(networkId));
            }
        }
    }

    // ─── Tick ────────────────────────────────────────────────────────────────

    /**
     * Provede energetický tick pro všechny sítě.
     * Voláno z MachineTickSystem každý SF tick.
     *
     * @return mapa consumerPos → zda dostali energii
     */
    public Map<MachinePosition, Boolean> tickAll() {
        Map<MachinePosition, Boolean> results = new HashMap<>();
        for (EnergyNetwork network : networks.values()) {
            results.putAll(network.tick());
        }
        return results;
    }

    /**
     * Vrátí síť ke které patří daná pozice.
     */
    public Optional<EnergyNetwork> getNetworkAt(MachinePosition pos) {
        String networkId = positionToNetwork.get(pos);
        if (networkId == null) return Optional.empty();
        return Optional.ofNullable(networks.get(networkId));
    }

    // ─── Interní logika ───────────────────────────────────────────────────────

    private void connectToNetworks(MachinePosition newPos) {
        Set<String> adjacentNetworkIds = new HashSet<>();

        // Najdi všechny sousední nody
        for (MachinePosition adj : newPos.getAdjacentPositions()) {
            if (nodeMetas.containsKey(adj)) {
                String adjNetwork = positionToNetwork.get(adj);
                if (adjNetwork != null) {
                    adjacentNetworkIds.add(adjNetwork);
                }
            }
        }

        if (adjacentNetworkIds.isEmpty()) {
            // Vytvoř novou síť jen pro tento node
            String newNetworkId = "net_" + networkIdCounter.incrementAndGet();
            EnergyNetwork network = new EnergyNetwork(newNetworkId);
            addNodeToNetwork(newPos, network);
            networks.put(newNetworkId, network);
            positionToNetwork.put(newPos, newNetworkId);
        } else if (adjacentNetworkIds.size() == 1) {
            // Připoj k existující síti
            String existingId = adjacentNetworkIds.iterator().next();
            EnergyNetwork existingNetwork = networks.get(existingId);
            if (existingNetwork != null) {
                addNodeToNetwork(newPos, existingNetwork);
                positionToNetwork.put(newPos, existingId);
            }
        } else {
            // Spoj více sítí dohromady
            String masterNetworkId = "net_" + networkIdCounter.incrementAndGet();
            EnergyNetwork masterNetwork = new EnergyNetwork(masterNetworkId);
            networks.put(masterNetworkId, masterNetwork);

            // Přesun všech nodů z existujících sítí do master sítě
            for (String oldId : adjacentNetworkIds) {
                EnergyNetwork oldNetwork = networks.remove(oldId);
                if (oldNetwork != null) {
                    for (MachinePosition pos : new ArrayList<>(positionToNetwork.keySet())) {
                        if (oldId.equals(positionToNetwork.get(pos))) {
                            addNodeToNetwork(pos, masterNetwork);
                            positionToNetwork.put(pos, masterNetworkId);
                        }
                    }
                }
            }

            addNodeToNetwork(newPos, masterNetwork);
            positionToNetwork.put(newPos, masterNetworkId);
        }
    }

    private void addNodeToNetwork(MachinePosition pos, EnergyNetwork network) {
        NodeMeta meta = nodeMetas.get(pos);
        if (meta == null) return;

        switch (meta.type()) {
            case GENERATOR -> network.addGenerator(pos, meta.generatorOutput());
            case CONSUMER  -> network.addConsumer(pos, meta.consumerDemand());
            case STORAGE   -> network.addStorage(pos, 0, meta.storageCapacity());
        }
    }

    private void rebuildNetworksFrom(List<MachinePosition> positions) {
        // BFS/DFS pro sestavení nových sítí ze zbývajících nodů
        Set<MachinePosition> unvisited = new HashSet<>(positions);

        while (!unvisited.isEmpty()) {
            MachinePosition seed = unvisited.iterator().next();
            Set<MachinePosition> component = new HashSet<>();
            Queue<MachinePosition> queue = new LinkedList<>();
            queue.add(seed);

            while (!queue.isEmpty()) {
                MachinePosition current = queue.poll();
                if (!component.add(current)) continue;
                for (MachinePosition adj : current.getAdjacentPositions()) {
                    if (unvisited.contains(adj)) queue.add(adj);
                }
            }

            unvisited.removeAll(component);

            // Vytvoř síť pro tuto komponentu
            String newId = "net_" + networkIdCounter.incrementAndGet();
            EnergyNetwork newNet = new EnergyNetwork(newId);
            networks.put(newId, newNet);
            for (MachinePosition pos : component) {
                positionToNetwork.put(pos, newId);
                addNodeToNetwork(pos, newNet);
            }
        }
    }

    private List<MachinePosition> getPositionsInNetwork(String networkId) {
        return positionToNetwork.entrySet().stream()
            .filter(e -> networkId.equals(e.getValue()))
            .map(Map.Entry::getKey)
            .toList();
    }

    // ─── Debug ───────────────────────────────────────────────────────────────

    public int getNetworkCount() { return networks.size(); }
    public int getRegisteredNodeCount() { return nodeMetas.size(); }
}
