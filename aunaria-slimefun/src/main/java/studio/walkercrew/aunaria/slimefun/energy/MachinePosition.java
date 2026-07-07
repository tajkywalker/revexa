package studio.walkercrew.aunaria.slimefun.energy;

import java.util.Objects;

/**
 * Identifikuje pozici stroje ve světě.
 * Klíč pro vyhledávání stavu stroje v HashMap a pro energetické sítě.
 *
 * Formát: "worldId:x:y:z"
 */
public record MachinePosition(String worldId, int x, int y, int z) {

    /**
     * Parsuje MachinePosition ze stringu "worldId:x:y:z".
     */
    public static MachinePosition fromString(String key) {
        String[] parts = key.split(":");
        if (parts.length != 4) {
            throw new IllegalArgumentException("Neplatný formát MachinePosition: " + key);
        }
        return new MachinePosition(parts[0],
            Integer.parseInt(parts[1]),
            Integer.parseInt(parts[2]),
            Integer.parseInt(parts[3]));
    }

    /**
     * Vrátí string klíč "worldId:x:y:z".
     */
    public String toKey() {
        return worldId + ":" + x + ":" + y + ":" + z;
    }

    /**
     * Vrátí sousední pozice (6 směrů) pro zjišťování, zda jsou stroje ve stejné síti.
     */
    public java.util.List<MachinePosition> getAdjacentPositions() {
        return java.util.List.of(
            new MachinePosition(worldId, x + 1, y, z),
            new MachinePosition(worldId, x - 1, y, z),
            new MachinePosition(worldId, x, y + 1, z),
            new MachinePosition(worldId, x, y - 1, z),
            new MachinePosition(worldId, x, y, z + 1),
            new MachinePosition(worldId, x, y, z - 1)
        );
    }

    /**
     * Vrátí sousedící pozice do dosahu (pro káblové sítě s větším dosahem).
     */
    public boolean isWithinRange(MachinePosition other, int range) {
        if (!this.worldId.equals(other.worldId)) return false;
        int dx = Math.abs(this.x - other.x);
        int dy = Math.abs(this.y - other.y);
        int dz = Math.abs(this.z - other.z);
        return dx + dy + dz <= range;
    }

    @Override
    public String toString() { return toKey(); }
}
