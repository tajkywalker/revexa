package studio.walkercrew.aunaria.slimefun.energy;

/**
 * Základní rozhraní pro všechny komponenty energetické sítě.
 *
 * Každý stroj/generátor/kapacitor implementuje toto rozhraní pokud chce
 * být součástí energetické sítě Slimefun 2.0.
 */
public interface IEnergyNode {

    /** Maximální vzdálenost od ostatních nodů pro propojení do sítě */
    int NETWORK_RANGE = 1;  // Pouze přímí sousedé (pro WiFi stroje lze rozšířit)

    /**
     * Typ energetického uzlu.
     */
    enum NodeType {
        /** Vyrábí energii (Coal Generator, Solar Generator) */
        GENERATOR,
        /** Spotřebovává energii (Electric Furnace, Ore Washer) */
        CONSUMER,
        /** Ukládá a přerozděluje energii (Energy Capacitor) */
        STORAGE,
        /** Je obojí — spotřebitelé kteří mohou generovat (např. budoucí reaktor) */
        GENERATOR_AND_CONSUMER
    }

    NodeType getNodeType();
}
